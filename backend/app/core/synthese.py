"""
Génération des tableaux de synthèse par année
"""
import pandas as pd
import numpy as np


def generer_tableau_synthese(df, annee, nom_client):
    """
    Génère le tableau de synthèse pour une année donnée
    
    Parameters:
    -----------
    df : DataFrame
        DataFrame avec toutes les données calculées
    annee : int
        Année à analyser (2023, 2024, 2025)
    nom_client : str
        Nom du client
        
    Returns:
    --------
    DataFrame : Tableau de synthèse avec totaux annuels et détails mensuels
    """
    
    # Filtrer les données de l'année
    df_annee = df[df['READING_DATE'].dt.year == annee].copy()
    
    if df_annee.empty:
        print(f"⚠️  Aucune donnée pour l'année {annee}")
        return None
    
    # Trier par date
    df_annee = df_annee.sort_values('READING_DATE')
    
    # Extraire le mois
    df_annee['Mois'] = df_annee['READING_DATE'].dt.month
    
    # Créer le tableau de synthèse
    lignes = {
        'Énergie (kWh)': [],
        'Énergie Active P (kWh)': [],
        'Énergie Active Off P (kWh)': [],
        'Puiss. Atteinte': [],
        'Puiss. Fact': [],
        'Temps normal': [],
        'Cos phi': [],
        'Montant HT (F.CFA)': [],
        'Gap cos phi': [],
        'Pénalité cos phi (F.CFA)': [],
        'Montant TTC (F.CFA)': []
    }
    
    # Calculer les valeurs mensuelles
    for mois in range(1, 13):
        df_mois = df_annee[df_annee['Mois'] == mois]
        
        if df_mois.empty:
            # Mois sans données
            lignes['Énergie (kWh)'].append(np.nan)
            lignes['Énergie Active P (kWh)'].append(np.nan)
            lignes['Énergie Active Off P (kWh)'].append(np.nan)
            lignes['Puiss. Atteinte'].append(np.nan)
            lignes['Puiss. Fact'].append(np.nan)
            lignes['Temps normal'].append(np.nan)
            lignes['Cos phi'].append(np.nan)
            lignes['Montant HT (F.CFA)'].append(np.nan)
            lignes['Gap cos phi'].append(np.nan)
            lignes['Pénalité cos phi (F.CFA)'].append(np.nan)
            lignes['Montant TTC (F.CFA)'].append(np.nan)
        else:
            row = df_mois.iloc[0]
            
            lignes['Énergie (kWh)'].append(row['MV_CONSUMPTION'])
            lignes['Énergie Active P (kWh)'].append(row['ACTIVE_PEAK_IMP'] + row['ACTIVE_PEAK_EXP'])
            lignes['Énergie Active Off P (kWh)'].append(row['ACTIVE_OFF_PEAK_IMP'] + row['ACTIVE_OFF_PEAK_EXP'])
            lignes['Puiss. Atteinte'].append(row['PUISSANCE_ATTEINTE'])
            lignes['Puiss. Fact'].append(row['PUISSANCE A UTILISER'])
            lignes['Temps normal'].append(row['Temps fonctionnement'])
            lignes['Cos phi'].append(row.get('COSPHI', np.nan) if 'COSPHI' in df_mois.columns else np.nan)
            lignes['Montant HT (F.CFA)'].append(row['AMOUNT_WITHOUT_TAX'])
            lignes['Gap cos phi'].append(0.9 - row.get('COSPHI', 0.9) if row.get('COSPHI', 0.9) < 0.9 else 0)
            lignes['Pénalité cos phi (F.CFA)'].append(row.get('MAUVAIS_COS', 0))
            lignes['Montant TTC (F.CFA)'].append(row['AMOUNT_WITH_TAX'])
    
    # Créer le DataFrame avec les colonnes de 1 à 12
    colonnes = ['Mois'] + [str(i) for i in range(1, 13)]
    
    # Créer le DataFrame final
    data = {'Mois': list(lignes.keys())}
    for i, mois in enumerate(range(1, 13)):
        data[str(mois)] = [lignes[key][i] for key in lignes.keys()]
    
    df_synthese = pd.DataFrame(data)
    
    # Calculer la colonne "Année {annee}" (totaux)
    totaux = []
    for key in lignes.keys():
        if key in ['Énergie (kWh)', 'Énergie Active P (kWh)', 'Énergie Active Off P (kWh)', 
                   'Montant HT (F.CFA)', 'Pénalité cos phi (F.CFA)', 'Montant TTC (F.CFA)']:
            # Somme pour ces lignes
            valeurs = [v for v in lignes[key] if not pd.isna(v)]
            totaux.append(sum(valeurs) if valeurs else 0)
        else:
            # Pas de total pour ces lignes
            totaux.append('')
    
    df_synthese.insert(1, f'Année {annee}', totaux)
    
    return df_synthese


