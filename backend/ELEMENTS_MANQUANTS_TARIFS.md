# ⚠️ ÉLÉMENTS MANQUANTS - TARIFS DÉTAILLÉS

**Date:** 2026-01-17
**Problème:** Le backend retourne les données de calcul mais PAS les détails des tarifs comme Streamlit

---

## 📋 COMPARAISON STREAMLIT vs BACKEND ACTUEL

### SECTION 1 - Optimisation année N

| Élément Streamlit | Backend actuel | Manquant ? |
|-------------------|----------------|------------|
| **Configuration actuelle** | | |
| - Puissance souscrite | ✅ `configuration_actuelle.puissance` | NON |
| - Puissance max atteinte | ❌ Pas dans Section 1 | **OUI** |
| - Type tarifaire | ✅ `configuration_actuelle.type_tarifaire` | NON |
| - Coût annuel | ✅ `configuration_actuelle.cout_annuel` | NON |
| - Dépassements | ✅ `configuration_actuelle.nb_depassements` | NON |
| **Tarifs et primes appliqués (actuel)** | | |
| - Tarif Heures Creuses | ❌ | **OUI - MANQUANT** |
| - Tarif Heures Pleines | ❌ | **OUI - MANQUANT** |
| - Prime Fixe | ❌ | **OUI - MANQUANT** |
| - Plage horaire (0-200h, etc.) | ❌ | **OUI - MANQUANT** |
| - Intervalle puissance [min, max] | ❌ | **OUI - MANQUANT** |
| **Nouvelle puissance à tester** | | |
| - Input nouvelle puissance | ✅ Paramètre `nouvelle_puissance` | NON |
| - Type détecté | ✅ `configuration_optimisee.type_tarifaire` | NON |
| - Intervalle [min, max] | ❌ | **OUI - MANQUANT** |
| - Variation vs actuel | ❌ | **OUI - MANQUANT** |
| **Tarifs et primes (nouvelle puissance)** | | |
| - Tarif HC | ❌ | **OUI - MANQUANT** |
| - Tarif HP | ❌ | **OUI - MANQUANT** |
| - Prime Fixe | ❌ | **OUI - MANQUANT** |
| - Plage horaire | ❌ | **OUI - MANQUANT** |

### SECTION 2 - Projection N+1

| Élément Streamlit | Backend actuel | Manquant ? |
|-------------------|----------------|------------|
| **Projection financière N+1** | | |
| - Coût N | ✅ `cout_N` | NON |
| - Coût projection N+1 | ✅ `cout_projection_N_plus_1` | NON |
| - Variation | ✅ `variation` | NON |
| **Tarifs appliqués N+1** | | |
| - Tarif HC N+1 | ❌ | **OUI - MANQUANT** |
| - Tarif HP N+1 | ❌ | **OUI - MANQUANT** |
| - Prime Fixe N+1 | ❌ | **OUI - MANQUANT** |
| **Graphiques** | | |
| - Données courbes factures | ⚠️ Partiellement (`tableau_mensuel`) | PARTIEL |
| - Données barres variation | ⚠️ Partiellement | PARTIEL |

### SECTION 3 - Optimisation N+1

| Élément Streamlit | Backend actuel | Manquant ? |
|-------------------|----------------|------------|
| **Projection financière N+1 optimisée** | | |
| - Coût actuel N | ✅ Via Section 1 | NON |
| - Coût optimisé N+1 | ✅ `configuration_optimisee_projection.cout` | NON |
| - Économies | ✅ `economies` | NON |
| **Tarifs appliqués (puissance optimisée, année N+1)** | | |
| - Tarif HC N+1 | ❌ | **OUI - MANQUANT** |
| - Tarif HP N+1 | ❌ | **OUI - MANQUANT** |
| - Prime Fixe N+1 | ❌ | **OUI - MANQUANT** |
| **Graphiques** | | |
| - Données courbes comparaison | ⚠️ Partiellement | PARTIEL |
| - Données barres économies | ⚠️ Partiellement | PARTIEL |

### SECTION 4 - Tableau comparatif

| Élément Streamlit | Backend actuel | Manquant ? |
|-------------------|----------------|------------|
| Tableau 4 scénarios | ✅ `scenarios` | NON |
| Recommandation | ✅ `recommandation` | NON |

---

## 🎯 RÉSUMÉ DES MANQUES

### Données manquantes principales:

1. **Tarifs détaillés** pour chaque configuration:
   - Tarif Heures Creuses (HC)
   - Tarif Heures Pleines (HP)
   - Prime Fixe (PF)
   - Plage horaire (0-200h, 201-400h, >400h, etc.)

2. **Métadonnées** de configuration:
   - Intervalle de puissance [min, max] pour le type
   - Variation de puissance (delta vs config actuelle)
   - Catégorie (Petit/Gros client)

3. **Données pour graphiques**:
   - Les tableaux mensuels existent mais manquent certaines colonnes

---

## 💡 SOLUTION PROPOSÉE

### Option 1: Ajouter un schema `TarifsInfo` (RECOMMANDÉ)

**Créer nouveau schema:**
```python
class TarifsInfo(BaseModel):
    """Detailed tariffs information"""
    tarif_hc: float  # Off-peak tariff
    tarif_hp: float  # Peak tariff
    prime_fixe: float  # Fixed charge
    plage_horaire: str  # Time range (e.g., "0-200h", ">400h")
    intervalle_min: float  # Min power for this type
    intervalle_max: float  # Max power for this type
    categorie: str  # "Petit client" or "Gros client"
```

**Modifier `ConfigurationInfo`:**
```python
class ConfigurationInfo(BaseModel):
    puissance: int
    type_tarifaire: int
    cout_annuel: float
    nb_depassements: int
    tarifs: TarifsInfo  # NOUVEAU
    variation_vs_actuel: Optional[int] = None  # NOUVEAU (delta de puissance)
```

