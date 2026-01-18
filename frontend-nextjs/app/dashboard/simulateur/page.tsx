"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import useAuthStore from '@/store/useAuthStore';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SimulationResult {
  type_tarif: string;
  puissance_saisie: number;
  temps_fonctionnement: number;
  type_detecte: number;
  plage_horaire: string;
  prix_kwh: number;
  cout_mensuel_ht: number;
  cout_mensuel_ttc: number;
  cout_annuel_ht: number;
  cout_annuel_ttc: number;
  details: {
    part_fixe_mensuelle: number;
    part_variable_mensuelle: number;
    taxes_mensuelles: number;
  };
}

export default function SimulateurPage() {
  const { hasPermission } = useAuthStore();
  const [puissance, setPuissance] = useState<string>('');
  const [tempsFonctionnement, setTempsFonctionnement] = useState<string>('');
  const [consommationMensuelle, setConsommationMensuelle] = useState<string>('');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const canView = hasPermission('view_simulateur');

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    // Validation
    if (!puissance || !tempsFonctionnement || !consommationMensuelle) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    const puissanceNum = parseFloat(puissance);
    const tempsNum = parseFloat(tempsFonctionnement);
    const consoNum = parseFloat(consommationMensuelle);

    if (puissanceNum <= 0 || tempsNum <= 0 || consoNum <= 0) {
      setError('Les valeurs doivent être positives');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post<SimulationResult>(
        `${API_BASE_URL}/api/simulateur/simuler`,
        {
          puissance_kva: puissanceNum,
          temps_fonctionnement_heures: tempsNum,
          consommation_mensuelle_kwh: consoNum,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPuissance('');
    setTempsFonctionnement('');
    setConsommationMensuelle('');
    setResult(null);
    setError('');
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

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Simulateur de Tarifs
          </h1>
          <p className="mt-2 text-gray-600">
            Estimez vos coûts selon différentes configurations
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Paramètres de Simulation
            </h3>

            <form onSubmit={handleSimulate} className="space-y-6">
              {/* Puissance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puissance Souscrite (kVA)
                </label>
                <input
                  type="number"
                  value={puissance}
                  onChange={(e) => setPuissance(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="Ex: 36"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Puissance électrique souscrite auprès de votre fournisseur
                </p>
              </div>

              {/* Temps de fonctionnement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temps de Fonctionnement (heures/mois)
                </label>
                <input
                  type="number"
                  value={tempsFonctionnement}
                  onChange={(e) => setTempsFonctionnement(e.target.value)}
                  step="1"
                  min="0"
                  placeholder="Ex: 300"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nombre d'heures d'utilisation par mois
                </p>
              </div>

              {/* Consommation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consommation Mensuelle (kWh)
                </label>
                <input
                  type="number"
                  value={consommationMensuelle}
                  onChange={(e) => setConsommationMensuelle(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="Ex: 10800"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Consommation électrique mensuelle en kWh
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  isLoading={isLoading}
                >
                  {isLoading ? 'Simulation...' : 'Simuler'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleReset}
                >
                  Réinitialiser
                </Button>
              </div>
            </form>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Information</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Le type tarifaire est automatiquement détecté selon la puissance</li>
                    <li>• La plage horaire dépend du temps de fonctionnement</li>
                    <li>• Les prix sont basés sur les tarifs SABC en vigueur</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Results */}
          {result && (
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300">
              <h3 className="text-lg font-semibold text-green-900 mb-6">
                Résultats de la Simulation
              </h3>

              <div className="space-y-4">
                {/* Tariff Type */}
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Type Tarifaire Détecté</p>
                  <p className="text-xl font-bold text-gray-900">{result.type_tarif}</p>
                  <p className="text-xs text-gray-500 mt-1">Type {result.type_detecte}</p>
                </div>

                {/* Time Range */}
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Plage Horaire</p>
                  <p className="text-xl font-bold text-gray-900">{result.plage_horaire}</p>
                  <p className="text-xs text-gray-500 mt-1">{result.temps_fonctionnement}h de fonctionnement/mois</p>
                </div>

                {/* Price per kWh */}
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm text-gray-600">Prix du kWh</p>
                  <p className="text-xl font-bold text-gray-900">
                    {result.prix_kwh.toFixed(4)} €/kWh
                  </p>
                </div>

                {/* Monthly Cost */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                  <p className="text-sm opacity-90">Coût Mensuel</p>
                  <div className="flex items-baseline gap-3 mt-1">
                    <p className="text-3xl font-bold">
                      {result.cout_mensuel_ttc.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} €
                    </p>
                    <p className="text-sm opacity-90">TTC</p>
                  </div>
                  <p className="text-xs opacity-75 mt-1">
                    {result.cout_mensuel_ht.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} € HT
                  </p>
                </div>

                {/* Annual Cost */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                  <p className="text-sm opacity-90">Coût Annuel</p>
                  <div className="flex items-baseline gap-3 mt-1">
                    <p className="text-3xl font-bold">
                      {result.cout_annuel_ttc.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} €
                    </p>
                    <p className="text-sm opacity-90">TTC</p>
                  </div>
                  <p className="text-xs opacity-75 mt-1">
                    {result.cout_annuel_ht.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} € HT
                  </p>
                </div>

                {/* Breakdown */}
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 mb-3">Détail Mensuel</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Part fixe</span>
                      <span className="font-semibold text-gray-900">
                        {result.details.part_fixe_mensuelle.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} €
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Part variable</span>
                      <span className="font-semibold text-gray-900">
                        {result.details.part_variable_mensuelle.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} €
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Taxes</span>
                      <span className="font-semibold text-gray-900">
                        {result.details.taxes_mensuelles.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} €
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {!result && (
            <Card className="bg-gray-50 flex items-center justify-center">
              <div className="text-center py-12">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-200 mb-4">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune simulation</h3>
                <p className="text-sm text-gray-600">
                  Remplissez le formulaire et cliquez sur "Simuler"
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Tariff Reference Table */}
        <Card className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Référence des Types Tarifaires
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Puissance (kVA)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temps (h/mois)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr><td className="px-6 py-4 text-sm">Type 1-3</td><td className="px-6 py-4 text-sm">≤ 12</td><td className="px-6 py-4 text-sm">Toutes plages</td><td className="px-6 py-4 text-sm">Petite puissance</td></tr>
                <tr><td className="px-6 py-4 text-sm">Type 4-6</td><td className="px-6 py-4 text-sm">13-35</td><td className="px-6 py-4 text-sm">Toutes plages</td><td className="px-6 py-4 text-sm">Moyenne puissance</td></tr>
                <tr><td className="px-6 py-4 text-sm">Type 7-9</td><td className="px-6 py-4 text-sm">36-250</td><td className="px-6 py-4 text-sm">Toutes plages</td><td className="px-6 py-4 text-sm">Haute puissance</td></tr>
                <tr><td className="px-6 py-4 text-sm">Type 10-12</td><td className="px-6 py-4 text-sm">{'>'} 250</td><td className="px-6 py-4 text-sm">Toutes plages</td><td className="px-6 py-4 text-sm">Très haute puissance</td></tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs text-gray-600">
            <p><strong>Plages horaires :</strong></p>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• 0-200h : Faible utilisation</li>
              <li>• 201-400h : Utilisation moyenne</li>
              <li>• {'>'} 400h : Forte utilisation</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
