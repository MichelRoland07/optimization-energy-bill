"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import useAuthStore from '@/store/useAuthStore';
import axios from 'axios';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ProfilData {
  annee_profil: number;
  annees_disponibles: number[];
  puissance_souscrite: number;
  consommation_totale_kwh: number;
  consommation_totale_mwh: number;
  nombre_jours: number;
  consommation_moyenne_jour: number;
  consommation_max_jour: number;
  date_consommation_max: string;
  consommation_min_jour: number;
  date_consommation_min: string;
  plot_conso_mensuelle: any;
  plot_conso_quotidienne: any;
}

export default function ProfilPage() {
  const { hasPermission } = useAuthStore();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [profilData, setProfilData] = useState<ProfilData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const canView = hasPermission('view_profil');

  useEffect(() => {
    if (canView) {
      fetchProfilData();
    }
  }, [canView]);

  const fetchProfilData = async (year?: number) => {
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const url = year
        ? `${API_BASE_URL}/api/data/profil?year=${year}`
        : `${API_BASE_URL}/api/data/profil`;

      const response = await axios.get<ProfilData>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProfilData(response.data);
      if (!selectedYear) {
        setSelectedYear(response.data.annee_profil);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Aucune donnée disponible. Veuillez d\'abord télécharger un fichier Excel depuis la page Accueil.');
      } else {
        setError(err.response?.data?.detail || 'Erreur lors du chargement des données');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    fetchProfilData(year);
  };

  if (!canView) {
    return (
      <div className="p-8">
        <Alert
          type="error"
          message="Vous n'avez pas la permission d'accéder à cette page. Veuillez contacter un administrateur."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Profil Client - État des lieux
            </h1>
            <p className="mt-2 text-gray-600">
              Analyse de votre consommation électrique
            </p>
          </div>

          {/* Year Selection */}
          {profilData && profilData.annees_disponibles.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Année:</label>
              <select
                value={selectedYear || ''}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                {profilData.annees_disponibles.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
          />
        )}

        {!profilData && !error && (
          <Alert
            type="info"
            message="Aucune donnée disponible. Veuillez d'abord télécharger un fichier Excel depuis la page Accueil."
          />
        )}

        {profilData && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Puissance Souscrite</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {profilData.puissance_souscrite.toFixed(0)} kVA
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Consommation Totale</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {profilData.consommation_totale_mwh.toFixed(2)} MWh
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {profilData.consommation_totale_kwh.toLocaleString('fr-FR')} kWh
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Consommation Moyenne</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {profilData.consommation_moyenne_jour.toFixed(0)} kWh/j
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Sur {profilData.nombre_jours} jours
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Consommation Max</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {profilData.consommation_max_jour.toFixed(0)} kWh
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(profilData.date_consommation_max).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Consumption */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Consommation Mensuelle
                </h3>
                <Plot
                  data={profilData.plot_conso_mensuelle.data}
                  layout={{
                    ...profilData.plot_conso_mensuelle.layout,
                    autosize: true,
                    height: 400,
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                  config={{ responsive: true }}
                />
              </Card>

              {/* Daily Consumption */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Consommation Quotidienne
                </h3>
                <Plot
                  data={profilData.plot_conso_quotidienne.data}
                  layout={{
                    ...profilData.plot_conso_quotidienne.layout,
                    autosize: true,
                    height: 400,
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                  config={{ responsive: true }}
                />
              </Card>
            </div>

            {/* Summary Stats */}
            <Card className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Période analysée</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    Année {profilData.annee_profil}
                  </p>
                  <p className="text-sm text-gray-500">{profilData.nombre_jours} jours de données</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Consommation minimale</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {profilData.consommation_min_jour.toFixed(0)} kWh
                  </p>
                  <p className="text-sm text-gray-500">
                    Le {new Date(profilData.date_consommation_min).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Variation</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {((profilData.consommation_max_jour - profilData.consommation_min_jour) / profilData.consommation_min_jour * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">Entre min et max</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
