"""
Invoice reconstruction (refacturation) routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth.models import User
from ..auth.utils import get_current_user
from ..database import get_db
from ..data.session_manager import session_manager
from .schemas import RefacurationResponse, RefacurationMetriques, RefacurationRow

router = APIRouter(prefix="/api/refacturation", tags=["Refacturation"])


@router.get("", response_model=RefacurationResponse)
async def get_refacturation(
    year: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get invoice reconstruction analysis for a specific year

    Compares real invoices vs recalculated invoices
    Highlights rows with significant gaps (écarts)
    """
    # Get processed data
    df = session_manager.get_processed_data(current_user.id)

    if df is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune donnée disponible. Veuillez d'abord uploader un fichier."
        )

    # Filter for selected year
    df_year = df[df['READING_DATE'].dt.year == year].copy()

    if df_year.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Aucune donnée pour l'année {year}"
        )

    # Sort by date
    df_year = df_year.sort_values('READING_DATE')

    # === CALCULATE METRICS ===

    # Total real invoice
    facture_reelle_total = df_year['AMOUNT_WITH_TAX'].sum()

    # Total recalculated invoice
    facture_recalculee_total = (
        (df_year['FACTURATION HORS POINTE'] +
         df_year['FACTURATION POINTE'] +
         (df_year['PUISSANCE A UTILISER'] * df_year['PRIME_FIXE_CALCULEE'])) * (1 + 0.1925)
    ).sum()

    # Gap
    gap_total = facture_recalculee_total - facture_reelle_total
    gap_pct = (gap_total / facture_reelle_total * 100) if facture_reelle_total > 0 else 0

    # Number of power overruns
    nb_depassements = (df_year['DEPASSEMENT_PUISSANCE'] > 0).sum()

    metriques = RefacurationMetriques(
        facture_reelle_total=facture_reelle_total,
        facture_recalculee_total=facture_recalculee_total,
        gap_total=gap_total,
        gap_pct=gap_pct,
        nb_depassements=nb_depassements
    )

    # === BUILD MONTHLY TABLE ===

    mois_noms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

    tableau = []
    for _, row in df_year.iterrows():
        mois_num = int(row['READING_DATE'].month)
        mois_nom = mois_noms[mois_num - 1]

        # Calculate recalculated invoice for this month
        facture_recalculee = (
            (row['FACTURATION HORS POINTE'] +
             row['FACTURATION POINTE'] +
             (row['PUISSANCE A UTILISER'] * row['PRIME_FIXE_CALCULEE'])) * (1 + 0.1925)
        )

        ecart = row['GAP_TTC']

        # Check if has significant gap (> 100 FCFA)
        has_gap = abs(ecart) > 100

        tableau.append(RefacurationRow(
            mois=mois_nom,
            puissance_souscrite=int(row['SUBSCRIPTION_LOAD']),
            puissance_atteinte=int(row['PUISSANCE_ATTEINTE']),
            depassement=int(row['DEPASSEMENT_PUISSANCE']),
            type_tarifaire=int(row['CATEGORIE']),
            consommation=float(row['MV_CONSUMPTION']),
            facture_reelle=float(row['AMOUNT_WITH_TAX']),
            facture_recalculee=float(facture_recalculee),
            ecart=float(ecart),
            has_gap=has_gap
        ))

    return RefacurationResponse(
        year=year,
        metriques=metriques,
        tableau=tableau
    )
