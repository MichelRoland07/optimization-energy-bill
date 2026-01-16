"""
Fonctions de calcul pour l'analyse énergétique
"""
import pandas as pd
import numpy as np
from .config import type_table, tarifs_small, tarifs_big, TVA


# ============ CONSOMMATIONS ============

def calcul_conso_hors_pointe(row):
    """Calcule la consommation hors pointe"""
    return max(
        0,
        row["ACTIVE_OFF_PEAK_IMP"] +
        row["ACTIVE_OFF_PEAK_EXP"] 
    )


def calcul_conso_pointe(row):
    """Calcule la consommation pointe"""
    return max(
        0,
        row["ACTIVE_PEAK_IMP"] +
        row["ACTIVE_PEAK_EXP"] 
    )


# ============ PUISSANCE ============

def calcul_puissance_atteinte_arrondi(row):
    """Arrondit la puissance atteinte au multiple de 5 supérieur"""
    P = row['PUISSANCE_ATTEINTE']
    if P % 5 == 0:
        return P
    else:
        return P - (P % 5) + 5


def calcul_puissance_a_utiliser(df):
    """Calcule la puissance à utiliser (max entre souscrite et atteinte arrondie)"""
    df['PUISSANCE A UTILISER'] = df[
        ['SUBSCRIPTION_LOAD', 'PUISSANCE_ATTEINTE_ARRONDI']
    ].max(axis=1)
    return df


def calcul_depassement_puissance(df):
    """Calcule le dépassement de puissance"""
    df['DEPASSEMENT_PUISSANCE'] = (
        df['PUISSANCE_ATTEINTE'] - df['SUBSCRIPTION_LOAD']
    ).clip(lower=0)
    return df


def calcul_depassement_puissance_pct(df):
    """Calcule le pourcentage de dépassement"""
    def depassement_pct(row):
        if row['DEPASSEMENT_PUISSANCE'] == 0:
            return 0
        return (row['PUISSANCE_ATTEINTE'] - row['SUBSCRIPTION_LOAD']) / \
               (row['PUISSANCE_ATTEINTE'] + row['SUBSCRIPTION_LOAD'])
    
    df['DEPASSEMENT_PUISSANCE_PCT'] = df.apply(depassement_pct, axis=1)
    return df


# ============ TEMPS DE FONCTIONNEMENT ============

def calcul_temps_fonctionnement(df):
    """Calcule le temps de fonctionnement en heures"""
    df['Temps fonctionnement'] = round(df['MV_CONSUMPTION'] / df['PUISSANCE A UTILISER'])
    return df


# ============ DATE ============

def convertir_date_datetime(df, colonne='READING_DATE'):
    """Convertit la colonne de date en datetime"""
    df[colonne] = pd.to_datetime(df[colonne])
    return df


# ============ AUGMENTATION TARIFAIRE ============

def calcul_augmentation(df):
    """Calcule le coefficient d'augmentation selon l'année et la puissance"""
    years = df['READING_DATE'].dt.year
    puissance = df['PUISSANCE A UTILISER']

    conditions = [
        years < 2024,
        years == 2024,
        years == 2025,
        years == 2026
    ]

    choices = [
        1,
        np.where(puissance < 3000, 1.05, 1.1),
        np.where(puissance < 3000, 1.05**2, 1.1**2),
        np.where(puissance < 3000, 1.05**3, 1.1**3)
    ]

    df['AUGMENTATION'] = np.select(conditions, choices, default=np.nan)
    df['AUGMENTATION'] = df['AUGMENTATION'].round(2)

    return df


# ============ CATEGORIE/TYPE ============

def calcul_categorie(df, type_table):
    """Calcule la catégorie/type tarifaire"""
    def get_type(puissance, df_table):
        row = df_table[(df_table['min'] <= puissance) & (puissance < df_table['max'])]
        if not row.empty:
            return int(row['type'].values[0])
        else:
            return np.nan

    df['CATEGORIE'] = df['PUISSANCE A UTILISER'].apply(lambda x: get_type(x, type_table))
    return df


# ============ TARIFS ============

def calcul_tarif_hors_pointe(df, tarifs_big, tarifs_small):
    """Calcule le tarif hors pointe ajusté"""
    def tarif_hors_pointe(row):
        cat = int(row['CATEGORIE'])
        temps = row['Temps fonctionnement']
        coeff = row['AUGMENTATION']

        if cat <= 5:
            if temps <= 200:
                tarif_list = tarifs_small['0_200']['off']
                tarif = tarif_list[cat-1]
            elif 200 < temps <= 400:
                tarif_list = tarifs_small['201_400']['off']
                tarif = tarif_list[cat-1]
            else:
                tarif_list = tarifs_small['sup_400']['off']
                tarif = tarif_list[cat-1]
        else:
            if temps <= 400:
                tarif_list = tarifs_big['0_400']['off']
                tarif = tarif_list[cat-6]
            else:
                tarif_list = tarifs_big['sup_400']['off']
                tarif = tarif_list[cat-6]

        return tarif * coeff

    df['TARIF_HORS_POINTE'] = df.apply(tarif_hors_pointe, axis=1)
    return df


