"""
Power optimization routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import pandas as pd

from ..auth.models import User
from ..auth.utils import get_current_user
from ..database import get_db
from ..data.session_manager import session_manager
from ..core import calculs
from ..core.config import type_table
from .schemas import (
    ConfigActuelleResponse, SimulationRequest, SimulationResponse,
    SimulationResultats, SimulationRowMensuel
)

router = APIRouter(prefix="/api/optimisation", tags=["Optimisation"])


@router.get("/config-actuelle", response_model=ConfigActuelleResponse)
async def get_config_actuelle(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current configuration for year 2025

    Returns current power subscription, max power reached, costs, etc.
    """
    # Get processed data
    df = session_manager.get_processed_data(current_user.id)

    if df is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée disponible. Veuillez d'abord uploader un fichier."
        )

    # Filter for 2025
    df_2025 = df[df['READING_DATE'].dt.year == 2025].copy()

    if df_2025.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée pour l'année 2025"
        )

    # Calculate metrics
    puissance_actuelle = int(df_2025['SUBSCRIPTION_LOAD'].iloc[0])
    puissance_max_atteinte = df_2025['PUISSANCE_ATTEINTE'].max()
    puissance_min_atteinte = df_2025['PUISSANCE_ATTEINTE'].min()
    puissance_moyenne = df_2025['PUISSANCE_ATTEINTE'].mean()

    # Current cost
    cout_annuel_2025 = df_2025['AMOUNT_WITH_TAX'].sum()

    # Detect current type
    row_type_actuel = type_table[
        (type_table['min'] <= puissance_actuelle) &
        (puissance_actuelle < type_table['max'])
    ]
    type_actuel = int(row_type_actuel['type'].values[0]) if not row_type_actuel.empty else 0

    # Number of overruns
    nb_depassements = (df_2025['PUISSANCE_ATTEINTE'] > puissance_actuelle).sum()

    return ConfigActuelleResponse(
        puissance_actuelle=puissance_actuelle,
        puissance_max_atteinte=puissance_max_atteinte,
        puissance_min_atteinte=puissance_min_atteinte,
        puissance_moyenne=puissance_moyenne,
        type_tarifaire=type_actuel,
        cout_annuel_2025=cout_annuel_2025,
        nb_depassements=nb_depassements
    )


@router.post("/simulate", response_model=SimulationResponse)
async def simulate_optimization(
    simulation: SimulationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Simulate new power subscription

    Recalculates costs with new power and compares to current configuration
    """
    # Get processed data
    df = session_manager.get_processed_data(current_user.id)

    if df is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée disponible. Veuillez d'abord uploader un fichier."
        )

    # Filter for 2025
    df_2025 = df[df['READING_DATE'].dt.year == 2025].copy()

    if df_2025.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée pour l'année 2025"
        )

    # Current metrics
    puissance_actuelle = int(df_2025['SUBSCRIPTION_LOAD'].iloc[0])
    puissance_max_atteinte = df_2025['PUISSANCE_ATTEINTE'].max()
    cout_actuel = df_2025['AMOUNT_WITH_TAX'].sum()
    nb_depassements_actuel = (df_2025['PUISSANCE_ATTEINTE'] > puissance_actuelle).sum()

    # Detect new type
    nouvelle_puissance = simulation.nouvelle_puissance
    row_type_optimise = type_table[
        (type_table['min'] <= nouvelle_puissance) &
        (nouvelle_puissance < type_table['max'])
    ]
    type_optimise = int(row_type_optimise['type'].values[0]) if not row_type_optimise.empty else 0

    # Check for warning
    warning = None
    has_warning = False
    nb_mois_depassement = (df_2025['PUISSANCE_ATTEINTE'] > nouvelle_puissance).sum()

    if nouvelle_puissance < puissance_max_atteinte:
        has_warning = True
        warning = (
            f"La puissance saisie ({nouvelle_puissance} kW) est inférieure à votre "
            f"puissance maximale atteinte ({puissance_max_atteinte:.0f} kW). "
            f"Vous aurez des dépassements sur {nb_mois_depassement} mois."
        )

    # Simulate: Create copy and change power
    df_simule = df_2025.copy()
    df_simule['SUBSCRIPTION_LOAD'] = nouvelle_puissance

    # Recalculate with new power
    df_simule = calculs.appliquer_tous_calculs(df_simule)

    # Calculate simulated cost
    cout_simule = df_simule['AMOUNT_WITH_TAX'].sum()

    # Savings
    economies = cout_actuel - cout_simule
    economies_pct = (economies / cout_actuel * 100) if cout_actuel > 0 else 0

    # Number of overruns in simulation
    nb_depassements_simule = (df_2025['PUISSANCE_ATTEINTE'] > nouvelle_puissance).sum()

    # Build monthly comparison table
    mois_noms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

    tableau_mensuel = []
    df_2025_sorted = df_2025.sort_values('READING_DATE')
    df_simule_sorted = df_simule.sort_values('READING_DATE')

    for (_, row_actuel), (_, row_simule) in zip(df_2025_sorted.iterrows(), df_simule_sorted.iterrows()):
        mois_num = int(row_actuel['READING_DATE'].month)
        mois_nom = mois_noms[mois_num - 1]

        facture_actuelle = float(row_actuel['AMOUNT_WITH_TAX'])
        facture_simulee = float(row_simule['AMOUNT_WITH_TAX'])
        economie = facture_actuelle - facture_simulee

        tableau_mensuel.append(SimulationRowMensuel(
            mois=mois_nom,
            facture_actuelle=facture_actuelle,
            facture_simulee=facture_simulee,
            economie=economie
        ))

    resultats = SimulationResultats(
        cout_actuel=cout_actuel,
        cout_simule=cout_simule,
        economies=economies,
        economies_pct=economies_pct,
        nb_depassements_actuel=nb_depassements_actuel,
        nb_depassements_simule=nb_depassements_simule
    )

    return SimulationResponse(
        nouvelle_puissance=nouvelle_puissance,
        nouveau_type_tarifaire=type_optimise,
        warning=warning,
        has_warning=has_warning,
        resultats=resultats,
        tableau_mensuel=tableau_mensuel
    )
