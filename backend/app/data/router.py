"""
Data upload and processing routes
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import Optional
import pandas as pd
from io import BytesIO

from ..auth.models import User
from ..auth.utils import get_current_user
from ..database import get_db
from ..core import calculs, synthese as synthese_module
from ..core.config import type_table, tarifs_small, tarifs_big
from .schemas import (
    UploadResponse, ServiceInfo, ServiceSelection,
    ServiceSelectionResponse, SyntheseResponse, GraphiquesResponse,
    ProfilClientResponse, TarifsProfilInfo, ReconstitutionResponse
)
from .session_manager import session_manager

router = APIRouter(prefix="/api/data", tags=["Data"])


def validate_required_columns(df: pd.DataFrame) -> bool:
    """Validate that DataFrame has all required columns"""
    required_columns = [
        'SERVICE_NO', 'CUST_NAME', 'REGION', 'DIVISION', 'AGENCE',
        'READING_DATE', 'SUBSCRIPTION_LOAD', 'PUISSANCE_ATTEINTE',
        'MV_CONSUMPTION', 'ACTIVE_OFF_PEAK_IMP', 'ACTIVE_PEAK_IMP',
        'ACTIVE_OFF_PEAK_EXP', 'ACTIVE_PEAK_EXP',
        'AMOUNT_WITHOUT_TAX', 'AMOUNT_WITH_TAX'
    ]
    return all(col in df.columns for col in required_columns)


def calculer_coefficient_annee(annee: int, puissance: float) -> float:
    """
    Calculate year coefficient based on year and power
    Matches the logic in calculs.calcul_augmentation
    """
    if annee < 2024:
        return 1.0
    elif annee == 2024:
        return 1.05 if puissance < 3000 else 1.1
    elif annee == 2025:
        return 1.05**2 if puissance < 3000 else 1.1**2
    elif annee == 2026:
        return 1.05**3 if puissance < 3000 else 1.1**3
    else:
        return 1.0


def calculer_tarifs_profil(puissance: float, annee: int) -> TarifsProfilInfo:
    """
    Calculate detailed tariffs for client profile display
    Reproduces exactly Streamlit's tariff detection and display

    Args:
        puissance: Subscribed power in kW
        annee: Year for tariff calculation

    Returns:
        TarifsProfilInfo with all tariff details
    """
    # Determine category and coefficients
    if puissance < 3000:
        categorie = "Petit client"
        tarifs_dict = tarifs_small
    else:
        categorie = "Gros client"
        tarifs_dict = tarifs_big

    # Calculate coefficients based on year
    coeff_annee = calculer_coefficient_annee(annee, puissance)

    # Find matching tariff type from type_table DataFrame
    row = type_table[(type_table['min'] <= puissance) & (puissance < type_table['max'])]

    if row.empty:
        raise ValueError(f"Aucun type tarifaire trouvé pour la puissance {puissance} kW")

    type_tarifaire = int(row['type'].values[0])
    intervalle_min = float(row['min'].values[0])
    intervalle_max = float(row['max'].values[0])

    # Determine plage_horaire based on type and category
    if type_tarifaire <= 5:
        # Petit client (types 1-5)
        if type_tarifaire == 1:
            plage_horaire = "Unique"
        else:
            plage_horaire = "Double"
    else:
        # Gros client (types 6-12)
        plage_horaire = "Double"

    # Get tariffs - this is simplified, actual tariff selection depends on temps_fonctionnement
    # For profile display, we use a representative value
    tarif_hc = 0.0
    tarif_hp = 0.0
    prime_fixe = 0.0

    # For simplicity, use middle range values
    # This is for display only - actual calculations are done in calculs.py
    if puissance < 3000:
        # Petit client - use sup_400 as default
        tarif_hc = 50 * coeff_annee
        tarif_hp = 95 * coeff_annee
        prime_fixe = 6000 * coeff_annee
    else:
        # Gros client - use sup_400 as default
        idx = type_tarifaire - 6  # Type 6 -> index 0
        if idx < len(tarifs_big["sup_400"]["off"]):
            tarif_hc = tarifs_big["sup_400"]["off"][idx] * coeff_annee
            tarif_hp = tarifs_big["sup_400"]["peak"][idx] * coeff_annee
            prime_fixe = tarifs_big["sup_400"]["pf"][idx] * coeff_annee

    return TarifsProfilInfo(
        type_tarifaire=type_tarifaire,
        categorie=categorie,
        plage_horaire=plage_horaire,
        intervalle_min=intervalle_min,
        intervalle_max=intervalle_max,
        tarif_hc=tarif_hc,
        tarif_hp=tarif_hp,
        prime_fixe=prime_fixe
    )


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload and process an Excel file
    """
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier doit être au format Excel (.xlsx ou .xls)"
        )

    # Read file
    contents = await file.read()
    try:
        df = pd.read_excel(BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur lors de la lecture du fichier: {str(e)}"
        )

    # Validate columns
    if not validate_required_columns(df):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier ne contient pas toutes les colonnes requises"
        )

    # Calculate enriched data
    df_enriched = calculs.appliquer_tous_calculs(df)

    # Store in session
    session_manager.store_user_data(current_user.id, df_enriched)

    # Detect services
    services = df_enriched['SERVICE_NO'].unique()

    if len(services) == 1:
        # Single service
        service_no = services[0]  # Keep original type
        df_service = df_enriched[df_enriched['SERVICE_NO'] == service_no]

        if df_service.empty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Aucune donnée trouvée pour le service {service_no}"
            )

        first_row = df_service.iloc[0]

        return UploadResponse(
            single_service=True,
            service_no=str(service_no),
            nom_client=str(first_row['CUST_NAME']),
            data_ready=True
        )
    else:
        # Multiple services
        service_list = []
        for service_no in services:
            df_service = df_enriched[df_enriched['SERVICE_NO'] == service_no]
            if not df_service.empty:
                first_row = df_service.iloc[0]
                service_list.append(ServiceInfo(
                    service_no=str(service_no),
                    nom_client=str(first_row['CUST_NAME']),
                    region=str(first_row['REGION']),
                    puissance=float(first_row['SUBSCRIPTION_LOAD']),
                    nb_lignes=len(df_service)
                ))

        return UploadResponse(
            single_service=False,
            services=service_list,
            data_ready=False
        )


