"""
Power optimization routes
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import pandas as pd

from ..auth.models import User
from ..auth.utils import get_current_user
from ..database import get_db
from ..data.session_manager import session_manager
from ..core import calculs
from ..core.config import type_table
from .schemas import (
    ConfigActuelleResponse, SimulationRequest, SimulationResponse,
    SimulationResultats, SimulationRowMensuel, FullAnalysisResponse,
    Section1OptimisationN, Section2ProjectionNPlus1, Section3OptimisationNPlus1,
    Section4TableauComparatif, ConfigurationInfo, EconomiesInfo, ScenarioComparatif,
    TarifsInfo
)
from ..core import optimisation as opt_module
from ..core.config import tarifs_small, tarifs_big

router = APIRouter(prefix="/api/optimisation", tags=["Optimisation"])


def calculer_tarifs_detailles(puissance: float, annee: int) -> TarifsInfo:
    """
    Calculate detailed tariffs for a given power and year
    EXACTLY reproduces Streamlit's afficher_tarifs_2025() function
    """
    # Determine category and coefficients
    if puissance < 3000:
        coeff = 1.05 ** (annee - 2023)
        categorie = "Petit client"
    else:
        coeff = 1.10 ** (annee - 2023)
        categorie = "Gros client"

    # Detect type
    row_type = type_table[
        (type_table['min'] <= puissance) &
        (puissance < type_table['max'])
    ]

    if row_type.empty:
        # Fallback values
        return TarifsInfo(
            tarif_hc=0.0,
            tarif_hp=0.0,
            prime_fixe=0.0,
            plage_horaire="N/A",
            intervalle_min=0.0,
            intervalle_max=0.0,
            categorie=categorie
        )

    type_tarif = int(row_type['type'].values[0])
    intervalle_min = float(row_type['min'].values[0])
    intervalle_max = float(row_type['max'].values[0])

    # Determine time range (default: >400h for calculation)
    # This matches Streamlit's default display
    if puissance < 3000:
        # Small client
        idx = type_tarif - 1
        # Use >400h as default (most common)
        plage_horaire = ">400h"
        tarif_hc = tarifs_small['sup_400']['off'][idx] * coeff if tarifs_small['sup_400']['off'][idx] != '' else 0.0
        tarif_hp = tarifs_small['sup_400']['peak'][idx] * coeff if tarifs_small['sup_400']['peak'][idx] != '' else 0.0
        prime_fixe = tarifs_small['sup_400']['pf'][idx] * coeff if tarifs_small['sup_400']['pf'][idx] != '' else 0.0
    else:
        # Big client
        idx = type_tarif - 6
        # Use >400h as default
        plage_horaire = ">400h"
        tarif_hc = tarifs_big['sup_400']['off'][idx] * coeff
        tarif_hp = tarifs_big['sup_400']['peak'][idx] * coeff
        prime_fixe = tarifs_big['sup_400']['pf'][idx] * coeff

    return TarifsInfo(
        tarif_hc=round(tarif_hc, 3),
        tarif_hp=round(tarif_hp, 3),
        prime_fixe=round(prime_fixe, 2),
        plage_horaire=plage_horaire,
        intervalle_min=intervalle_min,
        intervalle_max=intervalle_max,
        categorie=categorie
    )


@router.get("/config-actuelle", response_model=ConfigActuelleResponse)
async def get_config_actuelle(
    year: int = 2025,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current configuration for a specific year

    Returns current power subscription, max power reached, costs, etc.
    """
    # Get processed data
    df = session_manager.get_processed_data(current_user.id)

    if df is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée disponible. Veuillez d'abord uploader un fichier."
        )

    # Filter for specified year
    df_year = df[df['READING_DATE'].dt.year == year].copy()

    if df_year.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aucune donnée pour l'année {year}"
        )

    # Calculate metrics
    puissance_actuelle = int(df_year['SUBSCRIPTION_LOAD'].iloc[0])
    puissance_max_atteinte = df_year['PUISSANCE_ATTEINTE'].max()
    puissance_min_atteinte = df_year['PUISSANCE_ATTEINTE'].min()
    puissance_moyenne = df_year['PUISSANCE_ATTEINTE'].mean()

    # Current cost
    cout_annuel = df_year['AMOUNT_WITH_TAX'].sum()

    # Detect current type
    row_type_actuel = type_table[
        (type_table['min'] <= puissance_actuelle) &
        (puissance_actuelle < type_table['max'])
    ]
    type_actuel = int(row_type_actuel['type'].values[0]) if not row_type_actuel.empty else 0

    # Number of overruns
    nb_depassements = (df_year['PUISSANCE_ATTEINTE'] > puissance_actuelle).sum()

    return ConfigActuelleResponse(
        puissance_actuelle=puissance_actuelle,
        puissance_max_atteinte=puissance_max_atteinte,
        puissance_min_atteinte=puissance_min_atteinte,
        puissance_moyenne=puissance_moyenne,
        type_tarifaire=type_actuel,
        cout_annuel_2025=cout_annuel,
        nb_depassements=nb_depassements
    )


