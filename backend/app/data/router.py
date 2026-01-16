"""
Data upload and processing routes
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
import pandas as pd
from io import BytesIO

from ..auth.models import User
from ..auth.utils import get_current_user
from ..database import get_db
from ..core import calculs, synthese as synthese_module
from .schemas import (
    UploadResponse, ServiceInfo, ServiceSelection,
    ServiceSelectionResponse, SyntheseResponse, GraphiquesResponse, ProfilClientResponse
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get client profile information

    Returns:
    - Administrative info (name, service, region, division, agence)
    - Energetic profile summary
    - Multi-year consumption profile graph data
    """
    # Get processed data
    df = session_manager.get_processed_data(current_user.id)

    if df is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée disponible. Veuillez d'abord uploader un fichier."
        )

    # 1. Administrative Information
    infos_administratives = {
        "nom_client": str(df['CUST_NAME'].iloc[0]) if 'CUST_NAME' in df.columns else "N/A",
        "service_no": str(df['SERVICE_NO'].iloc[0]) if 'SERVICE_NO' in df.columns else "N/A",
        "region": str(df['REGION'].iloc[0]) if 'REGION' in df.columns else "N/A",
        "division": str(df['DIVISION'].iloc[0]) if 'DIVISION' in df.columns else "N/A",
        "agence": str(df['AGENCE'].iloc[0]) if 'AGENCE' in df.columns else "N/A",
    }

    # 2. Energetic Profile Summary
    puissance_souscrite = float(df['SUBSCRIPTION_LOAD'].iloc[0])
    puissance_max = float(df['PUISSANCE_ATTEINTE'].max())
    puissance_min = float(df['PUISSANCE_ATTEINTE'].min())
    puissance_moy = float(df['PUISSANCE_ATTEINTE'].mean())

    conso_max = float(df['MV_CONSUMPTION'].max())
    conso_min = float(df['MV_CONSUMPTION'].min())
    conso_moy = float(df['MV_CONSUMPTION'].mean())

    # HC/HP ratio
    total_hc = float((df['ACTIVE_OFF_PEAK_IMP'] + df['ACTIVE_OFF_PEAK_EXP']).sum())
    total_hp = float((df['ACTIVE_PEAK_IMP'] + df['ACTIVE_PEAK_EXP']).sum())
    total_energie = total_hc + total_hp
    ratio_hc = (total_hc / total_energie * 100) if total_energie > 0 else 0
    ratio_hp = (total_hp / total_energie * 100) if total_energie > 0 else 0

    # Cos(φ) if available
    cosphi_data = None
    if 'COSPHI' in df.columns:
        cosphi_data = {
            "disponible": True,
            "moyen": float(df['COSPHI'].mean()),
            "min": float(df['COSPHI'].min()),
            "max": float(df['COSPHI'].max()),
        }

    profil_energetique = {
        "puissance_souscrite": puissance_souscrite,
        "puissance_max": puissance_max,
        "puissance_min": puissance_min,
        "puissance_moyenne": puissance_moy,
        "consommation_max": conso_max,
        "consommation_min": conso_min,
        "consommation_moyenne": conso_moy,
        "ratio_hc": ratio_hc,
        "ratio_hp": ratio_hp,
        "cosphi": cosphi_data,
    }

    # 3. Multi-year Consumption Profile
    df_sorted = df.sort_values('READING_DATE')
    annees = sorted(df['READING_DATE'].dt.year.unique(), reverse=True)

    # Prepare data for multi-line graph (one line per year)
    series_par_annee = []
    for annee in annees:
        df_annee = df_sorted[df_sorted['READING_DATE'].dt.year == annee]
        series_par_annee.append({
            "annee": int(annee),
            "mois": df_annee['READING_DATE'].dt.month.tolist(),
            "consommation": df_annee['MV_CONSUMPTION'].tolist(),
        })

    profil_consommation = {
        "annees": [int(a) for a in annees],
        "series": series_par_annee,
    }

    return ProfilClientResponse(
        infos_administratives=infos_administratives,
        profil_energetique=profil_energetique,
        profil_consommation=profil_consommation
    )