def formater_tableau_synthese(df_synthese, annee):
    """
    Formate le tableau de synthèse pour l'affichage
    
    Parameters:
    -----------
    df_synthese : DataFrame
        Tableau brut
    annee : int
        Année
        
    Returns:
    --------
    DataFrame : Tableau formaté
    """
    if df_synthese is None:
        return None
    
    df_format = df_synthese.copy()
    
    # Formater les nombres
    def format_nombre(x):
        if isinstance(x, str) or pd.isna(x) or x == '':
            return x
        if abs(x) >= 1_000_000:
            return f"{int(x):,}".replace(',', ' ')
        elif abs(x) >= 1_000:
            return f"{int(x):,}".replace(',', ' ')
        else:
            return f"{x:.2f}"
    
    # Appliquer le formatage à toutes les colonnes sauf 'Mois'
    for col in df_format.columns:
        if col != 'Mois':
            df_format[col] = df_format[col].apply(format_nombre)
    
    return df_format


def generer_tous_tableaux_synthese(df, nom_client):
    """
    Génère les tableaux de synthèse pour 2023, 2024, 2025
    
    Parameters:
    -----------
    df : DataFrame
        DataFrame avec toutes les données
    nom_client : str
        Nom du client
        
    Returns:
    --------
    dict : Dictionnaire avec les 3 tableaux
    """
    tableaux = {}
    
    for annee in [2023, 2024, 2025]:
        print(f"📊 Génération du tableau de synthèse {annee}...")
        tableau = generer_tableau_synthese(df, annee, nom_client)
        if tableau is not None:
            tableaux[annee] = formater_tableau_synthese(tableau, annee)
            print(f"   ✓ Tableau {annee} créé")
        else:
            print(f"   ✗ Pas de données pour {annee}")
    
    return tableaux