def calcul_tarif_pointe(df, tarifs_big, tarifs_small):
    """Calcule le tarif pointe ajusté"""
    def tarif_pointe(row):
        cat = int(row['CATEGORIE'])
        temps = row['Temps fonctionnement']
        coeff = row['AUGMENTATION']

        if cat <= 5:
            if temps <= 200:
                tarif_list = tarifs_small['0_200']['peak']
                tarif = tarif_list[cat-1]
            elif 200 < temps <= 400:
                tarif_list = tarifs_small['201_400']['peak']
                tarif = tarif_list[cat-1]
            else:
                tarif_list = tarifs_small['sup_400']['peak']
                tarif = tarif_list[cat-1]
        else:
            if temps <= 400:
                tarif_list = tarifs_big['0_400']['peak']
                tarif = tarif_list[cat-6]
            else:
                tarif_list = tarifs_big['sup_400']['peak']
                tarif = tarif_list[cat-6]

        return tarif * coeff

    df['TARIF_POINTE'] = df.apply(tarif_pointe, axis=1)
    return df


def calcul_prime_fixe(df, tarifs_big, tarifs_small):
    """Calcule la prime fixe ajustée"""
    def prime_fixe(row):
        cat = int(row['CATEGORIE'])
        temps = row['Temps fonctionnement']
        coeff = row['AUGMENTATION']

        if cat <= 5:
            if temps <= 200:
                tarif_list = tarifs_small['0_200']['pf']
                tarif = tarif_list[cat-1]
            elif 200 < temps <= 400:
                tarif_list = tarifs_small['201_400']['pf']
                tarif = tarif_list[cat-1]
            else:
                tarif_list = tarifs_small['sup_400']['pf']
                tarif = tarif_list[cat-1]
        else:
            if temps <= 400:
                tarif_list = tarifs_big['0_400']['pf']
                tarif = tarif_list[cat-6]
            else:
                tarif_list = tarifs_big['sup_400']['pf']
                tarif = tarif_list[cat-6]

        return tarif * coeff

    df['PRIME_FIXE_CALCULEE'] = df.apply(prime_fixe, axis=1)
    return df


# ============ FACTURATION ============

def calcul_facturation_hors_pointe(df):
    """Calcule le montant de facturation hors pointe"""
    df['FACTURATION HORS POINTE'] = df['CONSO HORS POINTE'] * df["TARIF_HORS_POINTE"]
    return df


def calcul_facturation_pointe(df):
    """Calcule le montant de facturation pointe"""
    df['FACTURATION POINTE'] = df['CONSO POINTE'] * df['TARIF_POINTE']
    return df


def calcul_gap_ttc(df):
    """Calcule l'écart entre la facture calculée et la facture réelle"""
    def gap_ligne(row):
        if row['READING_DATE'].year >= 2023:
            total = (
                ((row['ACTIVE_OFF_PEAK_IMP'] + row['ACTIVE_OFF_PEAK_EXP']) * row['TARIF_HORS_POINTE']) +
                ((row['ACTIVE_PEAK_IMP'] + row['ACTIVE_PEAK_EXP']) * row['TARIF_POINTE']) +
                (row['PUISSANCE A UTILISER'] * row['PRIME_FIXE_CALCULEE'])
            ) * (1 + 0.1925)
            gap = round(total, 0) - row['AMOUNT_WITH_TAX']
        else:
            gap = 0
        return gap

    df['GAP_TTC'] = df.apply(gap_ligne, axis=1)
    return df


def calcul_facture_reconstitue(df):
    """Calcule la facture reconstituée validée"""
    def facture_reconstitue_ligne(row):
        if row['READING_DATE'].year >= 2023:
            if -3_000_000 <= row['GAP_TTC'] <= 3_000_000:
                return row['AMOUNT_WITH_TAX']
            else:
                return np.nan
        else:
            return 0

    df['FACTURE_RECONSTITUEE'] = df.apply(facture_reconstitue_ligne, axis=1)
    return df


# ============ PIPELINE COMPLET ============

def appliquer_tous_calculs(df):
    """Applique tous les calculs sur le DataFrame"""
    print("Application des calculs...")
    
    # Consommations
    df["CONSO HORS POINTE"] = df.apply(calcul_conso_hors_pointe, axis=1)
    df["CONSO POINTE"] = df.apply(calcul_conso_pointe, axis=1)
    
    # Puissance
    df['PUISSANCE_ATTEINTE_ARRONDI'] = df.apply(calcul_puissance_atteinte_arrondi, axis=1)
    df = calcul_puissance_a_utiliser(df)
    df = calcul_depassement_puissance(df)
    df = calcul_depassement_puissance_pct(df)
    
    # Temps et date
    df = calcul_temps_fonctionnement(df)
    df = convertir_date_datetime(df)
    
    # Augmentation et catégorie
    df = calcul_augmentation(df)
    df = calcul_categorie(df, type_table)
    
    # Tarifs
    df = calcul_tarif_hors_pointe(df, tarifs_big, tarifs_small)
    df = calcul_tarif_pointe(df, tarifs_big, tarifs_small)
    df = calcul_prime_fixe(df, tarifs_big, tarifs_small)
    
    # Facturation
    df = calcul_facturation_hors_pointe(df)
    df = calcul_facturation_pointe(df)
    df = calcul_gap_ttc(df)
    df = calcul_facture_reconstitue(df)
    
    print("Calculs terminés ✓")
    return df
