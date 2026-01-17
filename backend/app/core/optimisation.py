"""
Module d'optimisation de la puissance souscrite pour 2025
"""
import pandas as pd
import numpy as np
from .config import type_table, tarifs_small, tarifs_big, TVA


def calculer_facture_avec_puissance(row_data, puissance_souscrite, annee=2025):
    """
    Calcule la facture d'un mois avec une puissance souscrite donnée

    Parameters:
    -----------
    row_data : Series
        Données du mois
    puissance_souscrite : float
        Puissance souscrite à tester
    annee : int, optional
        Année pour le calcul des tarifs (défaut: 2025)

    Returns:
    --------
    dict : Résultats du calcul
    """
    # 1. Puissance atteinte arrondie
    P = row_data['PUISSANCE_ATTEINTE']
    if P % 5 == 0:
        puissance_atteinte_arrondi = P
    else:
        puissance_atteinte_arrondi = P - (P % 5) + 5
    
    # 2. Puissance utilisée
    puissance_utilisee = max(puissance_souscrite, puissance_atteinte_arrondi)
    
    # 3. Trouver le type
    row_type = type_table[
        (type_table['min'] <= puissance_utilisee) & 
        (puissance_utilisee < type_table['max'])
    ]
    if row_type.empty:
        return None
    type_tarif = int(row_type['type'].values[0])
    
    # 4. Temps de fonctionnement
    temps_fonctionnement = round(row_data['MV_CONSUMPTION'] / puissance_utilisee)
    
    # 5. Coefficient d'augmentation (selon l'année)
    annees_ecart = annee - 2023
    if puissance_utilisee < 3000:
        coefficient = 1.05**annees_ecart  # 5% par an pour puissance < 3000 kW
    else:
        coefficient = 1.1**annees_ecart   # 10% par an pour puissance >= 3000 kW
    
    # 6. Déterminer les tarifs de base
    if type_tarif <= 5:
        # Petits clients
        index = type_tarif - 1
        if temps_fonctionnement <= 200:
            tarif_off = tarifs_small['0_200']['off'][index]
            tarif_peak = tarifs_small['0_200']['peak'][index]
            pf = tarifs_small['0_200']['pf'][index]
        elif temps_fonctionnement <= 400:
            tarif_off = tarifs_small['201_400']['off'][index]
            tarif_peak = tarifs_small['201_400']['peak'][index]
            pf = tarifs_small['201_400']['pf'][index]
        else:
            tarif_off = tarifs_small['sup_400']['off'][index]
            tarif_peak = tarifs_small['sup_400']['peak'][index]
            pf = tarifs_small['sup_400']['pf'][index]
    else:
        # Gros clients
        index = type_tarif - 6
        if temps_fonctionnement <= 400:
            tarif_off = tarifs_big['0_400']['off'][index]
            tarif_peak = tarifs_big['0_400']['peak'][index]
            pf = tarifs_big['0_400']['pf'][index]
        else:
            tarif_off = tarifs_big['sup_400']['off'][index]
            tarif_peak = tarifs_big['sup_400']['peak'][index]
            pf = tarifs_big['sup_400']['pf'][index]
    
    # 7. Appliquer le coefficient
    tarif_off_ajuste = tarif_off * coefficient
    tarif_peak_ajuste = tarif_peak * coefficient
    pf_ajuste = pf * coefficient
    
    # 8. Calculer la facture
    conso_off = row_data['ACTIVE_OFF_PEAK_IMP'] + row_data['ACTIVE_OFF_PEAK_EXP']
    conso_peak = row_data['ACTIVE_PEAK_IMP'] + row_data['ACTIVE_PEAK_EXP']
    
    facture_ht = (
        (conso_off * tarif_off_ajuste) +
        (conso_peak * tarif_peak_ajuste) +
        (puissance_utilisee * pf_ajuste)
    )
    
    facture_ttc = facture_ht * (1 + TVA)
    
    # 9. Dépassement
    depassement = puissance_atteinte_arrondi > puissance_souscrite
    
    return {
        'puissance_utilisee': puissance_utilisee,
        'type': type_tarif,
        'temps_fonctionnement': temps_fonctionnement,
        'coefficient': coefficient,
        'tarif_off_peak': tarif_off_ajuste,
        'tarif_peak': tarif_peak_ajuste,
        'prime_fixe': pf_ajuste,
        'facture_ht': facture_ht,
        'facture_ttc': facture_ttc,
        'depassement': depassement
    }


