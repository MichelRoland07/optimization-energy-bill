"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  User,
  FileText,
  TrendingUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import useAuthStore from "@/store/useAuthStore";
import dataService, { ProfilClientResponse } from "@/services/data.service";
import {
  PaginatedTableProps,
  PaginationProps,
  TabType,
} from "./profil_interface";
import PaginatedTable from "./components/PaginationTable";
import ProfilePage from "./components/ProfilePage";
import Resume from "./components/Resume";
import Consommation from "./components/Consommation";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ProfilClientPage() {
  const { hasPermission } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>("profil");
  const [profilData, setProfilData] = useState<ProfilClientResponse | null>(
    null,
  );
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Section 4: Synthese data
  const [syntheseYear, setSyntheseYear] = useState<number | null>(null);
  const [syntheseData, setSyntheseData] = useState<any>(null);
  const [graphiquesData, setGraphiquesData] = useState<any>(null);
  const [isSyntheseLoading, setIsSyntheseLoading] = useState(false);

  const canView = hasPermission("view_profile");

  useEffect(() => {
    if (canView) {
      fetchProfilData();
    }
  }, [canView]);

  const fetchProfilData = async (year?: number) => {
    setIsLoading(true);
    setError("");

    try {
      const data = await dataService.getProfilClient(year);
      setProfilData(data);

      if (!selectedYear) {
        setSelectedYear(data.profil_energetique.annee);
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
    fetchProfilData(year);
  };

  const fetchSyntheseData = async (year: number) => {
    setIsSyntheseLoading(true);
    try {
      const [synthese, graphiques] = await Promise.all([
        dataService.getSynthese(year),
        dataService.getGraphiques(year),
      ]);
      setSyntheseData(synthese);
      setGraphiquesData(graphiques);
    } catch (err: any) {
      console.error("Error loading synthese data:", err);
    } finally {
      setIsSyntheseLoading(false);
    }
  };

  const handleSyntheseYearChange = (year: number) => {
    setSyntheseYear(year);
    fetchSyntheseData(year);
  };

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!profilData) {
    return (
      <div className="p-8">
        {error && (
          <Alert type="error" message={error} onClose={() => setError("")} />
        )}
        {!error && (
          <Alert
            type="info"
            message="Aucune donnée disponible. Veuillez d'abord télécharger un fichier Excel depuis la page Accueil."
          />
        )}
      </div>
    );
  }

  const { infos_administratives, profil_energetique, profil_consommation } =
    profilData;

  const tabs = [
    { id: "profil" as TabType, label: "Profil Client", icon: User },
    { id: "resume" as TabType, label: "Résumé Énergétique", icon: FileText },
    { id: "consommation" as TabType, label: "Consommation", icon: TrendingUp },
    {
      id: "synthese" as TabType,
      label: "Synthèse & Graphiques",
      icon: BarChart3,
    },
  ];

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
          <Alert type="error" message={error} onClose={() => setError("")} />
        )}

        {/* Tabs Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-1" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* PROFIL CLIENT TAB */}
          {activeTab === "profil" && (
            <ProfilePage infos_administratives={infos_administratives} />
          )}

          {/* RÉSUMÉ ÉNERGÉTIQUE TAB */}
          {activeTab === "resume" && (
            <Resume
              profil_energetique={profil_energetique}
              infos_administratives={infos_administratives}
              selectedYear={selectedYear}
              handleYearChange={handleYearChange}
            />
          )}

          {/* CONSOMMATION TAB */}
          {activeTab === "consommation" && (
            <Consommation
              profil_consommation={{
                graph1_evolution: {
                  series: [],
                },
                tableau_variation_conso: [],
                graph2_hc_hp_facturation: {
                  annees: [],
                  hc: [],
                  hp: [],
                  facturation: [],
                },
                tableau_variation_facturation: [],
                tableau_prix_unitaire: [],
                tableau_recapitulatif: [],
              }}
            />
          )}

          {/* SYNTHÈSE TAB */}
          {activeTab === "synthese" && (
            <div className="space-y-6">
              {/* Year Selector */}
              {infos_administratives.annees_disponibles.length > 0 && (
                <Card className="bg-gradient-to-r from-emerald-50 to-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Sélectionner l'année
                    </h3>
                    <select
                      value={syntheseYear || ""}
                      onChange={(e) =>
                        handleSyntheseYearChange(Number(e.target.value))
                      }
                      className="px-4 py-2 border-2 border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    >
                      {infos_administratives.annees_disponibles.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </Card>
              )}

              {isSyntheseLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : syntheseData && graphiquesData ? (
                <>
                  {/* Tableau de synthèse */}
                  <Card>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Tableau de synthèse {syntheseYear}
                    </h3>
                    <PaginatedTable
                      data={syntheseData.tableau}
                      itemsPerPage={10}
                      columns={[
                        { key: "mois", label: "Mois", align: "left" },
                        {
                          key: "date_releve",
                          label: "Date relevé",
                          align: "center",
                        },
                        {
                          key: "puissance_souscrite",
                          label: "P. souscrite",
                          align: "center",
                        },
                        {
                          key: "puissance_atteinte",
                          label: "P. atteinte",
                          align: "center",
                        },
                        {
                          key: "depassement",
                          label: "Dépass.",
                          align: "center",
                          render: (value) => (
                            <span
                              className={
                                value > 0 ? "text-red-600 font-semibold" : ""
                              }
                            >
                              {value}
                            </span>
                          ),
                        },
                        {
                          key: "consommation",
                          label: "Consommation",
                          align: "right",
                          render: (value) =>
                            value.toLocaleString("fr-FR", {
                              maximumFractionDigits: 0,
                            }),
                        },
                        {
                          key: "consommation_hc",
                          label: "HC",
                          align: "right",
                          render: (value) =>
                            value.toLocaleString("fr-FR", {
                              maximumFractionDigits: 0,
                            }),
                        },
                        {
                          key: "consommation_hp",
                          label: "HP",
                          align: "right",
                          render: (value) =>
                            value.toLocaleString("fr-FR", {
                              maximumFractionDigits: 0,
                            }),
                        },
                        {
                          key: "facture_ttc",
                          label: "Facture TTC",
                          align: "right",
                          render: (value) => (
                            <span className="font-semibold text-emerald-700">
                              {value.toLocaleString("fr-FR", {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          ),
                        },
                      ]}
                    />
                  </Card>

                  {/* Graphiques */}
                  <h3 className="text-xl font-bold text-gray-900">
                    Graphiques {syntheseYear}
                  </h3>

                  {/* Graph 1 */}
                  <Card>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      {graphiquesData.consommation_mensuelle.title}
                    </h4>
                    <Plot
                      data={[
                        {
                          x: graphiquesData.consommation_mensuelle.x,
                          y: graphiquesData.consommation_mensuelle.y,
                          type: "scatter",
                          mode: "lines+markers",
                          name: graphiquesData.consommation_mensuelle.name,
                          line: { color: "#059669", width: 2 },
                          marker: { size: 8 },
                        },
                      ]}
                      layout={{
                        autosize: true,
                        height: 400,
                        xaxis: {
                          title:
                            graphiquesData.consommation_mensuelle.xaxis_title,
                        },
                        yaxis: {
                          title:
                            graphiquesData.consommation_mensuelle.yaxis_title,
                        },
                        showlegend: false,
                      }}
                      useResizeHandler
                      style={{ width: "100%", height: "100%" }}
                      config={{ responsive: true }}
                    />
                  </Card>

                  {/* Graph 2 */}
                  <Card>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      {graphiquesData.heures_creuses_pointe.title}
                    </h4>
                    <Plot
                      data={[
                        {
                          x: graphiquesData.heures_creuses_pointe.x,
                          y: graphiquesData.heures_creuses_pointe.y_hc,
                          type: "bar",
                          name: "Heures Creuses",
                          marker: { color: "#059669" },
                        },
                        {
                          x: graphiquesData.heures_creuses_pointe.x,
                          y: graphiquesData.heures_creuses_pointe.y_hp,
                          type: "bar",
                          name: "Heures Pointe",
                          marker: { color: "#7C2D12" },
                        },
                      ]}
                      layout={{
                        autosize: true,
                        height: 400,
                        xaxis: {
                          title:
                            graphiquesData.heures_creuses_pointe.xaxis_title,
                        },
                        yaxis: {
                          title:
                            graphiquesData.heures_creuses_pointe.yaxis_title,
                        },
                        barmode: "group",
                        showlegend: true,
                        legend: { orientation: "h", y: -0.2 },
                      }}
                      useResizeHandler
                      style={{ width: "100%", height: "100%" }}
                      config={{ responsive: true }}
                    />
                  </Card>

                  {/* Graph 3 */}
                  <Card>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      {graphiquesData.puissance.title}
                    </h4>
                    <Plot
                      data={[
                        {
                          x: graphiquesData.puissance.x,
                          y: graphiquesData.puissance.y_atteinte,
                          type: "scatter",
                          mode: "lines+markers",
                          name: "Puissance atteinte",
                          line: { color: "#2563eb", width: 2 },
                          marker: { size: 8 },
                        },
                        {
                          x: graphiquesData.puissance.x,
                          y: graphiquesData.puissance.y_souscrite,
                          type: "scatter",
                          mode: "lines",
                          name: "Puissance souscrite",
                          line: { color: "#dc2626", width: 2, dash: "dash" },
                        },
                      ]}
                      layout={{
                        autosize: true,
                        height: 400,
                        xaxis: { title: graphiquesData.puissance.xaxis_title },
                        yaxis: { title: graphiquesData.puissance.yaxis_title },
                        showlegend: true,
                        legend: { orientation: "h", y: -0.2 },
                      }}
                      useResizeHandler
                      style={{ width: "100%", height: "100%" }}
                      config={{ responsive: true }}
                    />
                  </Card>

                  {/* Graph 4 */}
                  <Card>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      {graphiquesData.facturation_consommation.title}
                    </h4>
                    <Plot
                      data={[
                        {
                          x: graphiquesData.facturation_consommation.x,
                          y: graphiquesData.facturation_consommation
                            .facturation,
                          type: "bar",
                          name: "Facturation",
                          marker: { color: "#059669" },
                          yaxis: "y",
                        },
                        {
                          x: graphiquesData.facturation_consommation.x,
                          y: graphiquesData.facturation_consommation
                            .consommation,
                          type: "scatter",
                          mode: "lines+markers",
                          name: "Consommation",
                          line: { color: "#7C2D12", width: 2 },
                          marker: { size: 8 },
                          yaxis: "y2",
                        },
                      ]}
                      layout={{
                        autosize: true,
                        height: 400,
                        xaxis: {
                          title:
                            graphiquesData.facturation_consommation.xaxis_title,
                        },
                        yaxis: {
                          title:
                            graphiquesData.facturation_consommation
                              .yaxis1_title,
                          titlefont: { color: "#059669" },
                          tickfont: { color: "#059669" },
                        } as any,
                        yaxis2: {
                          title:
                            graphiquesData.facturation_consommation
                              .yaxis2_title,
                          titlefont: { color: "#7C2D12" },
                          tickfont: { color: "#7C2D12" },
                          overlaying: "y",
                          side: "right",
                        } as any,
                        showlegend: true,
                        legend: { orientation: "h", y: -0.2 },
                      }}
                      useResizeHandler
                      style={{ width: "100%", height: "100%" }}
                      config={{ responsive: true }}
                    />
                  </Card>

                  {/* Graph 5 if available */}
                  {graphiquesData.cosphi && (
                    <Card>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        {graphiquesData.cosphi.title}
                      </h4>
                      <Plot
                        data={[
                          {
                            x: graphiquesData.cosphi.x,
                            y: graphiquesData.cosphi.y,
                            type: "scatter",
                            mode: "lines+markers",
                            name: "Cos φ",
                            line: { color: "#9333ea", width: 2 },
                            marker: { size: 8 },
                          },
                          {
                            x: graphiquesData.cosphi.x,
                            y: graphiquesData.cosphi.y_seuil,
                            type: "scatter",
                            mode: "lines",
                            name: "Seuil (0.85)",
                            line: { color: "#dc2626", width: 2, dash: "dash" },
                          },
                        ]}
                        layout={{
                          autosize: true,
                          height: 400,
                          xaxis: { title: graphiquesData.cosphi.xaxis_title },
                          yaxis: { title: graphiquesData.cosphi.yaxis_title },
                          showlegend: true,
                          legend: { orientation: "h", y: -0.2 },
                        }}
                        useResizeHandler
                        style={{ width: "100%", height: "100%" }}
                        config={{ responsive: true }}
                      />
                    </Card>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
