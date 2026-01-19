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
    division: str
    agence: str
    puissance_souscrite: float
    puissance_max_atteinte: float
    nb_depassements: int
    penalites_cosphi_2025: float
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


class SyntheseResponse(BaseModel):
    """
    Response for synthese endpoint
    Matches Streamlit tableau de synthèse structure:
    - Rows are indicators (Énergie, Puissance, etc.)
    - Columns are: Mois | Année XXXX | 1 | 2 | 3 | ... | 12
    """
    year: int
    nom_client: str
    service_no: str
    # Tableau with indicators as rows, months as columns
    tableau: List[Dict[str, Any]]  # Each dict: {"indicateur": "Énergie (kWh)", "annee_total": 12345, "1": 1000, "2": 1100, ...}


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
    """Tariffs information for profile display - matches Streamlit display"""
    type_tarifaire: int
    categorie: str  # "Petit client" ou "Gros client"
    plage_horaire: str
    intervalle_min: float
    intervalle_max: float
    # Tableau des tarifs par plage de temps de fonctionnement
    tableau_tarifs: List[Dict[str, Any]]  # Liste de {temps_fonctionnement, tarif_hc, tarif_hp, prime_fixe}


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
    metriques_globales: Dict[str, Any]  # facture_reelle_total, facture_calculee_total, gap_total, gap_pct, nb_depassements

    # Tableau détaillé mensuel
    tableau_mensuel: List[Dict[str, Any]]  # Mois, Puissance souscrite, atteinte, Dépassement, Type tarifaire, Facture réelle, recalculée, Écart

    # Graph 1: Facture réelle vs recalculée (grouped bars)
    graph_comparaison: Dict[str, Any]

    # Graph 2: Écarts mensuels (Gap)
    graph_ecarts: Dict[str, Any]

    # Graph 3: Décomposition de la facture recalculée (stacked bars: HC + HP + Prime fixe)
    graph_decomposition: Dict[str, Any]


class OptimisationInitResponse(BaseModel):
    """Response for optimisation initialization endpoint"""
    year: int
    annee_N_plus_1: int
    nom_client: str
    service_no: str
    annees_disponibles: List[int]

    # Configuration actuelle (5 métriques)
    config_actuelle: Dict[str, Any]  # puissance_actuelle, puissance_max, type_actuel, cout_annuel, nb_depassements

    # Statistiques puissance
    stats_puissance: Dict[str, Any]  # min, max, moyenne

    # Tarifs actuels
    tarifs_actuels: Dict[str, Any]


class OptimisationSimulationRequest(BaseModel):
    """Request for simulation with new power"""
    year: int
    nouvelle_puissance: float


class OptimisationSimulationResponse(BaseModel):
    """Response for simulation with new power"""
    year: int
    annee_N_plus_1: int
    nouvelle_puissance: float
    type_optimise: int

    # Info nouvelle puissance
    info_nouvelle_puissance: Dict[str, Any]  # type, intervalle, variation

    # Tarifs nouvelle puissance
    tarifs_nouvelle_puissance: Dict[str, Any]

    # Résultats simulation Section 1
    resultats_simulation: Dict[str, Any]  # metriques financières, dépassements, graphiques, tableau, tableau_synthese

    # Résultats projection Section 2
    resultats_projection: Dict[str, Any]  # métriques, graphiques, tableau, tarifs_N_plus_1, tableau_synthese

    # Résultats optimisation Section 3 (année N+1 avec puissance optimisée)
    resultats_optimisation_N_plus_1: Dict[str, Any]  # métriques, graphiques, tableau, tarifs, tableau_synthese
