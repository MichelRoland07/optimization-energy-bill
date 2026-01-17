# 🔍 COMPARAISON DÉTAILLÉE - PAGE 2 "ÉTAT DES LIEUX ET PROFIL"

**Date:** 2026-01-17
**Analyse approfondie:** Streamlit vs Backend

---

## 📋 STRUCTURE DE LA PAGE STREAMLIT

### Ordre d'affichage dans Streamlit

```
Page "📊 État des lieux et profil"
│
├── 1. afficher_profil_client(df)
│   └── Infos administratives (5 colonnes)
│
├── 2. afficher_profil_energetique_synthetique(df)
│   ├── Selectbox année
│   ├── Tableau profil énergétique (avec Cos φ si dispo)
│   └── 3 graphiques:
│       ├── Graph 1: Factures mensuelles (bar chart)
│       ├── Graph 2: Puissances (line chart)
│       └── Graph 3: Cos φ (si disponible)
│
├── 3. afficher_profil_consommation(df)
│   └── 2 graphiques multi-années:
│       ├── Graph 1: Consommation mensuelle 3 ans (multi-lignes)
│       └── Graph 2: Puissance atteinte 3 ans (multi-lignes)
│
└── 4. Tableaux de synthèse
    ├── Selectbox année
    ├── generer_tableau_synthese(df, annee, nom_client)
    └── afficher_graphiques_synthese(df, annee)
        ├── Graph 1: Consommation mensuelle
        ├── Graph 2: HC vs HP (stacked bars)
        ├── Graph 3: Puissance atteinte vs souscrite
        ├── Graph 4: Facturation & consommation (dual axis)
        └── Graph 5: Cos φ (si disponible)
```

---

## 🔍 ANALYSE DÉTAILLÉE FONCTION PAR FONCTION

### 1. `afficher_profil_client(df)` - Lignes 318-347

**Ce qui est affiché:**
```python
Col1: Nom du client (CUST_NAME)
Col2: N° de service (SERVICE_NO)
Col3: Région (REGION)
Col4: Division (DIVISION)
Col5: Agence (AGENCE)
```

**Backend:** `GET /api/data/profil`

**Données retournées:**
```json
{
  "infos_administratives": {
    "nom_client": "...",
    "service_no": "...",
    "region": "...",
    "division": "...",
    "agence": "..."
  }
}
```

**Verdict:** ✅ **100% IDENTIQUE**

---

### 2. `afficher_profil_energetique_synthetique(df)` - Lignes 350-615

**Ce qui est affiché:**

#### A. Tableau profil énergétique (année sélectionnée)

```python
# Puissance
Puissance souscrite: {puissance_souscrite} kW
Puissance max atteinte: {puissance_max} kW
Puissance min atteinte: {puissance_min} kW
Puissance moyenne: {puissance_moy:.0f} kW

# Type et tarifs
Type tarifaire: {type_tarif}
Plage horaire: {plage_horaire}
Intervalle: [{min_kw}, {max_kw}]
Catégorie: {categorie}
Tarif HC: {tarif_hc} FCFA/kWh
Tarif HP: {tarif_hp} FCFA/kWh
Prime fixe: {prime_fixe} FCFA/mois

# Consommation
Consommation max: {conso_max:,.0f} kWh
Consommation min: {conso_min:,.0f} kWh
Consommation moyenne: {conso_moy:.0f} kWh
HC moyenne: {conso_hc_moy:.0f} kWh
HP moyenne: {conso_hp_moy:.0f} kWh

# Cos φ (si disponible)
Cos φ moyen: {cosphi_moy:.3f}
Cos φ min: {cosphi_min:.3f}
Cos φ max: {cosphi_max:.3f}
Nb mois < 0.85: {nb_mois_penalite}
```

#### B. Graph 1: Factures mensuelles (lignes 460-498)
```python
Bar chart: AMOUNT_WITH_TAX par mois
```

#### C. Graph 2: Puissances (lignes 500-537)
```python
Line chart avec 2 lignes:
- PUISSANCE_ATTEINTE (bleu)
- SUBSCRIPTION_LOAD (rouge horizontal)
```

#### D. Graph 3: Cos φ (lignes 539-615) - si disponible
```python
Bar chart: COSPHI par mois
+ Ligne seuil 0.85
```

**Backend:** `GET /api/data/profil`

