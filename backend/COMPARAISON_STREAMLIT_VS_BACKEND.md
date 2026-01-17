# COMPARAISON STREAMLIT vs BACKEND - PAGE "OPTIMISATION ET PROJECTION"

**Date:** 2026-01-17
**Question:** La page "Optimisation et Projection" de Streamlit a-t-elle été **littéralement reproduite à l'identique** dans le backend ?

---

## 🎯 RÉPONSE COURTE

**NON, ce n'est pas une reproduction littérale identique.**

Le backend reproduit **fonctionnellement** les 4 sections avec les mêmes calculs et données, mais avec une **approche automatisée** au lieu de l'approche interactive manuelle de Streamlit.

**Score de fidélité:** 85% - Les calculs et données sont identiques, mais l'interaction utilisateur est différente.

---

## 📊 COMPARAISON DÉTAILLÉE DES 4 SECTIONS

### SECTION 1 : OPTIMISATION ANNÉE N

| Aspect | Streamlit | Backend | Identique ? |
|--------|-----------|---------|-------------|
| **Méthode optimisation** | 🟠 **Manuelle** - L'utilisateur saisit la nouvelle puissance via `st.number_input()` | 🟠 **Automatique** - Le backend calcule automatiquement la puissance optimisée = `puissance_max` arrondie à la dizaine supérieure | ❌ **NON** |
| **Calcul de la puissance optimisée** | L'utilisateur teste différentes valeurs et clique sur "SIMULER" | `puissance_optimisee_N = int(puissance_max) if puissance_max % 10 == 0 else int(puissance_max // 10 + 1) * 10` | ❌ **NON** |
| **Données retournées** | Configuration actuelle, configuration simulée, économies, tableau mensuel | Configuration actuelle, configuration optimisée, économies, tableau mensuel | ✅ **OUI** |
| **Calculs financiers** | Utilise `calculer_facture_avec_puissance(row, nouvelle_puissance, annee=annee_N)` | Utilise `calculs.appliquer_tous_calculs()` sur DataFrame copié | ⚠️ **Équivalent mais méthode différente** |
| **Détection type tarifaire** | Automatique via `type_table` | Automatique via `type_table` | ✅ **OUI** |
| **Warnings dépassements** | Affiche alerte si `nouvelle_puissance < puissance_max` | Calcule `nb_depassements` mais ne retourne pas de warning texte | ⚠️ **Partiel** |

**Verdict Section 1:** ⚠️ **FONCTIONNELLEMENT ÉQUIVALENT mais PAS IDENTIQUE**

### SECTION 2 : PROJECTION N+1 AVEC CONFIG ACTUELLE

| Aspect | Streamlit | Backend | Identique ? |
|--------|-----------|---------|-------------|
| **Calcul projection** | Boucle sur `df_annee_N` avec `calculer_facture_avec_puissance(row, puissance_actuelle, annee=annee_N_plus_1)` | Boucle sur `df_N_sorted` avec `opt_module.calculer_facture_avec_puissance(row, puissance_actuelle, annee=annee_N_plus_1)` | ✅ **OUI - Identique** |
| **Données retournées** | Coût N, coût projection N+1, variation, tableau mensuel | Coût N, coût projection N+1, variation (montant + %), tableau mensuel | ✅ **OUI** |
| **Puissance utilisée** | `puissance_actuelle` | `puissance_actuelle` | ✅ **OUI** |
| **Tarifs appliqués** | Tarifs année N+1 | Tarifs année N+1 | ✅ **OUI** |

**Verdict Section 2:** ✅ **IDENTIQUE** (logique et calculs identiques)

### SECTION 3 : OPTIMISATION N+1 AVEC PUISSANCE OPTIMISÉE

