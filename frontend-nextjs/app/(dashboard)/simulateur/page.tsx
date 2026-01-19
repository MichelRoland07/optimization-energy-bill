"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import useAuthStore from "@/store/useAuthStore";
import simulateurService, {
  TableauTarifsResponse,
  SimulationResponse,
} from "@/services/simulateur.service";

export default function SimulateurPage() {
  const { hasPermission } = useAuthStore();

  // State for tariffs table
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [tarifsData, setTarifsData] = useState<TableauTarifsResponse | null>(
    null,
  );
  const [isTarifsLoading, setIsTarifsLoading] = useState(false);
  const [tarifsError, setTarifsError] = useState("");

  // State for simulation
  const [puissance, setPuissance] = useState<number>(1500);
  const [tempsFonctionnement, setTempsFonctionnement] = useState<number>(300);
  const [simulationResult, setSimulationResult] =
    useState<SimulationResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState("");

  const canView = hasPermission("view_simulateur");

  // Load tariffs table on mount and when year changes
  useEffect(() => {
    if (canView) {
      loadTarifsTable();
    }
  }, [canView, selectedYear]);

  const loadTarifsTable = async () => {
    setIsTarifsLoading(true);
    setTarifsError("");

    try {
      const data = await simulateurService.getTableauTarifs(selectedYear);
      setTarifsData(data);
    } catch (err: any) {
      setTarifsError(
        err.response?.data?.detail ||
          "Erreur lors du chargement de la table des tarifs",
      );
    } finally {
      setIsTarifsLoading(false);
    }
  };

  const handleSimulate = async () => {
    setSimulationError("");
    setIsSimulating(true);

    try {
      const data = await simulateurService.simulate({
        puissance,
        temps_fonctionnement: tempsFonctionnement,
        annee: selectedYear,
      });
      setSimulationResult(data);
    } catch (err: any) {
      setSimulationError(
        err.response?.data?.detail || "Erreur lors de la simulation",
      );
      setSimulationResult(null);
    } finally {
      setIsSimulating(false);
    }
  };

  const formatNumber = (num: number, decimals: number = 0) => {
    return num.toLocaleString("fr-FR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
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
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Simulateur de tarifs électriques
          </h1>
          <p className="mt-2 text-gray-600">
            Cette page vous permet de consulter l'ensemble des tarifs
            électriques et de simuler les tarifs applicables selon votre
            puissance souscrite et votre temps de fonctionnement.
          </p>
        </div>

        <div className="border-t border-gray-300 mb-8"></div>

        {/* SECTION 1: Table complète des tarifs électriques */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Table complète des tarifs électriques
          </h2>

          {/* Year selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionnez l'année de référence :
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value={2027}>2027</option>
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
            </select>
          </div>

          {/* Info box */}
          <Alert
            type="info"
            message={`Lecture du tableau :
• Petits clients (Types 1-5, puissance <3000 kW) : utilisent les colonnes 0-200h, 201-400h, >400h
• Gros clients (Types 6-12, puissance ≥3000 kW) : utilisent les colonnes 0-400h, >400h
• Off Peak = Heures creuses (FCFA/kWh) | Peak = Heures pointe (FCFA/kWh) | PF = Prime Fixe (FCFA/kW)
• Tarifs affichés pour l'année ${selectedYear} avec augmentation annuelle incluse`}
          />

          {/* Tariffs table */}
          <Card className="mt-6">
            {isTarifsLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : tarifsError ? (
              <Alert type="error" message={tarifsError} />
            ) : tarifsData ? (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {tarifsData.colonnes.map((col, idx) => (
                        <th
                          key={idx}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tarifsData.lignes.map((ligne, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        {tarifsData.colonnes.map((col, colIdx) => (
                          <td
                            key={colIdx}
                            className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200 whitespace-nowrap"
                          >
                            {ligne[col] !== undefined && ligne[col] !== ""
                              ? String(ligne[col])
                              : "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="border-t border-gray-300 mb-8"></div>

        {/* SECTION 2: Simulateur interactif */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Simulateur interactif
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Puissance input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Puissance souscrite (kW) :
              </label>
              <input
                type="number"
                value={puissance}
                onChange={(e) => setPuissance(Number(e.target.value))}
                min={1}
                max={10000}
                step={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Temps de fonctionnement input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temps de fonctionnement mensuel (heures) :
              </label>
              <input
                type="number"
                value={tempsFonctionnement}
                onChange={(e) => setTempsFonctionnement(Number(e.target.value))}
                min={1}
                max={744}
                step={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Simulation button */}
          <Button
            onClick={handleSimulate}
            variant="primary"
            className="w-full"
            isLoading={isSimulating}
          >
            CALCULER LES TARIFS
          </Button>

          {/* Simulation error */}
          {simulationError && (
            <div className="mt-4">
              <Alert
                type="error"
                message={simulationError}
                onClose={() => setSimulationError("")}
              />
            </div>
          )}
        </div>

        {/* SECTION 3: Résultats de la simulation */}
        {simulationResult && (
          <>
            <div className="border-t border-gray-300 mb-8"></div>
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Résultats de la simulation
              </h2>

              {/* Metrics cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Type tarifaire</p>
                    <p className="text-2xl font-bold text-gray-900">
                      Type {simulationResult.type}
                    </p>
                  </div>
                </Card>

                <Card>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Catégorie</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {simulationResult.categorie}
                    </p>
                  </div>
                </Card>

                <Card>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Plage horaire</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {simulationResult.plage_horaire}
                    </p>
                  </div>
                </Card>

                <Card>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Intervalle de puissance
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      [{simulationResult.intervalle_min},{" "}
                      {simulationResult.intervalle_max}[ kW
                    </p>
                  </div>
                </Card>
              </div>

              {/* Tarifs applicables */}
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Tarifs applicables
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Tarif HC */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
                  <div className="text-center">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">
                      Tarif Heures Creuses
                    </h4>
                    <h2 className="text-3xl font-bold text-blue-900">
                      {formatNumber(simulationResult.tarif_off_peak, 3)}
                    </h2>
                    <p className="text-sm text-blue-700 mt-1">FCFA/kWh</p>
                  </div>
                </Card>

                {/* Tarif HP */}
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300">
                  <div className="text-center">
                    <h4 className="text-sm font-semibold text-orange-900 mb-2">
                      Tarif Heures Pointe
                    </h4>
                    <h2 className="text-3xl font-bold text-orange-900">
                      {formatNumber(simulationResult.tarif_peak, 3)}
                    </h2>
                    <p className="text-sm text-orange-700 mt-1">FCFA/kWh</p>
                  </div>
                </Card>

                {/* Prime Fixe */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300">
                  <div className="text-center">
                    <h4 className="text-sm font-semibold text-green-900 mb-2">
                      Prime Fixe
                    </h4>
                    <h2 className="text-3xl font-bold text-green-900">
                      {formatNumber(simulationResult.prime_fixe, 2)}
                    </h2>
                    <p className="text-sm text-green-700 mt-1">FCFA/kW</p>
                  </div>
                </Card>
              </div>

              {/* Coefficient info */}
              <Alert
                type="info"
                message={`Coefficient d'augmentation appliqué : ${simulationResult.coefficient.toFixed(4)} (année de référence : 2023)`}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
