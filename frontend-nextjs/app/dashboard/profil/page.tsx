"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import useAuthStore from '@/store/useAuthStore';
import dataService, { type ProfilClientResponse } from '@/services/data.service';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function ProfilPage() {
  const { hasPermission } = useAuthStore();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [profilData, setProfilData] = useState<ProfilClientResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Section 4: Tableaux de synthèse
  const [selectedYearSynthese, setSelectedYearSynthese] = useState<number | null>(null);
  const [syntheseData, setSyntheseData] = useState<any>(null);
  const [graphiquesData, setGraphiquesData] = useState<any>(null);
  const [isLoadingSynthese, setIsLoadingSynthese] = useState(false);

  const canView = hasPermission('view_profil');

  useEffect(() => {
    if (canView) {
      console.log('[Profil] Fetching profil data...');
      fetchProfilData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  const fetchProfilData = async (year?: number) => {
    setIsLoading(true);
    setError('');

    try {
      console.log('[Profil] Calling dataService.getProfilClient with year:', year);
      const data = await dataService.getProfilClient(year);
      console.log('[Profil] Data received:', data);
      setProfilData(data);
      if (!selectedYear) {
        setSelectedYear(data.profil_energetique.annee_selectionnee);
      }
    } catch (err: any) {
      console.error('[Profil] Error fetching data:', err);
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

  const fetchSyntheseData = async (year: number) => {
    setIsLoadingSynthese(true);
    try {
      const [synthese, graphiques] = await Promise.all([
        dataService.getSynthese(year),
        dataService.getGraphiques(year)
      ]);
      setSyntheseData(synthese);
      setGraphiquesData(graphiques);
    } catch (err: any) {
      console.error('Erreur chargement synthèse:', err);
    } finally {
      setIsLoadingSynthese(false);
    }
  };

  const handleYearChangeSynthese = (year: number) => {
    setSelectedYearSynthese(year);
    fetchSyntheseData(year);
  };

  useEffect(() => {
    if (profilData && !selectedYearSynthese) {
      const defaultYear = profilData.profil_energetique.annee_selectionnee;
      setSelectedYearSynthese(defaultYear);
      fetchSyntheseData(defaultYear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilData]);

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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Titre Principal */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary-600 text-center mb-2">
            État des lieux et profil
          </h1>
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
            {/* SECTION 1: PROFIL CLIENT */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">👤 Profil du client</h2>
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <p className="font-semibold text-gray-700">Nom du client:</p>
                  <p className="text-gray-900 mt-1 break-words">{profilData.infos_administratives.nom_client}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">N° de service:</p>
                  <p className="text-gray-900 mt-1">{profilData.infos_administratives.service_no}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Région:</p>
                  <p className="text-gray-900 mt-1">{profilData.infos_administratives.region}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Division:</p>
                  <p className="text-gray-900 mt-1">{profilData.infos_administratives.division}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Agence:</p>
                  <p className="text-gray-900 mt-1">{profilData.infos_administratives.agence}</p>
                </div>
              </div>
              <hr className="mt-6 border-gray-300" />
            </div>

            {/* SECTION 2: RÉSUMÉ DU PROFIL ÉNERGÉTIQUE */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Résumé du profil énergétique du client</h2>

              {/* Sélecteur d'année */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner l'année pour le profil énergétique
                </label>
                <select
                  value={selectedYear || ''}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  {profilData.infos_administratives.annees_disponibles.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tableau 1: Caractéristiques contractuelles */}
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Caractéristiques contractuelles et tarifaires ({profilData.profil_energetique.annee_selectionnee})
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300 bg-white">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Puissance souscrite</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Type tarifaire</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Plage horaire applicable</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">
                          Tarif HC ({profilData.profil_energetique.annee_selectionnee})
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">
                          Tarif HP ({profilData.profil_energetique.annee_selectionnee})
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">
                          Prime Fixe ({profilData.profil_energetique.annee_selectionnee})
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 text-gray-900">
                          {profilData.profil_energetique.puissance_souscrite.toFixed(0)} kW
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-900 whitespace-pre-line">
                          Type {profilData.profil_energetique.type_tarifaire}{'\n'}
                          ({profilData.profil_energetique.categorie})
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-900">
                          {profilData.profil_energetique.plage_horaire}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-900">
                          {profilData.profil_energetique.tarif_hc.toFixed(3)} FCFA/kWh
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-900">
                          {profilData.profil_energetique.tarif_hp.toFixed(3)} FCFA/kWh
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-900">
                          {profilData.profil_energetique.prime_fixe.toFixed(2)} FCFA/kW
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tableau 2: Puissances atteintes */}
              {profilData.graphiques_profil_energetique && (
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Puissances atteintes sur la période ({profilData.profil_energetique.annee_selectionnee})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 bg-white">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Puissance maximum</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Puissance minimum</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Puissance moyenne</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 text-gray-900">
                            {profilData.profil_energetique.puissance_max.toFixed(0)} kW
                            {profilData.profil_energetique.puissance_max > profilData.profil_energetique.puissance_souscrite && ' ⚠️'}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-900">
                            {profilData.profil_energetique.puissance_min.toFixed(0)} kW
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-900">
                            {profilData.profil_energetique.puissance_moyenne.toFixed(0)} kW
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tableau 3: Consommations */}
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Consommations sur la période ({profilData.profil_energetique.annee_selectionnee})
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300 bg-white">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Conso. max mensuelle</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Conso. min mensuelle</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Conso. moyenne mensuelle</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Conso. creuse moyenne</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Conso. pointe moyenne</th>
                        <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Ratio HC/HP</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 text-gray-900">
                          {profilData.profil_energetique.consommation_max.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kWh
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-900">
                          {profilData.profil_energetique.consommation_min.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kWh
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-900">
                          {profilData.profil_energetique.consommation_moyenne.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kWh
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-900">
                          {profilData.profil_energetique.conso_hc_moyenne.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kWh
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-900">
                          {profilData.profil_energetique.conso_hp_moyenne.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kWh
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-900">
                          {profilData.profil_energetique.ratio_hc.toFixed(1)}% / {profilData.profil_energetique.ratio_hp.toFixed(1)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tableau 4: Facturation TTC */}
              {profilData.graphiques_profil_energetique && (
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Facturation TTC sur la période ({profilData.profil_energetique.annee_selectionnee})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 bg-white">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Facture TTC max</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Facture TTC min</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Facture TTC moyenne</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">
                            Facture TTC totale ({profilData.profil_energetique.annee_selectionnee})
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 text-gray-900">
                            {Math.max(...profilData.graphiques_profil_energetique.graph_factures.y).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-900">
                            {Math.min(...profilData.graphiques_profil_energetique.graph_factures.y).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-900">
                            {(profilData.graphiques_profil_energetique.graph_factures.y.reduce((a, b) => a + b, 0) / profilData.graphiques_profil_energetique.graph_factures.y.length).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-900">
                            {profilData.graphiques_profil_energetique.graph_factures.y.reduce((a, b) => a + b, 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tableau 5: Cos φ (si disponible) */}
              {profilData.profil_energetique.cosphi && (
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Facteur de puissance Cos φ ({profilData.profil_energetique.annee_selectionnee})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 bg-white">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Cos φ max</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Cos φ min</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Cos φ moyen</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Mois avec Cos φ &lt; 0.9</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 text-gray-900">
                            {profilData.profil_energetique.cosphi.max.toFixed(2)} {profilData.profil_energetique.cosphi.max >= 0.9 ? '✅' : '🔴'}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-900">
                            {profilData.profil_energetique.cosphi.min.toFixed(2)} {profilData.profil_energetique.cosphi.min >= 0.9 ? '✅' : '🔴'}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-900">
                            {profilData.profil_energetique.cosphi.moyen.toFixed(2)} {profilData.profil_energetique.cosphi.moyen >= 0.9 ? '✅' : '🔴'}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-900">
                            {profilData.profil_energetique.cosphi.nb_mois_sous_seuil} / 12 mois {profilData.profil_energetique.cosphi.nb_mois_sous_seuil === 0 ? '✅' : '🔴'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <hr className="mt-6 border-gray-300" />
            </div>

            {/* SECTION 3: PROFIL DE CONSOMMATION */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Profil de consommation</h2>

              {/* Graphique: Évolution consommation mensuelle sur 3 ans */}
              <Card className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Évolution de la consommation mensuelle sur 3 ans
                </h4>
                <Plot
                  data={profilData.profil_consommation.series_consommation.map((serie, idx) => ({
                    x: serie.mois,
                    y: serie.consommation,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: `${serie.annee}`,
                    line: { width: 2, color: ['#1f77b4', '#ff7f0e', '#2ca02c'][idx % 3] },
                    marker: { size: 6 },
                    hovertemplate: '<b>%{fullData.name}</b><br>Mois: %{x}<br>Consommation: %{y:,.0f} kWh<extra></extra>'
                  }))}
                  layout={{
                    autosize: true,
                    height: 450,
                    margin: { l: 60, r: 30, t: 30, b: 60 },
                    xaxis: {
                      title: 'Mois',
                      tickmode: 'array',
                      tickvals: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                      ticktext: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
                    },
                    yaxis: { title: 'Consommation (kWh)' },
                    hovermode: 'x unified',
                    font: { family: 'Arial, sans-serif', size: 14 },
                    showlegend: true,
                    legend: {
                      orientation: 'h',
                      yanchor: 'bottom',
                      y: 1.02,
                      xanchor: 'right',
                      x: 1
                    }
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                  config={{ responsive: true }}
                />
              </Card>

              {/* Tableau: Variation de la consommation totale */}
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Variation de la consommation totale
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300 bg-white">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">Indicateur</th>
                        {profilData.profil_consommation.annees.map(annee => (
                          <th key={annee} className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">
                            {annee}
                          </th>
                        ))}
                        {profilData.profil_consommation.annees.length > 1 && profilData.profil_consommation.annees.slice(1).map((annee, idx) => (
                          <th key={`var-${annee}`} className="border border-gray-300 px-4 py-2 text-left text-gray-900 font-semibold">
                            Variation {profilData.profil_consommation.annees[idx]}/{annee}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2 text-gray-900">
                          Consommation totale (kWh)
                        </td>
                        {profilData.profil_consommation.series_consommation.map(serie => {
                          const total = serie.consommation.reduce((a, b) => a + b, 0);
                          return (
                            <td key={serie.annee} className="border border-gray-300 px-4 py-2 text-gray-900">
                              {total.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                            </td>
                          );
                        })}
                        {profilData.profil_consommation.series_consommation.length > 1 &&
                          profilData.profil_consommation.series_consommation.slice(1).map((serie, idx) => {
                            const totalCurr = serie.consommation.reduce((a, b) => a + b, 0);
                            const totalPrev = profilData.profil_consommation.series_consommation[idx].consommation.reduce((a, b) => a + b, 0);
                            const variation = totalPrev > 0 ? ((totalCurr - totalPrev) / totalPrev * 100).toFixed(1) : '0.0';
                            return (
                              <td key={`var-${serie.annee}`} className="border border-gray-300 px-4 py-2 text-gray-900">
                                {variation}%
                              </td>
                            );
                          })
                        }
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* SECTION 4: TABLEAUX DE SYNTHÈSE PAR ANNÉE */}
            <div className="mb-6">
              <hr className="my-6 border-gray-300" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Tableaux de synthèse par année</h2>

              {/* Sélecteur d'année pour synthèse */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner une année
                </label>
                <select
                  value={selectedYearSynthese || ''}
                  onChange={(e) => handleYearChangeSynthese(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  {profilData.infos_administratives.annees_disponibles.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tableau de synthèse */}
              {isLoadingSynthese && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Génération du tableau {selectedYearSynthese}...</p>
                </div>
              )}

              {syntheseData && !isLoadingSynthese && (
                <>
                  <div className="mb-6 overflow-x-auto">
                    <table className="min-w-full border border-gray-300 text-sm bg-white">
                      <thead className="bg-gray-100">
                        <tr>
                          {/* En-têtes : Mois, Année XXXX, puis les 12 mois */}
                          {syntheseData.tableau[0] && Object.keys(syntheseData.tableau[0]).map((key) => (
                            <th key={key} className="border border-gray-300 px-3 py-2 text-center text-gray-900 font-semibold whitespace-nowrap">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Chaque ligne représente un indicateur */}
                        {syntheseData.tableau.map((row: any, idx: number) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {Object.entries(row).map(([key, value]: [string, any], colIdx: number) => (
                              <td
                                key={colIdx}
                                className={`border border-gray-300 px-3 py-2 text-gray-900 ${
                                  colIdx === 0 ? 'font-semibold text-left' : 'text-right'
                                }`}
                              >
                                {colIdx === 0
                                  ? value
                                  : (typeof value === 'number'
                                      ? value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
                                      : value || '')
                                }
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Graphiques de synthèse */}
                  {graphiquesData && (
                    <>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">📈 Graphiques {selectedYearSynthese}</h3>

                      {/* Graphique 1: Évolution de la consommation mensuelle */}
                      <Card className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Évolution de la consommation mensuelle {selectedYearSynthese}
                        </h4>
                        <Plot
                          data={[{
                            x: graphiquesData.consommation_mensuelle.x,
                            y: graphiquesData.consommation_mensuelle.y,
                            type: 'scatter',
                            mode: 'lines+markers',
                            name: graphiquesData.consommation_mensuelle.name,
                            line: { color: '#1f77b4', width: 2 },
                            marker: { size: 6 },
                            fill: 'tozeroy'
                          }]}
                          layout={{
                            autosize: true,
                            height: 400,
                            margin: { l: 60, r: 30, t: 30, b: 60 },
                            xaxis: { title: 'Mois' },
                            yaxis: { title: 'Consommation (kWh)' },
                            font: { family: 'Arial, sans-serif', size: 14 }
                          }}
                          useResizeHandler
                          style={{ width: '100%', height: '100%' }}
                          config={{ responsive: true }}
                        />
                      </Card>

                      {/* Graphique 2: Heures creuses vs Pointe */}
                      <Card className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Répartition Heures creuses / Pointe {selectedYearSynthese}
                        </h4>
                        <Plot
                          data={[
                            {
                              x: graphiquesData.heures_creuses_pointe.x,
                              y: graphiquesData.heures_creuses_pointe.heures_creuses,
                              type: 'bar',
                              name: 'Heures creuses',
                              marker: { color: '#2ca02c' }
                            },
                            {
                              x: graphiquesData.heures_creuses_pointe.x,
                              y: graphiquesData.heures_creuses_pointe.heures_pointe,
                              type: 'bar',
                              name: 'Heures pointe',
                              marker: { color: '#ff7f0e' }
                            }
                          ]}
                          layout={{
                            autosize: true,
                            height: 400,
                            margin: { l: 60, r: 30, t: 30, b: 60 },
                            xaxis: { title: 'Mois' },
                            yaxis: { title: 'Énergie (kWh)' },
                            barmode: 'stack',
                            font: { family: 'Arial, sans-serif', size: 14 }
                          }}
                          useResizeHandler
                          style={{ width: '100%', height: '100%' }}
                          config={{ responsive: true }}
                        />
                      </Card>

                      {/* Graphique 3: Puissance atteinte vs souscrite */}
                      <Card className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Puissance atteinte vs Puissance souscrite {selectedYearSynthese}
                        </h4>
                        <Plot
                          data={[
                            {
                              x: graphiquesData.puissance.x,
                              y: graphiquesData.puissance.puissance_atteinte,
                              type: 'scatter',
                              mode: 'lines+markers',
                              name: 'Puissance atteinte',
                              line: { color: '#d62728', width: 3 }
                            },
                            {
                              x: graphiquesData.puissance.x,
                              y: graphiquesData.puissance.puissance_souscrite,
                              type: 'scatter',
                              mode: 'lines',
                              name: 'Puissance souscrite',
                              line: { color: '#9467bd', width: 2, dash: 'dash' }
                            }
                          ]}
                          layout={{
                            autosize: true,
                            height: 400,
                            margin: { l: 60, r: 30, t: 30, b: 60 },
                            xaxis: { title: 'Mois' },
                            yaxis: { title: 'Puissance (kW)' },
                            font: { family: 'Arial, sans-serif', size: 14 }
                          }}
                          useResizeHandler
                          style={{ width: '100%', height: '100%' }}
                          config={{ responsive: true }}
                        />
                      </Card>

                      {/* Graphique 4: Facturation et Consommation (dual axis) */}
                      <Card className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Facturation et Consommation mensuelle {selectedYearSynthese}
                        </h4>
                        <Plot
                          data={[
                            {
                              x: graphiquesData.facturation_consommation.x,
                              y: graphiquesData.facturation_consommation.facturation,
                              type: 'bar',
                              name: 'Montant TTC',
                              marker: { color: '#17becf' },
                              text: graphiquesData.facturation_consommation.facturation.map((v: number) => `${(v / 1e6).toFixed(1)}M`),
                              textposition: 'outside',
                              yaxis: 'y'
                            },
                            {
                              x: graphiquesData.facturation_consommation.x,
                              y: graphiquesData.facturation_consommation.consommation,
                              type: 'scatter',
                              mode: 'lines+markers',
                              name: 'Consommation',
                              line: { color: '#ff7f0e', width: 3 },
                              marker: { size: 8 },
                              yaxis: 'y2'
                            }
                          ]}
                          layout={{
                            autosize: true,
                            height: 400,
                            margin: { l: 60, r: 60, t: 30, b: 60 },
                            xaxis: { title: 'Mois' },
                            yaxis: {
                              title: 'Montant TTC (FCFA)',
                              titlefont: { color: '#17becf' },
                              tickfont: { color: '#17becf' }
                            },
                            yaxis2: {
                              title: 'Consommation (kWh)',
                              titlefont: { color: '#ff7f0e' },
                              tickfont: { color: '#ff7f0e' },
                              overlaying: 'y',
                              side: 'right'
                            },
                            hovermode: 'x unified',
                            font: { family: 'Arial, sans-serif', size: 14 },
                            legend: {
                              orientation: 'h',
                              yanchor: 'bottom',
                              y: 1.02,
                              xanchor: 'right',
                              x: 1
                            }
                          }}
                          useResizeHandler
                          style={{ width: '100%', height: '100%' }}
                          config={{ responsive: true }}
                        />
                      </Card>

                      {/* Graphique 5: Cos(φ) et Consommation (si disponible) */}
                      {graphiquesData.cosphi && (
                        <Card className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">
                            Cos(φ) et Consommation mensuelle {selectedYearSynthese}
                          </h4>
                          <Plot
                            data={[
                              {
                                x: graphiquesData.cosphi.x,
                                y: graphiquesData.cosphi.consommation_mwh,
                                type: 'bar',
                                name: 'Consommation',
                                marker: { color: '#66B2FF' },
                                opacity: 0.6,
                                yaxis: 'y'
                              },
                              {
                                x: graphiquesData.cosphi.x,
                                y: graphiquesData.cosphi.cosphi,
                                type: 'scatter',
                                mode: 'lines+markers',
                                name: 'Cos(φ)',
                                line: { color: '#FF6B6B', width: 3 },
                                marker: { size: 10, symbol: 'diamond' },
                                yaxis: 'y2'
                              },
                              {
                                x: graphiquesData.cosphi.x,
                                y: Array(graphiquesData.cosphi.x.length).fill(0.9),
                                type: 'scatter',
                                mode: 'lines',
                                name: 'Seuil référence (0.9)',
                                line: { color: 'red', width: 2, dash: 'dash' },
                                yaxis: 'y2'
                              }
                            ]}
                            layout={{
                              autosize: true,
                              height: 450,
                              margin: { l: 60, r: 60, t: 30, b: 60 },
                              xaxis: { title: 'Mois' },
                              yaxis: {
                                title: 'Consommation (MWh)',
                                titlefont: { color: '#66B2FF' },
                                tickfont: { color: '#66B2FF' }
                              },
                              yaxis2: {
                                title: 'Cos(φ)',
                                titlefont: { color: '#FF6B6B' },
                                tickfont: { color: '#FF6B6B' },
                                overlaying: 'y',
                                side: 'right',
                                range: [0, 1]
                              },
                              hovermode: 'x unified',
                              font: { family: 'Arial, sans-serif', size: 14 },
                              legend: {
                                orientation: 'h',
                                yanchor: 'bottom',
                                y: 1.02,
                                xanchor: 'right',
                                x: 1
                              }
                            }}
                            useResizeHandler
                            style={{ width: '100%', height: '100%' }}
                            config={{ responsive: true }}
                          />

                          {/* Statistiques Cos φ */}
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-600">Cos φ moyen</p>
                              <p className="text-xl font-bold text-blue-600">{graphiquesData.cosphi.cosphi_moyen.toFixed(3)}</p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-600">Cos φ max</p>
                              <p className="text-xl font-bold text-green-600">{graphiquesData.cosphi.cosphi_max.toFixed(3)}</p>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-600">Cos φ min</p>
                              <p className="text-xl font-bold text-red-600">{graphiquesData.cosphi.cosphi_min.toFixed(3)}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${graphiquesData.cosphi.nb_mois_sous_seuil > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
                              <p className="text-sm text-gray-600">Mois sous seuil (0.85)</p>
                              <p className={`text-xl font-bold ${graphiquesData.cosphi.nb_mois_sous_seuil > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                {graphiquesData.cosphi.nb_mois_sous_seuil}/12
                              </p>
                            </div>
                          </div>
                        </Card>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
