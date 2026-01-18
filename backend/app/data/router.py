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
from ..core import calculs, synthese as synthese_module, optimisation
from ..core.config import type_table, tarifs_small, tarifs_big
from .schemas import (
    UploadResponse, ServiceInfo, ServiceSelection,
    ServiceSelectionResponse, SyntheseResponse, GraphiquesResponse,
    ProfilClientResponse, TarifsProfilInfo, ReconstitutionResponse,
    OptimisationInitResponse, OptimisationSimulationRequest, OptimisationSimulationResponse
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
    Base year is 2023
    """
    annees_ecart = annee - 2023
    if annees_ecart <= 0:
        return 1.0

    if puissance < 3000:
        return 1.05 ** annees_ecart  # 5% per year for small clients
    else:
        return 1.1 ** annees_ecart   # 10% per year for large clients


def calculer_tarifs_profil(puissance: float, annee: int) -> TarifsProfilInfo:
    """
    Calculate detailed tariffs for client profile display
    Reproduces exactly Streamlit's tariff detection and display

    Args:
        puissance: Subscribed power in kW
        annee: Year for tariff calculation

    Returns:
        TarifsProfilInfo with all tariff details including full table by operating time ranges
    """
    # Determine category and coefficients
    if puissance < 3000:
        categorie = "Petit client (≤3000 kW)"
        tarifs_dict = tarifs_small
    else:
        categorie = "Gros client (>3000 kW)"
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

    # Build complete tariff table matching Streamlit display
    tableau_tarifs = []

    if type_tarifaire <= 5:
        # Petit client - 3 plages de temps de fonctionnement
        idx = type_tarifaire - 1  # Type 1 -> index 0

        if idx < len(tarifs_small["0_200"]["off"]):
            tableau_tarifs.append({
                "temps_fonctionnement": "0-200h",
                "tarif_hc": round(tarifs_small["0_200"]["off"][idx] * coeff_annee, 3),
                "tarif_hp": round(tarifs_small["0_200"]["peak"][idx] * coeff_annee, 3),
                "prime_fixe": round(tarifs_small["0_200"]["pf"][idx] * coeff_annee, 2)
            })
            tableau_tarifs.append({
                "temps_fonctionnement": "201-400h",
                "tarif_hc": round(tarifs_small["201_400"]["off"][idx] * coeff_annee, 3),
                "tarif_hp": round(tarifs_small["201_400"]["peak"][idx] * coeff_annee, 3),
                "prime_fixe": round(tarifs_small["201_400"]["pf"][idx] * coeff_annee, 2)
            })
            tableau_tarifs.append({
                "temps_fonctionnement": ">400h",
                "tarif_hc": round(tarifs_small["sup_400"]["off"][idx] * coeff_annee, 3),
                "tarif_hp": round(tarifs_small["sup_400"]["peak"][idx] * coeff_annee, 3),
                "prime_fixe": round(tarifs_small["sup_400"]["pf"][idx] * coeff_annee, 2)
            })
    else:
        # Gros client - 2 plages de temps de fonctionnement
        idx = type_tarifaire - 6  # Type 6 -> index 0

        if idx < len(tarifs_big["0_400"]["off"]):
            tableau_tarifs.append({
                "temps_fonctionnement": "0-400h",
                "tarif_hc": round(tarifs_big["0_400"]["off"][idx] * coeff_annee, 3),
                "tarif_hp": round(tarifs_big["0_400"]["peak"][idx] * coeff_annee, 3),
                "prime_fixe": round(tarifs_big["0_400"]["pf"][idx] * coeff_annee, 2)
            })
            tableau_tarifs.append({
                "temps_fonctionnement": ">400h",
                "tarif_hc": round(tarifs_big["sup_400"]["off"][idx] * coeff_annee, 3),
                "tarif_hp": round(tarifs_big["sup_400"]["peak"][idx] * coeff_annee, 3),
                "prime_fixe": round(tarifs_big["sup_400"]["pf"][idx] * coeff_annee, 2)
            })

    return TarifsProfilInfo(
        type_tarifaire=type_tarifaire,
        categorie=categorie,
        plage_horaire=plage_horaire,
        intervalle_min=intervalle_min,
        intervalle_max=intervalle_max,
        tableau_tarifs=tableau_tarifs
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
        'intervalle': f"{tarifs_info.intervalle_min:.0f} - {tarifs_info.intervalle_max:.0f} kW",
        'tableau_tarifs': tarifs_info.tableau_tarifs
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
            'intervalle': f"{tarifs_info_suivante.intervalle_min:.0f} - {tarifs_info_suivante.intervalle_max:.0f} kW",
            'tableau_tarifs': tarifs_info_suivante.tableau_tarifs
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
    Format matches Streamlit: indicators as rows, months as columns
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

    # Sort by date and extract month
    df_year = df_year.sort_values('READING_DATE')
    df_year['Mois'] = pd.to_datetime(df_year['READING_DATE']).dt.month

    # Create synthesis table with indicators as rows
    lignes = {
        'Énergie (kWh)': [],
        'Énergie Active P (kWh)': [],
        'Énergie Active Off P (kWh)': [],
        'Puiss. Atteinte (kW)': [],
        'Puiss. Fact (kW)': [],
        'Temps normal (h/mois)': [],
        'Cos phi': [],
        'Montant HT (F.CFA)': [],
        'Gap cos phi': [],
        'Pénalité cos phi (F.CFA)': [],
        'Montant TTC (F.CFA)': []
    }

    # Calculate monthly values
    for mois in range(1, 13):
        df_mois = df_year[df_year['Mois'] == mois]

        if df_mois.empty:
            # Month without data
            for key in lignes.keys():
                lignes[key].append(None)
        else:
            row = df_mois.iloc[0]

            lignes['Énergie (kWh)'].append(float(row['MV_CONSUMPTION']))
            lignes['Énergie Active P (kWh)'].append(float(row['ACTIVE_PEAK_IMP'] + row['ACTIVE_PEAK_EXP']))
            lignes['Énergie Active Off P (kWh)'].append(float(row['ACTIVE_OFF_PEAK_IMP'] + row['ACTIVE_OFF_PEAK_EXP']))
            lignes['Puiss. Atteinte (kW)'].append(float(row['PUISSANCE_ATTEINTE']))
            lignes['Puiss. Fact (kW)'].append(float(row['PUISSANCE A UTILISER']))
            lignes['Temps normal (h/mois)'].append(float(row['Temps fonctionnement']))
            lignes['Cos phi'].append(float(row['COSPHI']) if 'COSPHI' in df_year.columns and pd.notna(row.get('COSPHI')) else None)
            lignes['Montant HT (F.CFA)'].append(float(row['AMOUNT_WITHOUT_TAX']))

            # Gap cos phi
            cosphi_val = row.get('COSPHI', 0.9) if 'COSPHI' in df_year.columns else 0.9
            gap = float(0.9 - cosphi_val) if (pd.notna(cosphi_val) and cosphi_val < 0.9) else 0.0
            lignes['Gap cos phi'].append(gap)

            # Pénalité cos phi
            penalite = float(row.get('MAUVAIS_COS', 0)) if 'MAUVAIS_COS' in df_year.columns else 0.0
            lignes['Pénalité cos phi (F.CFA)'].append(penalite)

            lignes['Montant TTC (F.CFA)'].append(float(row['AMOUNT_WITH_TAX']))

    # Build table as list of dicts (one per indicator)
    tableau = []
    for indicateur in lignes.keys():
        row_dict = {
            'indicateur': indicateur
        }

        # Calculate annual total for summable indicators
        if indicateur in ['Énergie (kWh)', 'Énergie Active P (kWh)', 'Énergie Active Off P (kWh)',
                          'Montant HT (F.CFA)', 'Pénalité cos phi (F.CFA)', 'Montant TTC (F.CFA)']:
            valeurs = [v for v in lignes[indicateur] if v is not None]
            row_dict['annee_total'] = sum(valeurs) if valeurs else 0
        else:
            row_dict['annee_total'] = None  # No total for these indicators

        # Add monthly values (1 to 12)
        for mois_num in range(1, 13):
            row_dict[str(mois_num)] = lignes[indicateur][mois_num - 1]

        tableau.append(row_dict)

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

    # Graph 5: Cos(φ) + Consommation if available (matches Streamlit)
    cosphi_graph = None
    if 'COSPHI' in df_year.columns and df_year['COSPHI'].notna().any():
        cosphi_graph = {
            "x": mois_labels,
            "consommation": (df_year['MV_CONSUMPTION'] / 1e3).tolist(),  # MWh for bars
            "y_cosphi": df_year['COSPHI'].tolist(),  # Cos φ curve
            "y_seuil": [0.9] * len(mois_labels),  # Threshold line at 0.9
            "type": "dual",  # Bar + scatter dual axis
            "title": f"Cos(φ) et Consommation mensuelle - {year}",
            "xaxis_title": "Mois",
            "yaxis1_title": "Consommation (MWh)",
            "yaxis2_title": "Facteur de Puissance (Cos φ)",
            "cosphi_moyen": float(df_year['COSPHI'].mean()),
            "cosphi_min": float(df_year['COSPHI'].min()),
            "cosphi_max": float(df_year['COSPHI'].max()),
            "nb_mois_sous_seuil": int((df_year['COSPHI'] < 0.9).sum())
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
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get reconstitution data for invoice reconstruction
    If year is not provided, uses the most recent year available
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

    # If no year provided, use the most recent year (first in reversed sorted list)
    if year is None:
        year = annees_disponibles[0]

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
    # Calculate gap percentage
    gap_pct = (gap_total / facture_reelle_total * 100) if facture_reelle_total > 0 else 0
    nb_depassements = int((df_year['DEPASSEMENT_PUISSANCE'] > 0).sum())

    metriques_globales = {
        "facture_reelle_total": facture_reelle_total,
        "facture_calculee_total": facture_calculee_total,
        "gap_total": gap_total,
        "gap_pct": gap_pct,
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
        # Consider gaps < 100 FCFA as 0 (non-significant)
        ecart_display = ecart if abs(ecart) >= 100 else 0

        tableau_mensuel.append({
            'mois': mois_str,
            'puissance_souscrite': int(row['SUBSCRIPTION_LOAD']),
            'puissance_atteinte': int(row['PUISSANCE_ATTEINTE']),
            'depassement': int(row['DEPASSEMENT_PUISSANCE']),
            'type_tarifaire': int(row['CATEGORIE']),
            'facture_reelle': facture_reelle,
            'facture_calculee': facture_calculee,
            'ecart': ecart_display
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
    # Consider gaps < 100 FCFA as 0 (non-significant)
    ecarts_display = [e if abs(e) >= 100 else 0 for e in ecarts]
    # Format text for display on bars (in millions)
    ecarts_text = [f"{e/1e6:.2f}M" for e in ecarts_display]

    graph_ecarts = {
        "x": mois_labels,
        "y": ecarts_display,
        "text": ecarts_text,
        "type": "bar",
        "title": f"Écarts mensuels (Gap) - {year}",
        "xaxis_title": "Mois",
        "yaxis_title": "Écart (FCFA)"
    }

    # === GRAPH 3: Décomposition de la facture recalculée (stacked bars) ===
    # Heures creuses + Heures pointe + Prime fixe (all with TVA)
    heures_creuses_ttc = (df_year['FACTURATION HORS POINTE'] * (1 + 0.1925)).tolist()
    heures_pointe_ttc = (df_year['FACTURATION POINTE'] * (1 + 0.1925)).tolist()
    prime_fixe_ttc = ((df_year['PUISSANCE A UTILISER'] * df_year['PRIME_FIXE_CALCULEE']) * (1 + 0.1925)).tolist()

    graph_decomposition = {
        "x": mois_labels,
        "y_hc": heures_creuses_ttc,
        "y_hp": heures_pointe_ttc,
        "y_prime": prime_fixe_ttc,
        "type": "stacked_bar",
        "title": f"Décomposition de la facture recalculée - {year}",
        "xaxis_title": "Mois",
        "yaxis_title": "Montant TTC (FCFA)"
    }

    return ReconstitutionResponse(
        year=year,
        nom_client=nom_client,
        service_no=service_no,
        annees_disponibles=annees_disponibles,
        metriques_globales=metriques_globales,
        tableau_mensuel=tableau_mensuel,
        graph_comparaison=graph_comparaison,
        graph_ecarts=graph_ecarts,
        graph_decomposition=graph_decomposition
    )


@router.get("/optimisation/init", response_model=OptimisationInitResponse)
async def get_optimisation_init(
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Initialize optimisation page with current configuration
    If year is not provided, uses the most recent year available
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

    # If no year provided, use the most recent year
    if year is None:
        year = annees_disponibles[0]

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
    annee_N_plus_1 = year + 1

    # === CONFIGURATION ACTUELLE ===
    puissance_actuelle = int(df_year['SUBSCRIPTION_LOAD'].iloc[0])
    puissance_atteinte_max = float(df_year['PUISSANCE_ATTEINTE'].max())
    cout_actuel_total = float(df_year['AMOUNT_WITH_TAX'].sum())
    nb_depassements_actuel = int((df_year['PUISSANCE_ATTEINTE'] > puissance_actuelle).sum())

    # Type actuel
    row_type_actuel = type_table[
        (type_table['min'] <= puissance_actuelle) &
        (puissance_actuelle < type_table['max'])
    ]
    type_actuel = int(row_type_actuel['type'].values[0]) if not row_type_actuel.empty else 0

    config_actuelle = {
        "puissance_actuelle": puissance_actuelle,
        "puissance_max": puissance_atteinte_max,
        "type_actuel": type_actuel,
        "cout_annuel": cout_actuel_total,
        "nb_depassements": nb_depassements_actuel
    }

    # === STATISTIQUES PUISSANCE ===
    stats_puissance = {
        "min": float(df_year['PUISSANCE_ATTEINTE'].min()),
        "max": puissance_atteinte_max,
        "moyenne": float(df_year['PUISSANCE_ATTEINTE'].mean())
    }

    # === TARIFS ACTUELS ===
    tarifs_actuels = calculer_tarifs_profil(puissance_actuelle, year)

    return OptimisationInitResponse(
        year=year,
        annee_N_plus_1=annee_N_plus_1,
        nom_client=nom_client,
        service_no=service_no,
        annees_disponibles=annees_disponibles,
        config_actuelle=config_actuelle,
        stats_puissance=stats_puissance,
        tarifs_actuels=tarifs_actuels.dict()
    )


@router.post("/optimisation/simulate", response_model=OptimisationSimulationResponse)
async def post_optimisation_simulate(
    request: OptimisationSimulationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Simulate with new power subscription
    Returns Section 1 (Optimisation année N) and Section 2 (Projection année N+1)
    """
    year = request.year
    nouvelle_puissance = request.nouvelle_puissance
    annee_N_plus_1 = year + 1

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
    df_year = df_year.sort_values('READING_DATE')

    puissance_actuelle = int(df_year['SUBSCRIPTION_LOAD'].iloc[0])
    puissance_atteinte_max = float(df_year['PUISSANCE_ATTEINTE'].max())

    # Type pour nouvelle puissance
    row_type_optimise = type_table[
        (type_table['min'] <= nouvelle_puissance) &
        (nouvelle_puissance < type_table['max'])
    ]
    type_optimise = int(row_type_optimise['type'].values[0]) if not row_type_optimise.empty else 0

    # Type actuel
    row_type_actuel = type_table[
        (type_table['min'] <= puissance_actuelle) &
        (puissance_actuelle < type_table['max'])
    ]
    type_actuel = int(row_type_actuel['type'].values[0]) if not row_type_actuel.empty else 0

    # === INFO NOUVELLE PUISSANCE ===
    delta_puissance = nouvelle_puissance - puissance_actuelle
    nb_mois_depassement = int((df_year['PUISSANCE_ATTEINTE'] > nouvelle_puissance).sum())

    # Détecter si risque de dépassement
    alerte_depassement = None
    if nouvelle_puissance < puissance_atteinte_max:
        alerte_depassement = {
            "type": "error",
            "message": f"Risque de dépassements ! La puissance saisie ({nouvelle_puissance:.0f} kW) est inférieure à votre puissance maximale atteinte ({puissance_atteinte_max:.0f} kW). Vous aurez des dépassements sur {nb_mois_depassement} mois."
        }
    elif nouvelle_puissance >= puissance_atteinte_max and nouvelle_puissance < puissance_actuelle:
        alerte_depassement = {
            "type": "success",
            "message": f"Bonne configuration ! La puissance saisie ({nouvelle_puissance:.0f} kW) est supérieure à votre puissance maximale atteinte ({puissance_atteinte_max:.0f} kW). Aucun dépassement prévu."
        }

    # Intervalle type
    intervalle = type_table[type_table['type'] == type_optimise]
    intervalle_min = float(intervalle['min'].values[0]) if not intervalle.empty else 0
    intervalle_max = float(intervalle['max'].values[0]) if not intervalle.empty else 0

    info_nouvelle_puissance = {
        "type_optimise": type_optimise,
        "type_actuel": type_actuel,
        "type_change": "identique" if type_optimise == type_actuel else ("descente" if type_optimise < type_actuel else "montee"),
        "intervalle_min": intervalle_min,
        "intervalle_max": intervalle_max,
        "delta_puissance": delta_puissance,
        "alerte_depassement": alerte_depassement
    }

    # === TARIFS NOUVELLE PUISSANCE ===
    tarifs_nouvelle_puissance = calculer_tarifs_profil(nouvelle_puissance, year)

    # ========================================
    # SECTION 1 : OPTIMISATION année N
    # ========================================

    # Simuler avec nouvelle puissance pour année N
    resultats_simulation_data = []
    cout_optimise_total = 0
    nb_depassements_optimise = 0

    for _, row in df_year.iterrows():
        resultat_mois = optimisation.calculer_facture_avec_puissance(row, nouvelle_puissance, annee=year)
        if resultat_mois:
            mois_str = pd.to_datetime(row['READING_DATE']).strftime('%B %Y')
            facture_actuelle = float(row['AMOUNT_WITH_TAX'])
            facture_simulee = float(resultat_mois['facture_ttc'])
            economie = facture_actuelle - facture_simulee

            resultats_simulation_data.append({
                'mois': mois_str,
                'puissance_atteinte': float(row['PUISSANCE_ATTEINTE']),
                'facture_actuelle': facture_actuelle,
                'facture_simulee': facture_simulee,
                'economie': economie,
                'depassement_actuel': bool(row['PUISSANCE_ATTEINTE'] > puissance_actuelle),
                'depassement_simule': bool(resultat_mois['depassement'])
            })

            cout_optimise_total += facture_simulee
            if resultat_mois['depassement']:
                nb_depassements_optimise += 1

    cout_actuel_total = float(df_year['AMOUNT_WITH_TAX'].sum())
    economie_totale = cout_actuel_total - cout_optimise_total
    economie_pct = (economie_totale / cout_actuel_total * 100) if cout_actuel_total > 0 else 0
    economie_mensuelle_moyenne = economie_totale / 12

    # Métriques financières
    metriques_financieres = {
        "cout_actuel": cout_actuel_total,
        "cout_optimise": cout_optimise_total,
        "economie_annuelle": economie_totale,
        "economie_pct": economie_pct,
        "economie_mensuelle": economie_mensuelle_moyenne
    }

    # Métriques dépassements
    nb_depassements_actuel = int((df_year['PUISSANCE_ATTEINTE'] > puissance_actuelle).sum())
    delta_depassements = nb_depassements_optimise - nb_depassements_actuel

    metriques_depassements = {
        "nb_depassements_actuel": nb_depassements_actuel,
        "nb_depassements_optimise": nb_depassements_optimise,
        "delta_depassements": delta_depassements
    }

    # Alerte économie
    alerte_economie = None
    if type_actuel == type_optimise and abs(economie_pct) < 2:
        alerte_economie = {
            "type": "warning",
            "message": f"Même type tarifaire - Économie limitée. L'économie de {economie_pct:.2f}% provient uniquement de la différence de prime fixe."
        }
    elif economie_pct > 0:
        alerte_economie = {
            "type": "success",
            "message": f"Économie positive de {economie_pct:.1f}%. Cette configuration permettrait une économie de {economie_totale:,.0f} FCFA sur l'année {year}."
        }
    elif economie_pct < 0:
        alerte_economie = {
            "type": "error",
            "message": f"Surcoût de {abs(economie_pct):.1f}%. Cette configuration entraînerait un surcoût de {abs(economie_totale):,.0f} FCFA sur l'année {year}."
        }

    # Graphiques Section 1
    mois_labels = [r['mois'] for r in resultats_simulation_data]
    factures_actuelles = [r['facture_actuelle'] for r in resultats_simulation_data]
    factures_simulees = [r['facture_simulee'] for r in resultats_simulation_data]
    economies = [r['economie'] for r in resultats_simulation_data]

    graph_factures = {
        "x": mois_labels,
        "y_actuelle": factures_actuelles,
        "y_simulee": factures_simulees,
        "title": f"Comparaison des factures mensuelles {year}",
        "xaxis_title": "Mois",
        "yaxis_title": "Montant TTC (FCFA)"
    }

    economies_text = [f"{e/1e6:.1f}M" for e in economies]
    graph_economies = {
        "x": mois_labels,
        "y": economies,
        "text": economies_text,
        "title": "Économies mensuelles (positif = gain, négatif = perte)",
        "xaxis_title": "Mois",
        "yaxis_title": "Économie (FCFA)"
    }

    resultats_simulation = {
        "metriques_financieres": metriques_financieres,
        "metriques_depassements": metriques_depassements,
        "alerte_economie": alerte_economie,
        "graph_factures": graph_factures,
        "graph_economies": graph_economies,
        "tableau_mensuel": resultats_simulation_data
    }

    # ========================================
    # SECTION 2 : PROJECTION année N+1
    # ========================================

    # Calculer projection N+1 avec puissance actuelle
    resultats_projection_data = []
    cout_projection_N_plus_1_total = 0
    nb_depassements_projection = 0

    for _, row in df_year.iterrows():
        resultat_mois = optimisation.calculer_facture_avec_puissance(row, puissance_actuelle, annee=annee_N_plus_1)
        if resultat_mois:
            mois_str = pd.to_datetime(row['READING_DATE']).strftime('%B %Y')
            facture_N = float(row['AMOUNT_WITH_TAX'])
            facture_N_plus_1 = float(resultat_mois['facture_ttc'])
            augmentation = facture_N_plus_1 - facture_N

            resultats_projection_data.append({
                'mois': mois_str,
                'puissance_atteinte': float(row['PUISSANCE_ATTEINTE']),
                'facture_N': facture_N,
                'facture_N_plus_1': facture_N_plus_1,
                'augmentation': augmentation,
                'depassement': bool(resultat_mois['depassement'])
            })

            cout_projection_N_plus_1_total += facture_N_plus_1
            if resultat_mois['depassement']:
                nb_depassements_projection += 1

    augmentation_totale = cout_projection_N_plus_1_total - cout_actuel_total
    augmentation_pct = (augmentation_totale / cout_actuel_total * 100) if cout_actuel_total > 0 else 0
    augmentation_mensuelle = augmentation_totale / 12

    # Métriques projection
    metriques_projection = {
        "cout_N": cout_actuel_total,
        "cout_N_plus_1": cout_projection_N_plus_1_total,
        "augmentation_annuelle": augmentation_totale,
        "augmentation_pct": augmentation_pct,
        "augmentation_mensuelle": augmentation_mensuelle,
        "nb_depassements": nb_depassements_projection
    }

    # Graphiques Section 2
    mois_labels_proj = [r['mois'] for r in resultats_projection_data]
    factures_N = [r['facture_N'] for r in resultats_projection_data]
    factures_N_plus_1 = [r['facture_N_plus_1'] for r in resultats_projection_data]
    augmentations = [r['augmentation'] for r in resultats_projection_data]

    graph_projection_factures = {
        "x": mois_labels_proj,
        "y_N": factures_N,
        "y_N_plus_1": factures_N_plus_1,
        "title": f"Comparaison des factures mensuelles : {year} vs Projection {annee_N_plus_1}",
        "xaxis_title": "Mois",
        "yaxis_title": "Montant TTC (FCFA)"
    }

    augmentations_text = [f"+{a/1e6:.1f}M" if a >= 0 else f"{a/1e6:.1f}M" for a in augmentations]
    graph_projection_augmentations = {
        "x": mois_labels_proj,
        "y": augmentations,
        "text": augmentations_text,
        "title": f"Augmentation mensuelle en {annee_N_plus_1} (positif = augmentation, négatif = diminution)",
        "xaxis_title": "Mois",
        "yaxis_title": "Augmentation (FCFA)"
    }

    # Tarifs N+1
    tarifs_N_plus_1 = calculer_tarifs_profil(puissance_actuelle, annee_N_plus_1)

    # === TABLEAU DE SYNTHESE PROJECTION N+1 ===
    # Create DataFrame for projection results
    df_projection_results = pd.DataFrame(resultats_projection_data)
    df_projection_results['Facture_2025'] = df_projection_results['facture_N']
    df_projection_results['Facture_Projection_2026'] = df_projection_results['facture_N_plus_1']

    nom_client = str(df_year.iloc[0]['CUST_NAME'])
    tableau_synthese_projection = synthese_module.generer_tableau_synthese_projection_2026(
        df_year, df_projection_results, puissance_actuelle, nom_client
    )

    # Convert DataFrame to dict for JSON response
    tableau_synthese_projection_dict = None
    if tableau_synthese_projection is not None:
        tableau_synthese_projection_dict = tableau_synthese_projection.to_dict('records')

    resultats_projection = {
        "metriques_projection": metriques_projection,
        "graph_factures": graph_projection_factures,
        "graph_augmentations": graph_projection_augmentations,
        "tableau_mensuel": resultats_projection_data,
        "tarifs_N_plus_1": tarifs_N_plus_1.dict(),
        "tableau_synthese": tableau_synthese_projection_dict
    }

    # ========================================
    # SECTION 3 : OPTIMISATION année N+1 avec puissance optimisée
    # ========================================

    # Calculer optimisation N+1 avec nouvelle puissance
    resultats_optimisation_N_plus_1_data = []
    cout_optimisation_N_plus_1_total = 0
    nb_depassements_optimisation = 0

    for _, row in df_year.iterrows():
        resultat_mois = optimisation.calculer_facture_avec_puissance(row, nouvelle_puissance, annee=annee_N_plus_1)
        if resultat_mois:
            mois_str = pd.to_datetime(row['READING_DATE']).strftime('%B %Y')
            facture_N = float(row['AMOUNT_WITH_TAX'])
            facture_N_plus_1_actuelle = resultats_projection_data[len(resultats_optimisation_N_plus_1_data)]['facture_N_plus_1']
            facture_N_plus_1_optimisee = float(resultat_mois['facture_ttc'])
            economie_vs_projection = facture_N_plus_1_actuelle - facture_N_plus_1_optimisee
            economie_vs_N = facture_N - facture_N_plus_1_optimisee

            resultats_optimisation_N_plus_1_data.append({
                'mois': mois_str,
                'puissance_atteinte': float(row['PUISSANCE_ATTEINTE']),
                'facture_N': facture_N,
                'facture_N_plus_1_actuelle': facture_N_plus_1_actuelle,
                'facture_N_plus_1_optimisee': facture_N_plus_1_optimisee,
                'economie_vs_projection': economie_vs_projection,
                'economie_vs_N': economie_vs_N,
                'depassement': bool(resultat_mois['depassement'])
            })

            cout_optimisation_N_plus_1_total += facture_N_plus_1_optimisee
            if resultat_mois['depassement']:
                nb_depassements_optimisation += 1

    economie_vs_projection_totale = cout_projection_N_plus_1_total - cout_optimisation_N_plus_1_total
    economie_vs_projection_pct = (economie_vs_projection_totale / cout_projection_N_plus_1_total * 100) if cout_projection_N_plus_1_total > 0 else 0

    economie_vs_N_totale = cout_actuel_total - cout_optimisation_N_plus_1_total
    economie_vs_N_pct = (economie_vs_N_totale / cout_actuel_total * 100) if cout_actuel_total > 0 else 0

    # Métriques optimisation N+1
    metriques_optimisation_N_plus_1 = {
        "cout_N": cout_actuel_total,
        "cout_N_plus_1_actuelle": cout_projection_N_plus_1_total,
        "cout_N_plus_1_optimisee": cout_optimisation_N_plus_1_total,
        "economie_vs_projection": economie_vs_projection_totale,
        "economie_vs_projection_pct": economie_vs_projection_pct,
        "economie_vs_N": economie_vs_N_totale,
        "economie_vs_N_pct": economie_vs_N_pct,
        "nb_depassements": nb_depassements_optimisation
    }

    # Graphiques Section 3
    mois_labels_opt = [r['mois'] for r in resultats_optimisation_N_plus_1_data]
    factures_N_opt = [r['facture_N'] for r in resultats_optimisation_N_plus_1_data]
    factures_N_plus_1_actuelles = [r['facture_N_plus_1_actuelle'] for r in resultats_optimisation_N_plus_1_data]
    factures_N_plus_1_optimisees = [r['facture_N_plus_1_optimisee'] for r in resultats_optimisation_N_plus_1_data]

    graph_optimisation_factures = {
        "x": mois_labels_opt,
        "y_N": factures_N_opt,
        "y_N_plus_1_actuelle": factures_N_plus_1_actuelles,
        "y_N_plus_1_optimisee": factures_N_plus_1_optimisees,
        "title": f"Comparaison : {year} vs Projection {annee_N_plus_1} vs Optimisation {annee_N_plus_1}",
        "xaxis_title": "Mois",
        "yaxis_title": "Montant TTC (FCFA)"
    }

    economies_vs_projection = [r['economie_vs_projection'] for r in resultats_optimisation_N_plus_1_data]
    economies_vs_projection_text = [f"{e/1e6:.1f}M" for e in economies_vs_projection]

    graph_economies_vs_projection = {
        "x": mois_labels_opt,
        "y": economies_vs_projection,
        "text": economies_vs_projection_text,
        "title": f"Économies mensuelles en {annee_N_plus_1} avec puissance optimisée vs projection",
        "xaxis_title": "Mois",
        "yaxis_title": "Économie (FCFA)"
    }

    # Tarifs N+1 avec puissance optimisée
    tarifs_N_plus_1_optimise = calculer_tarifs_profil(nouvelle_puissance, annee_N_plus_1)

    # === TABLEAU DE SYNTHESE OPTIMISATION N+1 ===
    df_optimisation_results = pd.DataFrame(resultats_optimisation_N_plus_1_data)
    df_optimisation_results['Facture_2025'] = df_optimisation_results['facture_N']
    df_optimisation_results['Facture_Optimisation_2026'] = df_optimisation_results['facture_N_plus_1_optimisee']

    tableau_synthese_optimisation = synthese_module.generer_tableau_synthese_optimisation_2026(
        df_year, df_optimisation_results, nouvelle_puissance, nom_client
    )

    # Convert DataFrame to dict for JSON response
    tableau_synthese_optimisation_dict = None
    if tableau_synthese_optimisation is not None:
        tableau_synthese_optimisation_dict = tableau_synthese_optimisation.to_dict('records')

    resultats_optimisation_N_plus_1 = {
        "metriques_optimisation": metriques_optimisation_N_plus_1,
        "graph_factures": graph_optimisation_factures,
        "graph_economies": graph_economies_vs_projection,
        "tableau_mensuel": resultats_optimisation_N_plus_1_data,
        "tarifs_N_plus_1_optimise": tarifs_N_plus_1_optimise.dict(),
        "tableau_synthese": tableau_synthese_optimisation_dict
    }

    # === TABLEAU DE SYNTHESE SECTION 1 (Optimisation année N) ===
    df_simulation_results = pd.DataFrame(resultats_simulation_data)
    df_simulation_results['Facture_Actuelle'] = df_simulation_results['facture_actuelle']
    df_simulation_results['Facture_Simulee'] = df_simulation_results['facture_simulee']
    df_simulation_results['Economie'] = df_simulation_results['economie']

    tableau_synthese_optimise = synthese_module.generer_tableau_synthese_optimise(
        df_year, df_simulation_results, nouvelle_puissance, nom_client
    )

    # Convert DataFrame to dict for JSON response
    tableau_synthese_optimise_dict = None
    if tableau_synthese_optimise is not None:
        tableau_synthese_optimise_dict = tableau_synthese_optimise.to_dict('records')

    # Add tableau_synthese to resultats_simulation
    resultats_simulation["tableau_synthese"] = tableau_synthese_optimise_dict

    return OptimisationSimulationResponse(
        year=year,
        annee_N_plus_1=annee_N_plus_1,
        nouvelle_puissance=nouvelle_puissance,
        type_optimise=type_optimise,
        info_nouvelle_puissance=info_nouvelle_puissance,
        tarifs_nouvelle_puissance=tarifs_nouvelle_puissance.dict(),
        resultats_simulation=resultats_simulation,
        resultats_projection=resultats_projection,
        resultats_optimisation_N_plus_1=resultats_optimisation_N_plus_1
    )