**Données retournées:**
```json
{
  "profil_energetique": {
    "puissance_souscrite": float,
    "puissance_max": float,
    "puissance_min": float,
    "puissance_moyenne": float,
    "consommation_max": float,
    "consommation_min": float,
    "consommation_moyenne": float,
    "ratio_hc": float,  // % HC
    "ratio_hp": float,  // % HP
    "cosphi": {
      "disponible": true,
      "moyen": float,
      "min": float,
      "max": float
    }
  }
}
```

**⚠️ CE QUI MANQUE DANS LE BACKEND:**

1. ❌ **Type tarifaire** (type_tarif, plage_horaire, intervalle, catégorie)
2. ❌ **Tarifs détaillés** (tarif_hc, tarif_hp, prime_fixe)
3. ❌ **Consommation HC moyenne** (conso_hc_moy en kWh)
4. ❌ **Consommation HP moyenne** (conso_hp_moy en kWh)
5. ❌ **Nb mois Cos φ < 0.85** (nb_mois_penalite)
6. ❌ **Données pour Graph 1** (factures mensuelles)
7. ❌ **Données pour Graph 2** (puissances mensuelles)
8. ❌ **Données pour Graph 3** (Cos φ mensuelles)

**Verdict:** ⚠️ **~40% - INCOMPLET**

---

### 3. `afficher_profil_consommation(df)` - Lignes 617-800

**Ce qui est affiché:**

#### Graph 1: Consommation 3 ans (lignes 636-676)
```python
Multi-line chart:
- 1 ligne par année (2025, 2024, 2023)
- X: Mois (1-12)
- Y: MV_CONSUMPTION
```

#### Graph 2: Puissance 3 ans (lignes 678-800)
```python
Multi-line chart:
- 1 ligne par année (2025, 2024, 2023)
- X: Mois (1-12)
- Y: PUISSANCE_ATTEINTE
```

**Backend:** `GET /api/data/profil`

**Données retournées:**
```json
{
  "profil_consommation": {
    "annees": [2025, 2024, 2023],
    "series": [
      {
        "annee": 2025,
        "mois": [1, 2, 3, ...],
        "consommation": [150000, 160000, ...]
      },
      {
        "annee": 2024,
        "mois": [1, 2, 3, ...],
        "consommation": [145000, 155000, ...]
      }
    ]
  }
}
```

**⚠️ CE QUI MANQUE:**

1. ❌ **Données puissance atteinte** pour le Graph 2 multi-années

**Verdict:** ⚠️ **~50% - INCOMPLET** (données consommation OK, puissance manquante)

---

### 4. Tableaux de synthèse + Graphiques - Lignes 2196-2212

**Ce qui est affiché:**

#### A. Tableau synthèse (fonction externe)
```python
synthese.generer_tableau_synthese(df, annee, nom_client)
```

#### B. Graphiques synthèse (lignes 1220-1425)

**5 graphiques au total:**

1. **Graph 1:** Consommation mensuelle (line+markers)
2. **Graph 2:** HC vs HP (stacked bars)
3. **Graph 3:** Puissance atteinte vs souscrite (dual lines)
4. **Graph 4:** Facturation & Consommation (dual axis, bar+line)
5. **Graph 5:** Cos φ (bars + seuil)

**Backend:** `GET /api/data/synthese?year={year}` + `GET /api/data/graphiques?year={year}`

**`/synthese?year=2025`:**
```json
{
  "year": 2025,
  "nom_client": "...",
  "service_no": "...",
  "tableau": [...]  // Tableau synthèse
}
```

**`/graphiques?year=2025`:**
```json
{
  "year": 2025,
  "consommation_mensuelle": {...},      // Graph 1 ✅
  "heures_creuses_pointe": {...},       // Graph 2 ✅
  "puissance": {...},                   // Graph 3 ✅
  "facturation_consommation": {...},    // Graph 4 ✅
  "cosphi": {...},                      // Graph 5 ✅
  "metriques": {...}
}
```

**Verdict:** ✅ **100% COMPLET**

---

## 📊 SYNTHÈSE COMPARATIVE

| Élément Streamlit | Endpoint Backend | Données Retournées | Status |
|-------------------|------------------|-------------------|--------|
| **1. Profil client** | `/profil` | Infos admin (5 champs) | ✅ 100% |
| **2. Profil énergétique** | `/profil` | Puissance min/max/moy, Conso min/max/moy, Ratios HC/HP, Cos φ stats | ⚠️ 40% |
| **3. Profil consommation** | `/profil` | Séries multi-années consommation | ⚠️ 50% |
| **4. Tableau synthèse** | `/synthese?year=X` | Tableau complet | ✅ 100% |
| **5. Graphiques synthèse** | `/graphiques?year=X` | 5 graphiques complets | ✅ 100% |

