# PHASE 2: VÉRIFICATION DU BACKEND EXISTANT

Date: 2026-01-17

## ✅ CE QUI EXISTE DÉJÀ

### 1. Routers Existants

#### ✅ `app/auth/router.py`
- Login JWT
- Get current user
**Status:** COMPLET

#### ✅ `app/data/router.py`
**Endpoints existants:**
- `POST /api/data/upload` - Upload fichier Excel
- `POST /api/data/select-service` - Sélection service (multi-service)
- `GET /api/data/synthese?year={year}` - Tableau synthèse mensuel
- `GET /api/data/graphiques?year={year}` - **NOUVEAU!** Données graphiques (5 graphes)
- `GET /api/data/profil` - **NOUVEAU!** Profil client complet

**Mapping avec Streamlit:**
- ✅ Page Accueil: upload + select-service
- ✅ Page État des lieux: profil + graphiques + synthese
- ⚠️ Dashboard multi-services: MANQUE endpoint `/dashboard`
- ⚠️ Statistiques données: MANQUE endpoint `/stats`

**Status:** PRESQUE COMPLET (manque 2 endpoints)

#### ✅ `app/refacturation/router.py`
**Endpoints existants:**
- `GET /api/refacturation?year={year}` - Reconstitution facture avec gaps

**Mapping avec Streamlit:**
- ✅ Page Reconstitution de la facture: Complet

**Status:** COMPLET

#### ✅ `app/optimisation/router.py`
**Endpoints existants:**
- `GET /api/optimisation/config-actuelle` - Configuration actuelle (hardcoded 2025!)
- `POST /api/optimisation/simulate` - Simulation puissance (hardcoded 2025!)

**Mapping avec Streamlit:**
- ❌ Page Optimisation et Projection: INCOMPLET
- ❌ Manque: Année dynamique
- ❌ Manque: Full analysis (4 sections)
- ❌ Manque: Section 2 (Projection N+1)
- ❌ Manque: Section 3 (Optimisation N+1)
- ❌ Manque: Section 4 (Tableau comparatif)

**Status:** INCOMPLET - Besoin refonte complète

#### ✅ `app/simulateur/router.py`
**Endpoints existants:**
- `GET /api/simulateur/tableau-tarifs?annee={year}` - Tableau complet tarifs
- `POST /api/simulateur/simulate` - Simulation tarifs

**Mapping avec Streamlit:**
- ✅ Page Simulateur: Section 1 (tableau tarifs)
- ✅ Page Simulateur: Section 2 (simulation simple)
- ❌ Page Simulateur: Section 3 (simulation détaillée avec données réelles) - MANQUE

**Status:** PRESQUE COMPLET (manque simulation détaillée)

---

## 📊 MAPPING COMPLET STREAMLIT → BACKEND

### Page 🏠 Accueil

| Fonctionnalité Streamlit | Endpoint Backend | Status |
|--------------------------|------------------|--------|
| Upload fichier | `POST /api/data/upload` | ✅ Existe |
| Détection multi-services | `POST /api/data/upload` | ✅ Existe |
| Sélection service | `POST /api/data/select-service` | ✅ Existe |
| Tableau dashboard multi-services | ❌ Manque | ⚠️ À créer |
| Statistiques données | ❌ Manque | ⚠️ À créer |

**Score: 3/5 (60%)**

---

### Page 📊 État des lieux et profil

| Fonctionnalité Streamlit | Endpoint Backend | Status |
|--------------------------|------------------|--------|
| `afficher_profil_client()` | `GET /api/data/profil` | ✅ Existe |
| `afficher_profil_energetique_synthetique()` | `GET /api/data/profil` | ✅ Existe |
| `afficher_profil_consommation()` | `GET /api/data/profil` | ✅ Existe |
| Sélection année | Query param `?year=` | ✅ Existe |
| `generer_tableau_synthese()` | `GET /api/data/synthese?year=` | ✅ Existe |
| `afficher_graphiques_synthese()` | `GET /api/data/graphiques?year=` | ✅ Existe |

