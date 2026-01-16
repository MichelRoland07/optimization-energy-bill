/**
 * Optimisation Page - Power subscription simulation
 */
import React, { useState, useEffect } from 'react';
import { optimisationAPI } from '../services/api';

const OptimisationPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [config, setConfig] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [nouvellePuissance, setNouvellePuissance] = useState('');
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await optimisationAPI.getCurrentConfig();
      setConfig(result);
      // Suggest 90% of max power
      setNouvellePuissance(Math.round(result.puissance_max_atteinte * 0.9).toString());
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    if (!nouvellePuissance || parseInt(nouvellePuissance) <= 0) {
      setError('Veuillez entrer une puissance valide');
      return;
    }

    setSimulating(true);
    setError('');

    try {
      const result = await optimisationAPI.simulate(parseInt(nouvellePuissance));
      setSimulation(result);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la simulation');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) return <div style={styles.loading}>Chargement...</div>;
  if (error && !config) return <div style={styles.error}>⚠️ {error}</div>;
  if (!config) return null;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>⚙️ Optimisation de la Puissance Souscrite</h2>

      {/* Current Configuration */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Configuration Actuelle (2025)</h3>
        <div style={styles.metrics}>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Puissance souscrite</div>
            <div style={styles.metricValue}>{config.puissance_actuelle} kW</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Puissance max atteinte</div>
            <div style={styles.metricValue}>{config.puissance_max_atteinte.toFixed(0)} kW</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Puissance min atteinte</div>
            <div style={styles.metricValue}>{config.puissance_min_atteinte.toFixed(0)} kW</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Puissance moyenne</div>
            <div style={styles.metricValue}>{config.puissance_moyenne.toFixed(0)} kW</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Type tarifaire</div>
            <div style={styles.metricValue}>{config.type_tarifaire}</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Coût annuel 2025</div>
            <div style={styles.metricValue}>{(config.cout_annuel_2025 / 1e6).toFixed(2)} M</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Dépassements</div>
            <div style={{
              ...styles.metricValue,
              color: config.nb_depassements > 0 ? '#e74c3c' : '#27ae60'
            }}>
              {config.nb_depassements}
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Form */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Simuler une Nouvelle Puissance</h3>
        <div style={styles.simulationForm}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nouvelle puissance souscrite (kW)</label>
            <input
              type="number"
              value={nouvellePuissance}
              onChange={(e) => setNouvellePuissance(e.target.value)}
              style={styles.input}
              placeholder="Ex: 4000"
            />
          </div>
          <button
            onClick={handleSimulate}
            disabled={simulating}
            style={{
              ...styles.button,
              ...(simulating ? styles.buttonDisabled : {})
            }}
          >
            {simulating ? 'Simulation en cours...' : 'Simuler'}
          </button>
        </div>

        {error && <div style={styles.errorMessage}>⚠️ {error}</div>}
      </div>

      {/* Simulation Results */}
      {simulation && (
        <>
          {/* Warning */}
          {simulation.has_warning && (
            <div style={styles.warning}>
              ⚠️ {simulation.warning}
            </div>
          )}

          {/* Results */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Résultats de la Simulation</h3>
            <div style={styles.resultsGrid}>
              <div style={styles.resultCard}>
                <div style={styles.resultLabel}>Nouvelle puissance</div>
                <div style={styles.resultValue}>{simulation.nouvelle_puissance} kW</div>
              </div>
              <div style={styles.resultCard}>
                <div style={styles.resultLabel}>Nouveau type tarifaire</div>
                <div style={styles.resultValue}>{simulation.nouveau_type_tarifaire}</div>
              </div>
            </div>

            <div style={styles.comparisonGrid}>
              <div style={styles.comparisonCard}>
                <h4 style={styles.comparisonTitle}>Configuration Actuelle</h4>
                <div style={styles.comparisonValue}>
                  {(simulation.resultats.cout_actuel / 1e6).toFixed(2)} M FCFA
                </div>
                <div style={styles.comparisonDetail}>
                  {simulation.resultats.nb_depassements_actuel} dépassements
                </div>
              </div>

              <div style={styles.arrow}>→</div>

              <div style={styles.comparisonCard}>
                <h4 style={styles.comparisonTitle}>Configuration Simulée</h4>
                <div style={styles.comparisonValue}>
                  {(simulation.resultats.cout_simule / 1e6).toFixed(2)} M FCFA
                </div>
                <div style={styles.comparisonDetail}>
                  {simulation.resultats.nb_depassements_simule} dépassements
                </div>
              </div>

              <div style={{
                ...styles.economiesCard,
                backgroundColor: simulation.resultats.economies > 0 ? '#d4edda' : '#f8d7da'
              }}>
                <h4 style={styles.economiesTitle}>
                  {simulation.resultats.economies > 0 ? '💰 Économies' : '⚠️ Surcoût'}
                </h4>
                <div style={{
                  ...styles.economiesValue,
                  color: simulation.resultats.economies > 0 ? '#27ae60' : '#e74c3c'
                }}>
                  {(simulation.resultats.economies / 1e6).toFixed(2)} M FCFA
                </div>
                <div style={styles.economiesPercent}>
                  ({simulation.resultats.economies_pct.toFixed(2)}%)
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Comparison Table */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Comparaison Mensuelle</h3>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Mois</th>
                    <th style={styles.th}>Facture Actuelle (FCFA)</th>
                    <th style={styles.th}>Facture Simulée (FCFA)</th>
                    <th style={styles.th}>Économie (FCFA)</th>
                  </tr>
                </thead>
                <tbody>
                  {simulation.tableau_mensuel.map((row, idx) => (
                    <tr key={idx}>
                      <td style={styles.td}>{row.mois}</td>
                      <td style={styles.td}>{row.facture_actuelle.toLocaleString('fr-FR')}</td>
                      <td style={styles.td}>{row.facture_simulee.toLocaleString('fr-FR')}</td>
                      <td style={{
                        ...styles.td,
                        fontWeight: 'bold',
                        color: row.economie > 0 ? '#27ae60' : row.economie < 0 ? '#e74c3c' : '#666'
                      }}>
                        {row.economie.toLocaleString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
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
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '30px',
  },
  section: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '20px',
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
  },
  metricCard: {
    padding: '15px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '6px',
  },
  metricValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
  },
  simulationForm: {
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-end',
  },
  inputGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
  },
  button: {
    padding: '12px 30px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  errorMessage: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '6px',
    marginTop: '15px',
  },
  warning: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    color: '#856404',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  resultsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    marginBottom: '30px',
  },
  resultCard: {
    padding: '20px',
    border: '2px solid #667eea',
    borderRadius: '8px',
  },
  resultLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  },
  resultValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea',
  },
  comparisonGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr auto',
    gap: '20px',
    alignItems: 'center',
  },
  comparisonCard: {
    padding: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    textAlign: 'center',
  },
  comparisonTitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '10px',
  },
  comparisonValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px',
  },
  comparisonDetail: {
    fontSize: '13px',
    color: '#999',
  },
  arrow: {
    fontSize: '30px',
    color: '#667eea',
  },
  economiesCard: {
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
  },
  economiesTitle: {
    fontSize: '14px',
    marginBottom: '10px',
  },
  economiesValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  economiesPercent: {
    fontSize: '16px',
    color: '#666',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
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
};

export default OptimisationPage;
