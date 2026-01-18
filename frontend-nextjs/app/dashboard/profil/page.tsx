"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import useAuthStore from '@/store/useAuthStore';
import dataService from '@/services/data.service';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

// Types matching backend response
interface ProfilClientResponse {
  infos_administratives: {
    nom_client: string;
    service_no: string;
    region: string;
    division: string;
    agence: string;
    annees_disponibles: number[];
  };
  profil_energetique: {
    annee: number;
    tableau1: any;
    tableau1bis: any | null;
    tableau2: any;
    tableau3: any;
    tableau4: any;
    tableau5: any | null;
    tableau6: any | null;
  };
  profil_consommation: {
    graph1_evolution: {
      series: Array<{
        annee: number;
        mois: number[];
        consommation: number[];
      }>;
    };
    tableau_variation_conso: Array<{
      annee: number;
      consommation: number;
      variation?: number;
    }>;
    graph2_hc_hp_facturation: {
      annees: number[];
      hc: number[];
      hp: number[];
      facturation: number[];
    };
    tableau_variation_facturation: Array<{
      annee: number;
      facturation: number;
      variation?: number;
    }>;
    tableau_prix_unitaire: Array<{
      annee: number;
      consommation: number;
      facturation: number;
      prix_unitaire: number;
    }>;
    tableau_recapitulatif: Array<{
      annee: number;
      consommation_totale: string;
      consommation_moyenne: string;
      heures_creuses: string;
      heures_pointe: string;
      mois_consommation_max: string;
      facturation_totale: string;
    }>;
  };
}

