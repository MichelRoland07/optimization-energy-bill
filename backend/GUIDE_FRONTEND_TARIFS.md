# 📘 GUIDE FRONTEND - UTILISATION DES TARIFS DÉTAILLÉS

**Date:** 2026-01-17
**Objectif:** Guide pour le développeur frontend sur l'utilisation des nouveaux champs de tarifs
**Backend API:** `/api/optimisation/full-analysis`

---

## 🎯 NOUVEAUX CHAMPS DISPONIBLES

Le backend retourne maintenant **TOUS** les détails tarifaires pour reproduire exactement l'affichage Streamlit.

### Structure `TarifsInfo` (nouveau)

```typescript
interface TarifsInfo {
  tarif_hc: number;        // Tarif Heures Creuses (FCFA/kWh)
  tarif_hp: number;        // Tarif Heures Pleines (FCFA/kWh)
  prime_fixe: number;      // Prime Fixe mensuelle (FCFA)
  plage_horaire: string;   // "0-200h", "201-400h", ">400h", "0-400h"
  intervalle_min: number;  // Puissance min pour ce type (kW)
  intervalle_max: number;  // Puissance max pour ce type (kW)
  categorie: string;       // "Petit client" ou "Gros client"
}
```

---

## 📍 OÙ TROUVER LES TARIFS DANS LA RÉPONSE API

### Section 1: Optimisation année N

```json
{
  "section_1_optimisation_N": {
    "annee": 2025,
    "configuration_actuelle": {
      "puissance": 5000,
      "type_tarifaire": 9,
      "cout_annuel": 1500000000,
      "nb_depassements": 3,
      "tarifs": {  // ✅ NOUVEAU
        "tarif_hc": 29.04,
        "tarif_hp": 29.04,
        "prime_fixe": 11132.0,
        "plage_horaire": ">400h",
        "intervalle_min": 5000.0,
        "intervalle_max": 6000.0,
        "categorie": "Gros client"
      },
      "variation_vs_actuel": 0  // ✅ NOUVEAU
    },
    "configuration_optimisee": {
      "puissance": 4200,
      "type_tarifaire": 8,
      "cout_annuel": 1350000000,
      "nb_depassements": 5,
      "tarifs": {  // ✅ NOUVEAU
        "tarif_hc": 36.3,
        "tarif_hp": 36.3,
        "prime_fixe": 10648.0,
        "plage_horaire": ">400h",
        "intervalle_min": 4000.0,
        "intervalle_max": 5000.0,
        "categorie": "Gros client"
      },
      "variation_vs_actuel": -800  // ✅ NOUVEAU (4200 - 5000 = -800 kW)
    },
    "economies": {...},
    "warning": "🚨 ATTENTION : Risque de dépassements !...",  // Afficher tel quel
    "tableau_mensuel": [...]
  }
}
```

**À afficher dans Section 1:**
1. Bloc "Configuration actuelle" avec `configuration_actuelle.tarifs`
2. Bloc "Tarifs appliqués (actuel)" → même objet
3. Bloc "Nouvelle puissance testée" avec `configuration_optimisee`
4. Bloc "Type détecté" avec intervalle `[intervalle_min, intervalle_max]`
5. Bloc "Variation" avec `variation_vs_actuel` (ex: "-800 kW")
6. Bloc "Tarifs appliqués (nouvelle)" avec `configuration_optimisee.tarifs`
7. Warning textuel si présent

### Section 2: Projection N+1

```json
{
  "section_2_projection_N_plus_1": {
    "annee": 2026,
    "puissance_utilisee": 5000,
    "type_tarifaire": 9,
    "cout_N": 1500000000,
    "cout_projection_N_plus_1": 1650000000,
    "variation": {
      "montant": 150000000,
      "pourcentage": 10.0
    },
    "tarifs_appliques": {  // ✅ NOUVEAU - Tarifs N+1 pour puissance actuelle
      "tarif_hc": 31.944,
      "tarif_hp": 31.944,
      "prime_fixe": 12245.2,
      "plage_horaire": ">400h",
      "intervalle_min": 5000.0,
      "intervalle_max": 6000.0,
      "categorie": "Gros client"
    },
    "tableau_mensuel": [...]
  }
}
```

