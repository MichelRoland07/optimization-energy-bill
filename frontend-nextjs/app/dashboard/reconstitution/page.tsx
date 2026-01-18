"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import useAuthStore from '@/store/useAuthStore';
import dataService, { ReconstitutionResponse } from '@/services/data.service';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function ReconstitutionPage() {
  const { hasPermission } = useAuthStore();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [reconstitutionData, setReconstitutionData] = useState<ReconstitutionResponse | null>(null);
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
      // Use first available year if no year provided
      let yearToUse = year;

      if (!yearToUse && reconstitutionData) {
        yearToUse = reconstitutionData.annees_disponibles[0];
      } else if (!yearToUse) {
        // Try to get initial data to find available years
        const initialData = await dataService.getReconstitution(new Date().getFullYear());
        yearToUse = initialData.annees_disponibles[0];
      }

      const data = await dataService.getReconstitution(yearToUse!);
      setReconstitutionData(data);

      if (!selectedYear) {
        setSelectedYear(data.year);
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
              Reconstitution de la facture
            </h1>
            <p className="mt-2 text-gray-600">
              Comparaison entre factures réelles et recalculées
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
            {/* Global Metrics - 4 KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                <div>
                  <p className="text-sm font-medium text-blue-900">Facture réelle totale</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">
                    {reconstitutionData.metriques_globales.facture_reelle_total.toLocaleString('fr-FR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })} FCFA
                  </p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100">
                <div>
                  <p className="text-sm font-medium text-green-900">Facture recalculée totale</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">
                    {reconstitutionData.metriques_globales.facture_calculee_total.toLocaleString('fr-FR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })} FCFA
                  </p>
                </div>
              </Card>

              <Card className={`bg-gradient-to-br ${
                reconstitutionData.metriques_globales.gap_total >= 0
                  ? 'from-orange-50 to-orange-100'
                  : 'from-red-50 to-red-100'
              }`}>
                <div>
                  <p className={`text-sm font-medium ${
                    reconstitutionData.metriques_globales.gap_total >= 0
                      ? 'text-orange-900'
                      : 'text-red-900'
                  }`}>Écart (Gap)</p>
                  <p className={`text-3xl font-bold mt-2 ${
                    reconstitutionData.metriques_globales.gap_total >= 0
                      ? 'text-orange-900'
                      : 'text-red-900'
                  }`}>
                    {reconstitutionData.metriques_globales.gap_total.toLocaleString('fr-FR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })} FCFA
                  </p>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                <div>
                  <p className="text-sm font-medium text-purple-900">Dépassements de puissance</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">
                    {reconstitutionData.metriques_globales.nb_depassements}
                  </p>
                </div>
              </Card>
            </div>

            {/* Monthly Details Table */}
            <Card className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Détails Mensuels
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mois
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Puissance souscrite (kW)
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Puissance atteinte (kW)
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dépassement (kW)
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type tarifaire
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Facture réelle (FCFA)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Facture recalculée (FCFA)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Écart (FCFA)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reconstitutionData.tableau_mensuel.map((row, index) => {
                      const hasSignificantGap = Math.abs(row.ecart) > 100;

                      return (
                        <tr
                          key={index}
                          className={hasSignificantGap ? 'bg-red-50' : 'hover:bg-gray-50'}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {row.mois}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                            {row.puissance_souscrite.toLocaleString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                            {row.puissance_atteinte.toLocaleString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                            <span className={row.depassement > 0 ? 'text-red-600 font-semibold' : ''}>
                              {row.depassement.toLocaleString('fr-FR')}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">
                            Type {row.type_tarifaire}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            {row.facture_reelle.toLocaleString('fr-FR', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            {row.facture_calculee.toLocaleString('fr-FR', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${
                            hasSignificantGap
                              ? 'text-red-700'
                              : row.ecart >= 0
                                ? 'text-orange-600'
                                : 'text-green-600'
                          }`}>
                            {row.ecart.toLocaleString('fr-FR', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Graph 1: Comparison Real vs Recalculated */}
            <Card className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {reconstitutionData.graph_comparaison.title}
              </h3>
              <Plot
                data={[
                  {
                    x: reconstitutionData.graph_comparaison.x,
                    y: reconstitutionData.graph_comparaison.y_reelle,
                    type: 'bar',
                    name: 'Facture réelle',
                    marker: { color: '#3B82F6' }
                  },
                  {
                    x: reconstitutionData.graph_comparaison.x,
                    y: reconstitutionData.graph_comparaison.y_calculee,
                    type: 'bar',
                    name: 'Facture recalculée',
                    marker: { color: '#10B981' }
                  }
                ]}
                layout={{
                  autosize: true,
                  height: 400,
                  xaxis: { title: reconstitutionData.graph_comparaison.xaxis_title },
                  yaxis: { title: reconstitutionData.graph_comparaison.yaxis_title },
                  barmode: 'group',
                  showlegend: true,
                  legend: { orientation: 'h', y: -0.2 }
                }}
                useResizeHandler
                style={{ width: '100%', height: '100%' }}
                config={{ responsive: true }}
              />
            </Card>

            {/* Text area for analysis 1 */}
            <Card className="mb-8 bg-blue-50">
              <h4 className="text-md font-semibold text-blue-900 mb-2">
                Analyse de la comparaison
              </h4>
              <textarea
                className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                rows={4}
                placeholder="Saisir votre analyse de la comparaison entre factures réelles et recalculées..."
              />
            </Card>

            {/* Graph 2: Monthly Gaps */}
            <Card className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {reconstitutionData.graph_ecarts.title}
              </h3>
              <Plot
                data={[
                  {
                    x: reconstitutionData.graph_ecarts.x,
                    y: reconstitutionData.graph_ecarts.y,
                    type: 'bar',
                    name: 'Écart',
                    marker: {
                      color: reconstitutionData.graph_ecarts.y.map(val => val >= 0 ? '#10B981' : '#EF4444')
                    }
                  }
                ]}
                layout={{
                  autosize: true,
                  height: 400,
                  xaxis: { title: reconstitutionData.graph_ecarts.xaxis_title },
                  yaxis: { title: reconstitutionData.graph_ecarts.yaxis_title },
                  showlegend: false,
                  shapes: [{
                    type: 'line',
                    x0: 0,
                    x1: 1,
                    xref: 'paper',
                    y0: 0,
                    y1: 0,
                    line: {
                      color: 'black',
                      width: 1,
                      dash: 'dash'
                    }
                  }]
                }}
                useResizeHandler
                style={{ width: '100%', height: '100%' }}
                config={{ responsive: true }}
              />
            </Card>

            {/* Text area for analysis 2 */}
            <Card className="bg-green-50">
              <h4 className="text-md font-semibold text-green-900 mb-2">
                Analyse des écarts
              </h4>
              <textarea
                className="w-full p-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
                rows={4}
                placeholder="Saisir votre analyse des écarts mensuels..."
              />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