def generer_tableau_synthese_optimise(df_2025_original, df_resultats_simulation, nouvelle_puissance, nom_client):
    """
    Génère le tableau de synthèse pour la configuration optimisée
    
    Parameters:
    -----------
    df_2025_original : DataFrame
        DataFrame 2025 avec toutes les données originales
    df_resultats_simulation : DataFrame
        DataFrame avec les résultats de simulation
    nouvelle_puissance : float
        Nouvelle puissance souscrite testée
    nom_client : str
        Nom du client
        
    Returns:
    --------
    DataFrame : Tableau de synthèse optimisé avec GAP
    """
    
    # Trier les DataFrames par date
    df_2025 = df_2025_original.sort_values('READING_DATE').copy()
    df_2025['Mois'] = df_2025['READING_DATE'].dt.month
    
    # Créer le tableau de synthèse
    lignes = {
        'Énergie (kWh)': [],
        'Énergie Active P (kWh)': [],
        'Énergie Active Off P (kWh)': [],
        'Puiss. Atteinte': [],
        'Puiss. Souscrite Optimisée': [],
        'Temps optimisé': [],
        'Cos phi': [],
        'Montant HT Optimisé (F.CFA)': [],
        'Gap cos phi': [],
        'Pénalité cos phi (F.CFA)': [],
        'Montant TTC Optimisé (F.CFA)': [],
        'GAP vs Actuel (F.CFA)': []
    }
    
    # Calculer les valeurs mensuelles
    for mois in range(1, 13):
        df_mois_original = df_2025[df_2025['Mois'] == mois]
        df_mois_simule = df_resultats_simulation.iloc[mois - 1] if mois - 1 < len(df_resultats_simulation) else None
        
        if not df_mois_original.empty and df_mois_simule is not None:
            row_original = df_mois_original.iloc[0]
            
            # Valeurs qui ne changent pas (du DataFrame original)
            energie_totale = row_original['MV_CONSUMPTION']
            energie_peak = row_original['ACTIVE_PEAK_IMP'] + row_original['ACTIVE_PEAK_EXP']
            energie_off_peak = row_original['ACTIVE_OFF_PEAK_IMP'] + row_original['ACTIVE_OFF_PEAK_EXP']
            puissance_atteinte = row_original['PUISSANCE_ATTEINTE']
            cos_phi = row_original.get('COSPHI', np.nan) if 'COSPHI' in df_mois_original.columns else np.nan
            
            # Valeurs recalculées avec la nouvelle puissance
            temps_optimise = round(energie_totale / nouvelle_puissance) if nouvelle_puissance > 0 else 0
            montant_ttc_optimise = df_mois_simule['Facture_Simulee']
            montant_ht_optimise = montant_ttc_optimise / 1.1925  # Retirer la TVA
            gap_vs_actuel = df_mois_simule['Economie']  # Positif = économie, négatif = surcoût
            
            # Remplir les lignes
            lignes['Énergie (kWh)'].append(energie_totale)
            lignes['Énergie Active P (kWh)'].append(energie_peak)
            lignes['Énergie Active Off P (kWh)'].append(energie_off_peak)
            lignes['Puiss. Atteinte'].append(puissance_atteinte)
            lignes['Puiss. Souscrite Optimisée'].append(nouvelle_puissance)
            lignes['Temps optimisé'].append(temps_optimise)
            lignes['Cos phi'].append(cos_phi)
            lignes['Montant HT Optimisé (F.CFA)'].append(montant_ht_optimise)
            lignes['Gap cos phi'].append(0.9 - cos_phi if cos_phi < 0.9 else 0)
            lignes['Pénalité cos phi (F.CFA)'].append(row_original.get('MAUVAIS_COS', 0))
            lignes['Montant TTC Optimisé (F.CFA)'].append(montant_ttc_optimise)
            lignes['GAP vs Actuel (F.CFA)'].append(gap_vs_actuel)
        else:
            # Mois sans données
            for key in lignes.keys():
                lignes[key].append(np.nan)
    
    # Créer le DataFrame avec les colonnes de 1 à 12
    colonnes = ['Indicateur'] + [str(i) for i in range(1, 13)]
    
    data = {'Indicateur': list(lignes.keys())}
    for i, mois in enumerate(range(1, 13)):
        data[str(mois)] = [lignes[key][i] for key in lignes.keys()]
    
    df_synthese = pd.DataFrame(data)
    
    # Calculer la colonne "Optimisé 2025" (totaux)
    totaux = []
    for key in lignes.keys():
        if key in ['Énergie (kWh)', 'Énergie Active P (kWh)', 'Énergie Active Off P (kWh)', 
                   'Montant HT Optimisé (F.CFA)', 'Pénalité cos phi (F.CFA)', 
                   'Montant TTC Optimisé (F.CFA)', 'GAP vs Actuel (F.CFA)']:
            # Somme pour ces lignes
            valeurs = [v for v in lignes[key] if not pd.isna(v)]
            totaux.append(sum(valeurs) if valeurs else 0)
        elif key == 'Puiss. Souscrite Optimisée':
            # Constante pour toute l'année
            totaux.append(nouvelle_puissance)
        else:
            # Pas de total pour ces lignes
            totaux.append('')
    
    df_synthese.insert(1, f'Optimisé 2025', totaux)
    
    # Formater les nombres
    return formater_tableau_synthese(df_synthese, 2025)