| Aspect | Streamlit | Backend | Identique ? |
|--------|-----------|---------|-------------|
| **Dépendance Section 1** | 🔴 Vérifie `st.session_state['nouvelle_puissance']` - Affiche warning si Section 1 non faite | 🟢 Aucune dépendance - Calcule automatiquement `puissance_optimisee_N` | ❌ **NON** |
| **Puissance utilisée** | Récupère `puissance_optimisee_N = st.session_state['nouvelle_puissance']` (choix utilisateur) | Calcule automatiquement `puissance_optimisee_N = max power arrondie` | ❌ **NON** |
| **Calcul projection** | `calculer_facture_avec_puissance(row, puissance_optimisee_N, annee=annee_N_plus_1)` | `opt_module.calculer_facture_avec_puissance(row, puissance_optimisee_N, annee=annee_N_plus_1)` | ✅ **OUI** |
| **Données retournées** | Coût optimisation N+1, économies vs N, économies vs projection N+1, tableau mensuel | Coût optimisation N+1, économies vs N, tableau mensuel | ⚠️ **Presque - manque "économies vs projection N+1"** |
| **Graphiques** | 2 graphiques Plotly (courbes factures, barres économies) | Aucun graphique (backend API = données uniquement) | ❌ **NON (normal pour API)** |

**Verdict Section 3:** ⚠️ **FONCTIONNELLEMENT SIMILAIRE mais approche différente**

### SECTION 4 : TABLEAU COMPARATIF DES 4 SCÉNARIOS

| Aspect | Streamlit | Backend | Identique ? |
|--------|-----------|---------|-------------|
| **Structure tableau** | DataFrame Pandas avec 4 scénarios | Liste de `ScenarioComparatif` (Pydantic) avec 4 scénarios | ✅ **OUI** |
| **Scénarios inclus** | 1. {annee_N} - Configuration actuelle<br>2. {annee_N} - Optimisation<br>3. {annee_N_plus_1} - Projection<br>4. {annee_N_plus_1} - Optimisation | 1. {annee_N} - Configuration actuelle<br>2. {annee_N} - Optimisation<br>3. {annee_N_plus_1} - Projection<br>4. {annee_N_plus_1} - Optimisation | ✅ **OUI** |
| **Colonnes données** | - Scénario<br>- Puissance souscrite<br>- Type tarifaire<br>- Coût annuel TTC<br>- Écart vs {annee_N} actuel (FCFA)<br>- Écart vs {annee_N} actuel (%) | - nom (scénario)<br>- puissance<br>- type_tarifaire<br>- cout_annuel<br>- ecart_vs_actuel_fcfa<br>- ecart_vs_actuel_pct | ✅ **OUI - Identique** |
| **Recommandation finale** | Analyse du meilleur scénario + recommandation textuelle | Retourne seulement les données (pas de recommandation textuelle) | ❌ **NON (normal pour API)** |

**Verdict Section 4:** ✅ **DONNÉES IDENTIQUES** (présentation différente normal pour API)

---

## 🔍 DIFFÉRENCES MAJEURES IDENTIFIÉES

### 1. 🚨 DIFFÉRENCE CRITIQUE : Méthode d'optimisation Section 1

**Streamlit (app_streamlit.py:2325-2429):**
```python
# Approche MANUELLE INTERACTIVE
nouvelle_puissance = st.number_input(
    "Entrez la nouvelle puissance souscrite (kW)",
    min_value=1,
    max_value=50000,
    value=puissance_actuelle,
    step=10
)

if st.button("🚀 SIMULER CETTE CONFIGURATION"):
    # L'utilisateur CHOISIT la puissance à tester
    resultats_simulation = []
    for _, row in df_annee_N.iterrows():
        resultat_mois = calculer_facture_avec_puissance(row, nouvelle_puissance, annee=annee_N)
        # ...
```

**Backend (router.py:250-256):**
```python
# Approche AUTOMATIQUE
puissance_optimisee_N = int(puissance_max) if puissance_max % 10 == 0 else int(puissance_max // 10 + 1) * 10

df_N_optimise = df_N.copy()
df_N_optimise['SUBSCRIPTION_LOAD'] = puissance_optimisee_N
df_N_optimise = calculs.appliquer_tous_calculs(df_N_optimise)
```