export default function ProfilClientPage() {
  const { hasPermission } = useAuthStore();
  const [profilData, setProfilData] = useState<ProfilClientResponse | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Section 4: Synthese data
  const [syntheseYear, setSyntheseYear] = useState<number | null>(null);
  const [syntheseData, setSyntheseData] = useState<any>(null);
  const [graphiquesData, setGraphiquesData] = useState<any>(null);
  const [isSyntheseLoading, setIsSyntheseLoading] = useState(false);

  const canView = hasPermission('view_profile');

  useEffect(() => {
    if (canView) {
      fetchProfilData();
    }
  }, [canView]);

  const fetchProfilData = async (year?: number) => {
    setIsLoading(true);
    setError('');

    try {
      const data = await dataService.getProfilClient(year);
      setProfilData(data);

      if (!selectedYear) {
        setSelectedYear(data.profil_energetique.annee);
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

  const fetchSyntheseData = async (year: number) => {
    setIsSyntheseLoading(true);
    try {
      const [synthese, graphiques] = await Promise.all([
        dataService.getSynthese(year),
        dataService.getGraphiques(year)
      ]);
      setSyntheseData(synthese);
      setGraphiquesData(graphiques);
    } catch (err: any) {
      console.error('Error loading synthese data:', err);
    } finally {
      setIsSyntheseLoading(false);
    }
  };

  const handleSyntheseYearChange = (year: number) => {
    setSyntheseYear(year);
    fetchSyntheseData(year);
  };

  // Load synthese data when profil data is available
  useEffect(() => {
    if (profilData && !syntheseYear) {
      const firstYear = profilData.infos_administratives.annees_disponibles[0];
      setSyntheseYear(firstYear);
      fetchSyntheseData(firstYear);
    }
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profilData) {
    return (
      <div className="p-8">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {!error && (
          <Alert
            type="info"
            message="Aucune donnée disponible. Veuillez d'abord télécharger un fichier Excel depuis la page Accueil."
          />
        )}
      </div>
    );
  }

  const { infos_administratives, profil_energetique, profil_consommation } = profilData;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            État des lieux et profil
          </h1>
          <p className="mt-2 text-gray-600">
            Profil complet du client et analyse de consommation
          </p>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
          />
        )}

        {/* ========== SECTION 1: PROFIL DU CLIENT (Administratif) ========== */}
        <Card className="mb-8 bg-gradient-to-br from-blue-50 to-blue-100">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">👤 Profil du client</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm font-medium text-blue-800">Nom du client:</p>
              <p className="text-base text-blue-900 mt-1 break-words">
                {infos_administratives.nom_client}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">N° de service:</p>
              <p className="text-base text-blue-900 mt-1">{infos_administratives.service_no}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Région:</p>
              <p className="text-base text-blue-900 mt-1">{infos_administratives.region}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Division:</p>
              <p className="text-base text-blue-900 mt-1">{infos_administratives.division}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Agence:</p>
              <p className="text-base text-blue-900 mt-1">{infos_administratives.agence}</p>
            </div>
          </div>
        </Card>

        {/* ========== SECTION 2: RÉSUMÉ DU PROFIL ÉNERGÉTIQUE ========== */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              📋 Résumé du profil énergétique du client
            </h2>
            {infos_administratives.annees_disponibles.length > 0 && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">
                  Sélectionner l'année pour le profil énergétique:
                </label>
                <select
                  value={selectedYear || ''}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  {infos_administratives.annees_disponibles.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tableau 1: Caractéristiques contractuelles et tarifaires */}
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Caractéristiques contractuelles et tarifaires ({profil_energetique.annee})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Puissance souscrite
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type tarifaire
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Plage horaire applicable
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tarif HC ({profil_energetique.annee})
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tarif HP ({profil_energetique.annee})
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Prime Fixe ({profil_energetique.annee})
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau1.puissance_souscrite}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau1.type_tarifaire}
                      <br />
                      <span className="text-xs text-gray-600">({profil_energetique.tableau1.categorie})</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau1.plage_horaire}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau1.tarif_hc}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau1.tarif_hp}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau1.prime_fixe}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Tableau 1bis: Projection N+1 (only if year == 2025) */}
          {profil_energetique.tableau1bis && (
            <Card className="mb-6 bg-yellow-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Caractéristiques contractuelles et tarifaires (2026) - Projection
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-yellow-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Puissance souscrite
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type tarifaire
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Plage horaire applicable
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tarif HC (2026)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tarif HP (2026)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Prime Fixe (2026)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {profil_energetique.tableau1bis.puissance_souscrite}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {profil_energetique.tableau1bis.type_tarifaire}
                        <br />
                        <span className="text-xs text-gray-600">({profil_energetique.tableau1bis.categorie})</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {profil_energetique.tableau1bis.plage_horaire}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {profil_energetique.tableau1bis.tarif_hc}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {profil_energetique.tableau1bis.tarif_hp}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {profil_energetique.tableau1bis.prime_fixe}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Tableau 2: Puissances atteintes */}
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Puissances atteintes sur la période ({profil_energetique.annee})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Puissance maximum
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Puissance minimum
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Puissance moyenne
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Dépassements
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau2.puissance_max.valeur}{' '}
                      {profil_energetique.tableau2.puissance_max.warning && '⚠️'}
                      <br />
                      <span className="text-xs text-gray-600">
                        ({profil_energetique.tableau2.puissance_max.mois})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau2.puissance_min.valeur}
                      <br />
                      <span className="text-xs text-gray-600">
                        ({profil_energetique.tableau2.puissance_min.mois})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau2.puissance_moyenne}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau2.depassements.nb} mois / {profil_energetique.tableau2.depassements.total} mois
                      ({profil_energetique.tableau2.depassements.pct.toFixed(1)}%)
                      <br />
                      <span className={profil_energetique.tableau2.depassements.warning ? 'text-red-600' : 'text-green-600'}>
                        {profil_energetique.tableau2.depassements.warning ? '⚠️ Dépassements détectés' : '✅ Aucun dépassement'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Tableau 3: Consommations */}
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Consommations sur la période ({profil_energetique.annee})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Conso. max mensuelle
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Conso. min mensuelle
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Conso. moyenne mensuelle
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Conso. creuse moyenne
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Conso. pointe moyenne
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ratio HC/HP
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Temps fonct. moyen
                    </th>
                    {profil_energetique.tableau3.cosphi_moyen && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cos φ moyen
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau3.conso_max.valeur}
                      <br />
                      <span className="text-xs text-gray-600">
                        ({profil_energetique.tableau3.conso_max.mois})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau3.conso_min.valeur}
                      <br />
                      <span className="text-xs text-gray-600">
                        ({profil_energetique.tableau3.conso_min.mois})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau3.conso_moyenne}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau3.conso_hc_moyenne}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau3.conso_hp_moyenne}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau3.ratio_hc_hp}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau3.temps_fonct_moyen}
                    </td>
                    {profil_energetique.tableau3.cosphi_moyen && (
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {profil_energetique.tableau3.cosphi_moyen.valeur}{' '}
                        {profil_energetique.tableau3.cosphi_moyen.status ? '✅' : '🔴'}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Tableau 4: Facturation TTC */}
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Facturation TTC sur la période ({profil_energetique.annee})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Facture TTC max
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Facture TTC min
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Facture TTC moyenne
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Facture TTC totale ({profil_energetique.annee})
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau4.facture_max.valeur}
                      <br />
                      <span className="text-xs text-gray-600">
                        ({profil_energetique.tableau4.facture_max.mois})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau4.facture_min.valeur}
                      <br />
                      <span className="text-xs text-gray-600">
                        ({profil_energetique.tableau4.facture_min.mois})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau4.facture_moyenne}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {profil_energetique.tableau4.facture_totale}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Tableau 5: Cos φ (if available) */}
          {profil_energetique.tableau5 && (
            <Card className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Facteur de puissance Cos φ ({profil_energetique.annee})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cos φ max
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cos φ min
                      </th>
                      {/*<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cos φ moyen
                      </th>*/}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Mois avec Cos φ &lt; 0.9
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {profil_energetique.tableau5.cosphi_max.valeur}{' '}
                        {profil_energetique.tableau5.cosphi_max.status ? '✅' : '🔴'}
                        <br />
                        <span className="text-xs text-gray-600">
                          ({profil_energetique.tableau5.cosphi_max.mois})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {profil_energetique.tableau5.cosphi_min.valeur}{' '}
                        {profil_energetique.tableau5.cosphi_min.status ? '✅' : '🔴'}
                        <br />
                        <span className="text-xs text-gray-600">
                          ({profil_energetique.tableau5.cosphi_min.mois})
                        </span>
                      </td>
                      {/*<td className="px-4 py-3 text-sm text-gray-900">
                        {profil_energetique.tableau5.cosphi_moyen.valeur}{' '}
                        {profil_energetique.tableau5.cosphi_moyen.status ? '✅' : '🔴'}
                      </td>*/}
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {profil_energetique.tableau5.nb_mois_mauvais.nb} /{' '}
                        {profil_energetique.tableau5.nb_mois_mauvais.total} mois{' '}
                        {profil_energetique.tableau5.nb_mois_mauvais.status ? '✅' : '🔴'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Tableau 6: Pénalité Cos φ (if available) */}
          {profil_energetique.tableau6 && (
            <Card className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Pénalité Cos φ ({profil_energetique.annee})
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Pénalité max
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Pénalité min
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Pénalité moyenne
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Pénalité totale ({profil_energetique.annee})
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {profil_energetique.tableau6.penalite_max.valeur}
                        <br />
                        <span className="text-xs text-gray-600">
                          ({profil_energetique.tableau6.penalite_max.mois})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {profil_energetique.tableau6.penalite_min.valeur}
                        <br />
                        <span className="text-xs text-gray-600">
                          ({profil_energetique.tableau6.penalite_min.mois})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {profil_energetique.tableau6.penalite_moyenne}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {profil_energetique.tableau6.penalite_totale}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* ========== SECTION 3: PROFIL DE CONSOMMATION (multi-années) ========== */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📊 Profil de consommation
          </h2>

          {/* Graph 1: Évolution de la consommation mensuelle sur 3 ans */}
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Évolution de la consommation mensuelle sur 3 ans
            </h3>
            <Plot
              data={profil_consommation.graph1_evolution.series.map((serie, idx) => {
                const couleurs = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'];
                return {
                  x: serie.mois,
                  y: serie.consommation,
                  type: 'scatter',
                  mode: 'lines+markers',
                  name: `${serie.annee}`,
                  line: { width: 2, color: couleurs[idx % couleurs.length] },
                  marker: { size: 6 },
                  hovertemplate: `<b>${serie.annee}</b><br>Mois: %{x}<br>Consommation: %{y:,.0f} kWh<extra></extra>`
                };
              })}
              layout={{
                autosize: true,
                height: 450,
                xaxis: {
                  title: 'Mois',
                  tickmode: 'array',
                  tickvals: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                  ticktext: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
                },
                yaxis: { title: 'Consommation (kWh)' },
                hovermode: 'x unified',
                showlegend: true,
                legend: { orientation: 'h', y: 1.02, x: 1, xanchor: 'right', yanchor: 'bottom' }
              }}
              useResizeHandler
              style={{ width: '100%', height: '100%' }}
              config={{ responsive: true }}
            />
          </Card>

          {/* Tableau variation consommation */}
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Variation de la consommation totale
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Indicateur
                    </th>
                    {profil_consommation.tableau_variation_conso.map((row) => (
                      <th key={row.annee} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        {row.annee}
                      </th>
                    ))}
                    {profil_consommation.tableau_variation_conso.map((row, idx) => (
                      idx > 0 && (
                        <th key={`var-${idx}`} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Variation {profil_consommation.tableau_variation_conso[idx-1].annee}→{row.annee}
                        </th>
                      )
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      Consommation totale (kWh)
                    </td>
                    {profil_consommation.tableau_variation_conso.map((row) => (
                      <td key={row.annee} className="px-4 py-3 text-sm text-gray-900 text-center">
                        {row.consommation.toLocaleString('fr-FR')}
                      </td>
                    ))}
                    {profil_consommation.tableau_variation_conso.map((row, idx) => (
                      idx > 0 && row.variation !== undefined && (
                        <td key={`var-${idx}`} className="px-4 py-3 text-sm text-gray-900 text-center">
                          {row.variation > 1 && `+${row.variation.toFixed(1)}% ⬆️`}
                          {row.variation < -1 && `${row.variation.toFixed(1)}% ⬇️`}
                          {row.variation >= -1 && row.variation <= 1 && `${row.variation.toFixed(1)}% ➡️`}
                        </td>
                      )
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
          {/* Tableau variation facturation */}
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Variation de la facturation TTC totale
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Indicateur
                    </th>
                    {profil_consommation.tableau_variation_facturation.map((row) => (
                      <th key={row.annee} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        {row.annee}
                      </th>
                    ))}
                    {profil_consommation.tableau_variation_facturation.map((row, idx) => (
                      idx > 0 && (
                        <th key={`var-${idx}`} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Variation {profil_consommation.tableau_variation_facturation[idx-1].annee}→{row.annee}
                        </th>
                      )
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      Facturation TTC totale (FCFA)
                    </td>
                    {profil_consommation.tableau_variation_facturation.map((row) => (
                      <td key={row.annee} className="px-4 py-3 text-sm text-gray-900 text-center">
                        {row.facturation.toLocaleString('fr-FR')}
                      </td>
                    ))}
                    {profil_consommation.tableau_variation_facturation.map((row, idx) => (
                      idx > 0 && row.variation !== undefined && (
                        <td key={`var-${idx}`} className="px-4 py-3 text-sm text-gray-900 text-center">
                          {row.variation > 1 && `+${row.variation.toFixed(1)}% ⬆️`}
                          {row.variation < -1 && `${row.variation.toFixed(1)}% ⬇️`}
                          {row.variation >= -1 && row.variation <= 1 && `${row.variation.toFixed(1)}% ➡️`}
                        </td>
                      )
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
          {/* Tableau prix unitaire */}
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              💰 Prix unitaire facture/consommation
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Année
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Consommation totale (kWh)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Facturation totale (FCFA)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Prix unitaire (FCFA/kWh)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {profil_consommation.tableau_prix_unitaire.map((row) => (
                    <tr key={row.annee}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {row.annee}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {row.consommation.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {row.facturation.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        {row.prix_unitaire.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
            </div>
          </Card>


          {/* Zone de texte pour analyse */}
          <Card className="mb-6 bg-blue-50">
            <h4 className="text-md font-semibold text-blue-900 mb-2">
              📝 Vos analyses et observations sur l'évolution de la consommation
            </h4>
            <textarea
              className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              rows={4}
              placeholder="Saisissez ici vos commentaires et analyses sur l'évolution de la consommation mensuelle au fil des années..."
            />
          </Card>

          {/* Graph 2: Consommation (HC/HP empilées) et Facturation annuelle */}
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Consommation (HC/HP) et Facturation annuelle
            </h3>
            <Plot
              data={[
                {
                  x: profil_consommation.graph2_hc_hp_facturation.annees.map(String),
                  y: profil_consommation.graph2_hc_hp_facturation.hc,
                  type: 'bar',
                  name: 'Heures Creuses',
                  marker: { color: '#66BB6A' },
                  text: profil_consommation.graph2_hc_hp_facturation.hc.map(val => `${val.toFixed(2)} MWh`),
                  textposition: 'inside',
                  hovertemplate: '<b>Heures Creuses</b><br>Année: %{x}<br>Consommation: %{y:.2f} MWh<extra></extra>',
                  yaxis: 'y'
                },
                {
                  x: profil_consommation.graph2_hc_hp_facturation.annees.map(String),
                  y: profil_consommation.graph2_hc_hp_facturation.hp,
                  type: 'bar',
                  name: 'Heures Pointe',
                  marker: { color: '#FFA726' },
                  text: profil_consommation.graph2_hc_hp_facturation.hp.map(val => `${val.toFixed(2)} MWh`),
                  textposition: 'inside',
                  hovertemplate: '<b>Heures Pointe</b><br>Année: %{x}<br>Consommation: %{y:.2f} MWh<extra></extra>',
                  yaxis: 'y'
                },
                {
                  x: profil_consommation.graph2_hc_hp_facturation.annees.map(String),
                  y: profil_consommation.graph2_hc_hp_facturation.facturation,
                  type: 'scatter',
                  mode: 'lines+markers',
                  name: 'Facturation',
                  line: { color: '#1E88E5', width: 3 },
                  marker: { size: 10 },
                  text: profil_consommation.graph2_hc_hp_facturation.facturation.map(val => `${val.toFixed(1)}M`),
                  textposition: 'top center',
                  hovertemplate: '<b>Facturation</b><br>Année: %{x}<br>Montant: %{y:.2f} M FCFA<extra></extra>',
                  yaxis: 'y2'
                }
              ]}
              layout={{
                autosize: true,
                height: 450,
                xaxis: { title: 'Année' },
                yaxis: {
                  title: 'Consommation (MWh)',
                  titlefont: { color: '#4CAF50' },
                  tickfont: { color: '#4CAF50' }
                },
                yaxis2: {
                  title: 'Facturation (M FCFA)',
                  titlefont: { color: '#1E88E5' },
                  tickfont: { color: '#1E88E5' },
                  overlaying: 'y',
                  side: 'right'
                },
                barmode: 'stack',
                hovermode: 'x unified',
                showlegend: true,
                legend: { orientation: 'h', y: 1.02, x: 1, xanchor: 'right', yanchor: 'bottom' }
              }}
              useResizeHandler
              style={{ width: '100%', height: '100%' }}
              config={{ responsive: true }}
            />
          </Card>

          {/* Zone de texte pour analyse */}
          <Card className="mb-6 bg-green-50">
            <h4 className="text-md font-semibold text-green-900 mb-2">
              📝 Vos analyses et observations sur la consommation HC/HP et la facturation
            </h4>
            <textarea
              className="w-full p-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
              rows={4}
              placeholder="Saisissez ici vos commentaires sur la répartition heures creuses/pointe et l'évolution de la facturation..."
            />
          </Card>

          {/* Tableau récapitulatif statistiques annuelles */}
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📋 Tableau récapitulatif des statistiques annuelles
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Année
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Consommation Totale
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Moyenne/Mois
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Heures Creuses
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Heures Pointe
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Mois Consommation Max
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Facturation Totale
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {profil_consommation.tableau_recapitulatif.map((row) => (
                    <tr key={row.annee}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {row.annee}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {row.consommation_totale}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {row.consommation_moyenne}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {row.heures_creuses}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {row.heures_pointe}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {row.mois_consommation_max}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {row.facturation_totale}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* ========== SECTION 4: TABLEAUX DE SYNTHÈSE PAR ANNÉE ========== */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              📊 Tableaux de synthèse par année
            </h2>
            {infos_administratives.annees_disponibles.length > 0 && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">
                  Sélectionner une année:
                </label>
                <select
                  value={syntheseYear || ''}
                  onChange={(e) => handleSyntheseYearChange(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  {infos_administratives.annees_disponibles.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {isSyntheseLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : syntheseData && graphiquesData ? (
            <>
              {/* Tableau de synthèse - Format Streamlit: indicateurs en lignes, mois en colonnes */}
              <Card className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Tableau de synthèse {syntheseYear}
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 sticky left-0 bg-gray-50 z-10">
                          Mois
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 bg-blue-50">
                          Année {syntheseYear}
                        </th>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                          <th key={m} className="px-3 py-2 text-right text-xs font-medium text-gray-700">
                            {m}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {syntheseData.tableau.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-xs font-semibold text-gray-900 sticky left-0 bg-white">
                            {row.indicateur}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-900 text-right font-semibold bg-blue-50">
                            {row.annee_total !== null && row.annee_total !== undefined
                              ? typeof row.annee_total === 'number'
                                ? row.annee_total >= 1000
                                  ? row.annee_total.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
                                  : row.annee_total.toFixed(2)
                                : row.annee_total
                              : ''}
                          </td>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((mois) => {
                            const val = row[mois.toString()];
                            return (
                              <td key={mois} className="px-3 py-2 text-xs text-gray-900 text-right">
                                {val !== null && val !== undefined
                                  ? typeof val === 'number'
                                    ? val >= 1000
                                      ? val.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
                                      : val.toFixed(2)
                                    : val
                                  : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Graphiques */}
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                📈 Graphiques {syntheseYear}
              </h3>

              {/* Graph 1: Consommation mensuelle */}
              <Card className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  {graphiquesData.consommation_mensuelle.title}
                </h4>
                <Plot
                  data={[{
                    x: graphiquesData.consommation_mensuelle.x,
                    y: graphiquesData.consommation_mensuelle.y,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: graphiquesData.consommation_mensuelle.name,
                    line: { color: '#1f77b4', width: 2 },
                    marker: { size: 8 }
                  }]}
                  layout={{
                    autosize: true,
                    height: 400,
                    xaxis: { title: graphiquesData.consommation_mensuelle.xaxis_title },
                    yaxis: { title: graphiquesData.consommation_mensuelle.yaxis_title },
                    showlegend: false
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                  config={{ responsive: true }}
                />
              </Card>

              {/* Graph 2: HC vs HP */}
              <Card className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  {graphiquesData.heures_creuses_pointe.title}
                </h4>
                <Plot
                  data={[
                    {
                      x: graphiquesData.heures_creuses_pointe.x,
                      y: graphiquesData.heures_creuses_pointe.y_hc,
                      type: 'bar',
                      name: 'Heures Creuses',
                      marker: { color: '#66BB6A' }
                    },
                    {
                      x: graphiquesData.heures_creuses_pointe.x,
                      y: graphiquesData.heures_creuses_pointe.y_hp,
                      type: 'bar',
                      name: 'Heures Pointe',
                      marker: { color: '#FFA726' }
                    }
                  ]}
                  layout={{
                    autosize: true,
                    height: 400,
                    xaxis: { title: graphiquesData.heures_creuses_pointe.xaxis_title },
                    yaxis: { title: graphiquesData.heures_creuses_pointe.yaxis_title },
                    barmode: 'stack',
                    showlegend: true,
                    legend: { orientation: 'h', y: -0.2 }
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                  config={{ responsive: true }}
                />
              </Card>

              {/* Graph 3: Puissance */}
              <Card className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  {graphiquesData.puissance.title}
                </h4>
                <Plot
                  data={[
                    {
                      x: graphiquesData.puissance.x,
                      y: graphiquesData.puissance.y_atteinte,
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'Puissance atteinte',
                      line: { color: '#2196F3', width: 2 },
                      marker: { size: 8 }
                    },
                    {
                      x: graphiquesData.puissance.x,
                      y: graphiquesData.puissance.y_souscrite,
                      type: 'scatter',
                      mode: 'lines',
                      name: 'Puissance souscrite',
                      line: { color: '#F44336', width: 2, dash: 'dash' }
                    }
                  ]}
                  layout={{
                    autosize: true,
                    height: 400,
                    xaxis: { title: graphiquesData.puissance.xaxis_title },
                    yaxis: { title: graphiquesData.puissance.yaxis_title },
                    showlegend: true,
                    legend: { orientation: 'h', y: -0.2 }
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                  config={{ responsive: true }}
                />
              </Card>

              {/* Graph 4: Facturation et consommation (dual axis) */}
              <Card className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  {graphiquesData.facturation_consommation.title}
                </h4>
                <Plot
                  data={[
                    {
                      x: graphiquesData.facturation_consommation.x,
                      y: graphiquesData.facturation_consommation.facturation,
                      type: 'bar',
                      name: 'Facturation',
                      marker: { color: '#4CAF50' },
                      yaxis: 'y'
                    },
                    {
                      x: graphiquesData.facturation_consommation.x,
                      y: graphiquesData.facturation_consommation.consommation,
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'Consommation',
                      line: { color: '#FF9800', width: 2 },
                      marker: { size: 8 },
                      yaxis: 'y2'
                    }
                  ]}
                  layout={{
                    autosize: true,
                    height: 400,
                    xaxis: { title: graphiquesData.facturation_consommation.xaxis_title },
                    yaxis: {
                      title: graphiquesData.facturation_consommation.yaxis1_title,
                      titlefont: { color: '#4CAF50' },
                      tickfont: { color: '#4CAF50' }
                    },
                    yaxis2: {
                      title: graphiquesData.facturation_consommation.yaxis2_title,
                      titlefont: { color: '#FF9800' },
                      tickfont: { color: '#FF9800' },
                      overlaying: 'y',
                      side: 'right'
                    },
                    showlegend: true,
                    legend: { orientation: 'h', y: -0.2 }
                  }}
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                  config={{ responsive: true }}
                />
              </Card>

              {/* Graph 5: Cos(φ) + Consommation if available (dual axis) */}
              {graphiquesData.cosphi && (
                <Card className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    {graphiquesData.cosphi.title}
                  </h4>
                  <Plot
                    data={[
                      {
                        x: graphiquesData.cosphi.x,
                        y: graphiquesData.cosphi.consommation,
                        type: 'bar',
                        name: 'Consommation',
                        marker: { color: '#66B2FF', opacity: 0.6 },
                        yaxis: 'y'
                      },
                      {
                        x: graphiquesData.cosphi.x,
                        y: graphiquesData.cosphi.y_cosphi,
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Cos φ',
                        line: { color: '#FF6B6B', width: 3 },
                        marker: { size: 10, symbol: 'diamond' },
                        yaxis: 'y2'
                      },
                      {
                        x: graphiquesData.cosphi.x,
                        y: graphiquesData.cosphi.y_seuil,
                        type: 'scatter',
                        mode: 'lines',
                        name: 'Seuil référence (0.9)',
                        line: { color: 'red', width: 2, dash: 'dash' },
                        yaxis: 'y2'
                      }
                    ]}
                    layout={{
                      autosize: true,
                      height: 400,
                      xaxis: { title: graphiquesData.cosphi.xaxis_title },
                      yaxis: {
                        title: graphiquesData.cosphi.yaxis1_title,
                        titlefont: { color: '#66B2FF' },
                        tickfont: { color: '#66B2FF' }
                      },
                      yaxis2: {
                        title: graphiquesData.cosphi.yaxis2_title,
                        titlefont: { color: '#FF6B6B' },
                        tickfont: { color: '#FF6B6B' },
                        overlaying: 'y',
                        side: 'right',
                        range: [0, 1]
                      },
                      showlegend: true,
                      legend: { orientation: 'h', y: -0.2 }
                    }}
                    useResizeHandler
                    style={{ width: '100%', height: '100%' }}
                    config={{ responsive: true }}
                  />
                </Card>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
