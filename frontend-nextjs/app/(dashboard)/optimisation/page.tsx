"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { TableauSynthese } from "@/components/ui/TableauSynthese";
import { TableauTarifs } from "@/components/ui/TableauTarifs";
import useAuthStore from "@/store/useAuthStore";
import dataService, {
  OptimisationInitResponse,
  OptimisationSimulationResponse,
  TarifsInfo,
} from "@/services/data.service";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function OptimisationPage() {
  const { hasPermission } = useAuthStore();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [initData, setInitData] = useState<OptimisationInitResponse | null>(
    null,
  );
  const [simulationData, setSimulationData] =
    useState<OptimisationSimulationResponse | null>(null);
  const [nouvellePuissance, setNouvellePuissance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState("");

  const canView = hasPermission("view_optimisation");

  useEffect(() => {
    if (canView) {
      fetchInitData();
    }
  }, [canView]);

  const fetchInitData = async (year?: number) => {
    setIsLoading(true);
    setError("");

    try {
      const data = await dataService.getOptimisationInit(year);
      setInitData(data);
      setNouvellePuissance(data.config_actuelle.puissance_actuelle);

      if (!selectedYear) {
        setSelectedYear(data.year);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError(
          "Aucune donnée disponible. Veuillez d'abord télécharger un fichier Excel depuis la page Accueil.",
        );
      } else {
        setError(
          err.response?.data?.detail || "Erreur lors du chargement des données",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setSimulationData(null); // Reset simulation when changing year
    fetchInitData(year);
  };

  const handleSimulate = async () => {
    if (!initData || !selectedYear) return;

    setIsSimulating(true);
    setError("");

    try {
      const data = await dataService.postOptimisationSimulate(
        selectedYear,
        nouvellePuissance,
      );
      setSimulationData(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de la simulation");
    } finally {
      setIsSimulating(false);
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Optimisation et Projection
            </h1>
            <p className="mt-2 text-gray-600">
              Optimisez votre puissance souscrite et projetez vos coûts futurs
            </p>
          </div>

          {/* Year Selection */}
          {initData && initData.annees_disponibles.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">
                Année à optimiser:
              </label>
              <select
                value={selectedYear || ""}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                {initData.annees_disponibles.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Projection Info */}
        {initData && (
          <Alert
            type="info"
            message={`🔮 La projection sera faite pour l'année ${initData.annee_N_plus_1}`}
          />
        )}

        {/* Alerts */}
        {error && (
          <Alert type="error" message={error} onClose={() => setError("")} />
        )}

        {!initData && !error && (
          <Alert
            type="info"
            message="Aucune donnée disponible. Veuillez d'abord télécharger un fichier Excel depuis la page Accueil."
          />
        )}

        {initData && (
          <>
            {/* ========================================
                SECTION 1 : OPTIMISATION année N
                ======================================== */}
            <div className="mt-8">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-primary-600">
                  📊 SECTION 1 : OPTIMISATION {selectedYear}
                </h2>
                <p className="text-gray-600 mt-2">
                  Optimisez votre puissance souscrite pour l'année{" "}
                  {selectedYear} avec les tarifs actuels
                </p>
              </div>

              {/* Configuration actuelle */}
              <Card className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📊 Configuration actuelle
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-900 font-medium">
                      Puissance souscrite
                    </p>
                    <p className="text-2xl font-bold text-blue-900 mt-1">
                      {initData.config_actuelle.puissance_actuelle} kW
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-900 font-medium">
                      Puissance max atteinte
                    </p>
                    <p className="text-2xl font-bold text-green-900 mt-1">
                      {initData.config_actuelle.puissance_max.toFixed(0)} kW
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-900 font-medium">
                      Type tarifaire
                    </p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">
                      Type {initData.config_actuelle.type_actuel}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-orange-900 font-medium">
                      Coût annuel {selectedYear}
                    </p>
                    <p className="text-2xl font-bold text-orange-900 mt-1">
                      {(initData.config_actuelle.cout_annuel / 1e6).toFixed(1)}M
                      FCFA
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-900 font-medium">
                      Dépassements
                    </p>
                    <p className="text-2xl font-bold text-red-900 mt-1">
                      {initData.config_actuelle.nb_depassements}/12 mois
                    </p>
                  </div>
                </div>
              </Card>

              {/* Tarifs actuels */}
              {initData.tarifs_actuels && (
                <Card className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    💵 Tarifs actuels (Configuration actuelle)
                  </h3>
                  <TableauTarifs
                    tarifs={initData.tarifs_actuels}
                    title="Tarifs actuels"
                    annee={selectedYear || initData.year}
                  />
                </Card>
              )}

              {/* Nouvelle puissance à tester */}
              <Card className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  🎛️ Nouvelle puissance à tester
                </h3>
                <div className="max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entrez la nouvelle puissance souscrite (kW)
                  </label>
                  <input
                    type="number"
                    value={nouvellePuissance}
                    onChange={(e) =>
                      setNouvellePuissance(Number(e.target.value))
                    }
                    min={1}
                    max={50000}
                    step={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-gray-900 bg-white font-semibold text-lg"
                  />
                </div>

                {/* Validation warnings */}
                {nouvellePuissance < initData.config_actuelle.puissance_max && (
                  <Alert
                    type="error"
                    message={`🚨 ATTENTION : Risque de dépassements ! La puissance saisie (${nouvellePuissance.toFixed(0)} kW) est inférieure à votre puissance maximale atteinte (${initData.config_actuelle.puissance_max.toFixed(0)} kW) en ${selectedYear}.`}
                  />
                )}

                {nouvellePuissance >= initData.config_actuelle.puissance_max &&
                  nouvellePuissance <
                    initData.config_actuelle.puissance_actuelle && (
                    <Alert
                      type="success"
                      message={`✅ Bonne configuration ! La puissance saisie (${nouvellePuissance.toFixed(0)} kW) est supérieure à votre puissance maximale atteinte (${initData.config_actuelle.puissance_max.toFixed(0)} kW). Aucun dépassement prévu !`}
                    />
                  )}

                {/* Bouton Simuler */}
                <div className="mt-6">
                  <Button
                    onClick={handleSimulate}
                    disabled={isSimulating}
                    className="w-full"
                  >
                    {isSimulating
                      ? "🔄 Simulation en cours..."
                      : "🚀 SIMULER CETTE CONFIGURATION"}
                  </Button>
                </div>
              </Card>

              {/* Résultats de la simulation */}
              {simulationData && (
                <>
                  {/* Info nouvelle puissance */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card
                      className={`${
                        simulationData.info_nouvelle_puissance.type_change ===
                        "identique"
                          ? "bg-blue-50"
                          : simulationData.info_nouvelle_puissance
                                .type_change === "descente"
                            ? "bg-green-50"
                            : "bg-orange-50"
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-700">
                        Type tarifaire
                      </p>
                      <p className="text-lg font-bold mt-1 text-gray-900">
                        Type{" "}
                        {simulationData.info_nouvelle_puissance.type_optimise} (
                        {simulationData.info_nouvelle_puissance.type_change ===
                          "identique" && "identique"}
                        {simulationData.info_nouvelle_puissance.type_change ===
                          "descente" && "🔽 descente"}
                        {simulationData.info_nouvelle_puissance.type_change ===
                          "montee" && "🔼 montée"}
                        )
                      </p>
                    </Card>

                    <Card className="bg-blue-50">
                      <p className="text-sm font-medium text-gray-700">
                        Intervalle
                      </p>
                      <p className="text-lg font-bold mt-1 text-gray-900">
                        [{simulationData.info_nouvelle_puissance.intervalle_min}
                        ,{" "}
                        {simulationData.info_nouvelle_puissance.intervalle_max}[
                        kW
                      </p>
                    </Card>

                    <Card
                      className={`${
                        simulationData.info_nouvelle_puissance
                          .delta_puissance === 0
                          ? "bg-blue-50"
                          : simulationData.info_nouvelle_puissance
                                .delta_puissance > 0
                            ? "bg-orange-50"
                            : "bg-green-50"
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-700">
                        Variation
                      </p>
                      <p className="text-lg font-bold mt-1 text-gray-900">
                        {simulationData.info_nouvelle_puissance
                          .delta_puissance === 0 && "↔️ 0 kW (identique)"}
                        {simulationData.info_nouvelle_puissance
                          .delta_puissance > 0 &&
                          `⬆️ +${simulationData.info_nouvelle_puissance.delta_puissance} kW`}
                        {simulationData.info_nouvelle_puissance
                          .delta_puissance < 0 &&
                          `⬇️ ${simulationData.info_nouvelle_puissance.delta_puissance} kW`}
                      </p>
                    </Card>
                  </div>

                  {/* Tarifs nouvelle puissance */}
                  {simulationData.tarifs_nouvelle_puissance && (
                    <Card className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        💵 Tarifs testés (Nouvelle configuration avec{" "}
                        {nouvellePuissance} kW)
                      </h3>
                      <TableauTarifs
                        tarifs={simulationData.tarifs_nouvelle_puissance}
                        title="Tarifs nouvelle puissance"
                        annee={selectedYear || initData.year}
                      />
                    </Card>
                  )}

                  {/* Résultats Section 1 */}
                  <Card className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      📊 Résultats de l'optimisation
                    </h3>

                    {/* Métriques financières */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-3">
                        💰 Comparaison financière
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">
                            Coût actuel {selectedYear}
                          </p>
                          <p className="text-xl font-bold text-gray-900 mt-1">
                            {(
                              simulationData.resultats_simulation
                                .metriques_financieres.cout_actuel / 1e6
                            ).toFixed(1)}
                            M FCFA
                          </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm text-green-900">
                            Coût Optimisé {selectedYear}
                          </p>
                          <p className="text-xl font-bold text-green-900 mt-1">
                            {(
                              simulationData.resultats_simulation
                                .metriques_financieres.cout_optimise / 1e6
                            ).toFixed(1)}
                            M FCFA
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            {(
                              simulationData.resultats_simulation
                                .metriques_financieres.economie_annuelle / 1e6
                            ).toFixed(1)}
                            M FCFA
                          </p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-blue-900">
                            Économie annuelle
                          </p>
                          <p className="text-xl font-bold text-blue-900 mt-1">
                            {(
                              simulationData.resultats_simulation
                                .metriques_financieres.economie_annuelle / 1e6
                            ).toFixed(1)}
                            M FCFA
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            {simulationData.resultats_simulation
                              .metriques_financieres.economie_pct >= 0
                              ? "+"
                              : ""}
                            {simulationData.resultats_simulation.metriques_financieres.economie_pct.toFixed(
                              1,
                            )}
                            %
                          </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-sm text-purple-900">
                            Économie/mois
                          </p>
                          <p className="text-xl font-bold text-purple-900 mt-1">
                            {(
                              simulationData.resultats_simulation
                                .metriques_financieres.economie_mensuelle / 1e6
                            ).toFixed(1)}
                            M FCFA
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Métriques dépassements */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-3">
                        ⚡ Comparaison des dépassements
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">
                            Dépassements actuels
                          </p>
                          <p className="text-xl font-bold text-gray-900 mt-1">
                            {
                              simulationData.resultats_simulation
                                .metriques_depassements.nb_depassements_actuel
                            }
                            /12 mois
                          </p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <p className="text-sm text-orange-900">
                            Dépassements Optimisés
                          </p>
                          <p className="text-xl font-bold text-orange-900 mt-1">
                            {
                              simulationData.resultats_simulation
                                .metriques_depassements.nb_depassements_optimise
                            }
                            /12 mois
                          </p>
                          <p className="text-xs text-orange-700 mt-1">
                            {simulationData.resultats_simulation
                              .metriques_depassements.delta_depassements >= 0
                              ? "+"
                              : ""}
                            {
                              simulationData.resultats_simulation
                                .metriques_depassements.delta_depassements
                            }{" "}
                            mois
                          </p>
                        </div>
                        <div
                          className={`p-4 rounded-lg ${
                            simulationData.resultats_simulation
                              .metriques_depassements
                              .nb_depassements_optimise === 0
                              ? "bg-green-50"
                              : simulationData.resultats_simulation
                                    .metriques_depassements
                                    .nb_depassements_optimise <= 2
                                ? "bg-blue-50"
                                : "bg-orange-50"
                          }`}
                        >
                          <p className="text-sm font-semibold">
                            {simulationData.resultats_simulation
                              .metriques_depassements
                              .nb_depassements_optimise === 0 &&
                              "✅ Aucun dépassement !"}
                            {simulationData.resultats_simulation
                              .metriques_depassements.nb_depassements_optimise >
                              0 &&
                              simulationData.resultats_simulation
                                .metriques_depassements
                                .nb_depassements_optimise <= 2 &&
                              `ℹ️ ${simulationData.resultats_simulation.metriques_depassements.nb_depassements_optimise} dépassement(s) acceptable(s)`}
                            {simulationData.resultats_simulation
                              .metriques_depassements.nb_depassements_optimise >
                              2 &&
                              `⚠️ ${simulationData.resultats_simulation.metriques_depassements.nb_depassements_optimise} dépassements`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Alerte économie */}
                    {simulationData.resultats_simulation.alerte_economie && (
                      <Alert
                        type={
                          simulationData.resultats_simulation.alerte_economie
                            .type
                        }
                        message={
                          simulationData.resultats_simulation.alerte_economie
                            .message
                        }
                      />
                    )}

                    {/* Graph 1: Factures mensuelles */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-3">
                        📈 Graphiques comparatifs
                      </h4>
                      <Card>
                        <Plot
                          data={[
                            {
                              x: simulationData.resultats_simulation
                                .graph_factures.x,
                              y: simulationData.resultats_simulation
                                .graph_factures.y_actuelle,
                              type: "scatter",
                              mode: "lines+markers",
                              name: "Configuration actuelle",
                              line: { color: "#FF6B6B", width: 3 },
                              marker: { size: 8 },
                            },
                            {
                              x: simulationData.resultats_simulation
                                .graph_factures.x,
                              y: simulationData.resultats_simulation
                                .graph_factures.y_simulee,
                              type: "scatter",
                              mode: "lines+markers",
                              name: "Configuration simulée",
                              line: { color: "#4ECDC4", width: 3 },
                              marker: { size: 8 },
                            },
                          ]}
                          layout={{
                            autosize: true,
                            height: 400,
                            title: {
                              text:
                                simulationData.resultats_simulation.graph_factures
                                  .title,
                            },
                            xaxis: {
                              title: {
                                text:
                                  simulationData.resultats_simulation
                                    .graph_factures.xaxis_title,
                              },
                            },
                            yaxis: {
                              title: {
                                text:
                                  simulationData.resultats_simulation
                                    .graph_factures.yaxis_title,
                              },
                            },
                            hovermode: "x unified",
                            showlegend: true,
                            legend: { orientation: "h", y: -0.2 },
                          }}
                          useResizeHandler
                          style={{ width: "100%", height: "100%" }}
                          config={{ responsive: true }}
                        />
                      </Card>

                      {/* Text area analysis 1 */}
                      <Card className="mt-4 bg-blue-50">
                        <h5 className="text-sm font-semibold text-blue-900 mb-2">
                          📝 Vos analyses sur la comparaison des factures
                          mensuelles
                        </h5>
                        <textarea
                          className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                          rows={3}
                          placeholder="Comparez les deux configurations, identifiez les mois avec le plus d'écart..."
                        />
                      </Card>
                    </div>

                    {/* Graph 2: Économies mensuelles */}
                    <div>
                      <Card>
                        <Plot
                          data={[
                            {
                              x: simulationData.resultats_simulation
                                .graph_economies.x,
                              y: simulationData.resultats_simulation
                                .graph_economies.y,
                              type: "bar",
                              name: "Économie",
                              text: simulationData.resultats_simulation
                                .graph_economies.text,
                              textposition: "outside",
                              marker: {
                                color:
                                  simulationData.resultats_simulation.graph_economies.y.map(
                                    (val) => (val > 0 ? "#2ECC71" : "#E74C3C"),
                                  ),
                              },
                            },
                          ]}
                          layout={{
                            autosize: true,
                            height: 400,
                            title:
                              simulationData.resultats_simulation
                                .graph_economies.title,
                            xaxis: {
                              title:
                                simulationData.resultats_simulation
                                  .graph_economies.xaxis_title,
                            },
                            yaxis: {
                              title:
                                simulationData.resultats_simulation
                                  .graph_economies.yaxis_title,
                            },
                            showlegend: false,
                          }}
                          useResizeHandler
                          style={{ width: "100%", height: "100%" }}
                          config={{ responsive: true }}
                        />
                      </Card>

                      {/* Text area analysis 2 */}
                      <Card className="mt-4 bg-green-50">
                        <h5 className="text-sm font-semibold text-green-900 mb-2">
                          📝 Vos analyses sur les économies mensuelles
                        </h5>
                        <textarea
                          className="w-full p-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
                          rows={3}
                          placeholder="Analysez la répartition des économies, les mois favorables ou défavorables..."
                        />
                      </Card>
                    </div>

                    {/* Tableau de synthèse Section 1 */}
                    {simulationData.resultats_simulation.tableau_synthese && (
                      <TableauSynthese
                        data={
                          simulationData.resultats_simulation.tableau_synthese
                        }
                        title={`📋 Tableau de synthèse - Optimisation ${selectedYear}`}
                      />
                    )}
                  </Card>

                  {/* ========================================
                      SECTION 2 : PROJECTION année N+1
                      ======================================== */}
                  <div className="mt-12">
                    <div className="mb-6 text-center">
                      <h2 className="text-2xl font-bold text-primary-600">
                        🔮 SECTION 2 : PROJECTION{" "}
                        {simulationData.annee_N_plus_1}
                      </h2>
                      <p className="text-gray-600 mt-2">
                        Projection des coûts {simulationData.annee_N_plus_1}{" "}
                        avec la puissance actuelle et les nouveaux tarifs{" "}
                        {simulationData.annee_N_plus_1}
                      </p>
                    </div>

                    <Alert
                      type="info"
                      message={`📌 Cette section projette vos coûts pour ${simulationData.annee_N_plus_1} en conservant votre puissance actuelle et vos consommations ${selectedYear}, mais en appliquant les tarifs ${simulationData.annee_N_plus_1}.`}
                    />

                    {/* Tarifs N+1 (puissance actuelle) */}
                    {simulationData.resultats_projection.tarifs_N_plus_1 && (
                      <Card className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          💵 Tarifs {simulationData.annee_N_plus_1} (Puissance
                          actuelle)
                        </h3>
                        <TableauTarifs
                          tarifs={
                            simulationData.resultats_projection.tarifs_N_plus_1
                          }
                          title="Tarifs N+1 (puissance actuelle)"
                          annee={simulationData.annee_N_plus_1}
                        />
                      </Card>
                    )}

                    <Card className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        💰 Projection financière {simulationData.annee_N_plus_1}{" "}
                        (Puissance actuelle)
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">
                            Coût actuel {selectedYear}
                          </p>
                          <p className="text-xl font-bold text-gray-900 mt-1">
                            {(
                              simulationData.resultats_projection
                                .metriques_projection.cout_N / 1e6
                            ).toFixed(1)}
                            M FCFA
                          </p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <p className="text-sm text-orange-900">
                            Coût projeté {simulationData.annee_N_plus_1}
                          </p>
                          <p className="text-xl font-bold text-orange-900 mt-1">
                            {(
                              simulationData.resultats_projection
                                .metriques_projection.cout_N_plus_1 / 1e6
                            ).toFixed(1)}
                            M FCFA
                          </p>
                          <p className="text-xs text-orange-700 mt-1">
                            +
                            {(
                              simulationData.resultats_projection
                                .metriques_projection.augmentation_annuelle /
                              1e6
                            ).toFixed(1)}
                            M FCFA
                          </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <p className="text-sm text-red-900">
                            Augmentation annuelle
                          </p>
                          <p className="text-xl font-bold text-red-900 mt-1">
                            {(
                              simulationData.resultats_projection
                                .metriques_projection.augmentation_annuelle /
                              1e6
                            ).toFixed(1)}
                            M FCFA
                          </p>
                          <p className="text-xs text-red-700 mt-1">
                            +
                            {simulationData.resultats_projection.metriques_projection.augmentation_pct.toFixed(
                              1,
                            )}
                            %
                          </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-sm text-purple-900">
                            Augmentation/mois
                          </p>
                          <p className="text-xl font-bold text-purple-900 mt-1">
                            {(
                              simulationData.resultats_projection
                                .metriques_projection.augmentation_mensuelle /
                              1e6
                            ).toFixed(1)}
                            M FCFA
                          </p>
                        </div>
                      </div>

                      {/* Dépassements */}
                      <div className="mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg inline-block">
                          <p className="text-sm text-gray-600">
                            Dépassements projetés
                          </p>
                          <p className="text-xl font-bold text-gray-900 mt-1">
                            {
                              simulationData.resultats_projection
                                .metriques_projection.nb_depassements
                            }
                            /12 mois
                          </p>
                        </div>
                      </div>

                      {/* Graph 1 Projection: Factures N vs N+1 */}
                      <div>
                        <h4 className="text-md font-semibold text-gray-800 mb-3">
                          📈 Graphiques comparatifs
                        </h4>
                        <Card>
                          <Plot
                            data={[
                              {
                                x: simulationData.resultats_projection
                                  .graph_factures.x,
                                y: simulationData.resultats_projection
                                  .graph_factures.y_N,
                                type: "scatter",
                                mode: "lines+markers",
                                name: `Facture ${selectedYear}`,
                                line: { color: "#FF6B6B", width: 3 },
                                marker: { size: 8 },
                              },
                              {
                                x: simulationData.resultats_projection
                                  .graph_factures.x,
                                y: simulationData.resultats_projection
                                  .graph_factures.y_N_plus_1,
                                type: "scatter",
                                mode: "lines+markers",
                                name: `Projection ${simulationData.annee_N_plus_1}`,
                                line: { color: "#4ECDC4", width: 3 },
                                marker: { size: 8 },
                              },
                            ]}
                            layout={{
                              autosize: true,
                              height: 400,
                              title:
                                simulationData.resultats_projection
                                  .graph_factures.title,
                              xaxis: {
                                title:
                                  simulationData.resultats_projection
                                    .graph_factures.xaxis_title,
                              },
                              yaxis: {
                                title:
                                  simulationData.resultats_projection
                                    .graph_factures.yaxis_title,
                              },
                              hovermode: "x unified",
                              showlegend: true,
                              legend: { orientation: "h", y: -0.2 },
                            }}
                            useResizeHandler
                            style={{ width: "100%", height: "100%" }}
                            config={{ responsive: true }}
                          />
                        </Card>

                        {/* Text area analysis projection 1 */}
                        <Card className="mt-4 bg-blue-50">
                          <h5 className="text-sm font-semibold text-blue-900 mb-2">
                            📝 Vos analyses sur la comparaison des factures
                            mensuelles
                          </h5>
                          <textarea
                            className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                            rows={3}
                            placeholder={`Comparez ${selectedYear} et ${simulationData.annee_N_plus_1}, identifiez les mois avec le plus d'augmentation...`}
                          />
                        </Card>
                      </div>

                      {/* Graph 2 Projection: Augmentations mensuelles */}
                      <div>
                        <Card>
                          <Plot
                            data={[
                              {
                                x: simulationData.resultats_projection
                                  .graph_augmentations.x,
                                y: simulationData.resultats_projection
                                  .graph_augmentations.y,
                                type: "bar",
                                name: "Augmentation",
                                text: simulationData.resultats_projection
                                  .graph_augmentations.text,
                                textposition: "outside",
                                marker: {
                                  color:
                                    simulationData.resultats_projection.graph_augmentations.y.map(
                                      (val) =>
                                        val > 0 ? "#E74C3C" : "#2ECC71",
                                    ),
                                },
                              },
                            ]}
                            layout={{
                              autosize: true,
                              height: 400,
                              title:
                                simulationData.resultats_projection
                                  .graph_augmentations.title,
                              xaxis: {
                                title:
                                  simulationData.resultats_projection
                                    .graph_augmentations.xaxis_title,
                              },
                              yaxis: {
                                title:
                                  simulationData.resultats_projection
                                    .graph_augmentations.yaxis_title,
                              },
                              showlegend: false,
                            }}
                            useResizeHandler
                            style={{ width: "100%", height: "100%" }}
                            config={{ responsive: true }}
                          />
                        </Card>

                        {/* Text area analysis projection 2 */}
                        <Card className="mt-4 bg-orange-50">
                          <h5 className="text-sm font-semibold text-orange-900 mb-2">
                            📝 Vos analyses sur les augmentations mensuelles
                          </h5>
                          <textarea
                            className="w-full p-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                            rows={3}
                            placeholder="Analysez l'impact de l'augmentation des tarifs mois par mois..."
                          />
                        </Card>
                      </div>

                      {/* Tableau de synthèse Section 2 */}
                      {simulationData.resultats_projection.tableau_synthese && (
                        <TableauSynthese
                          data={
                            simulationData.resultats_projection.tableau_synthese
                          }
                          title={`📋 Tableau de synthèse - Projection ${simulationData.annee_N_plus_1}`}
                        />
                      )}
                    </Card>
                  </div>

                  {/* ========================================
                      SECTION 3 : OPTIMISATION année N+1
                      ======================================== */}
                  <div className="mt-12">
                    <div className="mb-6 text-center">
                      <h2 className="text-2xl font-bold text-primary-600">
                        🚀 SECTION 3 : OPTIMISATION{" "}
                        {simulationData.annee_N_plus_1} avec puissance testée (
                        {nouvellePuissance} kW)
                      </h2>
                      <p className="text-gray-600 mt-2">
                        Projection des coûts {simulationData.annee_N_plus_1}{" "}
                        avec la puissance optimisée {nouvellePuissance} kW et
                        les nouveaux tarifs {simulationData.annee_N_plus_1}
                      </p>
                    </div>

                    <Alert
                      type="success"
                      message={`🎯 Cette section projette vos coûts pour ${simulationData.annee_N_plus_1} en appliquant la puissance optimisée de ${nouvellePuissance} kW avec les tarifs ${simulationData.annee_N_plus_1}. Comparez avec la projection N+1 (Section 2) pour voir les économies supplémentaires !`}
                    />

                    {/* Tarifs N+1 optimisé */}
                    {simulationData.resultats_optimisation_N_plus_1
                      .tarifs_N_plus_1_optimise && (
                      <Card className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          💵 Tarifs {simulationData.annee_N_plus_1} Optimisés
                          (Puissance {nouvellePuissance} kW)
                        </h3>
                        <TableauTarifs
                          tarifs={
                            simulationData.resultats_optimisation_N_plus_1
                              .tarifs_N_plus_1_optimise
                          }
                          title="Tarifs N+1 optimisé"
                          annee={simulationData.annee_N_plus_1}
                        />
                      </Card>
                    )}

                    <Card className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        💰 Optimisation financière{" "}
                        {simulationData.annee_N_plus_1} (Puissance optimisée)
                      </h3>

                      {/* Métriques financières */}
                      <div className="mb-6">
                        <h4 className="text-md font-semibold text-gray-800 mb-3">
                          💸 Comparaison financière complète
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">
                              Coût {selectedYear}
                            </p>
                            <p className="text-xl font-bold text-gray-900 mt-1">
                              {(
                                simulationData.resultats_optimisation_N_plus_1
                                  .metriques_optimisation.cout_N / 1e6
                              ).toFixed(1)}
                              M FCFA
                            </p>
                          </div>
                          <div className="bg-orange-50 p-4 rounded-lg">
                            <p className="text-sm text-orange-900">
                              Coût {simulationData.annee_N_plus_1} actuelle
                            </p>
                            <p className="text-xl font-bold text-orange-900 mt-1">
                              {(
                                simulationData.resultats_optimisation_N_plus_1
                                  .metriques_optimisation
                                  .cout_N_plus_1_actuelle / 1e6
                              ).toFixed(1)}
                              M FCFA
                            </p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-green-900">
                              Coût {simulationData.annee_N_plus_1} optimisée
                            </p>
                            <p className="text-xl font-bold text-green-900 mt-1">
                              {(
                                simulationData.resultats_optimisation_N_plus_1
                                  .metriques_optimisation
                                  .cout_N_plus_1_optimisee / 1e6
                              ).toFixed(1)}
                              M FCFA
                            </p>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-900">
                              Économie vs projection
                            </p>
                            <p className="text-xl font-bold text-blue-900 mt-1">
                              {(
                                simulationData.resultats_optimisation_N_plus_1
                                  .metriques_optimisation
                                  .economie_vs_projection / 1e6
                              ).toFixed(1)}
                              M FCFA
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              {simulationData.resultats_optimisation_N_plus_1
                                .metriques_optimisation
                                .economie_vs_projection_pct >= 0
                                ? "+"
                                : ""}
                              {simulationData.resultats_optimisation_N_plus_1.metriques_optimisation.economie_vs_projection_pct.toFixed(
                                1,
                              )}
                              %
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Économie vs N */}
                      <div className="mb-6">
                        <div className="bg-purple-50 p-4 rounded-lg inline-block">
                          <p className="text-sm text-purple-900">
                            Économie vs {selectedYear}
                          </p>
                          <p className="text-xl font-bold text-purple-900 mt-1">
                            {(
                              simulationData.resultats_optimisation_N_plus_1
                                .metriques_optimisation.economie_vs_N / 1e6
                            ).toFixed(1)}
                            M FCFA
                          </p>
                          <p className="text-xs text-purple-700 mt-1">
                            {simulationData.resultats_optimisation_N_plus_1
                              .metriques_optimisation.economie_vs_N_pct >= 0
                              ? "+"
                              : ""}
                            {simulationData.resultats_optimisation_N_plus_1.metriques_optimisation.economie_vs_N_pct.toFixed(
                              1,
                            )}
                            %
                          </p>
                        </div>
                      </div>

                      {/* Métriques dépassements */}
                      <div className="mb-6">
                        <h4 className="text-md font-semibold text-gray-800 mb-3">
                          ⚡ Dépassements
                        </h4>
                        <div
                          className={`p-4 rounded-lg inline-block ${
                            simulationData.resultats_optimisation_N_plus_1
                              .metriques_optimisation.nb_depassements === 0
                              ? "bg-green-50"
                              : simulationData.resultats_optimisation_N_plus_1
                                    .metriques_optimisation.nb_depassements <= 2
                                ? "bg-blue-50"
                                : "bg-orange-50"
                          }`}
                        >
                          <p className="text-sm font-medium">
                            Dépassements {simulationData.annee_N_plus_1}
                          </p>
                          <p className="text-xl font-bold mt-1">
                            {
                              simulationData.resultats_optimisation_N_plus_1
                                .metriques_optimisation.nb_depassements
                            }
                            /12 mois
                          </p>
                          <p className="text-xs mt-1">
                            {simulationData.resultats_optimisation_N_plus_1
                              .metriques_optimisation.nb_depassements === 0 &&
                              "✅ Aucun dépassement !"}
                            {simulationData.resultats_optimisation_N_plus_1
                              .metriques_optimisation.nb_depassements > 0 &&
                              simulationData.resultats_optimisation_N_plus_1
                                .metriques_optimisation.nb_depassements <= 2 &&
                              `ℹ️ ${simulationData.resultats_optimisation_N_plus_1.metriques_optimisation.nb_depassements} dépassement(s) acceptable(s)`}
                            {simulationData.resultats_optimisation_N_plus_1
                              .metriques_optimisation.nb_depassements > 2 &&
                              `⚠️ ${simulationData.resultats_optimisation_N_plus_1.metriques_optimisation.nb_depassements} dépassements`}
                          </p>
                        </div>
                      </div>

                      {/* Graph 1: Factures N vs N+1 actuelle vs N+1 optimisée */}
                      <div>
                        <h4 className="text-md font-semibold text-gray-800 mb-3">
                          📈 Graphiques comparatifs
                        </h4>
                        <Card>
                          <Plot
                            data={[
                              {
                                x: simulationData
                                  .resultats_optimisation_N_plus_1
                                  .graph_factures.x,
                                y: simulationData
                                  .resultats_optimisation_N_plus_1
                                  .graph_factures.y_N,
                                type: "scatter",
                                mode: "lines+markers",
                                name: `Facture ${selectedYear}`,
                                line: { color: "#FF6B6B", width: 3 },
                                marker: { size: 8 },
                              },
                              {
                                x: simulationData
                                  .resultats_optimisation_N_plus_1
                                  .graph_factures.x,
                                y: simulationData
                                  .resultats_optimisation_N_plus_1
                                  .graph_factures.y_N_plus_1_actuelle,
                                type: "scatter",
                                mode: "lines+markers",
                                name: `Projection ${simulationData.annee_N_plus_1} (actuelle)`,
                                line: { color: "#FFA500", width: 3 },
                                marker: { size: 8 },
                              },
                              {
                                x: simulationData
                                  .resultats_optimisation_N_plus_1
                                  .graph_factures.x,
                                y: simulationData
                                  .resultats_optimisation_N_plus_1
                                  .graph_factures.y_N_plus_1_optimisee,
                                type: "scatter",
                                mode: "lines+markers",
                                name: `Projection ${simulationData.annee_N_plus_1} (optimisée)`,
                                line: { color: "#2ECC71", width: 3 },
                                marker: { size: 8 },
                              },
                            ]}
                            layout={{
                              autosize: true,
                              height: 400,
                              title:
                                simulationData.resultats_optimisation_N_plus_1
                                  .graph_factures.title,
                              xaxis: {
                                title:
                                  simulationData.resultats_optimisation_N_plus_1
                                    .graph_factures.xaxis_title,
                              },
                              yaxis: {
                                title:
                                  simulationData.resultats_optimisation_N_plus_1
                                    .graph_factures.yaxis_title,
                              },
                              hovermode: "x unified",
                              showlegend: true,
                              legend: { orientation: "h", y: -0.2 },
                            }}
                            useResizeHandler
                            style={{ width: "100%", height: "100%" }}
                            config={{ responsive: true }}
                          />
                        </Card>

                        {/* Text area analysis 1 */}
                        <Card className="mt-4 bg-blue-50">
                          <h5 className="text-sm font-semibold text-blue-900 mb-2">
                            📝 Vos analyses sur la comparaison des factures
                          </h5>
                          <textarea
                            className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                            rows={3}
                            placeholder={`Comparez les 3 scénarios (${selectedYear}, ${simulationData.annee_N_plus_1} actuelle, ${simulationData.annee_N_plus_1} optimisée)...`}
                          />
                        </Card>
                      </div>

                      {/* Graph 2: Économies vs projection */}
                      <div>
                        <Card>
                          <Plot
                            data={[
                              {
                                x: simulationData
                                  .resultats_optimisation_N_plus_1
                                  .graph_economies.x,
                                y: simulationData
                                  .resultats_optimisation_N_plus_1
                                  .graph_economies.y,
                                type: "bar",
                                name: "Économie vs projection",
                                text: simulationData
                                  .resultats_optimisation_N_plus_1
                                  .graph_economies.text,
                                textposition: "outside",
                                marker: {
                                  color:
                                    simulationData.resultats_optimisation_N_plus_1.graph_economies.y.map(
                                      (val) =>
                                        val > 0 ? "#2ECC71" : "#E74C3C",
                                    ),
                                },
                              },
                            ]}
                            layout={{
                              autosize: true,
                              height: 400,
                              title:
                                simulationData.resultats_optimisation_N_plus_1
                                  .graph_economies.title,
                              xaxis: {
                                title:
                                  simulationData.resultats_optimisation_N_plus_1
                                    .graph_economies.xaxis_title,
                              },
                              yaxis: {
                                title:
                                  simulationData.resultats_optimisation_N_plus_1
                                    .graph_economies.yaxis_title,
                              },
                              showlegend: false,
                            }}
                            useResizeHandler
                            style={{ width: "100%", height: "100%" }}
                            config={{ responsive: true }}
                          />
                        </Card>

                        {/* Text area analysis 2 */}
                        <Card className="mt-4 bg-green-50">
                          <h5 className="text-sm font-semibold text-green-900 mb-2">
                            📝 Vos analyses sur les économies mensuelles
                          </h5>
                          <textarea
                            className="w-full p-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
                            rows={3}
                            placeholder={`Analysez les économies mensuelles entre la projection ${simulationData.annee_N_plus_1} actuelle et optimisée...`}
                          />
                        </Card>
                      </div>

                      {/* Tableau de synthèse Section 3 */}
                      {simulationData.resultats_optimisation_N_plus_1
                        .tableau_synthese && (
                        <TableauSynthese
                          data={
                            simulationData.resultats_optimisation_N_plus_1
                              .tableau_synthese
                          }
                          title={`📋 Tableau de synthèse - Optimisation ${simulationData.annee_N_plus_1}`}
                        />
                      )}
                    </Card>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