@router.post("/simulate", response_model=SimulationResponse)
async def simulate_optimization(
    simulation: SimulationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Simulate new power subscription for a specific year

    Recalculates costs with new power and compares to current configuration
    """
    # Get processed data
    df = session_manager.get_processed_data(current_user.id)

    if df is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée disponible. Veuillez d'abord uploader un fichier."
        )

    # Filter for specified year
    year = simulation.year
    df_year = df[df['READING_DATE'].dt.year == year].copy()

    if df_year.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aucune donnée pour l'année {year}"
        )

    # Current metrics
    puissance_actuelle = int(df_year['SUBSCRIPTION_LOAD'].iloc[0])
    puissance_max_atteinte = df_year['PUISSANCE_ATTEINTE'].max()
    cout_actuel = df_year['AMOUNT_WITH_TAX'].sum()
    nb_depassements_actuel = (df_year['PUISSANCE_ATTEINTE'] > puissance_actuelle).sum()

    # Detect new type
    nouvelle_puissance = simulation.nouvelle_puissance
    row_type_optimise = type_table[
        (type_table['min'] <= nouvelle_puissance) &
        (nouvelle_puissance < type_table['max'])
    ]
    type_optimise = int(row_type_optimise['type'].values[0]) if not row_type_optimise.empty else 0

    # Check for warning
    warning = None
    has_warning = False
    nb_mois_depassement = (df_year['PUISSANCE_ATTEINTE'] > nouvelle_puissance).sum()

    if nouvelle_puissance < puissance_max_atteinte:
        has_warning = True
        warning = (
            f"La puissance saisie ({nouvelle_puissance} kW) est inférieure à votre "
            f"puissance maximale atteinte ({puissance_max_atteinte:.0f} kW). "
            f"Vous aurez des dépassements sur {nb_mois_depassement} mois."
        )

    # Simulate: Create copy and change power
    df_simule = df_year.copy()
    df_simule['SUBSCRIPTION_LOAD'] = nouvelle_puissance

    # Recalculate with new power
    df_simule = calculs.appliquer_tous_calculs(df_simule)

    # Calculate simulated cost
    cout_simule = df_simule['AMOUNT_WITH_TAX'].sum()

    # Savings
    economies = cout_actuel - cout_simule
    economies_pct = (economies / cout_actuel * 100) if cout_actuel > 0 else 0

    # Number of overruns in simulation
    nb_depassements_simule = (df_year['PUISSANCE_ATTEINTE'] > nouvelle_puissance).sum()

    # Build monthly comparison table
    mois_noms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

    tableau_mensuel = []
    df_year_sorted = df_year.sort_values('READING_DATE')
    df_simule_sorted = df_simule.sort_values('READING_DATE')

    for (_, row_actuel), (_, row_simule) in zip(df_year_sorted.iterrows(), df_simule_sorted.iterrows()):
        mois_num = int(row_actuel['READING_DATE'].month)
        mois_nom = mois_noms[mois_num - 1]

        facture_actuelle = float(row_actuel['AMOUNT_WITH_TAX'])
        facture_simulee = float(row_simule['AMOUNT_WITH_TAX'])
        economie = facture_actuelle - facture_simulee

        tableau_mensuel.append(SimulationRowMensuel(
            mois=mois_nom,
            facture_actuelle=facture_actuelle,
            facture_simulee=facture_simulee,
            economie=economie
        ))

    resultats = SimulationResultats(
        cout_actuel=cout_actuel,
        cout_simule=cout_simule,
        economies=economies,
        economies_pct=economies_pct,
        nb_depassements_actuel=nb_depassements_actuel,
        nb_depassements_simule=nb_depassements_simule
    )

    return SimulationResponse(
        nouvelle_puissance=nouvelle_puissance,
        nouveau_type_tarifaire=type_optimise,
        warning=warning,
        has_warning=has_warning,
        resultats=resultats,
        tableau_mensuel=tableau_mensuel
    )


@router.get("/full-analysis", response_model=FullAnalysisResponse)
async def get_full_analysis(
    annee_N: int,
    nouvelle_puissance: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get complete 4-section optimization analysis for year N and N+1

    EXACTLY reproduces Streamlit's "Optimisation et Projection" page:
    - If nouvelle_puissance provided: Uses it (manual mode like Streamlit Section 1)
    - If not provided: Auto-calculates optimal power (max power rounded up)

    Returns:
    - Section 1: Optimisation année N (actuelle vs optimisée)
    - Section 2: Projection N+1 avec configuration actuelle
    - Section 3: Optimisation N+1 avec puissance optimisée
    - Section 4: Tableau comparatif des 4 scénarios
    """
    # Get processed data
    df = session_manager.get_processed_data(current_user.id)
    
    if df is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée disponible. Veuillez d'abord uploader un fichier."
        )
    
    # Calculate year N+1
    annee_N_plus_1 = annee_N + 1
    
    # Filter data for year N
    df_N = df[df['READING_DATE'].dt.year == annee_N].copy()
    
    if df_N.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aucune donnée pour l'année {annee_N}"
        )
    
    # ===== SECTION 1: OPTIMISATION ANNÉE N =====
    
    # Current configuration N
    puissance_actuelle = int(df_N['SUBSCRIPTION_LOAD'].iloc[0])
    puissance_max = df_N['PUISSANCE_ATTEINTE'].max()
    cout_actuel_N = df_N['AMOUNT_WITH_TAX'].sum()
    nb_depassements_actuel = int((df_N['PUISSANCE_ATTEINTE'] > puissance_actuelle).sum())
    
    # Detect current type
    row_type_actuel = type_table[
        (type_table['min'] <= puissance_actuelle) &
        (puissance_actuelle < type_table['max'])
    ]
    type_actuel = int(row_type_actuel['type'].values[0]) if not row_type_actuel.empty else 0

    # Optimized power for N
    # EXACTLY like Streamlit: If nouvelle_puissance provided (manual input), use it
    # Otherwise auto-calculate optimal power (max power rounded up)
    if nouvelle_puissance is not None:
        puissance_optimisee_N = nouvelle_puissance
    else:
        puissance_optimisee_N = int(puissance_max) if puissance_max % 10 == 0 else int(puissance_max // 10 + 1) * 10
    
    # Recalculate with optimized power
    df_N_optimise = df_N.copy()
    df_N_optimise['SUBSCRIPTION_LOAD'] = puissance_optimisee_N
    df_N_optimise = calculs.appliquer_tous_calculs(df_N_optimise)
    cout_optimise_N = df_N_optimise['AMOUNT_WITH_TAX'].sum()
    nb_depassements_optimise = int((df_N['PUISSANCE_ATTEINTE'] > puissance_optimisee_N).sum())
    
    # Detect optimized type
    row_type_optimise = type_table[
        (type_table['min'] <= puissance_optimisee_N) &
        (puissance_optimisee_N < type_table['max'])
    ]
    type_optimise_N = int(row_type_optimise['type'].values[0]) if not row_type_optimise.empty else 0
    
    # Savings
    economies_N = cout_actuel_N - cout_optimise_N
    economies_pct_N = (economies_N / cout_actuel_N * 100) if cout_actuel_N > 0 else 0

    # Warning if power insufficient (EXACTLY like Streamlit)
    warning_section_1 = None
    if puissance_optimisee_N < puissance_max:
        nb_mois_depassement = int((df_N['PUISSANCE_ATTEINTE'] > puissance_optimisee_N).sum())
        warning_section_1 = (
            f"🚨 ATTENTION : Risque de dépassements ! "
            f"La puissance saisie ({puissance_optimisee_N} kW) est inférieure à votre "
            f"puissance maximale atteinte ({puissance_max:.0f} kW) en {annee_N}. "
            f"Vous aurez des dépassements de puissance sur {nb_mois_depassement} mois de l'année, "
            f"ce qui entraînera des pénalités."
        )
    elif puissance_optimisee_N >= puissance_max and puissance_optimisee_N < puissance_actuelle:
        warning_section_1 = (
            f"✅ Bonne configuration ! "
            f"La puissance saisie ({puissance_optimisee_N} kW) est supérieure à votre "
            f"puissance maximale atteinte ({puissance_max:.0f} kW). Aucun dépassement prévu !"
        )

    # Monthly data
    tableau_mensuel_N = []
    mois_noms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    df_N_sorted = df_N.sort_values('READING_DATE')
    df_N_optimise_sorted = df_N_optimise.sort_values('READING_DATE')
    
    for (_, row_actuel), (_, row_optimise) in zip(df_N_sorted.iterrows(), df_N_optimise_sorted.iterrows()):
        mois_idx = int(row_actuel['READING_DATE'].month) - 1
        tableau_mensuel_N.append({
            'mois': mois_noms[mois_idx],
            'consommation': float(row_actuel['MV_CONSUMPTION']),
            'facture_actuelle': float(row_actuel['AMOUNT_WITH_TAX']),
            'facture_optimisee': float(row_optimise['AMOUNT_WITH_TAX']),
            'economie': float(row_actuel['AMOUNT_WITH_TAX'] - row_optimise['AMOUNT_WITH_TAX'])
        })
    
    section_1 = Section1OptimisationN(
        annee=annee_N,
        configuration_actuelle=ConfigurationInfo(
            puissance=puissance_actuelle,
            type_tarifaire=type_actuel,
            cout_annuel=cout_actuel_N,
            nb_depassements=nb_depassements_actuel,
            tarifs=calculer_tarifs_detailles(puissance_actuelle, annee_N),
            variation_vs_actuel=0  # Current config has 0 variation
        ),
        configuration_optimisee=ConfigurationInfo(
            puissance=puissance_optimisee_N,
            type_tarifaire=type_optimise_N,
            cout_annuel=cout_optimise_N,
            nb_depassements=nb_depassements_optimise,
            tarifs=calculer_tarifs_detailles(puissance_optimisee_N, annee_N),
            variation_vs_actuel=puissance_optimisee_N - puissance_actuelle
        ),
        economies=EconomiesInfo(
            montant=economies_N,
            pourcentage=economies_pct_N
        ),
        warning=warning_section_1,
        tableau_mensuel=tableau_mensuel_N
    )
    
    # ===== SECTION 2: PROJECTION N+1 AVEC CONFIG ACTUELLE =====
    
    # Project N+1 with current power
    resultats_projection = []
    for _, row in df_N_sorted.iterrows():
        resultat = opt_module.calculer_facture_avec_puissance(row, puissance_actuelle, annee=annee_N_plus_1)
        if resultat:
            resultats_projection.append(resultat)
    
    cout_projection_N_plus_1 = sum(r['facture_ttc'] for r in resultats_projection)
    variation = cout_projection_N_plus_1 - cout_actuel_N
    variation_pct = (variation / cout_actuel_N * 100) if cout_actuel_N > 0 else 0
    
    tableau_mensuel_projection = []
    for i, (_, row_N) in enumerate(df_N_sorted.iterrows()):
        if i < len(resultats_projection):
            mois_idx = int(row_N['READING_DATE'].month) - 1
            tableau_mensuel_projection.append({
                'mois': mois_noms[mois_idx],
                'facture_N': float(row_N['AMOUNT_WITH_TAX']),
                'facture_projection_N_plus_1': resultats_projection[i]['facture_ttc'],
                'variation': resultats_projection[i]['facture_ttc'] - float(row_N['AMOUNT_WITH_TAX'])
            })
    
    section_2 = Section2ProjectionNPlus1(
        annee=annee_N_plus_1,
        puissance_utilisee=puissance_actuelle,
        type_tarifaire=type_actuel,
        cout_N=cout_actuel_N,
        cout_projection_N_plus_1=cout_projection_N_plus_1,
        variation={'montant': variation, 'pourcentage': variation_pct},
        tarifs_appliques=calculer_tarifs_detailles(puissance_actuelle, annee_N_plus_1),
        tableau_mensuel=tableau_mensuel_projection
    )
    
    # ===== SECTION 3: OPTIMISATION N+1 =====
    
    # Project N+1 with optimized power
    resultats_optimisation_N_plus_1 = []
    for _, row in df_N_sorted.iterrows():
        resultat = opt_module.calculer_facture_avec_puissance(row, puissance_optimisee_N, annee=annee_N_plus_1)
        if resultat:
            resultats_optimisation_N_plus_1.append(resultat)
    
    cout_optimise_N_plus_1 = sum(r['facture_ttc'] for r in resultats_optimisation_N_plus_1)
    economies_N_plus_1 = cout_projection_N_plus_1 - cout_optimise_N_plus_1
    economies_pct_N_plus_1 = (economies_N_plus_1 / cout_projection_N_plus_1 * 100) if cout_projection_N_plus_1 > 0 else 0
    
    tableau_mensuel_optimisation_N_plus_1 = []
    for i, (_, row_N) in enumerate(df_N_sorted.iterrows()):
        if i < len(resultats_projection) and i < len(resultats_optimisation_N_plus_1):
            mois_idx = int(row_N['READING_DATE'].month) - 1
            tableau_mensuel_optimisation_N_plus_1.append({
                'mois': mois_noms[mois_idx],
                'facture_projection_actuelle': resultats_projection[i]['facture_ttc'],
                'facture_projection_optimisee': resultats_optimisation_N_plus_1[i]['facture_ttc'],
                'economie': resultats_projection[i]['facture_ttc'] - resultats_optimisation_N_plus_1[i]['facture_ttc']
            })
    
    section_3 = Section3OptimisationNPlus1(
        annee=annee_N_plus_1,
        configuration_actuelle_projection={'puissance': puissance_actuelle, 'cout': cout_projection_N_plus_1},
        configuration_optimisee_projection={'puissance': puissance_optimisee_N, 'cout': cout_optimise_N_plus_1},
        economies=EconomiesInfo(
            montant=economies_N_plus_1,
            pourcentage=economies_pct_N_plus_1
        ),
        tarifs_appliques=calculer_tarifs_detailles(puissance_optimisee_N, annee_N_plus_1),
        tableau_mensuel=tableau_mensuel_optimisation_N_plus_1
    )
    
    # ===== SECTION 4: TABLEAU COMPARATIF =====
    
    scenarios = [
        ScenarioComparatif(
            nom=f"{annee_N} - Configuration actuelle",
            annee=annee_N,
            puissance=puissance_actuelle,
            type_tarifaire=type_actuel,
            cout=cout_actuel_N,
            ecart_vs_ref=0,
            pourcentage_vs_ref=0
        ),
        ScenarioComparatif(
            nom=f"{annee_N} - Optimisation",
            annee=annee_N,
            puissance=puissance_optimisee_N,
            type_tarifaire=type_optimise_N,
            cout=cout_optimise_N,
            ecart_vs_ref=cout_optimise_N - cout_actuel_N,
            pourcentage_vs_ref=((cout_optimise_N - cout_actuel_N) / cout_actuel_N * 100) if cout_actuel_N > 0 else 0
        ),
        ScenarioComparatif(
            nom=f"{annee_N_plus_1} - Projection (puissance actuelle)",
            annee=annee_N_plus_1,
            puissance=puissance_actuelle,
            type_tarifaire=type_actuel,
            cout=cout_projection_N_plus_1,
            ecart_vs_ref=cout_projection_N_plus_1 - cout_actuel_N,
            pourcentage_vs_ref=((cout_projection_N_plus_1 - cout_actuel_N) / cout_actuel_N * 100) if cout_actuel_N > 0 else 0
        ),
        ScenarioComparatif(
            nom=f"{annee_N_plus_1} - Optimisation (puissance optimisée)",
            annee=annee_N_plus_1,
            puissance=puissance_optimisee_N,
            type_tarifaire=type_optimise_N,
            cout=cout_optimise_N_plus_1,
            ecart_vs_ref=cout_optimise_N_plus_1 - cout_actuel_N,
            pourcentage_vs_ref=((cout_optimise_N_plus_1 - cout_actuel_N) / cout_actuel_N * 100) if cout_actuel_N > 0 else 0
        )
    ]

    # Calculate recommendation (EXACTLY like Streamlit)
    meilleur_scenario = min(scenarios, key=lambda x: x.cout)

    economie_optimisation_N = cout_actuel_N - cout_optimise_N
    economie_optimisation_N_pct = (economie_optimisation_N / cout_actuel_N * 100) if cout_actuel_N > 0 else 0
    economie_optimisation_N_plus_1 = cout_actuel_N - cout_optimise_N_plus_1
    economie_optimisation_N_plus_1_pct = (economie_optimisation_N_plus_1 / cout_actuel_N * 100) if cout_actuel_N > 0 else 0

    if "Optimisation" in meilleur_scenario.nom:
        recommandation = (
            f"✅ Recommandation : Adopter la puissance optimisée de {puissance_optimisee_N} kW\n\n"
            f"Le meilleur scénario est {meilleur_scenario.nom} avec un coût de {meilleur_scenario.cout/1e6:.2f}M FCFA.\n\n"
            f"En passant de {puissance_actuelle} kW à {puissance_optimisee_N} kW:\n"
            f"- Économie immédiate en {annee_N}: {economie_optimisation_N/1e6:.2f}M FCFA ({economie_optimisation_N_pct:.1f}%)\n"
            f"- Économie en {annee_N_plus_1} vs configuration actuelle: {economie_optimisation_N_plus_1/1e6:.2f}M FCFA ({economie_optimisation_N_plus_1_pct:.1f}%)"
        )
    else:
        recommandation = (
            f"ℹ️ La configuration actuelle reste compétitive.\n\n"
            f"Le meilleur scénario est {meilleur_scenario.nom} avec un coût de {meilleur_scenario.cout/1e6:.2f}M FCFA."
        )

    section_4 = Section4TableauComparatif(scenarios=scenarios, recommandation=recommandation)

    # ===== RETURN FULL ANALYSIS =====
    
    return FullAnalysisResponse(
        annee_N=annee_N,
        annee_N_plus_1=annee_N_plus_1,
        section_1_optimisation_N=section_1,
        section_2_projection_N_plus_1=section_2,
        section_3_optimisation_N_plus_1=section_3,
        section_4_tableau_comparatif=section_4
    )