@router.post("/select-service", response_model=ServiceSelectionResponse)
async def select_service(
    selection: ServiceSelection,
    current_user: User = Depends(get_current_user)
):
    """
    Select a specific service from multi-service data
    """
    # Get user's data
    df = session_manager.get_user_data(current_user.id)
    if df is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée trouvée. Veuillez d'abord uploader un fichier."
        )

    # Filter for selected service
    df_service = df[df['SERVICE_NO'] == selection.service_no].copy()

    if df_service.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service {selection.service_no} non trouvé dans les données"
        )

    # Store filtered data
    session_manager.store_user_data(current_user.id, df_service)

    return ServiceSelectionResponse(
        data_ready=True,
        service_no=selection.service_no,
        nom_client=str(df_service.iloc[0]['CUST_NAME'])
    )


@router.get("/profil", response_model=ProfilClientResponse)
async def get_profil_client(
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive client profile matching Streamlit 'État des lieux et profil' page
    Returns 3 sections:
    1. infos_administratives: Administrative profile (5 fields)
    2. profil_energetique: Energy profile summary with 6 tables (for selected year)
    3. profil_consommation: Multi-year consumption analysis with graphs and tables
    """
    # Get user's data
    df = session_manager.get_user_data(current_user.id)
    if df is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée trouvée. Veuillez d'abord uploader un fichier."
        )

    # ========== SECTION 1: ADMINISTRATIVE INFO ==========
    first_row = df.iloc[0]
    service_no = str(first_row['SERVICE_NO'])
    nom_client = str(first_row['CUST_NAME'])
    region = str(first_row['REGION'])
    division = str(first_row['DIVISION'])
    agence = str(first_row['AGENCE'])

    # Get available years (descending order: 2025, 2024, 2023)
    df['ANNEE'] = pd.to_datetime(df['READING_DATE']).dt.year
    annees_disponibles = sorted(df['ANNEE'].unique().tolist(), reverse=True)

    # If no year specified, use the most recent year
    if year is None:
        year = annees_disponibles[0]

    # Validate year
    if year not in annees_disponibles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Année {year} non disponible dans les données"
        )

    infos_administratives = {
        "nom_client": nom_client,
        "service_no": service_no,
        "region": region,
        "division": division,
        "agence": agence,
        "annees_disponibles": annees_disponibles
    }

    # ========== SECTION 2: ENERGETIC PROFILE (for selected year) ==========
    df_year = df[df['ANNEE'] == year].copy().sort_values('READING_DATE')

    # Basic calculations
    puissance_souscrite = float(df_year['SUBSCRIPTION_LOAD'].iloc[0])
    puissance_max = float(df_year['PUISSANCE_ATTEINTE'].max())
    puissance_min = float(df_year['PUISSANCE_ATTEINTE'].min())
    puissance_moyenne = float(df_year['PUISSANCE_ATTEINTE'].mean())

    consommation_max = float(df_year['MV_CONSUMPTION'].max())
    consommation_min = float(df_year['MV_CONSUMPTION'].min())
    consommation_moyenne = float(df_year['MV_CONSUMPTION'].mean())

    conso_hc_moyenne = float(df_year['CONSO HORS POINTE'].mean())
    conso_hp_moyenne = float(df_year['CONSO POINTE'].mean())

    # Ratios HC/HP
    total_hc = df_year['CONSO HORS POINTE'].sum()
    total_hp = df_year['CONSO POINTE'].sum()
    total_energie = total_hc + total_hp
    ratio_hc = (total_hc / total_energie * 100) if total_energie > 0 else 0
    ratio_hp = (total_hp / total_energie * 100) if total_energie > 0 else 0

    # Temps de fonctionnement moyen
    temps_fonct_moy = consommation_moyenne / puissance_moyenne if puissance_moyenne > 0 else 0

    # Dépassements
    nb_depassements = int((df_year['PUISSANCE_ATTEINTE'] > puissance_souscrite).sum())
    nb_total_mois = len(df_year)
    pct_depassements = (nb_depassements / nb_total_mois * 100) if nb_total_mois > 0 else 0

    # Facturation
    facture_max = float(df_year['AMOUNT_WITH_TAX'].max())
    facture_min = float(df_year['AMOUNT_WITH_TAX'].min())
    facture_moy = float(df_year['AMOUNT_WITH_TAX'].mean())
    facture_total = float(df_year['AMOUNT_WITH_TAX'].sum())

    # Trouver les mois pour les min/max
    idx_pmax = df_year['PUISSANCE_ATTEINTE'].idxmax()
    mois_pmax = df_year.loc[idx_pmax, 'READING_DATE']
    mois_pmax_str = pd.to_datetime(mois_pmax).strftime('%b %Y')

    idx_pmin = df_year['PUISSANCE_ATTEINTE'].idxmin()
    mois_pmin = df_year.loc[idx_pmin, 'READING_DATE']
    mois_pmin_str = pd.to_datetime(mois_pmin).strftime('%b %Y')

    idx_cmax = df_year['MV_CONSUMPTION'].idxmax()
    mois_cmax = df_year.loc[idx_cmax, 'READING_DATE']
    mois_cmax_str = pd.to_datetime(mois_cmax).strftime('%b %Y')

    idx_cmin = df_year['MV_CONSUMPTION'].idxmin()
    mois_cmin = df_year.loc[idx_cmin, 'READING_DATE']
    mois_cmin_str = pd.to_datetime(mois_cmin).strftime('%b %Y')

    idx_fmax = df_year['AMOUNT_WITH_TAX'].idxmax()
    mois_fmax = df_year.loc[idx_fmax, 'READING_DATE']
    mois_fmax_str = pd.to_datetime(mois_fmax).strftime('%b %Y')

    idx_fmin = df_year['AMOUNT_WITH_TAX'].idxmin()
    mois_fmin = df_year.loc[idx_fmin, 'READING_DATE']
    mois_fmin_str = pd.to_datetime(mois_fmin).strftime('%b %Y')

    # Get tariffs for this year
    tarifs_info = calculer_tarifs_profil(puissance_souscrite, year)

    # Tableau 1: Caractéristiques contractuelles et tarifaires
    tableau1 = {
        'puissance_souscrite': f"{puissance_souscrite:.0f} kW",
        'type_tarifaire': f"Type {tarifs_info.type_tarifaire}",
        'categorie': tarifs_info.categorie,
        'plage_horaire': tarifs_info.plage_horaire,
        'tarif_hc': f"{tarifs_info.tarif_hc:.3f} FCFA/kWh",
        'tarif_hp': f"{tarifs_info.tarif_hp:.3f} FCFA/kWh",
        'prime_fixe': f"{tarifs_info.prime_fixe:.2f} FCFA/kW"
    }

    # Tableau 1bis: Projection N+1 (only if year == 2025)
    tableau1bis = None
    if year == 2025:
        tarifs_info_suivante = calculer_tarifs_profil(puissance_souscrite, 2026)
        tableau1bis = {
            'puissance_souscrite': f"{puissance_souscrite:.0f} kW",
            'type_tarifaire': f"Type {tarifs_info_suivante.type_tarifaire}",
            'categorie': tarifs_info_suivante.categorie,
            'plage_horaire': tarifs_info_suivante.plage_horaire,
            'tarif_hc': f"{tarifs_info_suivante.tarif_hc:.3f} FCFA/kWh",
            'tarif_hp': f"{tarifs_info_suivante.tarif_hp:.3f} FCFA/kWh",
            'prime_fixe': f"{tarifs_info_suivante.prime_fixe:.2f} FCFA/kW"
        }

    # Tableau 2: Puissances atteintes
    depassement_warning = nb_depassements > 0
    tableau2 = {
        'puissance_max': {
            'valeur': f"{puissance_max:.0f} kW",
            'mois': mois_pmax_str,
            'warning': puissance_max > puissance_souscrite
        },
        'puissance_min': {
            'valeur': f"{puissance_min:.0f} kW",
            'mois': mois_pmin_str
        },
        'puissance_moyenne': f"{puissance_moyenne:.0f} kW",
        'depassements': {
            'nb': nb_depassements,
            'total': nb_total_mois,
            'pct': pct_depassements,
            'warning': depassement_warning
        }
    }

    # Tableau 3: Consommations
    cosphi_disponible = 'COSPHI' in df_year.columns and df_year['COSPHI'].notna().any()
    cosphi_moy = None
    cosphi_status = None
    if cosphi_disponible:
        cosphi_moy = float(df_year['COSPHI'].mean())
        cosphi_status = cosphi_moy >= 0.85

    tableau3 = {
        'conso_max': {
            'valeur': f"{consommation_max:,.0f} kWh",
            'mois': mois_cmax_str
        },
        'conso_min': {
            'valeur': f"{consommation_min:,.0f} kWh",
            'mois': mois_cmin_str
        },
        'conso_moyenne': f"{consommation_moyenne:,.0f} kWh",
        'conso_hc_moyenne': f"{conso_hc_moyenne:,.0f} kWh",
        'conso_hp_moyenne': f"{conso_hp_moyenne:,.0f} kWh",
        'ratio_hc_hp': f"{ratio_hc:.1f}% / {ratio_hp:.1f}%",
        'temps_fonct_moyen': f"{temps_fonct_moy:.0f} h/mois"
    }
    if cosphi_disponible:
        tableau3['cosphi_moyen'] = {
            'valeur': f"{cosphi_moy:.2f}",
            'status': cosphi_status
        }

    # Tableau 4: Facturation TTC
    tableau4 = {
        'facture_max': {
            'valeur': f"{facture_max:,.0f} FCFA",
            'mois': mois_fmax_str
        },
        'facture_min': {
            'valeur': f"{facture_min:,.0f} FCFA",
            'mois': mois_fmin_str
        },
        'facture_moyenne': f"{facture_moy:,.0f} FCFA",
        'facture_totale': f"{facture_total:,.0f} FCFA"
    }

    # Tableau 5: Cos φ (if available)
    tableau5 = None
    if cosphi_disponible:
        cosphi_max = float(df_year['COSPHI'].max())
        cosphi_min = float(df_year['COSPHI'].min())
        nb_mois_mauvais_cosphi = int((df_year['COSPHI'] < 0.9).sum())

        idx_cosphi_max = df_year['COSPHI'].idxmax()
        mois_cosphi_max_str = pd.to_datetime(df_year.loc[idx_cosphi_max, 'READING_DATE']).strftime('%b %Y')

        idx_cosphi_min = df_year['COSPHI'].idxmin()
        mois_cosphi_min_str = pd.to_datetime(df_year.loc[idx_cosphi_min, 'READING_DATE']).strftime('%b %Y')

        tableau5 = {
            'cosphi_max': {
                'valeur': f"{cosphi_max:.2f}",
                'mois': mois_cosphi_max_str,
                'status': cosphi_max >= 0.9
            },
            'cosphi_min': {
                'valeur': f"{cosphi_min:.2f}",
                'mois': mois_cosphi_min_str,
                'status': cosphi_min >= 0.9
            },
            'cosphi_moyen': {
                'valeur': f"{cosphi_moy:.2f}",
                'status': cosphi_moy >= 0.9
            },
            'nb_mois_mauvais': {
                'nb': nb_mois_mauvais_cosphi,
                'total': nb_total_mois,
                'status': nb_mois_mauvais_cosphi == 0
            }
        }

    # Tableau 6: Pénalité Cos φ (if available)
    tableau6 = None
    if 'MAUVAIS_COS' in df_year.columns:
        penalite_max = float(df_year['MAUVAIS_COS'].max())
        penalite_min = float(df_year['MAUVAIS_COS'].min())
        penalite_moy = float(df_year['MAUVAIS_COS'].mean())
        penalite_total = float(df_year['MAUVAIS_COS'].sum())

        idx_pen_max = df_year['MAUVAIS_COS'].idxmax()
        mois_pen_max_str = pd.to_datetime(df_year.loc[idx_pen_max, 'READING_DATE']).strftime('%b %Y')

        idx_pen_min = df_year['MAUVAIS_COS'].idxmin()
        mois_pen_min_str = pd.to_datetime(df_year.loc[idx_pen_min, 'READING_DATE']).strftime('%b %Y')

        tableau6 = {
            'penalite_max': {
                'valeur': f"{penalite_max:,.0f} FCFA",
                'mois': mois_pen_max_str
            },
            'penalite_min': {
                'valeur': f"{penalite_min:,.0f} FCFA",
                'mois': mois_pen_min_str
            },
            'penalite_moyenne': f"{penalite_moy:,.0f} FCFA",
            'penalite_totale': f"{penalite_total:,.0f} FCFA"
        }

    profil_energetique = {
        'annee': year,
        'tableau1': tableau1,
        'tableau1bis': tableau1bis,
        'tableau2': tableau2,
        'tableau3': tableau3,
        'tableau4': tableau4,
        'tableau5': tableau5,
        'tableau6': tableau6
    }

    # ========== SECTION 3: CONSUMPTION PROFILE (multi-year) ==========

    # Graph 1 data: Monthly consumption evolution (all years)
    graph1_series = []
    for annee in annees_disponibles:
        df_annee = df[df['ANNEE'] == annee].copy().sort_values('READING_DATE')
        graph1_series.append({
            'annee': int(annee),
            'mois': df_annee['READING_DATE'].dt.month.tolist(),
            'consommation': df_annee['MV_CONSUMPTION'].tolist()
        })

    # Tableau variation consommation
    conso_par_annee = df.groupby('ANNEE')['MV_CONSUMPTION'].sum().sort_index()
    annees_list = sorted(conso_par_annee.index.tolist())

    tableau_variation_conso = []
    for i, annee_item in enumerate(annees_list):
        row = {
            'annee': int(annee_item),
            'consommation': float(conso_par_annee[annee_item])
        }
        if i > 0:
            annee_prec = annees_list[i-1]
            conso_prec = conso_par_annee[annee_prec]
            variation_pct = ((conso_par_annee[annee_item] - conso_prec) / conso_prec) * 100 if conso_prec > 0 else 0
            row['variation'] = variation_pct
        tableau_variation_conso.append(row)

    # Graph 2 data: HC/HP stacked + Facturation (dual axis)
    conso_hc_par_annee = df.groupby('ANNEE')['CONSO HORS POINTE'].sum() / 1e3  # MWh
    conso_hp_par_annee = df.groupby('ANNEE')['CONSO POINTE'].sum() / 1e3  # MWh
    facturation_par_annee = df.groupby('ANNEE')['AMOUNT_WITH_TAX'].sum() / 1e6  # M FCFA

    conso_hc_par_annee = conso_hc_par_annee.sort_index(ascending=False)
    conso_hp_par_annee = conso_hp_par_annee.sort_index(ascending=False)
    facturation_par_annee = facturation_par_annee.sort_index(ascending=False)

    graph2_data = {
        'annees': [int(a) for a in conso_hc_par_annee.index.tolist()],
        'hc': conso_hc_par_annee.tolist(),
        'hp': conso_hp_par_annee.tolist(),
        'facturation': facturation_par_annee.tolist()
    }

    # Tableau variation facturation
    fact_par_annee = df.groupby('ANNEE')['AMOUNT_WITH_TAX'].sum().sort_index()
    tableau_variation_fact = []
    for i, annee_item in enumerate(annees_list):
        row = {
            'annee': int(annee_item),
            'facturation': float(fact_par_annee[annee_item])
        }
        if i > 0:
            annee_prec = annees_list[i-1]
            fact_prec = fact_par_annee[annee_prec]
            variation_pct = ((fact_par_annee[annee_item] - fact_prec) / fact_prec) * 100 if fact_prec > 0 else 0
            row['variation'] = variation_pct
        tableau_variation_fact.append(row)

    # Tableau prix unitaire
    conso_totale_par_annee = df.groupby('ANNEE')['MV_CONSUMPTION'].sum()
    facturation_totale_par_annee = df.groupby('ANNEE')['AMOUNT_WITH_TAX'].sum()
    prix_unitaire_par_annee = facturation_totale_par_annee / conso_totale_par_annee

    tableau_prix_unitaire = []
    for annee_item in sorted(annees_list, reverse=True):
        tableau_prix_unitaire.append({
            'annee': int(annee_item),
            'consommation': float(conso_totale_par_annee[annee_item]),
            'facturation': float(facturation_totale_par_annee[annee_item]),
            'prix_unitaire': float(prix_unitaire_par_annee[annee_item])
        })

    # Tableau récapitulatif statistiques annuelles
    tableau_recapitulatif = []
    for annee_item in sorted(annees_list, reverse=True):
        df_annee = df[df['ANNEE'] == annee_item].sort_values('READING_DATE')

        total_mwh = df_annee['MV_CONSUMPTION'].sum() / 1e3
        moy_mensuelle_mwh = df_annee['MV_CONSUMPTION'].mean() / 1e3

        total_hc_annee = df_annee['CONSO HORS POINTE'].sum() / 1e3
        total_hp_annee = df_annee['CONSO POINTE'].sum() / 1e3
        total_energie_annee = total_hc_annee + total_hp_annee
        pct_hc = (total_hc_annee / total_energie_annee * 100) if total_energie_annee > 0 else 0
        pct_hp = (total_hp_annee / total_energie_annee * 100) if total_energie_annee > 0 else 0

        idx_max_annee = df_annee['MV_CONSUMPTION'].idxmax()
        mois_num = int(df_annee.loc[idx_max_annee, 'READING_DATE'].month)
        val_max_annee = df_annee['MV_CONSUMPTION'].max() / 1e3
        mois_noms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
        mois_max_str = f"{mois_noms[mois_num-1]} ({val_max_annee:.1f} MWh)"

        facturation_total_annee = df_annee['AMOUNT_WITH_TAX'].sum() / 1e6

        tableau_recapitulatif.append({
            'annee': int(annee_item),
            'consommation_totale': f"{total_mwh:.2f} MWh",
            'consommation_moyenne': f"{moy_mensuelle_mwh:.2f} MWh",
            'heures_creuses': f"{total_hc_annee:.2f} MWh ({pct_hc:.1f}%)",
            'heures_pointe': f"{total_hp_annee:.2f} MWh ({pct_hp:.1f}%)",
            'mois_consommation_max': mois_max_str,
            'facturation_totale': f"{facturation_total_annee:.2f} M FCFA"
        })

    profil_consommation = {
        'graph1_evolution': {
            'series': graph1_series
        },
        'tableau_variation_conso': tableau_variation_conso,
        'graph2_hc_hp_facturation': graph2_data,
        'tableau_variation_facturation': tableau_variation_fact,
        'tableau_prix_unitaire': tableau_prix_unitaire,
        'tableau_recapitulatif': tableau_recapitulatif
    }

    return ProfilClientResponse(
        infos_administratives=infos_administratives,
        profil_energetique=profil_energetique,
        profil_consommation=profil_consommation
    )


@router.get("/synthese", response_model=SyntheseResponse)
async def get_synthese(
    year: int,
    current_user: User = Depends(get_current_user)
):
    """
    Get synthesis table for a specific year
    """
    # Get user's data
    df = session_manager.get_user_data(current_user.id)
    if df is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée trouvée. Veuillez d'abord uploader un fichier."
        )

    # Filter for year
    df['ANNEE'] = pd.to_datetime(df['READING_DATE']).dt.year
    df_year = df[df['ANNEE'] == year].copy()

    if df_year.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aucune donnée pour l'année {year}"
        )

    # Extract info
    nom_client = str(df_year.iloc[0]['CUST_NAME'])
    service_no = str(df_year.iloc[0]['SERVICE_NO'])

    # Sort by date
    df_year = df_year.sort_values('READING_DATE')

    # Build table
    tableau = []
    for _, row in df_year.iterrows():
        mois_str = pd.to_datetime(row['READING_DATE']).strftime('%B %Y')

        tableau.append({
            'mois': mois_str,
            'date_releve': pd.to_datetime(row['READING_DATE']).strftime('%Y-%m-%d'),
            'puissance_souscrite': int(row['SUBSCRIPTION_LOAD']),
            'puissance_atteinte': int(row['PUISSANCE_ATTEINTE']),
            'depassement': int(row['DEPASSEMENT_PUISSANCE']),
            'consommation': float(row['MV_CONSUMPTION']),
            'consommation_hc': float(row['CONSO HORS POINTE']),
            'consommation_hp': float(row['CONSO POINTE']),
            'facture_ht': float(row['AMOUNT_WITHOUT_TAX']),
            'facture_ttc': float(row['AMOUNT_WITH_TAX']),
            'prime_fixe': float(row['PRIME_FIXE_CALCULEE']),
            'tarif_hc': float(row['TARIF_HORS_POINTE']),
            'tarif_hp': float(row['TARIF_POINTE']),
            'type_tarifaire': int(row['CATEGORIE'])
        })

    return SyntheseResponse(
        year=year,
        nom_client=nom_client,
        service_no=service_no,
        tableau=tableau
    )


@router.get("/graphiques", response_model=GraphiquesResponse)
async def get_graphiques(
    year: int,
    current_user: User = Depends(get_current_user)
):
    """
    Get all graphs data for a specific year (Plotly-ready format)
    """
    # Get user's data
    df = session_manager.get_user_data(current_user.id)
    if df is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée trouvée"
        )

    # Filter for year
    df['ANNEE'] = pd.to_datetime(df['READING_DATE']).dt.year
    df_year = df[df['ANNEE'] == year].copy()

    if df_year.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aucune donnée pour l'année {year}"
        )

    # Sort by date
    df_year = df_year.sort_values('READING_DATE')

    # Month labels
    mois_labels = pd.to_datetime(df_year['READING_DATE']).dt.strftime('%b %Y').tolist()

    # Graph 1: Monthly consumption
    consommation_mensuelle = {
        "x": mois_labels,
        "y": df_year['MV_CONSUMPTION'].tolist(),
        "type": "scatter",
        "mode": "lines+markers",
        "name": "Consommation",
        "title": f"Consommation mensuelle - {year}",
        "xaxis_title": "Mois",
        "yaxis_title": "Consommation (kWh)"
    }

    # Graph 2: HC vs HP
    heures_creuses_pointe = {
        "x": mois_labels,
        "y_hc": df_year['CONSO HORS POINTE'].tolist(),
        "y_hp": df_year['CONSO POINTE'].tolist(),
        "type": "bar",
        "title": f"Heures creuses vs Heures de pointe - {year}",
        "xaxis_title": "Mois",
        "yaxis_title": "Consommation (kWh)"
    }

    # Graph 3: Power
    puissance_souscrite = float(df_year['SUBSCRIPTION_LOAD'].iloc[0])
    puissance = {
        "x": mois_labels,
        "y_atteinte": df_year['PUISSANCE_ATTEINTE'].tolist(),
        "y_souscrite": [puissance_souscrite] * len(mois_labels),
        "type": "scatter",
        "title": f"Puissance atteinte vs souscrite - {year}",
        "xaxis_title": "Mois",
        "yaxis_title": "Puissance (kW)"
    }

    # Graph 4: Billing and consumption (dual axis)
    facturation_consommation = {
        "x": mois_labels,
        "facturation": df_year['AMOUNT_WITH_TAX'].tolist(),
        "consommation": df_year['MV_CONSUMPTION'].tolist(),
        "type": "dual",
        "title": f"Facturation et Consommation - {year}",
        "xaxis_title": "Mois",
        "yaxis1_title": "Facturation (FCFA)",
        "yaxis2_title": "Consommation (kWh)"
    }

    # Graph 5: Cos(φ) if available
    cosphi_graph = None
    if 'COSPHI' in df_year.columns and df_year['COSPHI'].notna().any():
        cosphi_graph = {
            "x": mois_labels,
            "y": df_year['COSPHI'].tolist(),
            "y_seuil": [0.85] * len(mois_labels),
            "type": "scatter",
            "title": f"Évolution du Cos(φ) - {year}",
            "xaxis_title": "Mois",
            "yaxis_title": "Cos(φ)",
            "cosphi_moyen": float(df_year['COSPHI'].mean()),
            "cosphi_min": float(df_year['COSPHI'].min()),
            "cosphi_max": float(df_year['COSPHI'].max()),
            "nb_mois_sous_seuil": int((df_year['COSPHI'] < 0.85).sum())
        }

    # Metrics
    metriques = {
        "consommation_totale": float(df_year['MV_CONSUMPTION'].sum()),
        "facture_totale": float(df_year['AMOUNT_WITH_TAX'].sum()),
        "puissance_max": float(df_year['PUISSANCE_ATTEINTE'].max()),
        "nb_depassements": int((df_year['DEPASSEMENT_PUISSANCE'] > 0).sum())
    }

    return GraphiquesResponse(
        year=year,
        consommation_mensuelle=consommation_mensuelle,
        heures_creuses_pointe=heures_creuses_pointe,
        puissance=puissance,
        facturation_consommation=facturation_consommation,
        cosphi=cosphi_graph,
        metriques=metriques
    )


@router.get("/dashboard")
async def get_multi_service_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard table for multi-service data
    Shows summary of all services in uploaded file
    """
    # Get raw uploaded data (before service selection)
    df_raw = session_manager.get_user_data(current_user.id)
    if df_raw is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée trouvée. Veuillez d'abord uploader un fichier."
        )

    # Detect services
    services_unique = df_raw['SERVICE_NO'].unique()

    if len(services_unique) == 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce fichier ne contient qu'un seul service. Le dashboard multi-services n'est pas disponible."
        )

    # Build dashboard table
    tableau_data = []

    for service_no in services_unique:
        df_service = df_raw[df_raw['SERVICE_NO'] == service_no].copy()

        if not df_service.empty:
            # Extract info
            client_name = str(df_service['CUST_NAME'].iloc[0])
            region = str(df_service['REGION'].iloc[0]) if 'REGION' in df_service.columns else "N/A"
            division = str(df_service['DIVISION'].iloc[0]) if 'DIVISION' in df_service.columns else "N/A"
            agence = str(df_service['AGENCE'].iloc[0]) if 'AGENCE' in df_service.columns else "N/A"

            # Date range
            df_service['READING_DATE'] = pd.to_datetime(df_service['READING_DATE'])
            date_min = df_service['READING_DATE'].min().strftime('%Y-%m-%d')
            date_max = df_service['READING_DATE'].max().strftime('%Y-%m-%d')

            # Metrics
            puissance_souscrite = float(df_service['SUBSCRIPTION_LOAD'].iloc[0])
            puissance_max = float(df_service['PUISSANCE_ATTEINTE'].max())
            conso_totale = float(df_service['MV_CONSUMPTION'].sum())
            facture_totale = float(df_service['AMOUNT_WITH_TAX'].sum())
            nb_lignes = len(df_service)

            tableau_data.append({
                'SERVICE_NO': str(service_no),
                'CLIENT_NAME': client_name,
                'REGION': region,
                'DIVISION': division,
                'AGENCE': agence,
                'DATE_DEBUT': date_min,
                'DATE_FIN': date_max,
                'NB_FACTURES': nb_lignes,
                'PUISSANCE_SOUSCRITE': puissance_souscrite,
                'PUISSANCE_MAX_ATTEINTE': puissance_max,
                'CONSOMMATION_TOTALE': conso_totale,
                'FACTURE_TOTALE': facture_totale
            })

    return {
        "nb_services": len(services_unique),
        "tableau": tableau_data
    }