**SCORE GLOBAL PAGE 2: ~70%**

---

## ❌ CE QUI MANQUE DANS LE BACKEND

### Dans `/profil` - Profil énergétique

#### 1. Type tarifaire et métadonnées
```python
# À AJOUTER dans profil_energetique
"type_tarifaire": int,
"plage_horaire": str,
"intervalle_min": float,
"intervalle_max": float,
"categorie": str
```

#### 2. Tarifs détaillés
```python
# À AJOUTER dans profil_energetique
"tarifs": {
    "tarif_hc": float,
    "tarif_hp": float,
    "prime_fixe": float
}
```

#### 3. Consommations HC/HP moyennes
```python
# À AJOUTER dans profil_energetique
"consommation_hc_moyenne": float,  // kWh HC moyen par mois
"consommation_hp_moyenne": float   // kWh HP moyen par mois
```

#### 4. Stats Cos φ enrichies
```python
# À AJOUTER dans profil_energetique.cosphi
"nb_mois_sous_seuil": int  // Nombre de mois < 0.85
```

#### 5. Données graphiques mensuelles
```python
# NOUVEAU endpoint ou ajout dans /profil
"graphiques_profil_energetique": {
    "factures_mensuelles": {
        "mois": ["Jan", "Fév", ...],
        "factures": [125000000, 130000000, ...]
    },
    "puissances_mensuelles": {
        "mois": ["Jan", "Fév", ...],
        "puissance_atteinte": [4800, 5200, ...],
        "puissance_souscrite": [5000, 5000, ...]
    },
    "cosphi_mensuelles": {  // si disponible
        "mois": ["Jan", "Fév", ...],
        "cosphi": [0.92, 0.88, ...],
        "seuil": 0.85
    }
}
```

### Dans `/profil` - Profil consommation multi-années

#### 6. Données puissance multi-années
```python
# À AJOUTER dans profil_consommation
"series_puissance": [
    {
        "annee": 2025,
        "mois": [1, 2, 3, ...],
        "puissance_atteinte": [4800, 5200, ...]
    },
    {
        "annee": 2024,
        "mois": [1, 2, 3, ...],
        "puissance_atteinte": [4700, 5100, ...]
    }
]
```

---

## ✅ PLAN D'ACTION POUR REPRODUCTION 100%

### Modifications nécessaires

**Fichier:** `app/data/router.py` - Endpoint `/profil`

#### Étape 1: Ajouter type tarifaire et tarifs

```python
# Dans get_profil_client()

# Calculer type tarifaire
from ..core.config import type_table
from ..optimisation.router import calculer_tarifs_detailles

puissance_souscrite = float(df['SUBSCRIPTION_LOAD'].iloc[0])

# Détection type
row_type = type_table[
    (type_table['min'] <= puissance_souscrite) &
    (puissance_souscrite < type_table['max'])
]

if not row_type.empty:
    type_tarifaire = int(row_type['type'].values[0])
    intervalle_min = float(row_type['min'].values[0])
    intervalle_max = float(row_type['max'].values[0])
else:
    type_tarifaire = 0
    intervalle_min = 0.0
    intervalle_max = 0.0

# Catégorie
categorie = "Petit client" if puissance_souscrite < 3000 else "Gros client"

# Plage horaire (>400h par défaut comme dans optimisation)
plage_horaire = ">400h"

# Obtenir année récente pour tarifs
annee_recente = int(df['READING_DATE'].max().year)

# Calculer tarifs
tarifs_info = calculer_tarifs_detailles(puissance_souscrite, annee_recente)
```

#### Étape 2: Ajouter consommations HC/HP moyennes

```python
# HC/HP moyennes en kWh
total_hc = (df['ACTIVE_OFF_PEAK_IMP'] + df['ACTIVE_OFF_PEAK_EXP'])
total_hp = (df['ACTIVE_PEAK_IMP'] + df['ACTIVE_PEAK_EXP'])

conso_hc_moyenne = float(total_hc.mean())
conso_hp_moyenne = float(total_hp.mean())
```

#### Étape 3: Enrichir stats Cos φ

```python
if 'COSPHI' in df.columns:
    cosphi_data = {
        "disponible": True,
        "moyen": float(df['COSPHI'].mean()),
        "min": float(df['COSPHI'].min()),
        "max": float(df['COSPHI'].max()),
        "nb_mois_sous_seuil": int((df['COSPHI'] < 0.85).sum())  // AJOUTER
    }
```

#### Étape 4: Ajouter données graphiques profil énergétique