**À afficher dans Section 2:**
1. Bloc "Projection financière N+1" avec coûts et variation
2. Bloc "Tarifs appliqués N+1" avec `tarifs_appliques` (année N+1, puissance actuelle)

### Section 3: Optimisation N+1

```json
{
  "section_3_optimisation_N_plus_1": {
    "annee": 2026,
    "configuration_actuelle_projection": {
      "puissance": 5000,
      "cout": 1650000000
    },
    "configuration_optimisee_projection": {
      "puissance": 4200,
      "cout": 1485000000
    },
    "economies": {
      "montant": 165000000,
      "pourcentage": 10.0
    },
    "tarifs_appliques": {  // ✅ NOUVEAU - Tarifs N+1 pour puissance optimisée
      "tarif_hc": 39.93,
      "tarif_hp": 39.93,
      "prime_fixe": 11712.8,
      "plage_horaire": ">400h",
      "intervalle_min": 4000.0,
      "intervalle_max": 5000.0,
      "categorie": "Gros client"
    },
    "tableau_mensuel": [...]
  }
}
```

**À afficher dans Section 3:**
1. Bloc "Projection financière optimisée N+1" avec coûts et économies
2. Bloc "Tarifs appliqués (puissance optimisée, année N+1)" avec `tarifs_appliques`

---

## 💡 EXEMPLES DE CODE FRONTEND

### React/TypeScript - Affichage Section 1

