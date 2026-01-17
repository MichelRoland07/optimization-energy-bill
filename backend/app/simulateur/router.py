"""
Simulateur router - Tariff simulator endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from .schemas import TableauTarifsResponse, SimulationRequest, SimulationResponse
from ..auth.utils import get_current_user
from ..auth.models import User
from ..core.config import type_table, tarifs_small, tarifs_big
import pandas as pd

router = APIRouter(prefix="/api/simulateur", tags=["simulateur"])


def construire_tableau_tarifs(annee: int = 2025):
    """
    Build complete tariffs table for given year
    """
    # Determine coefficients
    coeff_small = 1.05 ** (annee - 2023)  # 5% per year for <3000 kW
    coeff_big = 1.10 ** (annee - 2023)    # 10% per year for ≥3000 kW

    data = []

    for _, row in type_table.iterrows():
        min_kw = row['min']
        max_kw = row['max']
        type_tarif = int(row['type'])

        row_data = {
            'MIN (kW)': min_kw,
            'MAX (kW)': max_kw,
            'TYPE': type_tarif
        }

        # Types 1-5: Small clients
        if type_tarif <= 5:
            idx = type_tarif - 1
            coeff = coeff_small

            # Range 0-200h
            row_data['0-200h Off Peak'] = f"{tarifs_small['0_200']['off'][idx] * coeff:.3f}" if tarifs_small['0_200']['off'][idx] != '' else ''
            row_data['0-200h Peak'] = f"{tarifs_small['0_200']['peak'][idx] * coeff:.3f}" if tarifs_small['0_200']['peak'][idx] != '' else ''
            row_data['0-200h PF'] = f"{tarifs_small['0_200']['pf'][idx] * coeff:.2f}" if tarifs_small['0_200']['pf'][idx] != '' else ''

            # Range 201-400h
            row_data['201-400h Off Peak'] = f"{tarifs_small['201_400']['off'][idx] * coeff:.3f}" if tarifs_small['201_400']['off'][idx] != '' else ''
            row_data['201-400h Peak'] = f"{tarifs_small['201_400']['peak'][idx] * coeff:.3f}" if tarifs_small['201_400']['peak'][idx] != '' else ''
            row_data['201-400h PF'] = f"{tarifs_small['201_400']['pf'][idx] * coeff:.2f}" if tarifs_small['201_400']['pf'][idx] != '' else ''

            # Range >400h
            row_data['>400h Off Peak'] = f"{tarifs_small['sup_400']['off'][idx] * coeff:.3f}" if tarifs_small['sup_400']['off'][idx] != '' else ''
            row_data['>400h Peak'] = f"{tarifs_small['sup_400']['peak'][idx] * coeff:.3f}" if tarifs_small['sup_400']['peak'][idx] != '' else ''
            row_data['>400h PF'] = f"{tarifs_small['sup_400']['pf'][idx] * coeff:.2f}" if tarifs_small['sup_400']['pf'][idx] != '' else ''

            # Empty columns for big clients
            row_data['0-400h Off Peak'] = ''
            row_data['0-400h Peak'] = ''
            row_data['0-400h PF'] = ''

        # Types 6-12: Big clients
        else:
            idx = type_tarif - 6
            coeff = coeff_big

            # Empty columns for small clients
            row_data['0-200h Off Peak'] = ''
            row_data['0-200h Peak'] = ''
            row_data['0-200h PF'] = ''
            row_data['201-400h Off Peak'] = ''
            row_data['201-400h Peak'] = ''
            row_data['201-400h PF'] = ''

            # Range 0-400h
            row_data['0-400h Off Peak'] = f"{tarifs_big['0_400']['off'][idx] * coeff:.3f}"
            row_data['0-400h Peak'] = f"{tarifs_big['0_400']['peak'][idx] * coeff:.3f}"
            row_data['0-400h PF'] = f"{tarifs_big['0_400']['pf'][idx] * coeff:.2f}"

            # Range >400h
            row_data['>400h Off Peak'] = f"{tarifs_big['sup_400']['off'][idx] * coeff:.3f}"
            row_data['>400h Peak'] = f"{tarifs_big['sup_400']['peak'][idx] * coeff:.3f}"
            row_data['>400h PF'] = f"{tarifs_big['sup_400']['pf'][idx] * coeff:.2f}"

        data.append(row_data)

    return pd.DataFrame(data)


def detecter_type_et_plage(puissance: float, temps_fonctionnement: float):
    """
    Detect tariff type and time range
    """
    # Determine tariff type
    row_type = type_table[
        (type_table['min'] <= puissance) &
        (puissance < type_table['max'])
    ]

    if row_type.empty:
        return None, None, None, None, None

    type_tarif = int(row_type['type'].values[0])
    intervalle_min = row_type['min'].values[0]
    intervalle_max = row_type['max'].values[0]

    # Determine category and time range
    if puissance < 3000:
        categorie = "Petit client"
        if temps_fonctionnement <= 200:
            plage_horaire = "0-200h"
        elif temps_fonctionnement <= 400:
            plage_horaire = "201-400h"
        else:
            plage_horaire = ">400h"
    else:
        categorie = "Gros client"
        if temps_fonctionnement <= 400:
            plage_horaire = "0-400h"
        else:
            plage_horaire = ">400h"

    return type_tarif, plage_horaire, intervalle_min, intervalle_max, categorie


@router.get("/tableau-tarifs", response_model=TableauTarifsResponse)
async def get_tableau_tarifs(
    annee: int = 2025,
    current_user: User = Depends(get_current_user)
):
    """
    Get complete tariffs table for a given year
    """
    df = construire_tableau_tarifs(annee)

    return {
        "annee": annee,
        "colonnes": df.columns.tolist(),
        "lignes": df.to_dict('records')
    }


@router.post("/simulate", response_model=SimulationResponse)
async def simulate_tarifs(
    request: SimulationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Simulate tariffs for given power and operating time
    """
    puissance = request.puissance
    temps_fonctionnement = request.temps_fonctionnement
    annee = request.annee

    # Detect type and range
    type_tarif, plage_horaire, min_kw, max_kw, categorie = detecter_type_et_plage(
        puissance, temps_fonctionnement
    )

    if type_tarif is None:
        raise HTTPException(
            status_code=400,
            detail="Puissance hors limites. Veuillez saisir une puissance entre 0 et 10000 kW."
        )

    # Determine coefficient
    if puissance < 3000:
        coeff = 1.05 ** (annee - 2023)
    else:
        coeff = 1.10 ** (annee - 2023)

    # Get tariffs
    if type_tarif <= 5:
        # Small client
        idx = type_tarif - 1
        plage_key = plage_horaire.replace('h', '').replace('-', '_').replace('>', 'sup_')

        tarif_off = tarifs_small[plage_key]['off'][idx]
        tarif_peak = tarifs_small[plage_key]['peak'][idx]
        prime_fixe = tarifs_small[plage_key]['pf'][idx]

        # Handle empty values
        if tarif_off == '':
            tarif_off = 0
        if tarif_peak == '':
            tarif_peak = 0
        if prime_fixe == '':
            prime_fixe = 0
    else:
        # Big client
        idx = type_tarif - 6
        plage_key = '0_400' if plage_horaire == '0-400h' else 'sup_400'

        tarif_off = tarifs_big[plage_key]['off'][idx]
        tarif_peak = tarifs_big[plage_key]['peak'][idx]
        prime_fixe = tarifs_big[plage_key]['pf'][idx]

    return {
        'type': type_tarif,
        'categorie': categorie,
        'plage_horaire': plage_horaire,
        'intervalle_min': min_kw,
        'intervalle_max': max_kw,
        'tarif_off_peak': tarif_off * coeff,
        'tarif_peak': tarif_peak * coeff,
        'prime_fixe': prime_fixe * coeff,
        'coefficient': coeff,
        'puissance': puissance,
        'temps_fonctionnement': temps_fonctionnement,
        'annee': annee
    }