def formater_tableau_synthese(df_synthese, annee):
    """
    Formate le tableau de synthèse pour l'affichage
    
    Parameters:
    -----------
    df_synthese : DataFrame
        Tableau brut
    annee : int
        Année
        
    Returns:
    --------
    DataFrame : Tableau formaté
    """
    if df_synthese is None:
        return None
    
    df_format = df_synthese.copy()
    
    # Formater les nombres
    def format_nombre(x):
        if isinstance(x, str) or pd.isna(x) or x == '':
            return x
        if abs(x) >= 1_000_000:
            return f"{int(x):,}".replace(',', ' ')
        elif abs(x) >= 1_000:
            return f"{int(x):,}".replace(',', ' ')
        else:
            return f"{x:.2f}"
    
    # Appliquer le formatage à toutes les colonnes sauf 'Indicateur'
    for col in df_format.columns:
        if col not in ['Indicateur']:
            df_format[col] = df_format[col].apply(format_nombre)

    return df_format


def generer_tableau_synthese_projection_2026(df_2025_original, df_projection_2026, puissance_actuelle, nom_client):
    """
    Génère le tableau de synthèse pour la projection 2026 avec puissance actuelle

    Parameters:
    -----------
    df_2025_original : DataFrame
        DataFrame 2025 avec toutes les données originales
    df_projection_2026 : DataFrame
        DataFrame avec les résultats de projection 2026
    puissance_actuelle : float
        Puissance souscrite actuelle
    nom_client : str
        Nom du client

    Returns:
    --------
    DataFrame : Tableau de synthèse projection 2026 avec GAP
    """

    # Trier les DataFrames par date
    df_2025 = df_2025_original.sort_values('READING_DATE').copy()
    df_2025['Mois'] = df_2025['READING_DATE'].dt.month

    # Créer le tableau de synthèse
    lignes = {
        'Énergie (kWh)': [],
        'Énergie Active P (kWh)': [],
        'Énergie Active Off P (kWh)': [],
        'Puiss. Atteinte': [],
        'Puiss. Souscrite': [],
        'Temps fonctionnement': [],
        'Cos phi': [],
        'Montant HT 2026 (F.CFA)': [],
        'Gap cos phi': [],
        'Pénalité cos phi (F.CFA)': [],
        'Montant TTC 2026 (F.CFA)': [],
        'GAP vs 2025 (F.CFA)': []
    }

    # Calculer les valeurs mensuelles
    for mois in range(1, 13):
        df_mois_original = df_2025[df_2025['Mois'] == mois]
        df_mois_projection = df_projection_2026.iloc[mois - 1] if mois - 1 < len(df_projection_2026) else None

        if not df_mois_original.empty and df_mois_projection is not None:
            row_original = df_mois_original.iloc[0]

            # Valeurs qui ne changent pas (du DataFrame original)
            energie_totale = row_original['MV_CONSUMPTION']
            energie_peak = row_original['ACTIVE_PEAK_IMP'] + row_original['ACTIVE_PEAK_EXP']
            energie_off_peak = row_original['ACTIVE_OFF_PEAK_IMP'] + row_original['ACTIVE_OFF_PEAK_EXP']
            puissance_atteinte = row_original['PUISSANCE_ATTEINTE']
            cos_phi = row_original.get('COSPHI', np.nan) if 'COSPHI' in df_mois_original.columns else np.nan

            # Valeurs projetées - détection automatique des noms de colonnes
            temps_fonctionnement = round(energie_totale / puissance_actuelle) if puissance_actuelle > 0 else 0

            # Détecter les colonnes dynamiquement
            col_projection = [col for col in df_mois_projection.index if 'Facture_Projection_' in col]
            col_facture_base = [col for col in df_mois_projection.index if col.startswith('Facture_') and 'Projection' not in col and 'Optimisation' not in col]

            if col_projection and col_facture_base:
                montant_ttc_2026 = df_mois_projection[col_projection[0]]
                montant_ttc_2025 = df_mois_projection[col_facture_base[0]]
            else:
                # Fallback aux anciens noms si détection échoue
                montant_ttc_2026 = df_mois_projection.get('Facture_Projection_2026', 0)
                montant_ttc_2025 = df_mois_projection.get('Facture_2025', 0)

            montant_ht_2026 = montant_ttc_2026 / 1.1925  # Retirer la TVA
            gap_vs_2025 = montant_ttc_2026 - montant_ttc_2025  # Positif = augmentation, négatif = diminution

            # Remplir les lignes
            lignes['Énergie (kWh)'].append(energie_totale)
            lignes['Énergie Active P (kWh)'].append(energie_peak)
            lignes['Énergie Active Off P (kWh)'].append(energie_off_peak)
            lignes['Puiss. Atteinte'].append(puissance_atteinte)
            lignes['Puiss. Souscrite'].append(puissance_actuelle)
            lignes['Temps fonctionnement'].append(temps_fonctionnement)
            lignes['Cos phi'].append(cos_phi)
            lignes['Montant HT 2026 (F.CFA)'].append(montant_ht_2026)
            lignes['Gap cos phi'].append(0.9 - cos_phi if cos_phi < 0.9 else 0)
            lignes['Pénalité cos phi (F.CFA)'].append(row_original.get('MAUVAIS_COS', 0))
            lignes['Montant TTC 2026 (F.CFA)'].append(montant_ttc_2026)
            lignes['GAP vs 2025 (F.CFA)'].append(gap_vs_2025)
        else:
            # Mois sans données
            for key in lignes.keys():
                lignes[key].append(np.nan)

    # Créer le DataFrame avec les colonnes de 1 à 12
    data = {'Indicateur': list(lignes.keys())}
    for i, mois in enumerate(range(1, 13)):
        data[str(mois)] = [lignes[key][i] for key in lignes.keys()]

    df_synthese = pd.DataFrame(data)

    # Calculer la colonne "Projection 2026" (totaux)
    totaux = []
    for key in lignes.keys():
        if key in ['Énergie (kWh)', 'Énergie Active P (kWh)', 'Énergie Active Off P (kWh)',
                   'Montant HT 2026 (F.CFA)', 'Pénalité cos phi (F.CFA)',
                   'Montant TTC 2026 (F.CFA)', 'GAP vs 2025 (F.CFA)']:
            # Somme pour ces lignes
            valeurs = [v for v in lignes[key] if not pd.isna(v)]
            totaux.append(sum(valeurs) if valeurs else 0)
        elif key == 'Puiss. Souscrite':
            # Constante pour toute l'année
            totaux.append(puissance_actuelle)
        else:
            # Pas de total pour ces lignes
            totaux.append('')

    df_synthese.insert(1, f'Projection 2026', totaux)

    # Formater les nombres
    return formater_tableau_synthese(df_synthese, 2026)