```typescript
interface Section1Props {
  data: Section1OptimisationN;
}

const Section1Display: React.FC<Section1Props> = ({ data }) => {
  const { configuration_actuelle, configuration_optimisee, warning, economies } = data;

  return (
    <div className="section-1">
      <h2>Section 1 - Optimisation année {data.annee}</h2>

      {/* Configuration actuelle */}
      <div className="config-box">
        <h3>Configuration actuelle</h3>
        <p>Puissance souscrite: {configuration_actuelle.puissance} kW</p>
        <p>Type tarifaire: {configuration_actuelle.type_tarifaire}</p>
        <p>Coût annuel: {(configuration_actuelle.cout_annuel / 1e6).toFixed(2)}M FCFA</p>
        <p>Dépassements: {configuration_actuelle.nb_depassements} mois</p>
      </div>

      {/* NOUVEAU - Tarifs appliqués (actuel) */}
      <div className="tarifs-box">
        <h4>Tarifs et primes appliqués (configuration actuelle)</h4>
        <table>
          <tbody>
            <tr>
              <td>Catégorie:</td>
              <td><strong>{configuration_actuelle.tarifs.categorie}</strong></td>
            </tr>
            <tr>
              <td>Plage horaire:</td>
              <td>{configuration_actuelle.tarifs.plage_horaire}</td>
            </tr>
            <tr>
              <td>Intervalle puissance:</td>
              <td>[{configuration_actuelle.tarifs.intervalle_min} - {configuration_actuelle.tarifs.intervalle_max}] kW</td>
            </tr>
            <tr>
              <td>Tarif Heures Creuses:</td>
              <td>{configuration_actuelle.tarifs.tarif_hc.toFixed(3)} FCFA/kWh</td>
            </tr>
            <tr>
              <td>Tarif Heures Pleines:</td>
              <td>{configuration_actuelle.tarifs.tarif_hp.toFixed(3)} FCFA/kWh</td>
            </tr>
            <tr>
              <td>Prime Fixe:</td>
              <td>{configuration_actuelle.tarifs.prime_fixe.toFixed(2)} FCFA/mois</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Configuration optimisée */}
      <div className="config-box">
        <h3>Nouvelle puissance à tester: {configuration_optimisee.puissance} kW</h3>
        <p>Type tarifaire détecté: {configuration_optimisee.type_tarifaire}</p>
        <p>Intervalle: [{configuration_optimisee.tarifs.intervalle_min} - {configuration_optimisee.tarifs.intervalle_max}] kW</p>

        {/* NOUVEAU - Variation */}
        {configuration_optimisee.variation_vs_actuel !== 0 && (
          <p className={configuration_optimisee.variation_vs_actuel < 0 ? "reduction" : "augmentation"}>
            Variation: {configuration_optimisee.variation_vs_actuel > 0 ? "+" : ""}
            {configuration_optimisee.variation_vs_actuel} kW
            {configuration_optimisee.variation_vs_actuel < 0 ? " (réduction)" : " (augmentation)"}
          </p>
        )}

        <p>Coût annuel: {(configuration_optimisee.cout_annuel / 1e6).toFixed(2)}M FCFA</p>
        <p>Dépassements: {configuration_optimisee.nb_depassements} mois</p>
      </div>

      {/* NOUVEAU - Tarifs appliqués (optimisé) */}
      <div className="tarifs-box">
        <h4>Tarifs et primes appliqués (puissance testée)</h4>
        <table>
          <tbody>
            <tr>
              <td>Catégorie:</td>
              <td><strong>{configuration_optimisee.tarifs.categorie}</strong></td>
            </tr>
            <tr>
              <td>Plage horaire:</td>
              <td>{configuration_optimisee.tarifs.plage_horaire}</td>
            </tr>
            <tr>
              <td>Tarif HC:</td>
              <td>{configuration_optimisee.tarifs.tarif_hc.toFixed(3)} FCFA/kWh</td>
            </tr>
            <tr>
              <td>Tarif HP:</td>
              <td>{configuration_optimisee.tarifs.tarif_hp.toFixed(3)} FCFA/kWh</td>
            </tr>
            <tr>
              <td>Prime Fixe:</td>
              <td>{configuration_optimisee.tarifs.prime_fixe.toFixed(2)} FCFA/mois</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Économies */}
      <div className="economies-box">
        <h4>Économies</h4>
        <p>Montant: {(economies.montant / 1e6).toFixed(2)}M FCFA</p>
        <p>Pourcentage: {economies.pourcentage.toFixed(2)}%</p>
      </div>

      {/* NOUVEAU - Warning textuel (afficher tel quel avec emojis) */}
      {warning && (
        <div className={warning.startsWith("🚨") ? "alert-danger" : "alert-success"}>
          {warning.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Vue.js - Affichage Section 2

```vue
<template>
  <div class="section-2">
    <h2>Section 2 - Projection {{ data.annee }}</h2>

    <!-- Projection financière -->
    <div class="projection-box">
      <h3>Projection financière N+1</h3>
      <p>Puissance utilisée: {{ data.puissance_utilisee }} kW (actuelle)</p>
      <p>Coût année N ({{ data.annee - 1 }}): {{ formatCurrency(data.cout_N) }}</p>
      <p>Coût projection N+1 ({{ data.annee }}): {{ formatCurrency(data.cout_projection_N_plus_1) }}</p>
      <p :class="data.variation.montant >= 0 ? 'augmentation' : 'reduction'">
        Variation: {{ formatCurrency(data.variation.montant) }}
        ({{ data.variation.pourcentage > 0 ? '+' : '' }}{{ data.variation.pourcentage.toFixed(1) }}%)
      </p>
    </div>

    <!-- NOUVEAU - Tarifs appliqués N+1 -->
    <div class="tarifs-box">
      <h4>Tarifs appliqués pour l'année {{ data.annee }} (puissance actuelle)</h4>
      <table>
        <tr>
          <td>Catégorie:</td>
          <td><strong>{{ data.tarifs_appliques.categorie }}</strong></td>
        </tr>
        <tr>
          <td>Plage horaire:</td>
          <td>{{ data.tarifs_appliques.plage_horaire }}</td>
        </tr>
        <tr>
          <td>Tarif Heures Creuses:</td>
          <td>{{ data.tarifs_appliques.tarif_hc.toFixed(3) }} FCFA/kWh</td>
        </tr>
        <tr>
          <td>Tarif Heures Pleines:</td>
          <td>{{ data.tarifs_appliques.tarif_hp.toFixed(3) }} FCFA/kWh</td>
        </tr>
        <tr>
          <td>Prime Fixe:</td>
          <td>{{ data.tarifs_appliques.prime_fixe.toFixed(2) }} FCFA/mois</td>
        </tr>
      </table>
    </div>

    <!-- Graphiques avec données tableau_mensuel -->
    <GraphiqueProjection :data="data.tableau_mensuel" />
  </div>