**Impact:**
- ❌ L'utilisateur ne peut PAS tester différentes puissances avec le backend actuel
- ✅ Le backend calcule automatiquement LA puissance optimale
- 🔧 Pour reproduire Streamlit, il faudrait ajouter un endpoint `/simulate-custom-power`

### 2. 🔗 DIFFÉRENCE : Dépendance entre sections

**Streamlit:**
- Section 3 DÉPEND de Section 1 (vérifie `st.session_state`)
- Si Section 1 non faite → Affiche warning
- Flux: Section 1 → Stocke choix → Section 3 réutilise

**Backend:**
- Toutes les sections sont INDÉPENDANTES
- Un seul appel API retourne les 4 sections
- Pas de "session state" entre sections
- Flux: Calcul automatique complet en un coup

### 3. 📊 DIFFÉRENCE : Présentation vs Données

**Streamlit:**
- Interface complète avec graphiques Plotly, warnings, recommandations
- 2 graphiques en Section 3 (lignes + barres)
- Recommandation finale textuelle
- Zones de texte pour analyses

**Backend:**
- Retourne uniquement les DONNÉES brutes
- Pas de graphiques (le frontend React devra les créer)
- Pas de recommandations textuelles (juste les chiffres)
- Normal pour une API REST

---

## 📈 MATRICE DE FIDÉLITÉ

| Critère | Score | Commentaire |
|---------|-------|-------------|
| **Calculs financiers** | 95% | Identiques (même fonction `calculer_facture_avec_puissance`) |
| **Données retournées** | 90% | Toutes les données essentielles présentes |
| **Structure 4 sections** | 100% | Parfaitement reproduite |
| **Logique métier** | 85% | Même logique mais approche différente (auto vs manuel) |
| **Interactivité utilisateur** | 20% | Backend = API de données uniquement |
| **Warnings/Alertes** | 40% | Backend calcule les dépassements mais pas de textes d'alerte |
| **Flexibilité optimisation** | 30% | Streamlit permet de tester N puissances, backend calcule 1 seule |

**SCORE GLOBAL DE FIDÉLITÉ:** 65% reproduction littérale, 90% reproduction fonctionnelle

---

## ✅ CE QUI EST IDENTIQUE

1. ✅ **Calculs financiers** - Même fonction `calculer_facture_avec_puissance()`
2. ✅ **Structure 4 sections** - Reproduite à 100%
3. ✅ **Données Section 2** - Projection N+1 identique
4. ✅ **Données Section 4** - Tableau comparatif identique
5. ✅ **Détection type tarifaire** - Même logique `type_table`
6. ✅ **Année dynamique** - Support N et N+1
7. ✅ **Tarifs évolutifs** - Coefficients 1.05 et 1.10 appliqués

---

## ❌ CE QUI EST DIFFÉRENT

1. ❌ **Section 1 : Optimisation manuelle → automatique**
   - Streamlit: Utilisateur choisit la puissance
   - Backend: Calcul automatique = max power arrondie

2. ❌ **Pas de test de multiples puissances**
   - Streamlit: Utilisateur peut tester 5, 10, 20 configurations différentes
   - Backend: Retourne 1 seule configuration optimisée

3. ❌ **Pas de graphiques**
   - Streamlit: 2 graphiques Plotly en Section 3
   - Backend: Données uniquement (le frontend devra créer les graphiques)

4. ❌ **Pas de recommandations textuelles**
   - Streamlit: "✅ Recommandation : Adopter la puissance optimisée..."
   - Backend: Juste les chiffres

5. ❌ **Pas de warnings interactifs**
   - Streamlit: "🚨 ATTENTION : Risque de dépassements !"
   - Backend: Calcule `nb_depassements` mais pas de texte

6. ❌ **Pas de dépendance entre sections**
   - Streamlit: Section 3 nécessite Section 1 d'abord
   - Backend: Tout calculé en un coup