**Option A:** Ajouter dans `/profil`
**Option B:** Créer nouveau endpoint `/profil-graphiques?year={year}`

```python
# Données pour les 3 graphiques
graphiques_profil_energetique = {
    "factures_mensuelles": {
        "mois": mois_noms,
        "factures": df_year['AMOUNT_WITH_TAX'].tolist()
    },
    "puissances_mensuelles": {
        "mois": mois_noms,
        "puissance_atteinte": df_year['PUISSANCE_ATTEINTE'].tolist(),
        "puissance_souscrite": df_year['SUBSCRIPTION_LOAD'].tolist()
    },
    "cosphi_mensuelles": {
        "mois": mois_noms,
        "cosphi": df_year['COSPHI'].tolist() if 'COSPHI' in df_year else None,
        "seuil": 0.85
    } if 'COSPHI' in df_year else None
}
```

#### Étape 5: Ajouter séries puissance multi-années

```python
# Dans profil_consommation
series_puissance = []
for annee in annees:
    df_annee = df_sorted[df_sorted['READING_DATE'].dt.year == annee]
    series_puissance.append({
        "annee": int(annee),
        "mois": df_annee['READING_DATE'].dt.month.tolist(),
        "puissance_atteinte": df_annee['PUISSANCE_ATTEINTE'].tolist(),
    })

profil_consommation = {
    "annees": [int(a) for a in annees],
    "series": series_par_annee,
    "series_puissance": series_puissance  // AJOUTER
}
```

---

## 📝 MODIFICATIONS SCHEMAS

**Fichier:** `app/data/schemas.py`

```python
class ProfilEnergetique(BaseModel):
    puissance_souscrite: float
    puissance_max: float
    puissance_min: float
    puissance_moyenne: float
    consommation_max: float
    consommation_min: float
    consommation_moyenne: float
    ratio_hc: float
    ratio_hp: float
    # ✅ AJOUTER
    consommation_hc_moyenne: float
    consommation_hp_moyenne: float
    type_tarifaire: int
    plage_horaire: str
    intervalle_min: float
    intervalle_max: float
    categorie: str
    tarifs: TarifsInfo  # Importer de optimisation.schemas
    cosphi: Optional[dict]

class GraphiquesFacettesResponse(BaseModel):  # NOUVEAU
    factures_mensuelles: dict
    puissances_mensuelles: dict
    cosphi_mensuelles: Optional[dict]

class ProfilConsommation(BaseModel):
    annees: List[int]
    series: List[dict]
    series_puissance: List[dict]  # ✅ AJOUTER

class ProfilClientResponse(BaseModel):
    infos_administratives: dict
    profil_energetique: ProfilEnergetique  # Modifié
    profil_consommation: ProfilConsommation  # Modifié
    graphiques_profil_energetique: Optional[GraphiquesFacettesResponse]  # ✅ AJOUTER
```

---

## ⏱️ ESTIMATION TEMPS

| Modification | Temps estimé |
|--------------|--------------|
| Étape 1: Type tarifaire + tarifs | 15 min |
| Étape 2: Conso HC/HP moyennes | 5 min |
| Étape 3: Stats Cos φ enrichies | 5 min |
| Étape 4: Graphiques profil énergétique | 20 min |
| Étape 5: Séries puissance multi-années | 10 min |
| Modifications schemas | 10 min |
| Tests | 15 min |
| **TOTAL** | **~1h20** |

---

## ✅ CONCLUSION

### Question:
> "regarde bien la page etats des lieux et profil et tu me dis si le backend qui y est dedie fait exactement ce que streamlit fait ?"

### Réponse:

# ⚠️ **NON - REPRODUCTION ~70%**

**Ce qui fonctionne (30%):**
- ✅ Infos administratives (100%)
- ✅ Stats de base puissance/conso (100%)
- ✅ Tableau synthèse (100%)
- ✅ 5 graphiques synthèse annuels (100%)
- ✅ Profil consommation 3 ans (50% - manque puissance)

**Ce qui manque (30%):**
- ❌ Type tarifaire et métadonnées
- ❌ Tarifs détaillés (HC, HP, PF)
- ❌ Consommations HC/HP moyennes
- ❌ Stat Cos φ nb mois < 0.85
- ❌ 3 graphiques profil énergétique (factures, puissances, cos φ)
- ❌ Séries puissance multi-années

**Temps pour atteindre 100%:** ~1h20

**Voulez-vous que je fasse ces modifications maintenant ?**

---

**Créé le:** 2026-01-17
**Status actuel:** ⚠️ **70% reproduction**
**Action:** Compléter endpoint `/profil`
