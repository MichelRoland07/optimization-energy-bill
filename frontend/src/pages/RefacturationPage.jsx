/**
 * Refacturation Page - Invoice reconstruction
 */
import React, { useState, useEffect } from 'react';
import { refacturationAPI } from '../services/api';

const RefacturationPage = () => {
  const [year, setYear] = useState(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await refacturationAPI.getRefacturation(year);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Chargement...</div>;
  if (error) return <div style={styles.error}>⚠️ {error}</div>;
  if (!data) return null;

  const { metriques, tableau } = data;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>💰 Refacturation {year}</h2>
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

      {/* Metrics */}
      <div style={styles.metrics}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Facture réelle totale</div>
          <div style={styles.metricValue}>
            {(metriques.facture_reelle_total / 1e6).toFixed(2)} M FCFA
          </div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Facture recalculée totale</div>
          <div style={styles.metricValue}>
            {(metriques.facture_recalculee_total / 1e6).toFixed(2)} M FCFA
          </div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Gap total</div>
          <div style={{
            ...styles.metricValue,
            color: metriques.gap_total > 0 ? '#e74c3c' : '#27ae60'
          }}>
            {(metriques.gap_total / 1e6).toFixed(2)} M FCFA
          </div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Gap %</div>
          <div style={{
            ...styles.metricValue,
            color: Math.abs(metriques.gap_pct) > 5 ? '#e74c3c' : '#27ae60'
          }}>
            {metriques.gap_pct.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        <h3 style={styles.tableTitle}>
          Comparaison mensuelle (Gaps &gt; 100 FCFA mis en évidence)
        </h3>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Mois</th>
                <th style={styles.th}>P. Souscrite (kW)</th>
                <th style={styles.th}>P. Atteinte (kW)</th>
                <th style={styles.th}>Dépassement (kW)</th>
                <th style={styles.th}>Type Tarif</th>
                <th style={styles.th}>Consommation (kWh)</th>
                <th style={styles.th}>Facture Réelle (FCFA)</th>
                <th style={styles.th}>Facture Recalculée (FCFA)</th>
                <th style={styles.th}>Écart (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              {tableau.map((row, idx) => (
                <tr
                  key={idx}
                  style={row.has_gap ? styles.trHighlighted : {}}
                >
                  <td style={styles.td}>{row.mois}</td>
                  <td style={styles.td}>{row.puissance_souscrite}</td>
                  <td style={styles.td}>{row.puissance_atteinte}</td>
                  <td style={{
                    ...styles.td,
                    color: row.depassement > 0 ? '#e74c3c' : '#666'
                  }}>
                    {row.depassement}
                  </td>
                  <td style={styles.td}>{row.type_tarifaire}</td>
                  <td style={styles.td}>{row.consommation.toLocaleString('fr-FR')}</td>
                  <td style={styles.td}>{row.facture_reelle.toLocaleString('fr-FR')}</td>
                  <td style={styles.td}>{row.facture_recalculee.toLocaleString('fr-FR')}</td>
                  <td style={{
                    ...styles.td,
                    fontWeight: 'bold',
                    color: Math.abs(row.ecart) > 100 ? '#e74c3c' : '#27ae60'
                  }}>
                    {row.ecart.toLocaleString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info box */}
      <div style={styles.infoBox}>
        <p style={styles.infoTitle}>ℹ️ À propos de cette analyse</p>
        <p style={styles.infoText}>
          Cette page compare les factures réelles avec les factures recalculées selon les tarifs en vigueur.
          Les lignes surlignées en rouge indiquent des écarts supérieurs à 100 FCFA.
        </p>
        <p style={styles.infoText}>
          <strong>Dépassements:</strong> {metriques.nb_depassements} mois avec puissance atteinte &gt; puissance souscrite
        </p>
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
  tableCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: '30px',
  },
  tableTitle: {
    fontSize: '20px',
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
  trHighlighted: {
    backgroundColor: '#ffe6e6',
  },
  infoBox: {
    backgroundColor: '#f0f8ff',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #d0e8ff',
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '10px',
  },
  infoText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  },
};

export default RefacturationPage;