**Score: 6/6 (100%)** ✅ COMPLET

---

### Page 💰 Reconstitution de la facture

| Fonctionnalité Streamlit | Endpoint Backend | Status |
|--------------------------|------------------|--------|
| `afficher_refacturation()` | `GET /api/refacturation?year=` | ✅ Existe |
| Comparaison factures | Inclus dans endpoint | ✅ Existe |
| Détection gaps | Inclus dans endpoint | ✅ Existe |
| Métriques (total, %) | Inclus dans endpoint | ✅ Existe |

**Score: 4/4 (100%)** ✅ COMPLET

---

### Page 🔄 Optimisation et Projection

| Fonctionnalité Streamlit | Endpoint Backend | Status |
|--------------------------|------------------|--------|
| Sélection année N dynamique | ❌ Manque | ⚠️ À créer |
| Liste années disponibles | ❌ Manque | ⚠️ À créer |
| **SECTION 1: Optimisation N** | | |
| Config actuelle année N | `GET /config-actuelle` (hardcoded 2025) | ⚠️ À modifier |
| Optimisation année N | `POST /simulate` (hardcoded 2025) | ⚠️ À modifier |
| Comparaison actuel vs optimisé | Inclus dans simulate | ⚠️ À modifier |
| **SECTION 2: Projection N+1** | | |
| Projection coûts N+1 | ❌ Manque | ❌ À créer |
| Comparaison N vs N+1 | ❌ Manque | ❌ À créer |
| **SECTION 3: Optimisation N+1** | | |
| Optimisation projection N+1 | ❌ Manque | ❌ À créer |
| Comparaison projection actuelle vs optimisée | ❌ Manque | ❌ À créer |
| **SECTION 4: Tableau comparatif** | | |
| 4 scénarios comparés | ❌ Manque | ❌ À créer |
| Graphique comparaison | ❌ Manque | ❌ À créer |

**Score: 2/12 (17%)** ❌ TRÈS INCOMPLET

---

### Page 🎯 Simulateur de tarifs

| Fonctionnalité Streamlit | Endpoint Backend | Status |
|--------------------------|------------------|--------|
| **SECTION 1: Tableau tarifs** | | |
| `construire_tableau_tarifs_complet()` | `GET /tableau-tarifs?annee=` | ✅ Existe |
| **SECTION 2: Simulation simple** | | |
| `detecter_type_et_plage()` | `POST /simulate` | ✅ Existe |
| `obtenir_tarifs_pour_simulation()` | Inclus dans simulate | ✅ Existe |
| **SECTION 3: Simulation détaillée** | | |
| Simulation avec données réelles | ❌ Manque | ⚠️ À créer |
| Tableau mensuel détaillé | ❌ Manque | ⚠️ À créer |
| Comparaison actuel vs simulation | ❌ Manque | ⚠️ À créer |

**Score: 2/5 (40%)**

---

### Page 📄 Documentation

| Fonctionnalité Streamlit | Endpoint Backend | Status |
|--------------------------|------------------|--------|
| Documentation statique | N/A (frontend) | N/A |

**Score: N/A**

---

## 🔍 PROBLÈMES IDENTIFIÉS

### Problème 1: Année hardcodée dans optimisation ⚠️
**Fichier:** `app/optimisation/router.py`
**Lignes:** 42, 101

```python
# ACTUEL (MAUVAIS):
df_2025 = df[df['READING_DATE'].dt.year == 2025].copy()

# DEVRAIT ÊTRE:
df_year = df[df['READING_DATE'].dt.year == year].copy()
```

**Impact:** Ne peut pas optimiser pour 2023, 2024, 2026, etc.

---

### Problème 2: Modules manquants dans backend ❌

**Modules présents dans Streamlit mais absents dans backend:**
- `optimisation.py` (root) - Fonctions d'optimisation
- `analyse_gap.py` (root) - Analyse des écarts