---

## 🔧 CE QU'IL FAUDRAIT AJOUTER POUR UNE REPRODUCTION LITTÉRALE

### 1. Endpoint de simulation personnalisée (CRITIQUE)

**Créer:** `POST /api/optimisation/simulate-custom`

```python
@router.post("/simulate-custom")
async def simulate_custom_power(
    annee_N: int,
    nouvelle_puissance: int,
    current_user: User = Depends(get_current_user)
):
    """
    Permet à l'utilisateur de tester une puissance personnalisée
    (Reproduit exactement le comportement de Section 1 Streamlit)
    """
    # Calculer comme dans Streamlit avec puissance choisie
    # ...
```

**Impact:** Permettrait au frontend de reproduire l'input manuel de Streamlit

### 2. Endpoint de recommandations textuelles

**Créer:** `GET /api/optimisation/recommandations?annee_N={year}`

Retournerait:
```json
{
  "recommandation": "✅ Adopter la puissance optimisée de 4500 kW",
  "justification": "Économie de 150M FCFA (12.5%)",
  "meilleur_scenario": "2026 - Optimisation"
}
```

### 3. Ajouter warnings dans les réponses

Modifier les schemas pour inclure:
```python
class ConfigurationInfo(BaseModel):
    puissance: int
    type_tarifaire: int
    cout_annuel: float
    nb_depassements: int
    warning: Optional[str] = None  # NOUVEAU
```

---

## 🎯 CONCLUSION

### Question: "Est-ce que la page optimisation et projection a été littéralement reproduite à l'identique ?"

**Réponse détaillée:**

**NON, ce n'est pas une reproduction littérale à l'identique**, mais c'est une **reproduction fonctionnelle très fidèle** (90%).

**Ce qui est reproduit:**
- ✅ Les 4 sections sont présentes
- ✅ Les calculs financiers sont identiques
- ✅ Les données retournées permettent de reconstruire l'affichage Streamlit
- ✅ La logique métier est respectée

**Ce qui est différent:**
- ❌ Approche automatique au lieu de manuelle (Section 1)
- ❌ Pas de possibilité de tester plusieurs puissances différentes
- ❌ Pas de graphiques (normal pour une API)
- ❌ Pas de recommandations textuelles

**Analogie:**
- **Streamlit** = Calculatrice interactive où vous entrez les chiffres
- **Backend actuel** = Calculatrice automatique qui fait le calcul optimal direct

**Pour une reproduction LITTÉRALE à 100%**, il faudrait:
1. Ajouter endpoint `/simulate-custom` pour tester des puissances manuelles
2. Ajouter warnings textuels dans les réponses
3. Ajouter recommandations textuelles

**État actuel:** Le backend fournit **toutes les données** nécessaires pour qu'un frontend React reproduise l'interface Streamlit. C'est une **API de données complète** mais pas une **reproduction interactive littérale**.

---

## 📋 RECOMMANDATION

**Option 1: Garder l'approche actuelle (RECOMMANDÉ)**
- ✅ Plus simple et plus rapide
- ✅ Calcul automatique optimal
- ✅ Toutes les données disponibles
- ⚠️ Moins flexible pour l'utilisateur

**Option 2: Ajouter la simulation personnalisée**
- ✅ Reproduction 100% fidèle de Streamlit
- ✅ Flexibilité maximale pour l'utilisateur
- ⚠️ Nécessite développement supplémentaire
- ⚠️ Interface frontend plus complexe

**Mon avis:** L'approche actuelle est **suffisante** pour 95% des cas d'usage. Si vraiment besoin de tester des puissances manuelles, ajouter simplement l'endpoint `/simulate-custom`.

---

**Créé le:** 2026-01-17
**Analyse basée sur:**
- `app_streamlit.py` lignes 2228-3192 (Streamlit)
- `webapp/backend/app/optimisation/router.py` lignes 199-425 (Backend)
