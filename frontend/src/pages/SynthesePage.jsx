/**
 * Synthese Page with all 5 graphs from Streamlit
 */
import React, { useState, useEffect } from 'react';
import { dataAPI } from '../services/api';
import Chart from '../components/Chart';

const SynthesePage = () => {
  const [year, setYear] = useState(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [graphData, setGraphData] = useState(null);
  const [tableData, setTableData] = useState(null);

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [graphs, synthese] = await Promise.all([
        dataAPI.getGraphiques(year),
        dataAPI.getSynthese(year),
      ]);
      setGraphData(graphs);
      setTableData(synthese);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Chargement des données...</div>;
  }

  if (error) {
    return (
      <div style={styles.error}>
        ⚠️ {error}
        <button onClick={loadData} style={styles.retryButton}>
          Réessayer
        </button>
      </div>
    );
  }

  if (!graphData) return null;

  const { metriques } = graphData;

  return (
    <div style={styles.container}>
      {/* Header with year selector and metrics */}
      <div style={styles.header}>
        <h2 style={styles.title}>📊 Synthèse Énergétique</h2>
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

      {/* Key Metrics */}
      <div style={styles.metrics}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Consommation totale</div>
          <div style={styles.metricValue}>
            {(metriques.consommation_totale / 1000).toFixed(0)} MWh
          </div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Puissance max atteinte</div>
          <div style={styles.metricValue}>
            {metriques.puissance_max_atteinte.toFixed(0)} kW
          </div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Facture totale</div>
          <div style={styles.metricValue}>
            {(metriques.facture_totale / 1e6).toFixed(2)} M FCFA
          </div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Dépassements</div>
          <div style={{...styles.metricValue, color: metriques.nb_depassements > 0 ? '#e74c3c' : '#27ae60'}}>
            {metriques.nb_depassements}
          </div>
        </div>
      </div>

      {/* Graph 1: Consommation mensuelle */}
      <div style={styles.graphCard}>
        <h3 style={styles.graphTitle}>Évolution de la consommation mensuelle {year}</h3>
        <Chart
          data={[graphData.consommation_mensuelle]}
          layout={{
            title: '',
            xaxis: { title: 'Mois' },
            yaxis: { title: 'Consommation (kWh)' },
            height: 400,
          }}
        />
      </div>

      {/* Graph 2: Heures creuses vs Pointe */}
      <div style={styles.graphCard}>
        <h3 style={styles.graphTitle}>Répartition Heures creuses / Pointe {year}</h3>
        <Chart
          data={[
            {
              x: graphData.heures_creuses_pointe.x,
              y: graphData.heures_creuses_pointe.heures_creuses,
              name: 'Heures creuses',
              type: 'bar',
              marker: { color: '#2ca02c' },
            },
            {
              x: graphData.heures_creuses_pointe.x,
              y: graphData.heures_creuses_pointe.heures_pointe,
              name: 'Heures pointe',
              type: 'bar',
              marker: { color: '#ff7f0e' },
            },
          ]}
          layout={{
            title: '',
            xaxis: { title: 'Mois' },
            yaxis: { title: 'Énergie (kWh)' },
            barmode: 'stack',
            height: 400,
          }}
        />
      </div>

      {/* Graph 3: Puissance atteinte vs souscrite */}
      <div style={styles.graphCard}>
        <h3 style={styles.graphTitle}>Puissance atteinte vs Puissance souscrite {year}</h3>
        <Chart
          data={[
            {
              x: graphData.puissance.x,
              y: graphData.puissance.puissance_atteinte,
              name: 'Puissance atteinte',
              type: 'scatter',
              mode: 'lines+markers',
              line: { color: '#d62728', width: 3 },
              marker: { size: 8 },
            },
            {
              x: graphData.puissance.x,
              y: graphData.puissance.puissance_souscrite,
              name: 'Puissance souscrite',
              type: 'scatter',
              mode: 'lines',
              line: { color: '#9467bd', width: 2, dash: 'dash' },
            },
          ]}
          layout={{
            title: '',
            xaxis: { title: 'Mois' },
            yaxis: { title: 'Puissance (kW)' },
            height: 400,
          }}
        />
      </div>

      {/* Graph 4: Facturation et consommation (dual axis) */}
      <div style={styles.graphCard}>
        <h3 style={styles.graphTitle}>Facturation et Consommation mensuelle {year}</h3>
        <Chart
          data={[
            {
              x: graphData.facturation_consommation.x,
              y: graphData.facturation_consommation.facturation,
              name: 'Montant TTC',
              type: 'bar',
              marker: { color: '#17becf' },
              text: graphData.facturation_consommation.facturation.map(v => `${(v/1e6).toFixed(1)}M`),
              textposition: 'outside',
              yaxis: 'y',
            },
            {
              x: graphData.facturation_consommation.x,
              y: graphData.facturation_consommation.consommation,
              name: 'Consommation',
              type: 'scatter',
              mode: 'lines+markers',
              line: { color: '#ff7f0e', width: 3 },
              marker: { size: 8 },
              yaxis: 'y2',
            },
          ]}
          layout={{
            title: '',
            xaxis: { title: 'Mois' },
            yaxis: {
              title: 'Montant TTC (FCFA)',
              titlefont: { color: '#17becf' },
              tickfont: { color: '#17becf' },
            },
            yaxis2: {
              title: 'Consommation (kWh)',
              titlefont: { color: '#ff7f0e' },
              tickfont: { color: '#ff7f0e' },
              overlaying: 'y',
              side: 'right',
            },
            height: 400,
            hovermode: 'x unified',
          }}
        />
      </div>

      {/* Graph 5: Cos(φ) (if available) */}
      {graphData.cosphi && (
        <div style={styles.graphCard}>
          <h3 style={styles.graphTitle}>
            Évolution du Facteur de Puissance (Cos φ) et de la Consommation {year}
          </h3>
          <Chart
            data={[
              {
                x: graphData.cosphi.x,
                y: graphData.cosphi.consommation_mwh,
                name: 'Consommation (MWh)',
                type: 'bar',
                marker: { color: '#66B2FF' },
                opacity: 0.6,
                yaxis: 'y',
              },
              {
                x: graphData.cosphi.x,
                y: graphData.cosphi.cosphi,
                name: 'Cos(φ)',
                type: 'scatter',
                mode: 'lines+markers',
                line: { color: '#FF6B6B', width: 3 },
                marker: { size: 10, symbol: 'diamond' },
                yaxis: 'y2',
              },
            ]}
            layout={{
              title: '',
              xaxis: { title: 'Mois' },
              yaxis: {
                title: 'Consommation (MWh)',
                titlefont: { color: '#66B2FF' },
                tickfont: { color: '#66B2FF' },
              },
              yaxis2: {
                title: 'Facteur de Puissance (Cos φ)',
                titlefont: { color: '#FF6B6B' },
                tickfont: { color: '#FF6B6B' },
                overlaying: 'y',
                side: 'right',
                range: [0, 1],
              },
              height: 400,
              hovermode: 'x unified',
            }}
          />

          {/* Cos(φ) Metrics */}
          <div style={styles.cosphiMetrics}>
            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Cos(φ) moyen</div>
              <div style={styles.metricValue}>{graphData.cosphi.cosphi_moyen.toFixed(3)}</div>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Cos(φ) minimum</div>
              <div style={styles.metricValue}>{graphData.cosphi.cosphi_min.toFixed(3)}</div>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Cos(φ) maximum</div>
              <div style={styles.metricValue}>{graphData.cosphi.cosphi_max.toFixed(3)}</div>
            </div>
            <div style={styles.metricCard}>
              <div style={styles.metricLabel}>Mois {'<'} 0.85</div>
              <div style={styles.metricValue}>{graphData.cosphi.nb_mois_sous_seuil}/12</div>
            </div>
          </div>

          {/* Warning if Cos(φ) is low */}
          {graphData.cosphi.cosphi_moyen < 0.9 && (
            <div style={styles.warning}>
              <strong>⚠️ Attention : Facteur de puissance bas en {year}</strong>
              <p>
                Le facteur de puissance moyen ({graphData.cosphi.cosphi_moyen.toFixed(3)}) est inférieur
                à 0.85 sur {graphData.cosphi.nb_mois_sous_seuil} mois. Cela peut entraîner des pénalités
                et des pertes d'énergie.
              </p>
              <p>
                💡 <strong>Recommandation</strong> : Installation de batteries de condensateurs pour
                améliorer le facteur de puissance.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Synthese Table */}
      {tableData && (
        <div style={styles.tableSection}>
          <h3 style={styles.graphTitle}>Tableau de synthèse {year}</h3>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {Object.keys(tableData.tableau[0] || {}).map((key) => (
                    <th key={key} style={styles.th}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.tableau.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((value, i) => (
                      <td key={i} style={styles.td}>
                        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
  retryButton: {
    marginTop: '15px',
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  yearSelect: {
    padding: '10px 15px',
    fontSize: '16px',
    border: '2px solid #667eea',
    borderRadius: '6px',
    cursor: 'pointer',
    outline: 'none',
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  metricCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  metricLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  graphCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: '30px',
  },
  graphTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '20px',
  },
  cosphiMetrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '15px',
    marginTop: '20px',
  },
  warning: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '20px',
    color: '#856404',
  },
  tableSection: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: '30px',
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
    whiteSpace: 'nowrap',
  },
};

export default SynthesePage;
