/**
 * Main Dashboard with navigation
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadPage from './UploadPage';
import ProfilPage from './ProfilPage';
import RefacturationPage from './RefacturationPage';
import OptimisationPage from './OptimisationPage';
import SimulateurPage from './SimulateurPage';
import DocumentationPage from './DocumentationPage';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [dataReady, setDataReady] = useState(false);
  const [serviceNo, setServiceNo] = useState(null);
  const [nomClient, setNomClient] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleDataUploaded = (data) => {
    setDataReady(true);
    setServiceNo(data.service_no);
    setNomClient(data.nom_client);
    // Automatically switch to profil tab after upload (État des lieux et profil)
    setActiveTab('profil');
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.logo}>⚡ SABC Optimisation</h1>
          {nomClient && (
            <div style={styles.clientInfo}>
              <span style={styles.clientName}>{nomClient}</span>
              <span style={styles.serviceNo}>Service: {serviceNo}</span>
            </div>
          )}
        </div>
        <div style={styles.headerRight}>
          <span style={styles.username}>{user.username}</span>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Déconnexion
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={styles.nav}>
        <button
          onClick={() => setActiveTab('upload')}
          style={{
            ...styles.navButton,
            ...(activeTab === 'upload' ? styles.navButtonActive : {}),
          }}
        >
          🏠 Accueil
        </button>
        <button
          onClick={() => setActiveTab('profil')}
          disabled={!dataReady}
          style={{
            ...styles.navButton,
            ...(activeTab === 'profil' ? styles.navButtonActive : {}),
            ...(!dataReady ? styles.navButtonDisabled : {}),
          }}
        >
          📊 État des lieux et profil
        </button>
        <button
          onClick={() => setActiveTab('refacturation')}
          disabled={!dataReady}
          style={{
            ...styles.navButton,
            ...(activeTab === 'refacturation' ? styles.navButtonActive : {}),
            ...(!dataReady ? styles.navButtonDisabled : {}),
          }}
        >
          💰 Reconstitution de la facture
        </button>
        <button
          onClick={() => setActiveTab('optimisation')}
          disabled={!dataReady}
          style={{
            ...styles.navButton,
            ...(activeTab === 'optimisation' ? styles.navButtonActive : {}),
            ...(!dataReady ? styles.navButtonDisabled : {}),
          }}
        >
          🔄 Optimisation
        </button>
        <button
          onClick={() => setActiveTab('simulateur')}
          style={{
            ...styles.navButton,
            ...(activeTab === 'simulateur' ? styles.navButtonActive : {}),
          }}
        >
          🎯 Simulateur de tarifs
        </button>
        <button
          onClick={() => setActiveTab('documentation')}
          style={{
            ...styles.navButton,
            ...(activeTab === 'documentation' ? styles.navButtonActive : {}),
          }}
        >
          📄 Documentation
        </button>
      </nav>

      {/* Content */}
      <main style={styles.content}>
        {activeTab === 'upload' && (
          <UploadPage onDataUploaded={handleDataUploaded} />
        )}
        {activeTab === 'profil' && dataReady && <ProfilPage />}
        {activeTab === 'refacturation' && dataReady && <RefacturationPage />}
        {activeTab === 'optimisation' && dataReady && <OptimisationPage />}
        {activeTab === 'simulateur' && <SimulateurPage />}
        {activeTab === 'documentation' && <DocumentationPage />}
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: 'white',
    padding: '20px 40px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '30px',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea',
    margin: 0,
  },
  clientInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  clientName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  serviceNo: {
    fontSize: '12px',
    color: '#666',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  username: {
    fontSize: '14px',
    color: '#666',
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#ff6b6b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  nav: {
    backgroundColor: 'white',
    padding: '0 40px',
    display: 'flex',
    gap: '5px',
    borderBottom: '1px solid #e0e0e0',
  },
  navButton: {
    padding: '15px 25px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
    color: '#666',
    transition: 'all 0.3s',
  },
  navButtonActive: {
    color: '#667eea',
    borderBottomColor: '#667eea',
  },
  navButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  content: {
    padding: '30px 40px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
};

export default Dashboard;