**Impact:** Logique métier incomplète dans backend

---

### Problème 3: synthese.py sans correction dynamique ⚠️

**Fichier:** `app/core/synthese.py`
**Problème:** N'a PAS la correction des colonnes dynamiques (col_projection, col_optimisation)

**Référence:** La version root `synthese.py` a été corrigée (lignes 385-401)

**Impact:** Plantage si colonnes dynamiques utilisées

---

### Problème 4: Endpoint full-analysis manquant ❌

**Page:** Optimisation et Projection
**Besoin:** Un seul endpoint qui retourne les 4 sections

**Actuellement:** Faudrait faire 4+ requêtes différentes pour avoir toutes les infos

**Impact:** Performance médiocre, complexité frontend

---

### Problème 5: Simulation détaillée manquante ⚠️

**Page:** Simulateur
**Section 3:** Simulation avec données réelles chargées

**Actuellement:** Seulement simulation théorique (section 2)

**Impact:** Fonctionnalité incomplète

---

## 📋 ENDPOINTS À CRÉER/MODIFIER

### À CRÉER (nouveaux endpoints):

1. **`GET /api/data/dashboard`**
   - Retourne tableau dashboard multi-services
   - Équivalent: `st.session_state['tableau_dashboard']`

2. **`GET /api/data/stats`**
   - Statistiques des données uploadées
   - Équivalent: `afficher_statistiques_donnees()`

3. **`GET /api/optimisation/annees-disponibles`**
   - Liste des années dans les données
   - Simple extraction des années uniques

4. **`GET /api/optimisation/full-analysis?annee_N={year}`**
   - **LE GROS MORCEAU**
   - Retourne les 4 sections complètes
   - Structure détaillée nécessaire (voir schéma ci-dessous)

5. **`POST /api/simulateur/simulate-detailed`**
   - Simulation détaillée avec données réelles
   - Tableau mensuel comparatif

---

### À MODIFIER (endpoints existants):

1. **`GET /api/optimisation/config-actuelle`**
   - Ajouter paramètre `?year={year}`
   - Remplacer hardcoded 2025

2. **`POST /api/optimisation/simulate`**
   - Ajouter `year` dans request body
   - Remplacer hardcoded 2025
   - Support année dynamique

---

## 📊 STRUCTURE ENDPOINT FULL-ANALYSIS

```json
GET /api/optimisation/full-analysis?annee_N=2025

Response:
{
  "annee_N": 2025,
  "annee_N_plus_1": 2026,

  "section_1_optimisation_N": {
    "annee": 2025,
    "configuration_actuelle": {
      "puissance": 3200,
      "type": 11,
      "cout_annuel": 1873655031,
      "nb_depassements": 9
    },
    "configuration_optimisee": {
      "puissance": 4500,
      "type": 11,
      "cout_annuel": 1650000000,
      "nb_depassements": 0
    },
    "economies": {
      "montant": 223655031,
      "pourcentage": 11.93
    },
    "tableau_mensuel": [
      {
        "mois": "Janvier",
        "conso": 1234567,
        "facture_actuelle": 156789012,
        "facture_optimisee": 145678901,
        "economie": 11110111
      },
      // ... 11 autres mois
    ]
  },

  "section_2_projection_N_plus_1": {
    "annee": 2026,
    "puissance_utilisee": 3200,
    "type": 11,
    "cout_N": 1873655031,
    "cout_projection_N_plus_1": 1920000000,
    "variation": {
      "montant": 46344969,
      "pourcentage": 2.47
    },
    "tableau_mensuel": [
      {
        "mois": "Janvier",
        "facture_N": 156789012,
        "facture_projection_N_plus_1": 164627863,
        "variation": 7838851
      },
      // ... 11 autres mois
    ]
  },

  "section_3_optimisation_N_plus_1": {
    "annee": 2026,
    "configuration_actuelle": {
      "puissance": 3200,
      "cout_projection": 1920000000
    },
    "configuration_optimisee": {
      "puissance": 4500,
      "cout_projection": 1700000000
    },
    "economies": {
      "montant": 220000000,
      "pourcentage": 11.46
    },
    "tableau_mensuel": [
      // ...
    ]
  },

  "section_4_tableau_comparatif": {
    "scenarios": [
      {
        "nom": "2025 - Configuration actuelle",
        "annee": 2025,
        "puissance": 3200,
        "type": 11,
        "cout": 1873655031,
        "ecart_vs_ref": 0,
        "pourcentage_vs_ref": 0
      },
      {
        "nom": "2025 - Optimisation",
        "annee": 2025,
        "puissance": 4500,
        "type": 11,
        "cout": 1650000000,
        "ecart_vs_ref": -223655031,
        "pourcentage_vs_ref": -11.93
      },
      {
        "nom": "2026 - Projection (puissance actuelle)",
        "annee": 2026,
        "puissance": 3200,
        "type": 11,
        "cout": 1920000000,
        "ecart_vs_ref": 46344969,
        "pourcentage_vs_ref": 2.47
      },
      {
        "nom": "2026 - Optimisation (puissance optimisée)",
        "annee": 2026,
        "puissance": 4500,
        "type": 11,
        "cout": 1700000000,
        "ecart_vs_ref": -173655031,
        "pourcentage_vs_ref": -9.27
      }
    ]
  }
}
```

