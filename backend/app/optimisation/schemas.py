"""
Pydantic schemas for optimization
"""
from pydantic import BaseModel
from typing import List, Optional


class ConfigActuelleResponse(BaseModel):
    """Current configuration metrics"""
    puissance_actuelle: int
    puissance_max_atteinte: float
    puissance_min_atteinte: float
    puissance_moyenne: float
    type_tarifaire: int
    cout_annuel_2025: float
    nb_depassements: int


class SimulationRequest(BaseModel):
    """Request to simulate new power subscription"""
    nouvelle_puissance: int
    year: int = 2025  # Default to 2025 for backward compatibility


class SimulationResultats(BaseModel):
    """Simulation results metrics"""
    cout_actuel: float
    cout_simule: float
    economies: float
    economies_pct: float
    nb_depassements_actuel: int
    nb_depassements_simule: int


class SimulationRowMensuel(BaseModel):
    """Monthly comparison row"""
    mois: str
    facture_actuelle: float
    facture_simulee: float
    economie: float


class SimulationResponse(BaseModel):
    """Response for simulation endpoint"""
    nouvelle_puissance: int
    nouveau_type_tarifaire: int
    warning: Optional[str] = None
    has_warning: bool
    resultats: SimulationResultats
    tableau_mensuel: List[SimulationRowMensuel]


# Full Analysis Schemas (4 sections)

class TarifsInfo(BaseModel):
    """Detailed tariffs information (EXACTLY like Streamlit display)"""
    tarif_hc: float  # Tarif Heures Creuses / Off-peak
    tarif_hp: float  # Tarif Heures Pleines / Peak
    prime_fixe: float  # Prime Fixe / Fixed charge
    plage_horaire: str  # "0-200h", "201-400h", ">400h", "0-400h"
    intervalle_min: float  # Min power for this type
    intervalle_max: float  # Max power for this type
    categorie: str  # "Petit client" or "Gros client"


class ConfigurationInfo(BaseModel):
    """Configuration information (power, type, cost)"""
    puissance: int
    type_tarifaire: int
    cout_annuel: float
    nb_depassements: int
    tarifs: TarifsInfo  # Tarifs détaillés appliqués
    variation_vs_actuel: Optional[int] = None  # Delta puissance vs config actuelle


class EconomiesInfo(BaseModel):
    """Savings information"""
    montant: float
    pourcentage: float


class RowMensuel(BaseModel):
    """Generic monthly row"""
    mois: str
    consommation: float
    facture: float


class Section1OptimisationN(BaseModel):
    """Section 1: Optimisation année N"""
    annee: int
    configuration_actuelle: ConfigurationInfo
    configuration_optimisee: ConfigurationInfo
    economies: EconomiesInfo
    warning: Optional[str] = None  # Warning if puissance < max power
    tableau_mensuel: List[dict]  # Flexible monthly data


class Section2ProjectionNPlus1(BaseModel):
    """Section 2: Projection N+1 avec config actuelle"""
    annee: int
    puissance_utilisee: int
    type_tarifaire: int
    cout_N: float
    cout_projection_N_plus_1: float
    variation: dict  # {montant, pourcentage}
    tarifs_appliques: TarifsInfo  # Tarifs N+1 pour puissance actuelle
    tableau_mensuel: List[dict]


class Section3OptimisationNPlus1(BaseModel):
    """Section 3: Optimisation N+1"""
    annee: int
    configuration_actuelle_projection: dict  # {puissance, cout}
    configuration_optimisee_projection: dict  # {puissance, cout}
    economies: EconomiesInfo
    tarifs_appliques: TarifsInfo  # Tarifs N+1 pour puissance optimisée
    tableau_mensuel: List[dict]


class ScenarioComparatif(BaseModel):
    """Single scenario in comparative table"""
    nom: str
    annee: int
    puissance: int
    type_tarifaire: int
    cout: float
    ecart_vs_ref: float
    pourcentage_vs_ref: float


class Section4TableauComparatif(BaseModel):
    """Section 4: Comparative table (4 scenarios)"""
    scenarios: List[ScenarioComparatif]
    recommandation: Optional[str] = None  # Global recommendation like Streamlit


class FullAnalysisResponse(BaseModel):
    """Complete 4-section optimization analysis"""
    annee_N: int
    annee_N_plus_1: int
    section_1_optimisation_N: Section1OptimisationN
    section_2_projection_N_plus_1: Section2ProjectionNPlus1
    section_3_optimisation_N_plus_1: Section3OptimisationNPlus1
    section_4_tableau_comparatif: Section4TableauComparatif
