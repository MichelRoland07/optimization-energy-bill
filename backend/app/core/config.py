"""
Configuration des tarifs et paramètres pour l'optimisation énergétique
"""
import pandas as pd

# Tableau MIN / MAX / Type
type_table = pd.DataFrame({
    "min": [0, 50, 500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000],
    "max": [50, 500, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000],
    "type": list(range(1, 13))
})

# Tarifs pour petits clients (Types 1-5)
tarifs_small = {
    "0_200": {
        "off":  [95, 75, 70, 65, 60],
        "peak": [125, 95, 95, 95, 95],
        "pf":   [0, 4700, 5500, 6000, 6500]
    },
    "201_400": {
        "off":  [85, 65, 60, 60, 55],
        "peak": [125, 95, 95, 95, 95],
        "pf":   [0, 4700, 5500, 6000, 6500]
    },
    "sup_400": {
        "off":  [125, 60, 55, 55, 50],
        "peak": ['', 95, 95, 95, 95],
        "pf":   ['', 4700, 5500, 6000, 6500]
    }
}

# Tarifs pour gros clients (Types 6-12)
tarifs_big = {
    "0_400": {
        "off":  [40, 36, 31, 25, 19, 16, 14],
        "peak": [40, 36, 31, 25, 19, 16, 14],
        "pf":   [8200, 9350, 10750, 12290, 14050, 15795, 18090]
    },
    "sup_400": {
        "off":  [35, 30, 24, 18, 14, 11, 9],
        "peak": [35, 30, 24, 18, 14, 11, 9],
        "pf":   [7000, 8000, 9200, 10500, 12000, 13500, 15500]
    }
}

# Coefficient TVA
TVA = 0.1925

# Année de référence pour les tarifs
ANNEE_REFERENCE = 2023