def optimiser_puissance_2025(df, nom_client):
    """
    Optimise la puissance souscrite pour l'année 2025
    
    Parameters:
    -----------
    df : DataFrame
        DataFrame complet avec toutes les données calculées
    nom_client : str
        Nom du client
        
    Returns:
    --------
    dict : Résultats de l'optimisation
    """
    print(f"\n🔍 Optimisation de la puissance pour {nom_client} - Année 2025")
    print("=" * 70)
    
    # Filtrer les données 2025
    df_2025 = df[df['READING_DATE'].dt.year == 2025].copy()
    
    if df_2025.empty:
        print("❌ Aucune donnée pour 2025")
        return None
    
    # Trier par date
    df_2025 = df_2025.sort_values('READING_DATE')
    
    # Statistiques sur la puissance atteinte
    puissance_atteinte_min = df_2025['PUISSANCE_ATTEINTE'].min()
    puissance_atteinte_max = df_2025['PUISSANCE_ATTEINTE'].max()
    puissance_atteinte_moyenne = df_2025['PUISSANCE_ATTEINTE'].mean()
    puissance_atteinte_P90 = df_2025['PUISSANCE_ATTEINTE'].quantile(0.90)
    
    print(f"\n📊 Statistiques PUISSANCE_ATTEINTE 2025:")
    print(f"   • Min     : {puissance_atteinte_min:.0f} kW")
    print(f"   • Moyenne : {puissance_atteinte_moyenne:.0f} kW")
    print(f"   • P90     : {puissance_atteinte_P90:.0f} kW")
    print(f"   • Max     : {puissance_atteinte_max:.0f} kW")
    
    # Puissance souscrite actuelle
    puissance_actuelle = int(df_2025['SUBSCRIPTION_LOAD'].iloc[0])
    print(f"\n⚡ Puissance souscrite actuelle : {puissance_actuelle:.0f} kW")
    
    # Définir la plage de simulation
    plage_min = min(int(puissance_atteinte_moyenne * 0.8), puissance_actuelle - 100)
    plage_max = int(puissance_atteinte_max * 1.15)
    step = 10
    
    # Arrondir plage_min au multiple de 10 inférieur
    plage_min = (plage_min // 10) * 10
    
    print(f"\n🔄 Simulation de {plage_min} kW à {plage_max} kW (pas de {step} kW)")
    
    # Simuler tous les scénarios
    resultats = {}
    
    for puissance_test in range(plage_min, plage_max + step, step):
        cout_total = 0
        nb_depassements = 0
        
        for _, row in df_2025.iterrows():
            resultat_mois = calculer_facture_avec_puissance(row, puissance_test)
            if resultat_mois:
                cout_total += resultat_mois['facture_ttc']
                if resultat_mois['depassement']:
                    nb_depassements += 1
        
        resultats[puissance_test] = {
            'cout_total': cout_total,
            'cout_moyen_mensuel': cout_total / len(df_2025),
            'nb_depassements': nb_depassements
        }
    
    # Trouver la puissance optimale
    puissance_optimale = min(resultats, key=lambda x: resultats[x]['cout_total'])
    
    print(f"\n✅ PUISSANCE OPTIMALE IDENTIFIÉE : {puissance_optimale:.0f} kW")
    print(f"   • Coût total 2025 : {resultats[puissance_optimale]['cout_total']:,.0f} FCFA".replace(',', ' '))
    print(f"   • Coût moyen/mois : {resultats[puissance_optimale]['cout_moyen_mensuel']:,.0f} FCFA".replace(',', ' '))
    print(f"   • Dépassements    : {resultats[puissance_optimale]['nb_depassements']}/12 mois")
    
    # Comparaison avec l'actuel
    cout_actuel = resultats[puissance_actuelle]['cout_total']
    cout_optimal = resultats[puissance_optimale]['cout_total']
    economie = cout_actuel - cout_optimal
    economie_pct = (economie / cout_actuel) * 100
    
    print(f"\n💰 ÉCONOMIES POTENTIELLES:")
    print(f"   • Coût actuel  : {cout_actuel:,.0f} FCFA".replace(',', ' '))
    print(f"   • Coût optimal : {cout_optimal:,.0f} FCFA".replace(',', ' '))
    print(f"   • Économie     : {economie:,.0f} FCFA ({economie_pct:.1f}%)".replace(',', ' '))
    
    return {
        'puissance_actuelle': puissance_actuelle,
        'puissance_optimale': puissance_optimale,
        'cout_actuel': cout_actuel,
        'cout_optimal': cout_optimal,
        'economie_annuelle': economie,
        'economie_pct': economie_pct,
        'resultats_simulation': resultats,
        'df_2025': df_2025,
        'statistiques': {
            'min': puissance_atteinte_min,
            'max': puissance_atteinte_max,
            'moyenne': puissance_atteinte_moyenne,
            'P90': puissance_atteinte_P90
        }
    }


def generer_comparaison_mensuelle_2025(df_2025, puissance_actuelle, puissance_optimale):
    """
    Génère un tableau de comparaison mois par mois pour 2025
    
    Parameters:
    -----------
    df_2025 : DataFrame
        Données 2025
    puissance_actuelle : float
        Puissance souscrite actuelle
    puissance_optimale : float
        Puissance optimale recommandée
        
    Returns:
    --------
    DataFrame : Comparaison mensuelle
    """
    print("\n📅 Génération de la comparaison mensuelle 2025...")
    
    comparaison = []
    
    for _, row in df_2025.iterrows():
        # Calcul avec puissance actuelle
        result_actuel = calculer_facture_avec_puissance(row, puissance_actuelle)
        
        # Calcul avec puissance optimale
        result_optimal = calculer_facture_avec_puissance(row, puissance_optimale)
        
        if result_actuel and result_optimal:
            economie = result_actuel['facture_ttc'] - result_optimal['facture_ttc']
            gain_pct = (economie / result_actuel['facture_ttc']) * 100
            
            comparaison.append({
                'Mois': row['READING_DATE'].strftime('%B %Y'),
                'Puissance Atteinte (kW)': row['PUISSANCE_ATTEINTE'],
                'Type Actuel': result_actuel['type'],
                'Type Optimal': result_optimal['type'],
                'Facture Actuelle (FCFA)': result_actuel['facture_ttc'],
                'Facture Optimale (FCFA)': result_optimal['facture_ttc'],
                'Économie (FCFA)': economie,
                'Gain (%)': gain_pct,
                'Dépassement Actuel': 'OUI' if result_actuel['depassement'] else 'NON',
                'Dépassement Optimal': 'OUI' if result_optimal['depassement'] else 'NON'
            })
    
    df_comparaison = pd.DataFrame(comparaison)
    
    print("   ✓ Comparaison générée")
    
    return df_comparaison
