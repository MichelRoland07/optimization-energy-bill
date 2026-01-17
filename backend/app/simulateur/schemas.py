"""
Simulateur schemas
"""
from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class TableauTarifsResponse(BaseModel):
    """Response for tariffs table"""
    annee: int
    colonnes: List[str]
    lignes: List[Dict[str, Any]]


class SimulationRequest(BaseModel):
    """Request for tariff simulation"""
    puissance: float
    temps_fonctionnement: float
    annee: int = 2025


class SimulationResponse(BaseModel):
    """Response for tariff simulation"""
    type: int
    categorie: str
    plage_horaire: str
    intervalle_min: float
    intervalle_max: float
    tarif_off_peak: float
    tarif_peak: float
    prime_fixe: float
    coefficient: float  # Coefficient d'évolution (1.05 ou 1.10) ^ (annee - 2023)
    puissance: float
    temps_fonctionnement: float
    annee: int