</template>

<script setup lang="ts">
interface Section2Props {
  data: Section2ProjectionNPlus1;
}

const props = defineProps<Section2Props>();

const formatCurrency = (value: number): string => {
  return `${(value / 1e6).toFixed(2)}M FCFA`;
};
</script>
```

### Angular - Affichage Section 3

```typescript
// component.ts
export class Section3Component {
  @Input() data!: Section3OptimisationNPlus1;

  formatCurrency(value: number): string {
    return `${(value / 1e6).toFixed(2)}M FCFA`;
  }
}
```

```html
<!-- component.html -->
<div class="section-3">
  <h2>Section 3 - Optimisation {{ data.annee }}</h2>

  <!-- Projection optimisée -->
  <div class="projection-box">
    <h3>Projection financière N+1 (avec puissance optimisée)</h3>

    <table class="comparison-table">
      <thead>
        <tr>
          <th></th>
          <th>Puissance actuelle</th>
          <th>Puissance optimisée</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Puissance:</td>
          <td>{{ data.configuration_actuelle_projection.puissance }} kW</td>
          <td>{{ data.configuration_optimisee_projection.puissance }} kW</td>
        </tr>
        <tr>
          <td>Coût:</td>
          <td>{{ formatCurrency(data.configuration_actuelle_projection.cout) }}</td>
          <td>{{ formatCurrency(data.configuration_optimisee_projection.cout) }}</td>
        </tr>
      </tbody>
    </table>

    <div class="economies">
      <h4>Économies potentielles</h4>
      <p class="montant">{{ formatCurrency(data.economies.montant) }}</p>
      <p class="pourcentage">{{ data.economies.pourcentage.toFixed(2) }}%</p>
    </div>
  </div>

  <!-- NOUVEAU - Tarifs appliqués N+1 (optimisé) -->
  <div class="tarifs-box">
    <h4>Tarifs appliqués pour l'année {{ data.annee }} (puissance optimisée {{ data.configuration_optimisee_projection.puissance }} kW)</h4>
    <table>
      <tr>
        <td>Catégorie:</td>
        <td><strong>{{ data.tarifs_appliques.categorie }}</strong></td>
      </tr>
      <tr>
        <td>Plage horaire:</td>
        <td>{{ data.tarifs_appliques.plage_horaire }}</td>
      </tr>
      <tr>
        <td>Intervalle puissance:</td>
        <td>[{{ data.tarifs_appliques.intervalle_min }} - {{ data.tarifs_appliques.intervalle_max }}] kW</td>
      </tr>
      <tr>
        <td>Tarif Heures Creuses:</td>
        <td>{{ data.tarifs_appliques.tarif_hc.toFixed(3) }} FCFA/kWh</td>
      </tr>
      <tr>
        <td>Tarif Heures Pleines:</td>
        <td>{{ data.tarifs_appliques.tarif_hp.toFixed(3) }} FCFA/kWh</td>
      </tr>
      <tr>
        <td>Prime Fixe:</td>
        <td>{{ data.tarifs_appliques.prime_fixe.toFixed(2) }} FCFA/mois</td>
      </tr>
    </table>
  </div>

  <!-- Graphiques -->
  <app-graphique-optimisation [data]="data.tableau_mensuel"></app-graphique-optimisation>
