/**
 * État des lieux et profil - Administrative and energetic profile + Synthese
 */
import React, { useState, useEffect } from 'react';
import { profilAPI, dataAPI } from '../services/api';
import Chart from '../components/Chart';

const ProfilPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profil, setProfil] = useState(null);
  const [year, setYear] = useState(2025);
  const [syntheseData, setSyntheseData] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [loadingSynthese, setLoadingSynthese] = useState(false);

  useEffect(() => {
    loadProfil();
  }, []);

  useEffect(() => {
    if (profil) {
      loadSynthese();
    }
  }, [year, profil]);

  const loadProfil = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await profilAPI.getProfil();
      setProfil(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const loadSynthese = async () => {
    setLoadingSynthese(true);
    try {
      const [synthese, graphs] = await Promise.all([
        dataAPI.getSynthese(year),
        dataAPI.getGraphiques(year)
      ]);
      setSyntheseData(synthese);
      setGraphData(graphs);
    } catch (err) {
      console.error('Erreur lors du chargement de la synthèse:', err);
    } finally {
      setLoadingSynthese(false);
    }
  };

  if (loading) return <div style={styles.loading}>Chargement du profil...</div>;
  if (error) return <div style={styles.error}>⚠️ {error}</div>;
  if (!profil) return null;

  const { infos_administratives, profil_energetique, profil_consommation } = profil;

  // Colors for multi-year graph
  const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>👤 Profil Client</h2>

      {/* Administrative Information */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Informations Administratives</h3>
        <div style={styles.adminGrid}>
          <div style={styles.infoCard}>
            <div style={styles.infoLabel}>Nom du client</div>
            <div style={styles.infoValue}>{infos_administratives.nom_client}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoLabel}>N° de service</div>
            <div style={styles.infoValue}>{infos_administratives.service_no}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoLabel}>Région</div>
            <div style={styles.infoValue}>{infos_administratives.region}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoLabel}>Division</div>
            <div style={styles.infoValue}>{infos_administratives.division}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={styles.infoLabel}>Agence</div>
            <div style={styles.infoValue}>{infos_administratives.agence}</div>
          </div>
        </div>
      </div>

      {/* Energetic Profile Summary */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>📋 Résumé du Profil Énergétique</h3>

        <div style={styles.profileGrid}>
          <div style={styles.profileCard}>
            <h4 style={styles.profileCardTitle}>⚡ Puissance</h4>
            <div style={styles.profileMetrics}>
              <div style={styles.profileMetric}>
                <span style={styles.profileMetricLabel}>Souscrite:</span>
                <span style={styles.profileMetricValue}>{profil_energetique.puissance_souscrite.toFixed(0)} kW</span>
              </div>
              <div style={styles.profileMetric}>
                <span style={styles.profileMetricLabel}>Maximum:</span>
                <span style={styles.profileMetricValue}>{profil_energetique.puissance_max.toFixed(0)} kW</span>
              </div>
              <div style={styles.profileMetric}>
                <span style={styles.profileMetricLabel}>Minimum:</span>
                <span style={styles.profileMetricValue}>{profil_energetique.puissance_min.toFixed(0)} kW</span>
              </div>
              <div style={styles.profileMetric}>
                <span style={styles.profileMetricLabel}>Moyenne:</span>
                <span style={styles.profileMetricValue}>{profil_energetique.puissance_moyenne.toFixed(0)} kW</span>
              </div>
            </div>
          </div>

          <div style={styles.profileCard}>
            <h4 style={styles.profileCardTitle}>🔋 Consommation</h4>
            <div style={styles.profileMetrics}>
              <div style={styles.profileMetric}>
                <span style={styles.profileMetricLabel}>Maximum:</span>
                <span style={styles.profileMetricValue}>{(profil_energetique.consommation_max / 1000).toFixed(1)} MWh</span>
              </div>
              <div style={styles.profileMetric}>
                <span style={styles.profileMetricLabel}>Minimum:</span>
                <span style={styles.profileMetricValue}>{(profil_energetique.consommation_min / 1000).toFixed(1)} MWh</span>
              </div>
              <div style={styles.profileMetric}>
                <span style={styles.profileMetricLabel}>Moyenne:</span>
                <span style={styles.profileMetricValue}>{(profil_energetique.consommation_moyenne / 1000).toFixed(1)} MWh</span>
              </div>
            </div>
          </div>

          <div style={styles.profileCard}>
            <h4 style={styles.profileCardTitle}>⏰ Répartition HC/HP</h4>
            <div style={styles.profileMetrics}>
              <div style={styles.profileMetric}>
                <span style={styles.profileMetricLabel}>Heures Creuses:</span>
                <span style={{...styles.profileMetricValue, color: '#2ca02c'}}>{profil_energetique.ratio_hc.toFixed(1)}%</span>
              </div>
              <div style={styles.profileMetric}>
                <span style={styles.profileMetricLabel}>Heures Pointe:</span>
                <span style={{...styles.profileMetricValue, color: '#ff7f0e'}}>{profil_energetique.ratio_hp.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {profil_energetique.cosphi && (
            <div style={styles.profileCard}>
              <h4 style={styles.profileCardTitle}>⚡ Cos(φ)</h4>
              <div style={styles.profileMetrics}>
                <div style={styles.profileMetric}>
                  <span style={styles.profileMetricLabel}>Moyen:</span>
                  <span style={{
                    ...styles.profileMetricValue,
                    color: profil_energetique.cosphi.moyen < 0.85 ? '#e74c3c' : '#27ae60'
                  }}>
                    {profil_energetique.cosphi.moyen.toFixed(3)}
                  </span>
                </div>
                <div style={styles.profileMetric}>
                  <span style={styles.profileMetricLabel}>Min - Max:</span>
                  <span style={styles.profileMetricValue}>
                    {profil_energetique.cosphi.min.toFixed(3)} - {profil_energetique.cosphi.max.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {profil_energetique.cosphi && profil_energetique.cosphi.moyen < 0.85 && (
          <div style={styles.warning}>
            <strong>⚠️ Attention:</strong> Le facteur de puissance moyen ({profil_energetique.cosphi.moyen.toFixed(3)})
            est inférieur à 0.85. Cela peut entraîner des pénalités.
            💡 Recommandation: Installation de batteries de condensateurs.
          </div>
        )}
      </div>

      {/* Multi-year Consumption Profile */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>📊 Profil de Consommation (Multi-années)</h3>
        <Chart
          data={profil_consommation.series.map((serie, idx) => ({
            x: serie.mois,
            y: serie.consommation,
            name: serie.annee.toString(),
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: colors[idx % colors.length], width: 2 },
            marker: { size: 6 },
          }))}
          layout={{
            title: 'Évolution de la consommation mensuelle sur plusieurs années',
            xaxis: {
              title: 'Mois',
              tickmode: 'array',
              tickvals: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
              ticktext: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
            },
            yaxis: { title: 'Consommation (kWh)' },
            height: 450,
            hovermode: 'x unified',
          }}
        />

        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            Ce graphique montre l'évolution de votre consommation mensuelle sur {profil_consommation.annees.length} année(s): {profil_consommation.annees.join(', ')}.
          </p>
          <p style={styles.infoText}>
            Identifiez les tendances saisonnières et les variations d'une année à l'autre pour mieux anticiper vos besoins énergétiques.
          </p>
        </div>
      </div>

      {/* Tableaux de synthèse par année */}
      <div style={styles.section}>
        <div style={styles.syntheseHeader}>
          <h3 style={styles.sectionTitle}>📊 Tableaux de synthèse par année</h3>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            style={styles.yearSelect}
          >
            <option value={2023}>2023</option>
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
        </div>

        {loadingSynthese ? (
          <div style={styles.loading}>Chargement des données {year}...</div>
        ) : syntheseData && graphData ? (
          <>
            {/* Métriques */}
            <div style={styles.metricsGrid}>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Consommation totale</div>
                <div style={styles.metricValue}>
                  {(graphData.metriques.consommation_totale / 1000).toFixed(1)} MWh
                </div>
              </div>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Puissance max atteinte</div>
                <div style={styles.metricValue}>
                  {graphData.metriques.puissance_max.toFixed(0)} kW
                </div>
              </div>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Facture totale</div>
                <div style={styles.metricValue}>
                  {(graphData.metriques.facture_totale / 1e6).toFixed(2)} M FCFA
                </div>
              </div>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Dépassements</div>
                <div style={{
                  ...styles.metricValue,
                  color: graphData.metriques.nb_depassements > 0 ? '#e74c3c' : '#27ae60'
                }}>
                  {graphData.metriques.nb_depassements} mois
                </div>
              </div>
            </div>

            {/* Graphiques */}
            <div style={styles.graphsSection}>
              <h4 style={styles.graphsSectionTitle}>📈 Graphiques {year}</h4>

              {/* Graph 1: Consommation mensuelle */}
              <div style={styles.graphCard}>
                <Chart
                  data={[graphData.consommation_mensuelle]}
                  layout={{
                    title: '1. Consommation mensuelle',
                    xaxis: { title: 'Mois' },
                    yaxis: { title: 'Consommation (kWh)' },
                    height: 400,
                  }}
                />
              </div>

              {/* Graph 2: HC vs HP */}
              <div style={styles.graphCard}>
                <Chart
                  data={[
                    graphData.heures_creuses_pointe.heures_creuses,
                    graphData.heures_creuses_pointe.heures_pointe
                  ]}
                  layout={{
                    title: '2. Consommation Heures Creuses vs Heures Pointe',
                    xaxis: { title: 'Mois' },
                    yaxis: { title: 'Consommation (kWh)' },
                    barmode: 'stack',
                    height: 400,
                  }}
                />
              </div>

              {/* Graph 3: Puissance */}
              <div style={styles.graphCard}>
                <Chart
                  data={[
                    graphData.puissance.puissance_atteinte,
                    graphData.puissance.puissance_souscrite
                  ]}
                  layout={{
                    title: '3. Puissance atteinte vs souscrite',
                    xaxis: { title: 'Mois' },
                    yaxis: { title: 'Puissance (kW)' },
                    height: 400,
                  }}
                />
              </div>

              {/* Graph 4: Facturation et consommation */}
              <div style={styles.graphCard}>
                <Chart
                  data={[
                    graphData.facturation_consommation.facture,
                    graphData.facturation_consommation.consommation
                  ]}
                  layout={{
                    title: '4. Facturation et consommation',
                    xaxis: { title: 'Mois' },
                    yaxis: { title: 'Facture (FCFA)' },
                    yaxis2: {
                      title: 'Consommation (kWh)',
                      overlaying: 'y',
                      side: 'right'
                    },
                    height: 400,
                  }}
                />
              </div>

              {/* Graph 5: Cos(φ) */}
              {graphData.cosphi && (
                <div style={styles.graphCard}>
                  <Chart
                    data={[
                      graphData.cosphi.cosphi,
                      graphData.cosphi.consommation
                    ]}
                    layout={{
                      title: '5. Facteur de puissance (Cos φ) et consommation',
                      xaxis: { title: 'Mois' },
                      yaxis: { title: 'Cos(φ)' },
                      yaxis2: {
                        title: 'Consommation (kWh)',
                        overlaying: 'y',
                        side: 'right'
                      },
                      height: 400,
                    }}
                  />
                  {graphData.cosphi.cosphi_moyen < 0.85 && (
                    <div style={styles.warning}>
                      <strong>⚠️ Attention:</strong> Le facteur de puissance moyen ({graphData.cosphi.cosphi_moyen.toFixed(3)})
                      est inférieur à 0.85. Cela peut entraîner des pénalités.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tableau de synthèse */}
            <div style={styles.tableSection}>
              <h4 style={styles.tableSectionTitle}>📋 Tableau de synthèse mensuelle</h4>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {syntheseData.colonnes.map((col, idx) => (
                        <th key={idx} style={styles.th}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {syntheseData.lignes.map((row, idx) => (
                      <tr key={idx}>
                        {syntheseData.colonnes.map((col, colIdx) => (
                          <td key={colIdx} style={styles.td}>
                            {typeof row[col] === 'number'
                              ? row[col].toLocaleString('fr-FR', { maximumFractionDigits: 2 })
                              : row[col]
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
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
  adminGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
  },
  infoCard: {
    padding: '15px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
  },
  infoLabel: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '6px',
  },
  infoValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  profileGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  profileCard: {
    padding: '20px',
    border: '2px solid #667eea',
    borderRadius: '12px',
  },
  profileCardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#667eea',
    marginBottom: '15px',
  },
  profileMetrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  profileMetric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileMetricLabel: {
    fontSize: '13px',
    color: '#666',
  },
  profileMetricValue: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
  },
  warning: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '8px',
    padding: '15px',
    color: '#856404',
    marginTop: '20px',
  },
  infoBox: {
    backgroundColor: '#f0f8ff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #d0e8ff',
    marginTop: '20px',
  },
  infoText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  },
  syntheseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  yearSelect: {
    padding: '10px 15px',
    fontSize: '16px',
    border: '2px solid #667eea',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  metricCard: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  },
  metricLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  },
  graphsSection: {
    marginTop: '30px',
  },
  graphsSectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '20px',
  },
  graphCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #e0e0e0',
  },
  tableSection: {
    marginTop: '30px',
  },
  tableSectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '20px',
  },
  tableWrapper: {
    overflowX: 'auto',
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
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #dee2e6',
  },
};

export default ProfilPage;