**Résultat dans Section 1:**
```json
{
  "configuration_actuelle": {
    "puissance": 5000,
    "type_tarifaire": 9,
    "cout_annuel": 1500000000,
    "nb_depassements": 3,
    "tarifs": {
      "tarif_hc": 78.901,
      "tarif_hp": 98.765,
      "prime_fixe": 11234.00,
      "plage_horaire": ">400h",
      "intervalle_min": 4000,
      "intervalle_max": 5000,
      "categorie": "Gros client"
    },
    "variation_vs_actuel": 0
  },
  "configuration_optimisee": {
    "puissance": 4200,
    "type_tarifaire": 8,
    "cout_annuel": 1350000000,
    "nb_depassements": 5,
    "tarifs": {
      "tarif_hc": 75.234,
      "tarif_hp": 95.678,
      "prime_fixe": 10500.00,
      "plage_horaire": ">400h",
      "intervalle_min": 3000,
      "intervalle_max": 4000,
      "categorie": "Gros client"
    },
    "variation_vs_actuel": -800  // 4200 - 5000 = -800 kW
  }
}
```

### Option 2: Utiliser l'endpoint existant `/simulateur/simulate`

**Avantage:** L'endpoint `/simulateur/simulate` retourne DÉJÀ:
```json
{
  "type": 8,
  "categorie": "Gros client",
  "plage_horaire": ">400h",
  "intervalle_min": 3000,
  "intervalle_max": 4000,
  "tarif_off_peak": 75.234,
  "tarif_peak": 95.678,
  "prime_fixe": 10500.00
}
```

**Solution:** Le frontend peut appeler `/simulateur/simulate` pour obtenir les tarifs détaillés.

**Inconvénient:** Nécessite 2-3 appels API au lieu d'un seul.

---

## 🔧 WORKFLOW FRONTEND ACTUEL vs COMPLET

### Workflow actuel (INCOMPLET):

```
1. Appel GET /full-analysis?annee_N=2025&nouvelle_puissance=4200
   → Reçoit: configurations, économies, tableaux
   → Manque: tarifs détaillés

2. Frontend doit afficher "Tarifs appliqués"
   → ❌ Pas de données disponibles
```

### Workflow complet (AVEC Option 1):

```
1. Appel GET /full-analysis?annee_N=2025&nouvelle_puissance=4200
   → Reçoit: configurations + tarifs détaillés + économies + tableaux
   → ✅ Tout est là pour afficher comme Streamlit
```

### Workflow complet (AVEC Option 2):

```
1. Appel GET /config-actuelle?year=2025
   → Reçoit: config actuelle (puissance, type, coût)

2. Appel POST /simulateur/simulate avec puissance_actuelle
   → Reçoit: tarifs détaillés config actuelle

3. Appel POST /simulateur/simulate avec nouvelle_puissance
   → Reçoit: tarifs détaillés config optimisée

4. Appel GET /full-analysis?annee_N=2025&nouvelle_puissance=4200
   → Reçoit: calculs optimisation

Total: 4 appels API
```

---

## ✅ RECOMMANDATION

**Je recommande l'Option 1** pour ces raisons:

1. ✅ **Un seul appel API** pour tout avoir
2. ✅ **Plus simple** pour le frontend
3. ✅ **Plus cohérent** avec la structure Streamlit
4. ✅ **Meilleure performance** (moins de requêtes)
5. ✅ **Reproduction EXACTE** de Streamlit

**Modification à faire:**

1. Créer schema `TarifsInfo` dans `schemas.py`
2. Modifier `ConfigurationInfo` pour inclure `tarifs: TarifsInfo`
3. Dans `/full-analysis`, calculer et inclure les tarifs pour:
   - Configuration actuelle (année N, tarifs N)
   - Configuration optimisée (année N, tarifs N)
   - Projection N+1 (puissance actuelle, tarifs N+1)
   - Optimisation N+1 (puissance optimisée, tarifs N+1)

---

## 📊 MAPPING COMPLET STREAMLIT → BACKEND (APRÈS MODIFICATION)

| Streamlit Section 1 | Backend Endpoint | Données |
|---------------------|------------------|---------|
| Configuration actuelle | `GET /full-analysis` → section_1.configuration_actuelle | ✅ puissance, type, coût, dépassements, **tarifs**, intervalle, catégorie |
| Tarifs appliqués (actuel) | ↑ section_1.configuration_actuelle.tarifs | ✅ HC, HP, PF, plage |
| Nouvelle puissance | Paramètre `nouvelle_puissance` | ✅ |
| Type/intervalle détecté | section_1.configuration_optimisee | ✅ type, **intervalle**, **variation** |
| Tarifs (nouvelle puissance) | section_1.configuration_optimisee.tarifs | ✅ HC, HP, PF, plage |
| Simulation | section_1.tableau_mensuel | ✅ |

| Streamlit Section 2 | Backend | Données |
|---------------------|---------|---------|
| Projection financière N+1 | section_2 | ✅ coûts, variation |
| Tarifs N+1 | **section_2.tarifs_appliques** (NOUVEAU) | ✅ HC, HP, PF |
| Graphiques | section_2.tableau_mensuel | ✅ |

| Streamlit Section 3 | Backend | Données |
|---------------------|---------|---------|
| Projection optimisée N+1 | section_3 | ✅ coûts, économies |
| Tarifs N+1 (optimisé) | **section_3.tarifs_appliques** (NOUVEAU) | ✅ HC, HP, PF |
| Graphiques | section_3.tableau_mensuel | ✅ |

---

**Voulez-vous que j'implémente l'Option 1 maintenant ?** 🚀