</div>
```

---

## 📋 CHECKLIST FRONTEND

### Section 1 - Optimisation année N

- [ ] Afficher "Configuration actuelle"
  - [ ] Puissance, type, coût, dépassements
  - [ ] **NOUVEAU:** Bloc "Tarifs et primes appliqués (actuel)"
    - [ ] Catégorie (Petit/Gros client)
    - [ ] Plage horaire
    - [ ] Intervalle [min, max]
    - [ ] Tarif HC (3 décimales)
    - [ ] Tarif HP (3 décimales)
    - [ ] Prime Fixe (2 décimales)

- [ ] Afficher "Nouvelle puissance à tester"
  - [ ] Puissance, type, coût, dépassements
  - [ ] **NOUVEAU:** Type détecté avec intervalle
  - [ ] **NOUVEAU:** Variation vs actuel (ex: "-800 kW")
  - [ ] **NOUVEAU:** Bloc "Tarifs et primes appliqués (nouvelle puissance)"
    - [ ] Tous les champs identiques à "actuel"

- [ ] Afficher économies (montant + pourcentage)

- [ ] **NOUVEAU:** Afficher warning textuel si présent
  - [ ] Respecter les sauts de ligne (\n)
  - [ ] Conserver les emojis (🚨, ✅)
  - [ ] Style différent selon type (danger/success)

- [ ] Afficher tableau mensuel (pour graphique)

### Section 2 - Projection N+1

- [ ] Afficher projection financière
  - [ ] Coût N, Coût N+1, Variation

- [ ] **NOUVEAU:** Afficher "Tarifs appliqués N+1"
  - [ ] Préciser "pour l'année N+1 avec puissance actuelle"
  - [ ] Tarifs HC, HP, Prime Fixe
  - [ ] Catégorie, plage horaire

- [ ] Afficher graphiques (données tableau_mensuel)

### Section 3 - Optimisation N+1

- [ ] Afficher projection optimisée
  - [ ] Tableau comparatif actuelle vs optimisée
  - [ ] Économies

- [ ] **NOUVEAU:** Afficher "Tarifs appliqués N+1 (optimisé)"
  - [ ] Préciser "pour l'année N+1 avec puissance optimisée X kW"
  - [ ] Tarifs HC, HP, Prime Fixe
  - [ ] Intervalle de puissance
  - [ ] Catégorie, plage horaire

- [ ] Afficher graphiques (données tableau_mensuel)

### Section 4 - Tableau comparatif

- [ ] Afficher tableau 4 scénarios
  - [ ] Nom, année, puissance, type, coût
  - [ ] Écart vs référence, pourcentage

- [ ] **NOUVEAU:** Afficher recommandation finale
  - [ ] Respecter les sauts de ligne (\n)
  - [ ] Conserver les emojis (✅, 💰, 🎯, ℹ️)
  - [ ] Mise en forme sections (titre, économies, action)

---

## 🎨 EXEMPLES DE FORMATAGE CSS

```css
/* Bloc tarifs */
.tarifs-box {
  background: #f8f9fa;
  border-left: 4px solid #007bff;
  padding: 15px;
  margin: 15px 0;
}

.tarifs-box h4 {
  color: #007bff;
  margin-bottom: 10px;
}

.tarifs-box table {
  width: 100%;
  border-collapse: collapse;
}

.tarifs-box td {
  padding: 8px;
  border-bottom: 1px solid #dee2e6;
}

.tarifs-box td:first-child {
  font-weight: 500;
  color: #6c757d;
}

.tarifs-box td:last-child {
  text-align: right;
  font-family: monospace;
}

/* Warning box */
.alert-danger {
  background: #f8d7da;
  border-left: 4px solid #dc3545;
  padding: 15px;
  margin: 15px 0;
}

.alert-success {
  background: #d4edda;
  border-left: 4px solid #28a745;
  padding: 15px;
  margin: 15px 0;
}

/* Variation puissance */
.reduction {
  color: #28a745;
  font-weight: bold;
}

.augmentation {
  color: #dc3545;
  font-weight: bold;
}

/* Recommandation */
.recommandation-box {
  background: #e7f3ff;
  border: 2px solid #007bff;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  white-space: pre-line; /* Respecte les \n */
}

.recommandation-box h3 {
  margin-top: 0;
}
```

---

## 🔍 TYPES TYPESCRIPT COMPLETS

```typescript
// Nouveau schema
interface TarifsInfo {
  tarif_hc: number;
  tarif_hp: number;
  prime_fixe: number;
  plage_horaire: string;
  intervalle_min: number;
  intervalle_max: number;
  categorie: string;
}

// Schema modifié
interface ConfigurationInfo {
  puissance: number;
  type_tarifaire: number;
  cout_annuel: number;
  nb_depassements: number;
  tarifs: TarifsInfo;  // ✅ NOUVEAU
  variation_vs_actuel: number | null;  // ✅ NOUVEAU
}

