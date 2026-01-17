"""
Pydantic schemas for data endpoints
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class ServiceInfo(BaseModel):
    """Information about a service detected in uploaded file"""
    service_no: str
    nom_client: str
    region: str
    puissance: float
    nb_lignes: int


class UploadResponse(BaseModel):
    """Response for file upload"""
    single_service: bool
    service_no: Optional[str] = None
    nom_client: Optional[str] = None
    services: Optional[List[ServiceInfo]] = None
    data_ready: bool


class ServiceSelection(BaseModel):
    """Request to select a specific service"""
    service_no: str


class ServiceSelectionResponse(BaseModel):
    """Response after service selection"""
    data_ready: bool
    service_no: str
    nom_client: str


class SyntheseRow(BaseModel):
    """Single row in synthese table"""
    mois: str
    date_releve: str
    puissance_souscrite: int
    puissance_atteinte: int
    depassement: int
    consommation: float
    consommation_hc: float
    consommation_hp: float
    facture_ht: float
    facture_ttc: float
    prime_fixe: float
    tarif_hc: float
    tarif_hp: float
    type_tarifaire: int


class SyntheseResponse(BaseModel):
    """Response for synthese endpoint"""
    year: int
    nom_client: str
    service_no: str
    tableau: List[Dict[str, Any]]  # Keep flexible for DataFrame conversion


class GraphiquesResponse(BaseModel):
    """Response for graphiques endpoint with Plotly-ready data"""
    year: int

    # Graph 1: Consommation mensuelle
    consommation_mensuelle: Dict[str, Any]

    # Graph 2: Heures creuses vs Pointe
    heures_creuses_pointe: Dict[str, Any]

    # Graph 3: Puissance atteinte vs souscrite
    puissance: Dict[str, Any]

    # Graph 4: Facturation et consommation (dual axis)
    facturation_consommation: Dict[str, Any]

    # Graph 5: Cos(φ) (if available)
    cosphi: Optional[Dict[str, Any]] = None

    # Metrics for display
    metriques: Dict[str, Any]


class TarifsProfilInfo(BaseModel):
    """Tariffs information for profile display"""
    type_tarifaire: int
    categorie: str  # "Petit client" ou "Gros client"
    plage_horaire: str
    intervalle_min: float
    intervalle_max: float
    tarif_hc: float
    tarif_hp: float
    prime_fixe: float


class ProfilClientResponse(BaseModel):
    """Response for client profile endpoint"""
    # Administrative info
    infos_administratives: Dict[str, str]

    # Energetic profile summary (enriched with tariffs)
    profil_energetique: Dict[str, Any]

    # Consumption profile (multi-year graph data with power series)
    profil_consommation: Dict[str, Any]

    # 3 graphiques profil énergétique (Plotly-ready data)
    graphiques_profil_energetique: Optional[Dict[str, Any]] = None
