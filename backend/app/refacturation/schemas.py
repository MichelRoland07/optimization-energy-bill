"""
Pydantic schemas for refacturation (invoice reconstruction)
"""
from pydantic import BaseModel
from typing import List


class RefacurationMetriques(BaseModel):
    """Global metrics for refacturation"""
    facture_reelle_total: float
    facture_recalculee_total: float
    gap_total: float
    gap_pct: float
    nb_depassements: int


class RefacurationRow(BaseModel):
    """Single row in refacturation table"""
    mois: str
    puissance_souscrite: int
    puissance_atteinte: int
    depassement: int
    type_tarifaire: int
    consommation: float
    facture_reelle: float
    facture_recalculee: float
    ecart: float
    has_gap: bool


class RefacurationResponse(BaseModel):
    """Response for refacturation endpoint"""
    year: int
    metriques: RefacurationMetriques
    tableau: List[RefacurationRow]
