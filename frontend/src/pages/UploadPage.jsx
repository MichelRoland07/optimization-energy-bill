/**
 * Upload Page for Excel files
 */
import React, { useState } from 'react';
import { dataAPI } from '../services/api';

const UploadPage = ({ onDataUploaded }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [selectingService, setSelectingService] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setError('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
        return;
      }
      setFile(selectedFile);
      setError('');
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await dataAPI.uploadFile(file);
      setUploadResult(result);

      if (result.single_service && result.data_ready) {
        // Single service: data is ready
        onDataUploaded(result);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'upload du fichier');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = async (serviceNo) => {
    setSelectingService(true);
    setError('');

    try {
      const result = await dataAPI.selectService(serviceNo);
      onDataUploaded(result);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la sélection du service');
    } finally {
      setSelectingService(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>📤 Upload de données</h2>
        <p style={styles.subtitle}>
          Importez un fichier Excel contenant les données de consommation énergétique
        </p>

        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {!uploadResult && (
          <div style={styles.uploadSection}>
            <div style={styles.fileInput}>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                style={styles.input}
                id="file-upload"
              />
              <label htmlFor="file-upload" style={styles.fileLabel}>
                {file ? file.name : 'Choisir un fichier Excel...'}
              </label>
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              style={{
                ...styles.button,
                ...(!file || loading ? styles.buttonDisabled : {}),
              }}
            >
              {loading ? 'Upload en cours...' : 'Uploader'}
            </button>

            <div style={styles.info}>
              <p style={styles.infoText}>
                ℹ️ Le fichier doit contenir les colonnes suivantes:
              </p>
              <ul style={styles.infoList}>
                <li>SERVICE_NO, CUST_NAME, REGION</li>
                <li>READING_DATE, SUBSCRIPTION_LOAD, PUISSANCE_ATTEINTE</li>
                <li>MV_CONSUMPTION, ACTIVE_OFF_PEAK_IMP, ACTIVE_PEAK_IMP</li>
                <li>AMOUNT_WITHOUT_TAX, AMOUNT_WITH_TAX</li>
              </ul>
            </div>
          </div>
        )}

        {uploadResult && !uploadResult.single_service && (
          <div style={styles.servicesSection}>
            <h3 style={styles.servicesTitle}>
              ✅ Fichier uploadé avec succès!
            </h3>
            <p style={styles.servicesSubtitle}>
              Plusieurs services détectés ({uploadResult.services.length}).
              Veuillez sélectionner un service:
            </p>

            <div style={styles.servicesList}>
              {uploadResult.services.map((service) => (
                <div
                  key={service.service_no}
                  style={styles.serviceCard}
                  onClick={() => !selectingService && handleServiceSelect(service.service_no)}
                >
                  <div style={styles.serviceHeader}>
                    <span style={styles.serviceName}>{service.nom_client}</span>
                    <span style={styles.serviceBadge}>{service.region}</span>
                  </div>
                  <div style={styles.serviceDetails}>
                    <div style={styles.serviceDetail}>
                      <span style={styles.serviceLabel}>Service N°:</span>
                      <span style={styles.serviceValue}>{service.service_no}</span>
                    </div>
                    <div style={styles.serviceDetail}>
                      <span style={styles.serviceLabel}>Puissance:</span>
                      <span style={styles.serviceValue}>{service.puissance} kW</span>
                    </div>
                    <div style={styles.serviceDetail}>
                      <span style={styles.serviceLabel}>Lignes:</span>
                      <span style={styles.serviceValue}>{service.nb_lignes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadResult && uploadResult.single_service && (
          <div style={styles.successSection}>
            <div style={styles.successIcon}>✅</div>
            <h3 style={styles.successTitle}>Upload réussi!</h3>
            <p style={styles.successText}>
              Service: <strong>{uploadResult.service_no}</strong>
            </p>
            <p style={styles.successText}>
              Client: <strong>{uploadResult.nom_client}</strong>
            </p>
            <p style={styles.successSubtext}>
              Les données sont prêtes à être analysées.
              Utilisez les onglets ci-dessus pour accéder aux analyses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  uploadSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fileInput: {
    position: 'relative',
  },
  input: {
    display: 'none',
  },
  fileLabel: {
    display: 'block',
    padding: '60px 20px',
    border: '2px dashed #ddd',
    borderRadius: '8px',
    textAlign: 'center',
    cursor: 'pointer',
    color: '#666',
    fontSize: '16px',
    transition: 'all 0.3s',
  },
  button: {
    padding: '15px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  info: {
    backgroundColor: '#f0f8ff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #d0e8ff',
  },
  infoText: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    color: '#555',
  },
  infoList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#666',
  },
  servicesSection: {
    marginTop: '20px',
  },
  servicesTitle: {
    fontSize: '22px',
    color: '#27ae60',
    marginBottom: '10px',
  },
  servicesSubtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
  },
  servicesList: {
    display: 'grid',
    gap: '15px',
  },
  serviceCard: {
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  serviceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  serviceName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  },
  serviceBadge: {
    padding: '4px 12px',
    backgroundColor: '#667eea',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  serviceDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
  },
  serviceDetail: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  serviceLabel: {
    fontSize: '12px',
    color: '#999',
  },
  serviceValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  successSection: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  successIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  successTitle: {
    fontSize: '24px',
    color: '#27ae60',
    marginBottom: '20px',
  },
  successText: {
    fontSize: '16px',
    color: '#555',
    marginBottom: '10px',
  },
  successSubtext: {
    fontSize: '14px',
    color: '#999',
    marginTop: '20px',
  },
};

export default UploadPage;
