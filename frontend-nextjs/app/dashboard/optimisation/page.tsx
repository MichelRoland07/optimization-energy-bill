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

interface OptimisationData {
  facture_actuelle: {
    type_tarif: string;
    puissance_actuelle: number;
    montant_annuel_ht: number;
    montant_annuel_ttc: number;
  };
  meilleure_option: {
    type_tarif: string;
    puissance_optimale: number;
    montant_annuel_ht: number;
    montant_annuel_ttc: number;
    economie_ht: number;
    economie_ttc: number;
    economie_pourcent: number;
  };
  toutes_simulations: Array<{
    type_tarif: string;
    puissance: number;
    montant_ht: number;
    montant_ttc: number;
    economie_vs_actuel: number;
    rang: number;
  }>;
  plot_comparaison: any;
  recommandations: string[];
}

export default function OptimisationPage() {
  const { hasPermission } = useAuthStore();
  const [optimisationData, setOptimisationData] = useState<OptimisationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const canView = hasPermission('view_optimisation');

  useEffect(() => {
    if (canView) {
      fetchOptimisationData();
    }
  }, [canView]);

  const fetchOptimisationData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get<OptimisationData>(
        `${API_BASE_URL}/api/optimisation/optimiser`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setOptimisationData(response.data);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Optimisation Tarifaire
          </h1>
          <p className="mt-2 text-gray-600">
            Trouvez le meilleur tarif pour réduire vos coûts
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
          />
        )}

        {!optimisationData && !error && (
          <Alert
            type="info"
            message="Aucune donnée disponible. Veuillez d'abord télécharger un fichier Excel depuis la page Accueil."
          />
        )}

        {optimisationData && (
          <>
            {/* Current vs Optimal Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Current Tariff */}
              <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Tarif Actuel</h3>
                    <p className="text-sm text-gray-600 mt-1">Votre situation actuelle</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Type de tarif</p>
                    <p className="text-lg font-semibold text-gray-900">{optimisationData.facture_actuelle.type_tarif}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Puissance souscrite</p>
                    <p className="text-lg font-semibold text-gray-900">{optimisationData.facture_actuelle.puissance_actuelle} kVA</p>
                  </div>
                  <div className="pt-3 border-t border-gray-300">
                    <p className="text-sm text-gray-600">Coût annuel HT</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {optimisationData.facture_actuelle.montant_annuel_ht.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} €
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Coût annuel TTC</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {optimisationData.facture_actuelle.montant_annuel_ttc.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} €
                    </p>
                  </div>
                </div>
              </Card>

              {/* Optimal Tariff */}
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Meilleure Option</h3>
                    <p className="text-sm text-green-700 mt-1">Tarif recommandé</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-200 flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-green-700">Type de tarif</p>
                    <p className="text-lg font-semibold text-green-900">{optimisationData.meilleure_option.type_tarif}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Puissance optimale</p>
                    <p className="text-lg font-semibold text-green-900">{optimisationData.meilleure_option.puissance_optimale} kVA</p>
                  </div>
                  <div className="pt-3 border-t border-green-300">
                    <p className="text-sm text-green-700">Coût annuel HT</p>
                    <p className="text-2xl font-bold text-green-900">
                      {optimisationData.meilleure_option.montant_annuel_ht.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} €
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Coût annuel TTC</p>
                    <p className="text-xl font-semibold text-green-900">
                      {optimisationData.meilleure_option.montant_annuel_ttc.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} €
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Savings Summary */}
            <Card className="mb-8 bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">Économie Potentielle Annuelle</p>
                <div className="flex items-center justify-center gap-8">
                  <div>
                    <p className="text-4xl font-bold">
                      {optimisationData.meilleure_option.economie_ttc.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} €
                    </p>
                    <p className="text-sm opacity-90 mt-1">TTC</p>
                  </div>
                  <div className="h-16 w-px bg-white opacity-30"></div>
                  <div>
                    <p className="text-4xl font-bold">
                      {optimisationData.meilleure_option.economie_pourcent.toFixed(1)}%
                    </p>
                    <p className="text-sm opacity-90 mt-1">de réduction</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Comparison Chart */}
            <Card className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Comparaison des Options Tarifaires
              </h3>
              <Plot
                data={optimisationData.plot_comparaison.data}
                layout={{
                  ...optimisationData.plot_comparaison.layout,
                  autosize: true,
                  height: 500,
                }}
                useResizeHandler
                style={{ width: '100%', height: '100%' }}
                config={{ responsive: true }}
              />
            </Card>

            {/* All Simulations Table */}
            <Card className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Toutes les Simulations
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rang
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type Tarif
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Puissance (kVA)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant HT (€)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant TTC (€)
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Économie (€)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {optimisationData.toutes_simulations.map((sim, index) => (
                      <tr
                        key={index}
                        className={`
                          ${sim.rang === 1 ? 'bg-green-50' : 'hover:bg-gray-50'}
                          ${sim.economie_vs_actuel === 0 ? 'bg-gray-50' : ''}
                        `}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {sim.rang === 1 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              #{sim.rang}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">#{sim.rang}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sim.type_tarif}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {sim.puissance}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {sim.montant_ht.toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {sim.montant_ttc.toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                          sim.economie_vs_actuel > 0 ? 'text-green-600' :
                          sim.economie_vs_actuel < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {sim.economie_vs_actuel > 0 ? '+' : ''}
                          {sim.economie_vs_actuel.toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Recommendations */}
            <Card className="bg-blue-50 border-blue-200">
              <div className="flex items-start">
                <svg className="h-6 w-6 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Recommandations</h3>
                  <ul className="text-sm text-blue-800 space-y-2">
                    {optimisationData.recommandations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
