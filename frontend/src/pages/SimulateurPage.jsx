/**
 * Simulateur de tarifs Page
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SimulateurPage = () => {
  const [annee, setAnnee] = useState(2025);
  const [tableauTarifs, setTableauTarifs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Simulation form
  const [puissance, setPuissance] = useState(1500);
  const [tempsFonctionnement, setTempsFonctionnement] = useState(300);
  const [resultatsSimulation, setResultatsSimulation] = useState(null);
  const [loadingSimulation, setLoadingSimulation] = useState(false);

  useEffect(() => {
    loadTableauTarifs();
  }, [annee]);

  const loadTableauTarifs = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/simulateur/tableau-tarifs', {
        params: { annee },
        headers: { Authorization: `Bearer ${token}` }
      });
      setTableauTarifs(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSimuler = async () => {
    setLoadingSimulation(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/simulateur/simulate',
        {
          puissance: parseFloat(puissance),
          temps_fonctionnement: parseFloat(tempsFonctionnement),
          annee: annee
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setResultatsSimulation(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la simulation');
    } finally {
      setLoadingSimulation(false);
    }
  };

  if (loading) return <div style={styles.loading}>Chargement...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🎯 Simulateur de tarifs électriques</h2>
      </div>

      <p style={styles.intro}>
        Cette page vous permet de consulter l'ensemble des tarifs électriques et de simuler
        les tarifs applicables selon votre puissance souscrite et votre temps de fonctionnement.
      </p>

      {error && <div style={styles.error}>⚠️ {error}</div>}

      {/* Section 1: Tableau des tarifs */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>📊 Table complète des tarifs électriques</h3>
          <select
            value={annee}
            onChange={(e) => setAnnee(parseInt(e.target.value))}
            style={styles.yearSelect}
          >
            <option value={2023}>2023</option>
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        </div>

        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            💡 <strong>Lecture du tableau :</strong>
          </p>
          <ul style={styles.infoList}>
            <li><strong>Petits clients</strong> (Types 1-5, puissance &lt;3000 kW) : utilisent les colonnes 0-200h, 201-400h, &gt;400h</li>
            <li><strong>Gros clients</strong> (Types 6-12, puissance ≥3000 kW) : utilisent les colonnes 0-400h, &gt;400h</li>
            <li><strong>Off Peak</strong> = Heures creuses (FCFA/kWh) | <strong>Peak</strong> = Heures pointe (FCFA/kWh) | <strong>PF</strong> = Prime Fixe (FCFA/kW)</li>
            <li>Tarifs affichés pour l'année {annee} avec augmentation annuelle incluse</li>
          </ul>
        </div>

        {tableauTarifs && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {tableauTarifs.colonnes.map((col, idx) => (
                    <th key={idx} style={styles.th}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableauTarifs.lignes.map((row, idx) => (
                  <tr key={idx}>
                    {tableauTarifs.colonnes.map((col, colIdx) => (
                      <td key={colIdx} style={styles.td}>
                        {row[col] !== undefined ? row[col] : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Simulateur interactif */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>🎛️ Simulateur interactif</h3>

        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>📏 Puissance souscrite (kW)</label>
            <input
              type="number"
              value={puissance}
              onChange={(e) => setPuissance(e.target.value)}
              min="1"
              max="10000"
              step="10"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>⏱️ Temps de fonctionnement mensuel (heures)</label>
            <input
              type="number"
              value={tempsFonctionnement}
              onChange={(e) => setTempsFonctionnement(e.target.value)}
              min="1"
              max="744"
              step="10"
              style={styles.input}
            />
          </div>
        </div>

        <button
          onClick={handleSimuler}
          disabled={loadingSimulation}
          style={styles.simulateButton}
        >
          {loadingSimulation ? 'Calcul en cours...' : '🚀 CALCULER LES TARIFS'}
        </button>

        {/* Résultats de simulation */}
        {resultatsSimulation && (
          <div style={styles.resultsSection}>
            <h4 style={styles.resultsTitle}>✅ Résultats de la simulation</h4>

            <div style={styles.metricsGrid}>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Type tarifaire</div>
                <div style={styles.metricValue}>Type {resultatsSimulation.type}</div>
              </div>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Catégorie</div>
                <div style={styles.metricValue}>{resultatsSimulation.categorie}</div>
              </div>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Plage horaire</div>
                <div style={styles.metricValue}>{resultatsSimulation.plage_horaire}</div>
              </div>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Intervalle</div>
                <div style={styles.metricValue}>
                  [{resultatsSimulation.intervalle_min}, {resultatsSimulation.intervalle_max}[ kW
                </div>
              </div>
            </div>

            <div style={styles.tarifsBox}>
              <h5 style={styles.tarifsTitle}>💰 Tarifs applicables</h5>
              <div style={styles.tarifsGrid}>
                <div style={styles.tarifItem}>
                  <span style={styles.tarifLabel}>Heures creuses (Off Peak):</span>
                  <span style={styles.tarifValue}>{resultatsSimulation.tarif_off_peak.toFixed(3)} FCFA/kWh</span>
                </div>
                <div style={styles.tarifItem}>
                  <span style={styles.tarifLabel}>Heures pointe (Peak):</span>
                  <span style={styles.tarifValue}>{resultatsSimulation.tarif_peak.toFixed(3)} FCFA/kWh</span>
                </div>
                <div style={styles.tarifItem}>
                  <span style={styles.tarifLabel}>Prime fixe:</span>
                  <span style={styles.tarifValue}>{resultatsSimulation.prime_fixe.toFixed(2)} FCFA/kW</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  header: {
    marginBottom: '20px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  intro: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px',
    lineHeight: '1.6',
  },
  card: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: '30px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    margin: 0,
  },
  yearSelect: {
    padding: '10px 15px',
    fontSize: '16px',
    border: '2px solid #667eea',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  infoBox: {
    backgroundColor: '#f0f8ff',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #d0e8ff',
  },
  infoText: {
    fontSize: '14px',
    color: '#333',
    marginBottom: '10px',
    fontWeight: '600',
  },
  infoList: {
    fontSize: '14px',
    color: '#666',
    marginLeft: '20px',
    lineHeight: '1.8',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
  },
  th: {
    backgroundColor: '#f8f9fa',
    padding: '12px 8px',
    textAlign: 'left',
    fontWeight: '600',
    borderBottom: '2px solid #dee2e6',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 8px',
    borderBottom: '1px solid #dee2e6',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #ddd',
    borderRadius: '6px',
  },
  simulateButton: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#667eea',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  resultsSection: {
    marginTop: '30px',
    paddingTop: '30px',
    borderTop: '2px solid #eee',
  },
  resultsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '20px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '20px',
  },
  metricCard: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '5px',
  },
  metricValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
  tarifsBox: {
    backgroundColor: '#f0f8ff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #d0e8ff',
  },
  tarifsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '15px',
  },
  tarifsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  tarifItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '6px',
  },
  tarifLabel: {
    fontSize: '14px',
    color: '#666',
  },
  tarifValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#667eea',
  },
};

export default SimulateurPage;
