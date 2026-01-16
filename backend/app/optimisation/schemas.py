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
