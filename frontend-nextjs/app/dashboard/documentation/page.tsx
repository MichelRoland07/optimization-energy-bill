"use client";

import { Card } from '@/components/ui/Card';

export default function DocumentationPage() {
  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Documentation
          </h1>
          <p className="mt-2 text-gray-600">
            Guide d'utilisation de la plateforme d'optimisation SABC
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
          <p className="text-gray-700 leading-relaxed">
            Bienvenue sur la plateforme d'optimisation tarifaire SABC. Cette application vous permet d'analyser
            votre consommation électrique, de reconstituer vos factures, d'optimiser vos tarifs et de simuler
            différentes configurations pour réduire vos coûts.
          </p>
        </Card>

        {/* Getting Started */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Démarrage Rapide</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Télécharger vos données</h3>
                <p className="text-gray-700 text-sm">
                  Rendez-vous sur la page <strong>Accueil</strong> et téléchargez votre fichier Excel contenant
                  vos données de consommation. Le fichier doit contenir les colonnes : READING_DATE, CONSUMPTION_KWH,
                  et PUISSANCE_SOUSCRITE.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Analyser votre profil</h3>
                <p className="text-gray-700 text-sm">
                  Consultez la page <strong>Profil Client</strong> pour voir l'état des lieux de votre consommation :
                  graphiques mensuels, consommation quotidienne, statistiques clés.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Reconstituer vos factures</h3>
                <p className="text-gray-700 text-sm">
                  La page <strong>Reconstitution</strong> vous montre le détail de votre facturation mensuelle
                  avec la répartition des coûts (part fixe, variable, taxes).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Optimiser vos tarifs</h3>
                <p className="text-gray-700 text-sm">
                  La page <strong>Optimisation</strong> compare toutes les options tarifaires possibles et
                  vous recommande la meilleure configuration pour économiser.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                5
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Simuler des scénarios</h3>
                <p className="text-gray-700 text-sm">
                  Utilisez le <strong>Simulateur</strong> pour tester différentes configurations (puissance,
                  temps de fonctionnement, consommation) et estimer les coûts.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Features */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Fonctionnalités</h2>

          <div className="space-y-6">
            {/* Accueil */}
            <div>
              <h3 className="text-lg font-semibold text-primary-600 mb-2">📤 Accueil - Upload de données</h3>
              <p className="text-gray-700 text-sm mb-2">
                Téléchargez vos fichiers Excel contenant vos données de consommation électrique.
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Format accepté : .xlsx, .xls</li>
                <li>• Colonnes requises : READING_DATE, CONSUMPTION_KWH, PUISSANCE_SOUSCRITE</li>
                <li>• Glisser-déposer ou sélection manuelle</li>
              </ul>
            </div>

            {/* Profil */}
            <div>
              <h3 className="text-lg font-semibold text-primary-600 mb-2">👤 Profil Client - État des lieux</h3>
              <p className="text-gray-700 text-sm mb-2">
                Visualisez votre profil de consommation avec des graphiques et statistiques détaillés.
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Sélection de l'année d'analyse</li>
                <li>• Consommation totale, moyenne, min/max</li>
                <li>• Graphiques de consommation mensuelle et quotidienne</li>
                <li>• Identification des pics de consommation</li>
              </ul>
            </div>

            {/* Reconstitution */}
            <div>
              <h3 className="text-lg font-semibold text-primary-600 mb-2">📄 Reconstitution de la Facture</h3>
              <p className="text-gray-700 text-sm mb-2">
                Reconstitution détaillée de vos factures d'électricité mensuelles et annuelles.
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Montants HT et TTC</li>
                <li>• Décomposition : part fixe, part variable, taxes</li>
                <li>• Prix moyen du kWh</li>
                <li>• Tableau des détails mensuels</li>
              </ul>
            </div>

            {/* Optimisation */}
            <div>
              <h3 className="text-lg font-semibold text-primary-600 mb-2">⚡ Optimisation Tarifaire</h3>
              <p className="text-gray-700 text-sm mb-2">
                Trouvez le meilleur tarif pour réduire vos coûts d'électricité.
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Comparaison automatique de tous les tarifs</li>
                <li>• Calcul des économies potentielles</li>
                <li>• Recommandations personnalisées</li>
                <li>• Graphique de comparaison des options</li>
              </ul>
            </div>

            {/* Simulateur */}
            <div>
              <h3 className="text-lg font-semibold text-primary-600 mb-2">🔢 Simulateur de Tarifs</h3>
              <p className="text-gray-700 text-sm mb-2">
                Simulez des scénarios personnalisés pour estimer vos coûts futurs.
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Saisie de la puissance souscrite (kVA)</li>
                <li>• Temps de fonctionnement mensuel (heures)</li>
                <li>• Consommation mensuelle estimée (kWh)</li>
                <li>• Détection automatique du type tarifaire</li>
                <li>• Calcul des coûts mensuels et annuels</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Tariff Structure */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Structure Tarifaire SABC</h2>

          <p className="text-gray-700 mb-4">
            Les tarifs SABC sont organisés en 12 types selon deux critères principaux :
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Puissance Souscrite (kVA)</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• <strong>Types 1-3 :</strong> ≤ 12 kVA (petite puissance)</li>
                <li>• <strong>Types 4-6 :</strong> 13-35 kVA (moyenne puissance)</li>
                <li>• <strong>Types 7-9 :</strong> 36-250 kVA (haute puissance)</li>
                <li>• <strong>Types 10-12 :</strong> {'>'} 250 kVA (très haute puissance)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Temps de Fonctionnement (h/mois)</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• <strong>Plage 1 :</strong> 0-200 heures (faible utilisation)</li>
                <li>• <strong>Plage 2 :</strong> 201-400 heures (utilisation moyenne)</li>
                <li>• <strong>Plage 3 :</strong> {'>'} 400 heures (forte utilisation)</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Exemple :</strong> Une entreprise avec 36 kVA de puissance souscrite et 350h de
                fonctionnement mensuel sera classée en <strong>Type 8</strong> (haute puissance, utilisation moyenne).
              </p>
            </div>
          </div>
        </Card>

        {/* Data Format */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Format des Données</h2>

          <p className="text-gray-700 mb-4">
            Votre fichier Excel doit respecter le format suivant :
          </p>

          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold">READING_DATE</th>
                  <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold">CONSUMPTION_KWH</th>
                  <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold">PUISSANCE_SOUSCRITE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border border-gray-300 text-sm">01/01/2024</td>
                  <td className="px-4 py-2 border border-gray-300 text-sm">350.5</td>
                  <td className="px-4 py-2 border border-gray-300 text-sm">36</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border border-gray-300 text-sm">02/01/2024</td>
                  <td className="px-4 py-2 border border-gray-300 text-sm">425.8</td>
                  <td className="px-4 py-2 border border-gray-300 text-sm">36</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border border-gray-300 text-sm">03/01/2024</td>
                  <td className="px-4 py-2 border border-gray-300 text-sm">380.2</td>
                  <td className="px-4 py-2 border border-gray-300 text-sm">36</td>
                </tr>
              </tbody>
            </table>
          </div>

          <ul className="text-sm text-gray-600 space-y-1 ml-4">
            <li>• <strong>READING_DATE :</strong> Date au format DD/MM/YYYY</li>
            <li>• <strong>CONSUMPTION_KWH :</strong> Consommation en kilowattheures (nombre décimal)</li>
            <li>• <strong>PUISSANCE_SOUSCRITE :</strong> Puissance en kVA (nombre entier)</li>
          </ul>
        </Card>

        {/* Permissions */}
        <Card className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Permissions Utilisateur</h2>

          <p className="text-gray-700 mb-4">
            Votre accès aux différentes fonctionnalités dépend de vos permissions :
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded bg-green-100 flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Voir Profil Client</p>
                <p className="text-xs text-gray-600">Accès à la page État des lieux</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded bg-green-100 flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Voir Reconstitution</p>
                <p className="text-xs text-gray-600">Accès à la reconstitution des factures</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded bg-green-100 flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Voir Optimisation</p>
                <p className="text-xs text-gray-600">Accès aux recommandations d'optimisation (généralement réservé aux admins)</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded bg-green-100 flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Voir Simulateur</p>
                <p className="text-xs text-gray-600">Accès au simulateur de tarifs</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded bg-green-100 flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Télécharger Données</p>
                <p className="text-xs text-gray-600">Permission de télécharger des fichiers Excel</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Support */}
        <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <h2 className="text-2xl font-bold mb-4">Besoin d'aide ?</h2>
          <p className="mb-4">
            Pour toute question ou problème technique, contactez votre administrateur système.
          </p>
          <p className="text-sm opacity-90">
            Version 1.0.0 | © 2024 SABC - Plateforme d'Optimisation Tarifaire
          </p>
        </Card>
      </div>
    </div>
  );
}