@router.get("/reconstitution", response_model=ReconstitutionResponse)
async def get_reconstitution(
    year: int,
    current_user: User = Depends(get_current_user)
):
    """
    Get reconstitution data for invoice reconstruction
    Returns:
    - Global metrics (facture réelle, recalculée, gap, dépassements)
    - Monthly detail table
    - Comparison graph (real vs recalculated)
    - Gap graph (monthly differences)
    """
    # Get user's data
    df = session_manager.get_user_data(current_user.id)
    if df is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée trouvée. Veuillez d'abord uploader un fichier."
        )

    # Get available years
    df['ANNEE'] = pd.to_datetime(df['READING_DATE']).dt.year
    annees_disponibles = sorted(df['ANNEE'].unique().tolist(), reverse=True)

    # Validate year
    if year not in annees_disponibles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Année {year} non disponible dans les données"
        )

    # Filter for year
    df_year = df[df['ANNEE'] == year].copy()
    df_year = df_year.sort_values('READING_DATE')

    # Extract info
    nom_client = str(df_year.iloc[0]['CUST_NAME'])
    service_no = str(df_year.iloc[0]['SERVICE_NO'])

    # === GLOBAL METRICS ===
    facture_reelle_total = float(df_year['AMOUNT_WITH_TAX'].sum())

    # Facture recalculée: ((FACTURATION HORS POINTE + FACTURATION POINTE + (PUISSANCE A UTILISER * PRIME_FIXE_CALCULEE)) * (1 + 0.1925))
    facture_calculee_total = float(
        ((df_year['FACTURATION HORS POINTE'] +
          df_year['FACTURATION POINTE'] +
          (df_year['PUISSANCE A UTILISER'] * df_year['PRIME_FIXE_CALCULEE'])) * (1 + 0.1925)).sum()
    )

    gap_total = facture_calculee_total - facture_reelle_total
    nb_depassements = int((df_year['DEPASSEMENT_PUISSANCE'] > 0).sum())

    metriques_globales = {
        "facture_reelle_total": facture_reelle_total,
        "facture_calculee_total": facture_calculee_total,
        "gap_total": gap_total,
        "nb_depassements": nb_depassements
    }

    # === MONTHLY TABLE ===
    tableau_mensuel = []

    for _, row in df_year.iterrows():
        mois_str = pd.to_datetime(row['READING_DATE']).strftime('%B %Y')

        facture_reelle = float(row['AMOUNT_WITH_TAX'])
        facture_calculee = float(
            (row['FACTURATION HORS POINTE'] +
             row['FACTURATION POINTE'] +
             (row['PUISSANCE A UTILISER'] * row['PRIME_FIXE_CALCULEE'])) * (1 + 0.1925)
        )
        ecart = facture_calculee - facture_reelle

        tableau_mensuel.append({
            'mois': mois_str,
            'puissance_souscrite': int(row['SUBSCRIPTION_LOAD']),
            'puissance_atteinte': int(row['PUISSANCE_ATTEINTE']),
            'depassement': int(row['DEPASSEMENT_PUISSANCE']),
            'type_tarifaire': int(row['CATEGORIE']),
            'facture_reelle': facture_reelle,
            'facture_calculee': facture_calculee,
            'ecart': ecart
        })

    # === GRAPH 1: Comparison (Real vs Recalculated) ===
    mois_labels = pd.to_datetime(df_year['READING_DATE']).dt.strftime('%b %Y').tolist()

    factures_reelles = df_year['AMOUNT_WITH_TAX'].tolist()
    factures_calculees = [
        float((row['FACTURATION HORS POINTE'] +
               row['FACTURATION POINTE'] +
               (row['PUISSANCE A UTILISER'] * row['PRIME_FIXE_CALCULEE'])) * (1 + 0.1925))
        for _, row in df_year.iterrows()
    ]

    graph_comparaison = {
        "x": mois_labels,
        "y_reelle": factures_reelles,
        "y_calculee": factures_calculees,
        "type": "bar",
        "title": f"Facture Réelle vs Recalculée - {year}",
        "xaxis_title": "Mois",
        "yaxis_title": "Montant (FCFA)"
    }

    # === GRAPH 2: Monthly Gaps ===
    ecarts = [calc - reel for calc, reel in zip(factures_calculees, factures_reelles)]

    graph_ecarts = {
        "x": mois_labels,
        "y": ecarts,
        "type": "bar",
        "title": f"Écarts mensuels (Gap) - {year}",
        "xaxis_title": "Mois",
        "yaxis_title": "Écart (FCFA)"
    }

    return ReconstitutionResponse(
        year=year,
        nom_client=nom_client,
        service_no=service_no,
        annees_disponibles=annees_disponibles,
        metriques_globales=metriques_globales,
        tableau_mensuel=tableau_mensuel,
        graph_comparaison=graph_comparaison,
        graph_ecarts=graph_ecarts
    )