def generer_tableau_synthese_optimisation_2026(df_2025_original, df_optimisation_2026, puissance_optimisee, nom_client):
    """
    Génère le tableau de synthèse pour l'optimisation 2026 avec puissance optimisée

    Parameters:
    -----------
    df_2025_original : DataFrame
        DataFrame 2025 avec toutes les données originales
    df_optimisation_2026 : DataFrame
        DataFrame avec les résultats d'optimisation 2026
    puissance_optimisee : float
        Puissance optimisée (de la Section 1)
    nom_client : str
        Nom du client

    Returns:
    --------
    DataFrame : Tableau de synthèse optimisation 2026 avec GAP
    """

    # Trier les DataFrames par date
    df_2025 = df_2025_original.sort_values('READING_DATE').copy()
    df_2025['Mois'] = df_2025['READING_DATE'].dt.month

    # Créer le tableau de synthèse
    lignes = {
        'Énergie (kWh)': [],
        'Énergie Active P (kWh)': [],
        'Énergie Active Off P (kWh)': [],
        'Puiss. Atteinte': [],
        'Puiss. Optimisée': [],
        'Temps optimisé': [],
        'Cos phi': [],
        'Montant HT 2026 Optimisé (F.CFA)': [],
        'Gap cos phi': [],
        'Pénalité cos phi (F.CFA)': [],
        'Montant TTC 2026 Optimisé (F.CFA)': [],
        'GAP vs 2025 Actuel (F.CFA)': []
    }

    # Calculer les valeurs mensuelles
    for mois in range(1, 13):
        df_mois_original = df_2025[df_2025['Mois'] == mois]
        df_mois_optimisation = df_optimisation_2026.iloc[mois - 1] if mois - 1 < len(df_optimisation_2026) else None

        if not df_mois_original.empty and df_mois_optimisation is not None:
            row_original = df_mois_original.iloc[0]

            # Valeurs qui ne changent pas (du DataFrame original)
            energie_totale = row_original['MV_CONSUMPTION']
            energie_peak = row_original['ACTIVE_PEAK_IMP'] + row_original['ACTIVE_PEAK_EXP']
            energie_off_peak = row_original['ACTIVE_OFF_PEAK_IMP'] + row_original['ACTIVE_OFF_PEAK_EXP']
            puissance_atteinte = row_original['PUISSANCE_ATTEINTE']
            cos_phi = row_original.get('COSPHI', np.nan) if 'COSPHI' in df_mois_original.columns else np.nan

            # Valeurs optimisées - détection automatique des noms de colonnes
            temps_optimise = round(energie_totale / puissance_optimisee) if puissance_optimisee > 0 else 0

            # Détecter les colonnes dynamiquement
            col_optimisation = [col for col in df_mois_optimisation.index if 'Facture_Optimisation_' in col]
            col_facture_base = [col for col in df_mois_optimisation.index if col.startswith('Facture_') and 'Projection' not in col and 'Optimisation' not in col]

            if col_optimisation and col_facture_base:
                montant_ttc_2026_optimise = df_mois_optimisation[col_optimisation[0]]
                montant_ttc_2025 = df_mois_optimisation[col_facture_base[0]]
            else:
                # Fallback aux anciens noms si détection échoue
                montant_ttc_2026_optimise = df_mois_optimisation.get('Facture_Optimisation_2026', 0)
                montant_ttc_2025 = df_mois_optimisation.get('Facture_2025', 0)

            montant_ht_2026_optimise = montant_ttc_2026_optimise / 1.1925  # Retirer la TVA
            gap_vs_2025 = montant_ttc_2025 - montant_ttc_2026_optimise  # Positif = économie, négatif = surcoût

            # Remplir les lignes
            lignes['Énergie (kWh)'].append(energie_totale)
            lignes['Énergie Active P (kWh)'].append(energie_peak)
            lignes['Énergie Active Off P (kWh)'].append(energie_off_peak)
            lignes['Puiss. Atteinte'].append(puissance_atteinte)
            lignes['Puiss. Optimisée'].append(puissance_optimisee)
            lignes['Temps optimisé'].append(temps_optimise)
            lignes['Cos phi'].append(cos_phi)
            lignes['Montant HT 2026 Optimisé (F.CFA)'].append(montant_ht_2026_optimise)
            lignes['Gap cos phi'].append(0.9 - cos_phi if cos_phi < 0.9 else 0)
            lignes['Pénalité cos phi (F.CFA)'].append(row_original.get('MAUVAIS_COS', 0))
            lignes['Montant TTC 2026 Optimisé (F.CFA)'].append(montant_ttc_2026_optimise)
            lignes['GAP vs 2025 Actuel (F.CFA)'].append(gap_vs_2025)
        else:
            # Mois sans données
            for key in lignes.keys():
                lignes[key].append(np.nan)

    # Créer le DataFrame avec les colonnes de 1 à 12
    data = {'Indicateur': list(lignes.keys())}
    for i, mois in enumerate(range(1, 13)):
        data[str(mois)] = [lignes[key][i] for key in lignes.keys()]

    df_synthese = pd.DataFrame(data)

    # Calculer la colonne "Optimisation 2026" (totaux)
    totaux = []
    for key in lignes.keys():
        if key in ['Énergie (kWh)', 'Énergie Active P (kWh)', 'Énergie Active Off P (kWh)',
                   'Montant HT 2026 Optimisé (F.CFA)', 'Pénalité cos phi (F.CFA)',
                   'Montant TTC 2026 Optimisé (F.CFA)', 'GAP vs 2025 Actuel (F.CFA)']:
            # Somme pour ces lignes
            valeurs = [v for v in lignes[key] if not pd.isna(v)]
            totaux.append(sum(valeurs) if valeurs else 0)
        elif key == 'Puiss. Optimisée':
            # Constante pour toute l'année
            totaux.append(puissance_optimisee)
        else:
            # Pas de total pour ces lignes
            totaux.append('')

    df_synthese.insert(1, f'Optimisation 2026', totaux)

    # Formater les nombres
    return formater_tableau_synthese(df_synthese, 2026)