interface EconomiesInfo {
  montant: number;
  pourcentage: number;
}

interface Section1OptimisationN {
  annee: number;
  configuration_actuelle: ConfigurationInfo;
  configuration_optimisee: ConfigurationInfo;
  economies: EconomiesInfo;
  warning: string | null;  // ✅ NOUVEAU
  tableau_mensuel: Array<{
    mois: string;
    consommation: number;
    facture_actuelle: number;
    facture_optimisee: number;
    economie: number;
  }>;
}

interface Section2ProjectionNPlus1 {
  annee: number;
  puissance_utilisee: number;
  type_tarifaire: number;
  cout_N: number;
  cout_projection_N_plus_1: number;
  variation: {
    montant: number;
    pourcentage: number;
  };
  tarifs_appliques: TarifsInfo;  // ✅ NOUVEAU
  tableau_mensuel: Array<{
    mois: string;
    facture_N: number;
    facture_projection_N_plus_1: number;
    variation: number;
  }>;
}

interface Section3OptimisationNPlus1 {
  annee: number;
  configuration_actuelle_projection: {
    puissance: number;
    cout: number;
  };
  configuration_optimisee_projection: {
    puissance: number;
    cout: number;
  };
  economies: EconomiesInfo;
  tarifs_appliques: TarifsInfo;  // ✅ NOUVEAU
  tableau_mensuel: Array<{
    mois: string;
    facture_projection_actuelle: number;
    facture_projection_optimisee: number;
    economie: number;
  }>;
}

interface ScenarioComparatif {
  nom: string;
  annee: number;
  puissance: number;
  type_tarifaire: number;
  cout: number;
  ecart_vs_ref: number;
  pourcentage_vs_ref: number;
}

interface Section4TableauComparatif {
  scenarios: ScenarioComparatif[];
  recommandation: string | null;  // ✅ NOUVEAU
}

interface FullAnalysisResponse {
  annee_N: number;
  annee_N_plus_1: number;
  section_1_optimisation_N: Section1OptimisationN;
  section_2_projection_N_plus_1: Section2ProjectionNPlus1;
  section_3_optimisation_N_plus_1: Section3OptimisationNPlus1;
  section_4_tableau_comparatif: Section4TableauComparatif;
}
```

---

## 🚀 APPEL API COMPLET

```typescript
// Service API
async function getFullAnalysis(
  annee_N: number,
  nouvelle_puissance?: number
): Promise<FullAnalysisResponse> {
  const params = new URLSearchParams({
    annee_N: annee_N.toString(),
  });

  if (nouvelle_puissance !== undefined) {
    params.append('nouvelle_puissance', nouvelle_puissance.toString());
  }

  const response = await fetch(
    `/api/optimisation/full-analysis?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return await response.json();
}

// Utilisation
const data = await getFullAnalysis(2025, 4200);  // Mode MANUEL
// OU
const data = await getFullAnalysis(2025);  // Mode AUTO
```

---

## ✅ RÉSUMÉ POUR LE FRONTEND

### Avant (données manquantes):
❌ Tarifs HC, HP, Prime Fixe → **ABSENTS**
❌ Plage horaire → **ABSENTE**
❌ Intervalle [min, max] → **ABSENT**
❌ Catégorie client → **ABSENTE**
❌ Variation puissance → **ABSENTE**
❌ Warning textuel → **ABSENT**
❌ Recommandation → **ABSENTE**

### Après (reproduction exacte Streamlit):
✅ **Tous les tarifs détaillés disponibles**
✅ **Tous les métadonnées disponibles**
✅ **Warnings et recommandations textuels exacts**
✅ **Un seul appel API** pour tout avoir
✅ **Types TypeScript complets**

**Le frontend peut maintenant reproduire EXACTEMENT l'interface Streamlit !** 🚀

---

**Créé le:** 2026-01-17
**Pour:** Développeurs frontend (React, Vue, Angular, etc.)
**Backend version:** v2.0 (avec tarifs détaillés)
**Contact backend:** Voir `REPRODUCTION_100_POURCENT_FINALE.md`

✨ **GUIDE COMPLET POUR UTILISATION DES NOUVEAUX CHAMPS DE TARIFS** ✨
