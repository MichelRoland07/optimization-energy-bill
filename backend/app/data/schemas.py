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
    """
    Response for client profile endpoint
    Matches exactly the Streamlit 'État des lieux et profil' page structure
    """
    # Section 1: Administrative Profile (5 fields)
    infos_administratives: Dict[str, Any]  # nom_client, service_no, region, division, agence, annees_disponibles

    # Section 2: Energetic Profile Summary (6 tables for selected year)
    profil_energetique: Dict[str, Any]  # Contains: tableau1, tableau1bis (optional), tableau2, tableau3, tableau4, tableau5 (optional), tableau6 (optional)

    # Section 3: Consumption Profile (multi-year analysis)
    profil_consommation: Dict[str, Any]  # graph1_evolution, tableau_variation_conso, graph2_hc_hp_facturation, tableau_variation_facturation, tableau_prix_unitaire, tableau_recapitulatif


class ReconstitutionResponse(BaseModel):
    """Response for reconstitution endpoint"""
    year: int
    nom_client: str
    service_no: str
    annees_disponibles: List[int]

    # 4 Métriques globales
    metriques_globales: Dict[str, Any]  # facture_reelle_total, facture_calculee_total, gap_total, nb_depassements

    # Tableau détaillé mensuel
    tableau_mensuel: List[Dict[str, Any]]  # Mois, Puissance souscrite, atteinte, Dépassement, Type tarifaire, Facture réelle, recalculée, Écart

    # Graph 1: Facture réelle vs recalculée (grouped bars)
    graph_comparaison: Dict[str, Any]

    # Graph 2: Écarts mensuels (Gap)
    graph_ecarts: Dict[str, Any]