@router.post("/simulate-detailed")
async def simulate_detailed(
    request: SimulationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Detailed simulation with real loaded data
    
    Simulates a new power/type configuration on actual consumption data
    Returns monthly comparison table
    """
    from ..data.session_manager import session_manager
    from ..core import calculs
    from fastapi import HTTPException
    
    # Get processed data
    df = session_manager.get_processed_data(current_user.id)
    
    if df is None:
        raise HTTPException(
            status_code=404,
            detail="Aucune donnée chargée. Cette simulation nécessite des données réelles."
        )
    
    # Extract parameters
    nouvelle_puissance = request.puissance
    annee = request.annee
    
    # Filter for specified year
    df_year = df[df['READING_DATE'].dt.year == annee].copy()
    
    if df_year.empty:
        raise HTTPException(
            status_code=404,
            detail=f"Aucune donnée pour l'année {annee}"
        )
    
    # Current configuration
    puissance_actuelle = int(df_year['SUBSCRIPTION_LOAD'].iloc[0])
    cout_actuel = df_year['AMOUNT_WITH_TAX'].sum()
    
    # Simulate with new power
    df_simule = df_year.copy()
    df_simule['SUBSCRIPTION_LOAD'] = nouvelle_puissance
    df_simule = calculs.appliquer_tous_calculs(df_simule)
    cout_simule = df_simule['AMOUNT_WITH_TAX'].sum()
    
    # Calculate savings
    economies = cout_actuel - cout_simule
    economies_pct = (economies / cout_actuel * 100) if cout_actuel > 0 else 0
    
    # Detect new type
    type_tarif, plage_horaire, _, _, categorie = detecter_type_et_plage(
        nouvelle_puissance, 
        300  # Default time
    )
    
    # Monthly table
    mois_noms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    
    tableau_mensuel = []
    df_year_sorted = df_year.sort_values('READING_DATE')
    df_simule_sorted = df_simule.sort_values('READING_DATE')
    
    for (_, row_actuel), (_, row_simule) in zip(df_year_sorted.iterrows(), df_simule_sorted.iterrows()):
        mois_idx = int(row_actuel['READING_DATE'].month) - 1
        
        tableau_mensuel.append({
            'mois': mois_noms[mois_idx],
            'consommation': float(row_actuel['MV_CONSUMPTION']),
            'puissance_atteinte': float(row_actuel['PUISSANCE_ATTEINTE']),
            'facture_actuelle': float(row_actuel['AMOUNT_WITH_TAX']),
            'facture_simulee': float(row_simule['AMOUNT_WITH_TAX']),
            'economie': float(row_actuel['AMOUNT_WITH_TAX'] - row_simule['AMOUNT_WITH_TAX']),
            'depassement_actuel': int(row_actuel['PUISSANCE_ATTEINTE'] > puissance_actuelle),
            'depassement_simule': int(row_actuel['PUISSANCE_ATTEINTE'] > nouvelle_puissance)
        })
    
    # Warning if insufficient power
    puissance_max_atteinte = df_year['PUISSANCE_ATTEINTE'].max()
    warning = None
    if nouvelle_puissance < puissance_max_atteinte:
        nb_depassements = (df_year['PUISSANCE_ATTEINTE'] > nouvelle_puissance).sum()
        warning = f"La puissance simulée ({nouvelle_puissance} kW) est inférieure à votre puissance maximale atteinte ({puissance_max_atteinte:.0f} kW). Vous aurez {nb_depassements} dépassement(s)."
    
    return {
        'annee': annee,
        'puissance_actuelle': puissance_actuelle,
        'puissance_simulee': nouvelle_puissance,
        'type_simule': type_tarif,
        'categorie': categorie,
        'plage_horaire': plage_horaire,
        'cout_actuel': cout_actuel,
        'cout_simule': cout_simule,
        'economies': economies,
        'economies_pct': economies_pct,
        'warning': warning,
        'tableau_mensuel': tableau_mensuel
    }
