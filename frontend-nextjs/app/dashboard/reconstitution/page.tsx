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

interface ReconstitutionData {
  annee_reconstitution: number;
  annees_disponibles: number[];
  montant_total_facture: number;
  montant_part_fixe: number;
  montant_part_variable: number;
  montant_taxes: number;
  montant_ht: number;
  montant_ttc: number;
  consommation_totale_kwh: number;
  puissance_souscrite: number;
  prix_moyen_kwh: number;
  plot_facture_mensuelle: any;
  plot_repartition: any;
  details_mensuels: Array<{
    mois: string;
    consommation_kwh: number;
    montant_ht: number;
    montant_ttc: number;
  }>;
}

export default function ReconstitutionPage() {
  const { hasPermission } = useAuthStore();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [reconstitutionData, setReconstitutionData] = useState<ReconstitutionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const canView = hasPermission('view_reconstitution');

  useEffect(() => {
    if (canView) {
      fetchReconstitutionData();
    }
  }, [canView]);

  const fetchReconstitutionData = async (year?: number) => {
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const url = year
        ? `${API_BASE_URL}/api/data/reconstitution?year=${year}`
        : `${API_BASE_URL}/api/data/reconstitution`;

      const response = await axios.get<ReconstitutionData>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setReconstitutionData(response.data);
      if (!selectedYear) {
        setSelectedYear(response.data.annee_reconstitution);
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
    fetchReconstitutionData(year);
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
              Reconstitution de la Facture
            </h1>
            <p className="mt-2 text-gray-600">
              Détail de votre facturation électrique
            </p>
          </div>

          {/* Year Selection */}
          {reconstitutionData && reconstitutionData.annees_disponibles.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Année:</label>
              <select
                value={selectedYear || ''}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                {reconstitutionData.annees_disponibles.map((year) => (
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

        {!reconstitutionData && !error && (
          <Alert
            type="info"
            message="Aucune donnée disponible. Veuillez d'abord télécharger un fichier Excel depuis la page Accueil."
          />
        )}

        {reconstitutionData && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                <div>
                  <p className="text-sm font-medium text-blue-900">Montant HT</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">
                    {reconstitutionData.montant_ht.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} €
                  </p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100">
                <div>
                  <p className="text-sm font-medium text-green-900">Montant TTC</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">
                    {reconstitutionData.montant_ttc.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} €
                  </p>
                </div>
              </Card>

              <Card>
                <div>
                  <p className="text-sm font-medium text-gray-600">Prix Moyen kWh</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {reconstitutionData.prix_moyen_kwh.toFixed(4)} €
                  </p>
                </div>
              </Card>

              <Card>
                <div>
                  <p className="text-sm font-medium text-gray-600">Consommation Totale</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {reconstitutionData.consommation_totale_kwh.toLocaleString('fr-FR')} kWh
                  </p>
                </div>
              </Card>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Part Fixe</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {reconstitutionData.montant_part_fixe.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} €
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Part Variable</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {reconstitutionData.montant_part_variable.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} €
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxes</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {reconstitutionData.montant_taxes.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} €
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    </svg>
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Monthly Bill */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Facture Mensuelle
                </h3>
                <Plot
                  data={reconstitutionData.plot_facture_mensuelle.data}
                  layout={{
                    ...reconstitutionData.plot_facture_mensuelle.layout,
                    autosize: true,
                    height: 400,
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                  config={{ responsive: true }}
                />
              </Card>

              {/* Cost Breakdown */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Répartition des Coûts
                </h3>
                <Plot
                  data={reconstitutionData.plot_repartition.data}
                  layout={{
                    ...reconstitutionData.plot_repartition.layout,
                    autosize: true,
                    height: 400,
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                  config={{ responsive: true }}
                />
              </Card>
            </div>

            {/* Monthly Details Table */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Détails Mensuels
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mois
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Consommation (kWh)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant HT (€)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant TTC (€)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reconstitutionData.details_mensuels.map((detail, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {detail.mois}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {detail.consommation_kwh.toLocaleString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {detail.montant_ht.toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                          {detail.montant_ttc.toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        TOTAL
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                        {reconstitutionData.consommation_totale_kwh.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                        {reconstitutionData.montant_ht.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-600 text-right">
                        {reconstitutionData.montant_ttc.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
