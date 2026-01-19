import { Card } from "@/components/ui/Card";
import React from "react";
import PaginatedTable from "./PaginationTable";

export default function Resume({
  profil_energetique,
  infos_administratives,
  selectedYear,
  handleYearChange,
}: {
  profil_energetique: {
    annee: number;
    tableau1: any;
    tableau1bis?: any;
    tableau2: any;
    tableau3: any;
    tableau4: any;
    tableau5?: any;

    tableau6?: any;
  };
  infos_administratives: {
    annees_disponibles: number[];
  };
  selectedYear: number | null;
  handleYearChange: (year: number) => void;
}) {
  return (
    <div>
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
                    <div className="text-xs text-gray-500">({value.mois})</div>
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
                    <div className="text-xs text-gray-500">({value.mois})</div>
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
                      {value.nb} / {value.total} mois ({value.pct.toFixed(1)}%)
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
                          profil_energetique.tableau5.nb_mois_mauvais.status
                            ? "text-emerald-600"
                            : "text-red-600"
                        }
                      >
                        {profil_energetique.tableau5.nb_mois_mauvais.nb} /{" "}
                        {profil_energetique.tableau5.nb_mois_mauvais.total} mois{" "}
                        {profil_energetique.tableau5.nb_mois_mauvais.status
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
    </div>
  );
}
