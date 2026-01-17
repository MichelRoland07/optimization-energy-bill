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
    ProfilClientResponse, TarifsProfilInfo
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
        coeff = 1.05 ** (annee - 2023)  # 5% per year
        categorie = "Petit client"
    else:
        coeff = 1.10 ** (annee - 2023)  # 10% per year
        categorie = "Gros client"

    # Detect type using type_table
    row_type = type_table[
        (type_table['min'] <= puissance) &
        (puissance < type_table['max'])
    ]

    if row_type.empty:
        # Fallback
        type_tarifaire = 1 if puissance < 3000 else 6
        intervalle_min = 0.0
        intervalle_max = 10000.0
    else:
        type_tarifaire = int(row_type.iloc[0]['type'])
        intervalle_min = float(row_type.iloc[0]['min'])
        intervalle_max = float(row_type.iloc[0]['max'])

    # Determine plage horaire and get tariffs (default to >400h as in Streamlit)
    plage_horaire = ">400h"

    if puissance < 3000:
        # Small client
        idx = type_tarifaire - 1
        # Use >400h as default
        tarif_hc = tarifs_small['sup_400']['off'][idx] * coeff if tarifs_small['sup_400']['off'][idx] != '' else 0.0
        tarif_hp = tarifs_small['sup_400']['peak'][idx] * coeff if tarifs_small['sup_400']['peak'][idx] != '' else 0.0
        prime_fixe = tarifs_small['sup_400']['pf'][idx] * coeff if tarifs_small['sup_400']['pf'][idx] != '' else 0.0
    else:
        # Big client
        idx = type_tarifaire - 6
        # Use >400h as default
        tarif_hc = tarifs_big['sup_400']['off'][idx] * coeff
        tarif_hp = tarifs_big['sup_400']['peak'][idx] * coeff
        prime_fixe = tarifs_big['sup_400']['pf'][idx] * coeff

    return TarifsProfilInfo(
        type_tarifaire=type_tarifaire,
        categorie=categorie,
        plage_horaire=plage_horaire,
        intervalle_min=intervalle_min,
        intervalle_max=intervalle_max,
        tarif_hc=round(tarif_hc, 3),
        tarif_hp=round(tarif_hp, 3),
        prime_fixe=round(prime_fixe, 2)
    )


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload Excel file with energy data

    - Validates required columns
    - Detects single or multiple services
    - Stores raw data in session
    - If single service: processes data immediately
    - If multiple services: returns list for user selection
    """
    # Check file extension
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le fichier doit être au format Excel (.xlsx ou .xls)"
        )

    try:
        # Read Excel file
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))

        # Validate columns
        if not validate_required_columns(df):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le fichier ne contient pas toutes les colonnes requises"
            )

        # Store raw data
        session_manager.store_raw_data(current_user.id, df)

        # Detect services (using SERVICE_NO as unique identifier)
        services_unique = df['SERVICE_NO'].unique()

        if len(services_unique) == 1:
            # Single service: process immediately
            service_no = str(services_unique[0])

            # Apply calculations
            df_processed = calculs.appliquer_tous_calculs(df)

            # Store processed data
            session_manager.store_processed_data(current_user.id, df_processed, service_no)

            nom_client = df['CUST_NAME'].iloc[0]

            return UploadResponse(
                single_service=True,
                service_no=service_no,
                nom_client=nom_client,
                data_ready=True
            )

        else:
            # Multiple services: return list for selection
            services_info = []

            for service_no in services_unique:
                df_service = df[df['SERVICE_NO'] == service_no]

                # Get service info
                nom_client = df_service['CUST_NAME'].iloc[0]
                region = df_service['REGION'].iloc[0]
                puissance = float(df_service['SUBSCRIPTION_LOAD'].iloc[0])
                nb_lignes = len(df_service)

                services_info.append(ServiceInfo(
                    service_no=str(service_no),
                    nom_client=nom_client,
                    region=region,
                    puissance=puissance,
                    nb_lignes=nb_lignes
                ))

            return UploadResponse(
                single_service=False,
                services=services_info,
                data_ready=False
            )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors du traitement du fichier: {str(e)}"
        )


@router.post("/select-service", response_model=ServiceSelectionResponse)
async def select_service(
    selection: ServiceSelection,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Select a specific service from multi-service file

    Filters data for selected service and applies calculations
    """
    # Get raw data
    df_raw = session_manager.get_raw_data(current_user.id)

    if df_raw is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée uploadée. Veuillez d'abord uploader un fichier."
        )

    # Filter for selected service (convert to string for comparison)
    df_service = df_raw[df_raw['SERVICE_NO'].astype(str) == str(selection.service_no)].copy()

    if df_service.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service {selection.service_no} non trouvé dans les données"
        )

    # Apply calculations
    df_processed = calculs.appliquer_tous_calculs(df_service)

    # Store processed data
    session_manager.store_processed_data(current_user.id, df_processed, selection.service_no)

    nom_client = df_service['CUST_NAME'].iloc[0]

    return ServiceSelectionResponse(
        data_ready=True,
        service_no=selection.service_no,
        nom_client=nom_client
    )