---

## 🔄 MODULES À COPIER/ADAPTER

### 1. Copier `optimisation.py` → `app/core/optimisation.py`
**Fonctions nécessaires:**
- `optimiser_puissance()`
- Autres fonctions d'optimisation

### 2. Copier `analyse_gap.py` → `app/core/analyse_gap.py`
**Fonctions nécessaires:**
- Fonctions d'analyse des écarts
- (Vérifier si déjà dans calculs.py)

### 3. Mettre à jour `app/core/synthese.py`
**Copier la correction dynamique depuis root `synthese.py`:**
- Lignes 385-401: détection dynamique colonnes projection
- Lignes 505-521: détection dynamique colonnes optimisation

---

## 📈 SCORE GLOBAL

| Module | Complétion | Endpoints Manquants |
|--------|-----------|---------------------|
| Auth | 100% ✅ | 0 |
| Data (Accueil) | 60% ⚠️ | 2 |
| Data (État des lieux) | 100% ✅ | 0 |
| Refacturation | 100% ✅ | 0 |
| Optimisation | 17% ❌ | 3 |
| Simulateur | 40% ⚠️ | 1 |
| **TOTAL** | **62%** | **6 endpoints** |

---

## 🎯 PRIORITÉS D'IMPLÉMENTATION

### PRIORITÉ 1: CRITIQUE (bloquant) 🔴
1. Corriger année hardcodée dans optimisation (2 endpoints)
2. Créer endpoint `/full-analysis` (le plus gros travail)
3. Copier modules manquants (optimisation.py, corriger synthese.py)

### PRIORITÉ 2: IMPORTANT (fonctionnalité incomplète) 🟠
4. Créer endpoint `/dashboard` (multi-services)
5. Créer endpoint `/simulate-detailed` (simulateur section 3)

### PRIORITÉ 3: NICE TO HAVE (amélioration) 🟡
6. Créer endpoint `/stats` (statistiques données)
7. Créer endpoint `/annees-disponibles` (liste années)

---

## ✅ PROCHAINES ÉTAPES

1. ✅ **PHASE 2 TERMINÉE** - Vérification complète
2. 🔜 **PHASE 3** - Détailler l'implémentation endpoint par endpoint
3. 🔜 **PHASE 4** - Implémenter les corrections/ajouts
4. 🔜 **PHASE 5** - Tests avec données réelles
5. 🔜 **PHASE 6** - Documentation API finale

---

**Document créé le:** 2026-01-17
**Auteur:** Analyse automatisée backend
**Basé sur:** Code Streamlit actuel vs Backend existant
