/**
 * Documentation Page
 */
import React, { useState } from 'react';

const DocumentationPage = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📄 Documentation</h2>

      {/* Section 1: Structure du fichier Excel */}
      <div style={styles.section}>
        <div
          style={styles.sectionHeader}
          onClick={() => toggleSection('structure')}
        >
          <span style={styles.sectionTitle}>📋 Structure du fichier Excel</span>
          <span style={styles.expandIcon}>{expandedSection === 'structure' ? '▼' : '▶'}</span>
        </div>
        {expandedSection === 'structure' && (
          <div style={styles.sectionContent}>
            <h3 style={styles.subtitle}>Colonnes obligatoires (16 colonnes)</h3>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Colonne</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={styles.td}>SERVICE_NO</td><td style={styles.td}>Texte</td><td style={styles.td}>Numéro de service</td></tr>
                  <tr><td style={styles.td}>CUST_NAME</td><td style={styles.td}>Texte</td><td style={styles.td}>Nom du client</td></tr>
                  <tr><td style={styles.td}>REGION</td><td style={styles.td}>Texte</td><td style={styles.td}>Région</td></tr>
                  <tr><td style={styles.td}>DIVISION</td><td style={styles.td}>Texte</td><td style={styles.td}>Division</td></tr>
                  <tr><td style={styles.td}>AGENCE</td><td style={styles.td}>Texte</td><td style={styles.td}>Agence</td></tr>
                  <tr><td style={styles.td}>READING_DATE</td><td style={styles.td}>Date</td><td style={styles.td}>Date de facturation</td></tr>
                  <tr><td style={styles.td}>SUBSCRIPTION_LOAD</td><td style={styles.td}>Nombre</td><td style={styles.td}>Puissance souscrite (kW)</td></tr>
                  <tr><td style={styles.td}>PUISSANCE_ATTEINTE</td><td style={styles.td}>Nombre</td><td style={styles.td}>Puissance max atteinte (kW)</td></tr>
                  <tr><td style={styles.td}>MV_CONSUMPTION</td><td style={styles.td}>Nombre</td><td style={styles.td}>Consommation totale (kWh)</td></tr>
                  <tr><td style={styles.td}>ACTIVE_OFF_PEAK_IMP</td><td style={styles.td}>Nombre</td><td style={styles.td}>Import heures creuses (kWh)</td></tr>
                  <tr><td style={styles.td}>ACTIVE_PEAK_IMP</td><td style={styles.td}>Nombre</td><td style={styles.td}>Import heures pointe (kWh)</td></tr>
                  <tr><td style={styles.td}>ACTIVE_OFF_PEAK_EXP</td><td style={styles.td}>Nombre</td><td style={styles.td}>Export heures creuses (kWh)</td></tr>
                  <tr><td style={styles.td}>ACTIVE_PEAK_EXP</td><td style={styles.td}>Nombre</td><td style={styles.td}>Export heures pointe (kWh)</td></tr>
                  <tr><td style={styles.td}>AMOUNT_WITHOUT_TAX</td><td style={styles.td}>Nombre</td><td style={styles.td}>Montant HT (FCFA)</td></tr>
                  <tr><td style={styles.td}>AMOUNT_WITH_TAX</td><td style={styles.td}>Nombre</td><td style={styles.td}>Montant TTC (FCFA)</td></tr>
                  <tr><td style={styles.td}>COSPHI</td><td style={styles.td}>Nombre</td><td style={styles.td}>Facteur de puissance</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Comment fonctionne la simulation */}
      <div style={styles.section}>
        <div
          style={styles.sectionHeader}
          onClick={() => toggleSection('simulation')}
        >
          <span style={styles.sectionTitle}>🔄 Comment fonctionne la simulation ?</span>
          <span style={styles.expandIcon}>{expandedSection === 'simulation' ? '▼' : '▶'}</span>
        </div>
        {expandedSection === 'simulation' && (
          <div style={styles.sectionContent}>
            <h3 style={styles.subtitle}>Processus de simulation</h3>
            <ol style={styles.orderedList}>
              <li><strong>Choix de la puissance</strong> : Vous sélectionnez une nouvelle puissance souscrite à tester</li>
              <li><strong>Détection du type</strong> : Le système identifie automatiquement le type tarifaire correspondant</li>
              <li><strong>Recalcul des factures</strong> : Toutes les factures 2025 sont recalculées avec la nouvelle puissance</li>
              <li><strong>Comparaison</strong> : Visualisation côte à côte de la situation actuelle vs simulée</li>
              <li><strong>Analyse</strong> : Calcul des économies, dépassements, et recommandations</li>
            </ol>

            <h3 style={styles.subtitle}>Avantages de la simulation interactive</h3>
            <ul style={styles.unorderedList}>
              <li>Testez plusieurs configurations facilement</li>
              <li>Comprenez l'impact de chaque choix</li>
              <li>Visualisez les économies mois par mois</li>
              <li>Identifiez les changements de type tarifaire</li>
              <li>Exportez les résultats détaillés</li>
            </ul>
          </div>
        )}
      </div>

      {/* Section 3: Conseils d'utilisation */}
      <div style={styles.section}>
        <div
          style={styles.sectionHeader}
          onClick={() => toggleSection('conseils')}
        >
          <span style={styles.sectionTitle}>💡 Conseils d'utilisation</span>
          <span style={styles.expandIcon}>{expandedSection === 'conseils' ? '▼' : '▶'}</span>
        </div>
        {expandedSection === 'conseils' && (
          <div style={styles.sectionContent}>
            <h3 style={styles.subtitle}>Comment tirer le meilleur parti de la simulation ?</h3>
            <ol style={styles.orderedList}>
              <li><strong>Commencez par analyser</strong> vos données dans l'onglet "État des lieux et profil"</li>
              <li><strong>Observez les statistiques</strong> : puissance min, max, moyenne</li>
              <li><strong>Testez différentes valeurs</strong> dans la simulation</li>
              <li><strong>Attention aux seuils</strong> : Les types changent à 3000, 4000, 5000 kW...</li>
              <li><strong>Considérez les dépassements</strong> : Trop de dépassements = pénalités</li>
              <li><strong>Cherchez l'équilibre</strong> entre coût minimal et risque de dépassement</li>
            </ol>

            <h3 style={styles.subtitle}>Exemples de stratégies</h3>
            <div style={styles.strategiesBox}>
              <div style={styles.strategyItem}>
                <strong style={styles.strategyTitle}>Conservatrice</strong>
                <p style={styles.strategyDesc}>Puissance ≥ max atteint (0 dépassement)</p>
              </div>
              <div style={styles.strategyItem}>
                <strong style={styles.strategyTitle}>Équilibrée</strong>
                <p style={styles.strategyDesc}>Puissance = P95 (5% de dépassements acceptables)</p>
              </div>
              <div style={styles.strategyItem}>
                <strong style={styles.strategyTitle}>Agressive</strong>
                <p style={styles.strategyDesc}>Puissance minimale (plusieurs dépassements)</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Comprendre les types tarifaires */}
      <div style={styles.section}>
        <div
          style={styles.sectionHeader}
          onClick={() => toggleSection('types')}
        >
          <span style={styles.sectionTitle}>🎯 Comprendre les types tarifaires</span>
          <span style={styles.expandIcon}>{expandedSection === 'types' ? '▼' : '▶'}</span>
        </div>
        {expandedSection === 'types' && (
          <div style={styles.sectionContent}>
            <h3 style={styles.subtitle}>Structure des types</h3>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Intervalle (kW)</th>
                    <th style={styles.th}>Catégorie</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={styles.td}>1-5</td><td style={styles.td}>[0, 3000[</td><td style={styles.td}>Petits clients</td></tr>
                  <tr><td style={styles.td}>6-12</td><td style={styles.td}>[3000, 10000[</td><td style={styles.td}>Gros clients</td></tr>
                </tbody>
              </table>
            </div>

            <h3 style={styles.subtitle}>Impact du changement de type</h3>
            <ul style={styles.unorderedList}>
              <li><strong>Même type</strong> : Seule la prime fixe change</li>
              <li><strong>Changement de type</strong> : Tarifs unitaires ET prime fixe changent</li>
            </ul>

            <div style={styles.tipBox}>
              <strong>💡 Astuce :</strong> Pour maximiser les économies, testez les valeurs juste en dessous des seuils de changement de type (2999 kW, 3999 kW, etc.)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '30px',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: '20px',
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #dee2e6',
    transition: 'background-color 0.2s',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  },
  expandIcon: {
    fontSize: '14px',
    color: '#667eea',
  },
  sectionContent: {
    padding: '25px',
  },
  subtitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '15px',
    marginTop: '20px',
  },
  orderedList: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.8',
    paddingLeft: '25px',
  },
  unorderedList: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.8',
    paddingLeft: '25px',
  },
  tableWrapper: {
    overflowX: 'auto',
    marginTop: '15px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    borderBottom: '2px solid #dee2e6',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #dee2e6',
  },
  strategiesBox: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginTop: '15px',
  },
  strategyItem: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    border: '2px solid #dee2e6',
  },
  strategyTitle: {
    fontSize: '14px',
    color: '#667eea',
    display: 'block',
    marginBottom: '8px',
  },
  strategyDesc: {
    fontSize: '13px',
    color: '#666',
    margin: 0,
  },
  tipBox: {
    backgroundColor: '#fff3cd',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #ffc107',
    marginTop: '20px',
    fontSize: '14px',
    color: '#856404',
  },
};

export default DocumentationPage;