@router.get("/synthese", response_model=SyntheseResponse)
async def get_synthese(
    year: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get monthly synthesis table for a specific year

    Uses the synthese.generer_tableau_synthese() function
    """
    # Get processed data
    df = session_manager.get_processed_data(current_user.id)

    if df is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée disponible. Veuillez d'abord uploader un fichier."
        )

    service_no = session_manager.get_service_no(current_user.id)
    nom_client = df['CUST_NAME'].iloc[0]

    try:
        # Generate synthese table using existing function
        df_synthese = synthese_module.generer_tableau_synthese(df, year, nom_client)

        # Convert to list of dicts for JSON response
        tableau = df_synthese.to_dict('records')

        return SyntheseResponse(
            year=year,
            nom_client=nom_client,
            service_no=service_no,
            tableau=tableau
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération de la synthèse: {str(e)}"
        )


@router.get("/graphiques", response_model=GraphiquesResponse)
async def get_graphiques(
    year: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get graph data for visualization (Plotly-compatible format)

    Returns data for all 5 graphs from Streamlit app:
    1. Consommation mensuelle
    2. Heures creuses vs Pointe
    3. Puissance atteinte vs souscrite
    4. Facturation et consommation (dual axis)
    5. Cos(φ) (if available)
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

    # Sort by date
    df_year = df_year.sort_values('READING_DATE')

    # Get month names in French
    mois_noms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    df_year['Mois'] = df_year['READING_DATE'].dt.month.apply(lambda x: mois_noms[x-1])

    # Graph 1: Consommation mensuelle (line with fill)
    consommation_mensuelle = {
        "x": df_year['Mois'].tolist(),
        "y": df_year['MV_CONSUMPTION'].tolist(),
        "type": "scatter",
        "mode": "lines+markers",
        "fill": "tozeroy",
        "name": "Consommation totale",
        "line": {"color": "#1f77b4", "width": 3},
        "marker": {"size": 8}
    }

    # Graph 2: Heures creuses vs Pointe (stacked bar)
    heures_creuses_pointe = {
        "x": df_year['Mois'].tolist(),
        "heures_creuses": (df_year['ACTIVE_OFF_PEAK_IMP'] + df_year['ACTIVE_OFF_PEAK_EXP']).tolist(),
        "heures_pointe": (df_year['ACTIVE_PEAK_IMP'] + df_year['ACTIVE_PEAK_EXP']).tolist(),
        "type": "bar"
    }

    # Graph 3: Puissance atteinte vs souscrite (dual line)
    puissance = {
        "x": df_year['Mois'].tolist(),
        "puissance_atteinte": df_year['PUISSANCE_ATTEINTE'].tolist(),
        "puissance_souscrite": df_year['SUBSCRIPTION_LOAD'].tolist(),
        "type": "line"
    }

    # Graph 4: Facturation et consommation (dual axis)
    facturation_consommation = {
        "x": df_year['Mois'].tolist(),
        "facturation": df_year['AMOUNT_WITH_TAX'].tolist(),
        "consommation": df_year['MV_CONSUMPTION'].tolist(),
        "type": "mixed"
    }

    # Graph 5: Cos(φ) (if available)
    cosphi_data = None
    if 'COSPHI' in df_year.columns:
        cosphi_data = {
            "x": df_year['Mois'].tolist(),
            "cosphi": df_year['COSPHI'].tolist(),
            "consommation_mwh": (df_year['MV_CONSUMPTION'] / 1000).tolist(),  # Convert to MWh
            "type": "mixed",
            "cosphi_moyen": float(df_year['COSPHI'].mean()),
            "cosphi_min": float(df_year['COSPHI'].min()),
            "cosphi_max": float(df_year['COSPHI'].max()),
            "nb_mois_sous_seuil": int((df_year['COSPHI'] < 0.85).sum())
        }

    # Metrics for display
    metriques = {
        "consommation_totale": float(df_year['MV_CONSUMPTION'].sum()),
        "consommation_moyenne": float(df_year['MV_CONSUMPTION'].mean()),
        "puissance_max_atteinte": float(df_year['PUISSANCE_ATTEINTE'].max()),
        "puissance_min_atteinte": float(df_year['PUISSANCE_ATTEINTE'].min()),
        "puissance_moyenne": float(df_year['PUISSANCE_ATTEINTE'].mean()),
        "facture_totale": float(df_year['AMOUNT_WITH_TAX'].sum()),
        "nb_depassements": int((df_year['PUISSANCE_ATTEINTE'] > df_year['SUBSCRIPTION_LOAD']).sum())
    }

    return GraphiquesResponse(
        year=year,
        consommation_mensuelle=consommation_mensuelle,
        heures_creuses_pointe=heures_creuses_pointe,
        puissance=puissance,
        facturation_consommation=facturation_consommation,
        cosphi=cosphi_data,
        metriques=metriques
    )


@router.get("/profil", response_model=ProfilClientResponse)
async def get_profil_client(
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get client profile information

    Args:
        year: Optional year to filter data (e.g., 2025, 2024, 2023).
              If not provided, uses the most recent year available.

    Returns:
    - Administrative info (name, service, region, division, agence)
    - Energetic profile summary for selected year
    - Multi-year consumption profile graph data
    """
    # Get processed data
    df = session_manager.get_processed_data(current_user.id)

    if df is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée disponible. Veuillez d'abord uploader un fichier."
        )

    # Get available years (for frontend dropdown)
    annees_disponibles = sorted(df['READING_DATE'].dt.year.unique(), reverse=True)

    # 1. Administrative Information
    infos_administratives = {
        "nom_client": str(df['CUST_NAME'].iloc[0]) if 'CUST_NAME' in df.columns else "N/A",
        "service_no": str(df['SERVICE_NO'].iloc[0]) if 'SERVICE_NO' in df.columns else "N/A",
        "region": str(df['REGION'].iloc[0]) if 'REGION' in df.columns else "N/A",
        "division": str(df['DIVISION'].iloc[0]) if 'DIVISION' in df.columns else "N/A",
        "agence": str(df['AGENCE'].iloc[0]) if 'AGENCE' in df.columns else "N/A",
        "annees_disponibles": [int(a) for a in annees_disponibles],  # ✅ AJOUT pour sélecteur
    }

    # 2. Energetic Profile Summary (ENRICHED with tariffs and HC/HP averages)
    # ✅ AJOUT: Sélection année (EXACTEMENT comme Streamlit)
    # If year not provided, use most recent year
    if year is None:
        annee_profil = int(df['READING_DATE'].dt.year.max())
    else:
        annee_profil = year

    # Filter data for selected year
    df_annee = df[df['READING_DATE'].dt.year == annee_profil].copy()

    if df_annee.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aucune donnée disponible pour l'année {annee_profil}"
        )

    # Calculate statistics for selected year ONLY
    puissance_souscrite = float(df_annee['SUBSCRIPTION_LOAD'].iloc[0])
    puissance_max = float(df_annee['PUISSANCE_ATTEINTE'].max())
    puissance_min = float(df_annee['PUISSANCE_ATTEINTE'].min())
    puissance_moy = float(df_annee['PUISSANCE_ATTEINTE'].mean())

    conso_max = float(df_annee['MV_CONSUMPTION'].max())
    conso_min = float(df_annee['MV_CONSUMPTION'].min())
    conso_moy = float(df_annee['MV_CONSUMPTION'].mean())

    # ✅ AJOUT: Consommations HC et HP moyennes (EXACTEMENT comme Streamlit)
    df_temp = df_annee.copy()
    df_temp['CONSO_OFF_PEAK'] = df_temp['ACTIVE_OFF_PEAK_IMP'] + df_temp['ACTIVE_OFF_PEAK_EXP']
    df_temp['CONSO_PEAK'] = df_temp['ACTIVE_PEAK_IMP'] + df_temp['ACTIVE_PEAK_EXP']
    conso_hc_moy = float(df_temp['CONSO_OFF_PEAK'].mean())
    conso_hp_moy = float(df_temp['CONSO_PEAK'].mean())

    # HC/HP ratio
    total_hc = float(df_temp['CONSO_OFF_PEAK'].sum())
    total_hp = float(df_temp['CONSO_PEAK'].sum())
    total_energie = total_hc + total_hp
    ratio_hc = (total_hc / total_energie * 100) if total_energie > 0 else 0
    ratio_hp = (total_hp / total_energie * 100) if total_energie > 0 else 0

    # ✅ AJOUT: Détection type tarifaire et tarifs détaillés (EXACTEMENT comme Streamlit)
    # Use selected year for tariff calculation
    tarifs_info = calculer_tarifs_profil(puissance_souscrite, annee_profil)

    # Cos(φ) if available (ENRICHED with nb_mois_sous_seuil) - for selected year
    cosphi_data = None
    if 'COSPHI' in df_annee.columns:
        nb_mois_sous_seuil = int((df_annee['COSPHI'] < 0.9).sum())
        cosphi_data = {
            "disponible": True,
            "moyen": float(df_annee['COSPHI'].mean()),
            "min": float(df_annee['COSPHI'].min()),
            "max": float(df_annee['COSPHI'].max()),
            "nb_mois_sous_seuil": nb_mois_sous_seuil  # ✅ AJOUT
        }

    profil_energetique = {
        "annee_selectionnee": annee_profil,  # ✅ AJOUT: année sélectionnée
        "puissance_souscrite": puissance_souscrite,
        "puissance_max": puissance_max,
        "puissance_min": puissance_min,
        "puissance_moyenne": puissance_moy,
        "consommation_max": conso_max,
        "consommation_min": conso_min,
        "consommation_moyenne": conso_moy,
        "conso_hc_moyenne": conso_hc_moy,  # ✅ AJOUT
        "conso_hp_moyenne": conso_hp_moy,  # ✅ AJOUT
        "ratio_hc": ratio_hc,
        "ratio_hp": ratio_hp,
        "cosphi": cosphi_data,
        # ✅ AJOUT: Tarifs détaillés (type, catégorie, HC, HP, PF)
        "type_tarifaire": tarifs_info.type_tarifaire,
        "categorie": tarifs_info.categorie,
        "plage_horaire": tarifs_info.plage_horaire,
        "tarif_hc": tarifs_info.tarif_hc,
        "tarif_hp": tarifs_info.tarif_hp,
        "prime_fixe": tarifs_info.prime_fixe,
        "annee_tarifs": annee_profil
    }

    # 3. Multi-year Consumption Profile (ENRICHED with power series)
    df_sorted = df.sort_values('READING_DATE')
    annees = sorted(df['READING_DATE'].dt.year.unique(), reverse=True)

    # ✅ AJOUT: Prepare data for multi-line graphs (consommation + puissance)
    series_consommation = []
    series_puissance = []  # ✅ AJOUT: séries puissance multi-années

    for annee in annees:
        df_annee = df_sorted[df_sorted['READING_DATE'].dt.year == annee]

        series_consommation.append({
            "annee": int(annee),
            "mois": df_annee['READING_DATE'].dt.month.tolist(),
            "consommation": df_annee['MV_CONSUMPTION'].tolist(),
        })

        # ✅ AJOUT: Série puissance atteinte par année
        series_puissance.append({
            "annee": int(annee),
            "mois": df_annee['READING_DATE'].dt.month.tolist(),
            "puissance": df_annee['PUISSANCE_ATTEINTE'].tolist(),
        })

    profil_consommation = {
        "annees": [int(a) for a in annees],
        "series_consommation": series_consommation,
        "series_puissance": series_puissance,  # ✅ AJOUT
    }

    # ✅ AJOUT: 4. Graphiques profil énergétique (3 graphiques Plotly-ready)
    # Use selected year for energetic profile graphs (EXACTLY like Streamlit)
    graphiques_profil_energetique = None
    if not df_annee.empty:
        # Prepare month labels
        mois_noms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
                     'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
        mois_labels = [mois_noms[int(m)-1] for m in df_annee['READING_DATE'].dt.month]

        # Graph 1: Factures mensuelles TTC
        graph_factures = {
            "x": mois_labels,
            "y": df_annee['AMOUNT_WITH_TAX'].tolist(),
            "type": "bar",
            "name": f"Facture TTC {annee_profil}",
            "title": f"Facturation mensuelle TTC ({annee_profil})",
            "xaxis_title": "Mois",
            "yaxis_title": "Facture TTC (FCFA)"
        }

        # Graph 2: Puissances atteinte vs souscrite mensuelles
        graph_puissances = {
            "x": mois_labels,
            "y_atteinte": df_annee['PUISSANCE_ATTEINTE'].tolist(),
            "y_souscrite": [puissance_souscrite] * len(mois_labels),
            "type": "line",
            "title": f"Puissance atteinte vs souscrite ({annee_profil})",
            "xaxis_title": "Mois",
            "yaxis_title": "Puissance (kW)"
        }

        # Graph 3: Cos φ mensuels (si disponible)
        graph_cosphi = None
        if 'COSPHI' in df_annee.columns:
            graph_cosphi = {
                "x": mois_labels,
                "y": df_annee['COSPHI'].tolist(),
                "y_seuil": [0.9] * len(mois_labels),  # Ligne de seuil à 0.9
                "type": "line",
                "title": f"Facteur de puissance Cos φ ({annee_profil})",
                "xaxis_title": "Mois",
                "yaxis_title": "Cos φ"
            }

        graphiques_profil_energetique = {
            "annee": annee_profil,
            "graph_factures": graph_factures,
            "graph_puissances": graph_puissances,
            "graph_cosphi": graph_cosphi
        }

    return ProfilClientResponse(
        infos_administratives=infos_administratives,
        profil_energetique=profil_energetique,
        profil_consommation=profil_consommation,
        graphiques_profil_energetique=graphiques_profil_energetique  # ✅ AJOUT
    )


@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard table for multi-service files
    
    Returns consolidated view of all services in uploaded file
    Only available if multi-service file was uploaded
    """
    # Get raw data (before service selection)
    df_raw = session_manager.get_raw_data(current_user.id)
    
    if df_raw is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée uploadée. Veuillez d'abord uploader un fichier."
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
