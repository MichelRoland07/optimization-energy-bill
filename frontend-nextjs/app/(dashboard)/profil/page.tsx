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

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Première page"
        >
          <ChevronsLeft className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Page précédente"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="flex items-center gap-1">
        {pages.map((page) => {
          // Show first page, last page, current page, and pages around current
          if (
            page === 1 ||
            page === totalPages ||
            (page >= currentPage - 1 && page <= currentPage + 1)
          ) {
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`min-w-[40px] h-10 px-3 rounded-lg font-medium transition-colors ${
                  currentPage === page
                    ? "bg-emerald-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            );
          } else if (page === currentPage - 2 || page === currentPage + 2) {
            return (
              <span key={page} className="px-2 text-gray-400">
                ...
              </span>
            );
          }
          return null;
        })}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Page suivante"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Dernière page"
        >
          <ChevronsRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

const PaginatedTable: React.FC<PaginatedTableProps> = ({
  data,
  columns,
  itemsPerPage = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-emerald-50 to-emerald-100">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider ${
                    column.align === "center"
                      ? "text-center"
                      : column.align === "right"
                        ? "text-right"
                        : "text-left"
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 text-sm text-gray-900 ${
                      column.align === "center"
                        ? "text-center"
                        : column.align === "right"
                          ? "text-right"
                          : "text-left"
                    }`}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

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
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-6 h-6 text-emerald-700" />
                <h2 className="text-xl font-semibold text-emerald-900">
                  Profil du client
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg">
                  <p className="text-sm font-medium text-emerald-800 mb-1">
                    Nom du client:
                  </p>
                  <p className="text-base text-gray-900 font-semibold break-words">
                    {infos_administratives.nom_client}
                  </p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg">
                  <p className="text-sm font-medium text-emerald-800 mb-1">
                    N° de service:
                  </p>
                  <p className="text-base text-gray-900 font-semibold">
                    {infos_administratives.service_no}
                  </p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg">
                  <p className="text-sm font-medium text-emerald-800 mb-1">
                    Région:
                  </p>
                  <p className="text-base text-gray-900 font-semibold">
                    {infos_administratives.region}
                  </p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg">
                  <p className="text-sm font-medium text-emerald-800 mb-1">
                    Division:
                  </p>
                  <p className="text-base text-gray-900 font-semibold">
                    {infos_administratives.division}
                  </p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg">
                  <p className="text-sm font-medium text-emerald-800 mb-1">
                    Agence:
                  </p>
                  <p className="text-base text-gray-900 font-semibold">
                    {infos_administratives.agence}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* RÉSUMÉ ÉNERGÉTIQUE TAB */}
          {activeTab === "resume" && (
            <div className="space-y-6">
              {/* Year Selector */}
              {infos_administratives.annees_disponibles.length > 0 && (
                <Card className="bg-gradient-to-r from-emerald-50 to-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Sélectionner l'année
                    </h3>
                    <select
                      value={selectedYear || ""}
                      onChange={(e) => handleYearChange(Number(e.target.value))}
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

              {/* Tableau 1: Caractéristiques contractuelles */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Caractéristiques contractuelles et tarifaires (
                  {profil_energetique.annee})
                </h3>
                <PaginatedTable
                  data={[profil_energetique.tableau1]}
                  itemsPerPage={10}
                  columns={[
                    {
                      key: "puissance_souscrite",
                      label: "Puissance souscrite",
                      align: "left",
                    },
                    {
                      key: "type_tarifaire",
                      label: "Type tarifaire",
                      align: "left",
                      render: (value, row) => (
                        <div>
                          <div className="font-medium">{value}</div>
                          <div className="text-xs text-gray-500">
                            ({row.categorie})
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "plage_horaire",
                      label: "Plage horaire",
                      align: "left",
                    },
                    {
                      key: "tarif_hc",
                      label: `Tarif HC (${profil_energetique.annee})`,
                      align: "right",
                    },
                    {
                      key: "tarif_hp",
                      label: `Tarif HP (${profil_energetique.annee})`,
                      align: "right",
                    },
                    {
                      key: "prime_fixe",
                      label: `Prime Fixe (${profil_energetique.annee})`,
                      align: "right",
                    },
                  ]}
                />
              </Card>

              {/* Tableau 1bis if available */}
              {profil_energetique.tableau1bis && (
                <Card className="bg-amber-50 border-amber-200">
                  <h3 className="text-lg font-semibold text-amber-900 mb-4">
                    Projection 2026 - Caractéristiques contractuelles
                  </h3>
                  <PaginatedTable
                    data={[profil_energetique.tableau1bis]}
                    itemsPerPage={10}
                    columns={[
                      {
                        key: "puissance_souscrite",
                        label: "Puissance souscrite",
                        align: "left",
                      },
                      {
                        key: "type_tarifaire",
                        label: "Type tarifaire",
                        align: "left",
                        render: (value, row) => (
                          <div>
                            <div className="font-medium">{value}</div>
                            <div className="text-xs text-gray-500">
                              ({row.categorie})
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: "plage_horaire",
                        label: "Plage horaire",
                        align: "left",
                      },
                      {
                        key: "tarif_hc",
                        label: "Tarif HC (2026)",
                        align: "right",
                      },
                      {
                        key: "tarif_hp",
                        label: "Tarif HP (2026)",
                        align: "right",
                      },
                      {
                        key: "prime_fixe",
                        label: "Prime Fixe (2026)",
                        align: "right",
                      },
                    ]}
                  />
                </Card>
              )}

              {/* Tableau 2: Puissances */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Puissances atteintes ({profil_energetique.annee})
                </h3>
                <PaginatedTable
                  data={[profil_energetique.tableau2]}
                  itemsPerPage={10}
                  columns={[
                    {
                      key: "puissance_max",
                      label: "Puissance maximum",
                      align: "left",
                      render: (value) => (
                        <div>
                          <div className="font-medium">
                            {value.valeur} {value.warning && "⚠️"}
                          </div>
                          <div className="text-xs text-gray-500">
                            ({value.mois})
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "puissance_min",
                      label: "Puissance minimum",
                      align: "left",
                      render: (value) => (
                        <div>
                          <div className="font-medium">{value.valeur}</div>
                          <div className="text-xs text-gray-500">
                            ({value.mois})
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "puissance_moyenne",
                      label: "Puissance moyenne",
                      align: "left",
                    },
                    {
                      key: "depassements",
                      label: "Dépassements",
                      align: "left",
                      render: (value) => (
                        <div>
                          <div className="font-medium">
                            {value.nb} / {value.total} mois (
                            {value.pct.toFixed(1)}%)
                          </div>
                          <div
                            className={`text-xs font-medium ${value.warning ? "text-red-600" : "text-emerald-600"}`}
                          >
                            {value.warning
                              ? "⚠️ Dépassements détectés"
                              : "✅ Aucun dépassement"}
                          </div>
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>

              {/* Tableau 3: Consommations */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Consommations ({profil_energetique.annee})
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-emerald-50 to-emerald-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Conso. max
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Conso. min
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Conso. moy
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          HC moy
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          HP moy
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Ratio HC/HP
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Temps fonct.
                        </th>
                        {profil_energetique.tableau3.cosphi_moyen && (
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Cos φ moy
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium">
                            {profil_energetique.tableau3.conso_max.valeur}
                          </div>
                          <div className="text-xs text-gray-500">
                            ({profil_energetique.tableau3.conso_max.mois})
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium">
                            {profil_energetique.tableau3.conso_min.valeur}
                          </div>
                          <div className="text-xs text-gray-500">
                            ({profil_energetique.tableau3.conso_min.mois})
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {profil_energetique.tableau3.conso_moyenne}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {profil_energetique.tableau3.conso_hc_moyenne}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {profil_energetique.tableau3.conso_hp_moyenne}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {profil_energetique.tableau3.ratio_hc_hp}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {profil_energetique.tableau3.temps_fonct_moyen}
                        </td>
                        {profil_energetique.tableau3.cosphi_moyen && (
                          <td className="px-4 py-3 text-sm">
                            {profil_energetique.tableau3.cosphi_moyen.valeur}{" "}
                            {profil_energetique.tableau3.cosphi_moyen.status
                              ? "✅"
                              : "🔴"}
                          </td>
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Tableau 4: Facturation */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Facturation TTC ({profil_energetique.annee})
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-emerald-50 to-emerald-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Facture max
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Facture min
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Facture moyenne
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                          Facture totale
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      <tr>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium">
                            {profil_energetique.tableau4.facture_max.valeur}
                          </div>
                          <div className="text-xs text-gray-500">
                            ({profil_energetique.tableau4.facture_max.mois})
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium">
                            {profil_energetique.tableau4.facture_min.valeur}
                          </div>
                          <div className="text-xs text-gray-500">
                            ({profil_energetique.tableau4.facture_min.mois})
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {profil_energetique.tableau4.facture_moyenne}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-emerald-700">
                          {profil_energetique.tableau4.facture_totale}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Tableau 5: Cos φ if available */}
              {profil_energetique.tableau5 && (
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Facteur de puissance Cos φ ({profil_energetique.annee})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-emerald-50 to-emerald-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Cos φ max
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Cos φ min
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Cos φ moyen
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Mois &lt; 0.9
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        <tr>
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium">
                              {profil_energetique.tableau5.cosphi_max.valeur}{" "}
                              {profil_energetique.tableau5.cosphi_max.status
                                ? "✅"
                                : "🔴"}
                            </div>
                            <div className="text-xs text-gray-500">
                              ({profil_energetique.tableau5.cosphi_max.mois})
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium">
                              {profil_energetique.tableau5.cosphi_min.valeur}{" "}
                              {profil_energetique.tableau5.cosphi_min.status
                                ? "✅"
                                : "🔴"}
                            </div>
                            <div className="text-xs text-gray-500">
                              ({profil_energetique.tableau5.cosphi_min.mois})
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {profil_energetique.tableau5.cosphi_moyen.valeur}{" "}
                            {profil_energetique.tableau5.cosphi_moyen.status
                              ? "✅"
                              : "🔴"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={
                                profil_energetique.tableau5.nb_mois_mauvais
                                  .status
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }
                            >
                              {profil_energetique.tableau5.nb_mois_mauvais.nb} /{" "}
                              {
                                profil_energetique.tableau5.nb_mois_mauvais
                                  .total
                              }{" "}
                              mois{" "}
                              {profil_energetique.tableau5.nb_mois_mauvais
                                .status
                                ? "✅"
                                : "🔴"}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Tableau 6: Pénalité if available */}
              {profil_energetique.tableau6 && (
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Pénalité Cos φ ({profil_energetique.annee})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-red-50 to-red-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Pénalité max
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Pénalité min
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Pénalité moyenne
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                            Pénalité totale
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        <tr>
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium text-red-600">
                              {profil_energetique.tableau6.penalite_max.valeur}
                            </div>
                            <div className="text-xs text-gray-500">
                              ({profil_energetique.tableau6.penalite_max.mois})
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium">
                              {profil_energetique.tableau6.penalite_min.valeur}
                            </div>
                            <div className="text-xs text-gray-500">
                              ({profil_energetique.tableau6.penalite_min.mois})
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {profil_energetique.tableau6.penalite_moyenne}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-red-700">
                            {profil_energetique.tableau6.penalite_totale}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* CONSOMMATION TAB */}
          {activeTab === "consommation" && (
            <div className="space-y-6">
              {/* Graph 1: Évolution */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Évolution de la consommation mensuelle
                </h3>
                <Plot
                  data={profil_consommation.graph1_evolution.series.map(
                    (serie: { mois: any; consommation: any; annee: any; }, idx: number) => {
                      const couleurs = [
                        "#059669",
                        "#7C2D12",
                        "#2563eb",
                        "#dc2626",
                        "#9333ea",
                      ];
                      return {
                        x: serie.mois,
                        y: serie.consommation,
                        type: "scatter",
                        mode: "lines+markers",
                        name: `${serie.annee}`,
                        line: {
                          width: 2,
                          color: couleurs[idx % couleurs.length],
                        },
                        marker: { size: 6 },
                        hovertemplate: `<b>${serie.annee}</b><br>Mois: %{x}<br>Consommation: %{y:,.0f} kWh<extra></extra>`,
                      };
                    },
                  )}
                  layout={{
                    autosize: true,
                    height: 450,
                    xaxis: {
                      title: { text: "Mois" },
                      tickmode: "array",
                      tickvals: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                      ticktext: [
                        "Jan",
                        "Fév",
                        "Mar",
                        "Avr",
                        "Mai",
                        "Jun",
                        "Jul",
                        "Aoû",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Déc",
                      ],
                    },
                    yaxis: { title: { text: "Consommation (kWh)" } },
                    hovermode: "x unified",
                    showlegend: true,
                    legend: {
                      orientation: "h",
                      y: 1.02,
                      x: 1,
                      xanchor: "right",
                      yanchor: "bottom",
                    },
                  }}
                  useResizeHandler
                  style={{ width: "100%", height: "100%" }}
                  config={{ responsive: true }}
                />
              </Card>

              {/* Variation consommation */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Variation de la consommation totale
                </h3>
                <PaginatedTable
                  data={profil_consommation.tableau_variation_conso}
                  itemsPerPage={10}
                  columns={[
                    { key: "annee", label: "Année", align: "center" },
                    {
                      key: "consommation",
                      label: "Consommation (kWh)",
                      align: "right",
                      render: (value) => value.toLocaleString("fr-FR"),
                    },
                    {
                      key: "variation",
                      label: "Variation (%)",
                      align: "center",
                      render: (value) => {
                        if (value === undefined) return "-";
                        if (value > 1)
                          return (
                            <span className="text-red-600 font-medium">
                              +{value.toFixed(1)}% ⬆️
                            </span>
                          );
                        if (value < -1)
                          return (
                            <span className="text-emerald-600 font-medium">
                              {value.toFixed(1)}% ⬇️
                            </span>
                          );
                        return (
                          <span className="text-gray-600">
                            {value.toFixed(1)}% ➡️
                          </span>
                        );
                      },
                    },
                  ]}
                />
              </Card>

              {/* Graph 2: HC/HP */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Consommation (HC/HP) et Facturation
                </h3>
                <Plot
                  data={[
                    {
                      x: profil_consommation.graph2_hc_hp_facturation.annees.map(
                        String,
                      ),
                      y: profil_consommation.graph2_hc_hp_facturation.hc,
                      type: "bar",
                      name: "Heures Creuses",
                      marker: { color: "#059669" },
                      text: profil_consommation.graph2_hc_hp_facturation.hc.map(
                        (val: number) => `${val.toFixed(2)} MWh`,
                      ),
                      textposition: "inside",
                      yaxis: "y",
                    },
                    {
                      x: profil_consommation.graph2_hc_hp_facturation.annees.map(
                        String,
                      ),
                      y: profil_consommation.graph2_hc_hp_facturation.hp,
                      type: "bar",
                      name: "Heures Pointe",
                      marker: { color: "#7C2D12" },
                      text: profil_consommation.graph2_hc_hp_facturation.hp.map(
                        (val: number) => `${val.toFixed(2)} MWh`,
                      ),
                      textposition: "inside",
                      yaxis: "y",
                    },
                    {
                      x: profil_consommation.graph2_hc_hp_facturation.annees.map(
                        String,
                      ),
                      y: profil_consommation.graph2_hc_hp_facturation
                        .facturation,
                      type: "scatter",
                      mode: "lines+markers",
                      name: "Facturation",
                      line: { color: "#2563eb", width: 3 },
                      marker: { size: 10 },
                      yaxis: "y2",
                    },
                  ]}
                  layout={{
                    autosize: true,
                    height: 450,
                    xaxis: { title: { text: "Année" } },
                    yaxis: {
                      title: {
                        text: "Consommation (MWh)",
                        font: { color: "#059669" },
                      },
                      tickfont: { color: "#059669" },
                    },
                    yaxis2: {
                      title: {
                        text: "Facturation (M FCFA)",
                        font: { color: "#2563eb" },
                      },
                      tickfont: { color: "#2563eb" },
                      overlaying: "y",
                      side: "right",
                    },
                    barmode: "stack",
                    hovermode: "x unified",
                    showlegend: true,
                    legend: {
                      orientation: "h",
                      y: 1.02,
                      x: 1,
                      xanchor: "right",
                      yanchor: "bottom",
                    },
                  }}
                  useResizeHandler
                  style={{ width: "100%", height: "100%" }}
                  config={{ responsive: true }}
                />
              </Card>

              {/* Variation facturation */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Variation de la facturation TTC
                </h3>
                <PaginatedTable
                  data={profil_consommation.tableau_variation_facturation}
                  itemsPerPage={10}
                  columns={[
                    { key: "annee", label: "Année", align: "center" },
                    {
                      key: "facturation",
                      label: "Facturation (FCFA)",
                      align: "right",
                      render: (value) => value.toLocaleString("fr-FR"),
                    },
                    {
                      key: "variation",
                      label: "Variation (%)",
                      align: "center",
                      render: (value) => {
                        if (value === undefined) return "-";
                        if (value > 1)
                          return (
                            <span className="text-red-600 font-medium">
                              +{value.toFixed(1)}% ⬆️
                            </span>
                          );
                        if (value < -1)
                          return (
                            <span className="text-emerald-600 font-medium">
                              {value.toFixed(1)}% ⬇️
                            </span>
                          );
                        return (
                          <span className="text-gray-600">
                            {value.toFixed(1)}% ➡️
                          </span>
                        );
                      },
                    },
                  ]}
                />
              </Card>

              {/* Prix unitaire */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Prix unitaire
                </h3>
                <PaginatedTable
                  data={profil_consommation.tableau_prix_unitaire}
                  itemsPerPage={10}
                  columns={[
                    { key: "annee", label: "Année", align: "center" },
                    {
                      key: "consommation",
                      label: "Consommation (kWh)",
                      align: "right",
                      render: (value) => value.toLocaleString("fr-FR"),
                    },
                    {
                      key: "facturation",
                      label: "Facturation (FCFA)",
                      align: "right",
                      render: (value) => value.toLocaleString("fr-FR"),
                    },
                    {
                      key: "prix_unitaire",
                      label: "Prix unitaire (FCFA/kWh)",
                      align: "right",
                      render: (value) => (
                        <span className="font-semibold text-emerald-700">
                          {value.toFixed(2)}
                        </span>
                      ),
                    },
                  ]}
                />
              </Card>

              {/* Récapitulatif */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Tableau récapitulatif
                </h3>
                <PaginatedTable
                  data={profil_consommation.tableau_recapitulatif}
                  itemsPerPage={10}
                  columns={[
                    { key: "annee", label: "Année", align: "center" },
                    {
                      key: "consommation_totale",
                      label: "Conso. totale",
                      align: "center",
                    },
                    {
                      key: "consommation_moyenne",
                      label: "Moy/Mois",
                      align: "center",
                    },
                    { key: "heures_creuses", label: "HC", align: "center" },
                    { key: "heures_pointe", label: "HP", align: "center" },
                    {
                      key: "mois_consommation_max",
                      label: "Mois Max",
                      align: "center",
                    },
                    {
                      key: "facturation_totale",
                      label: "Fact. totale",
                      align: "center",
                    },
                  ]}
                />
              </Card>
            </div>
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
                          title: {
                            text: graphiquesData.facturation_consommation
                              .yaxis1_title,
                            font: { color: "#059669" },
                          },
                          tickfont: { color: "#059669" },
                        },
                        yaxis2: {
                          title: {
                            text: graphiquesData.facturation_consommation
                              .yaxis2_title,
                            font: { color: "#7C2D12" },
                          },
                          tickfont: { color: "#7C2D12" },
                          overlaying: "y",
                          side: "right",
                        },
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
