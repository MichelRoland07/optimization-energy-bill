import { Card } from "@/components/ui/Card";
import React from "react";
import Plot from "react-plotly.js";
import PaginatedTable from "./PaginationTable";

const PlotComponent = Plot as any;

export default function Consommation({
  profil_consommation,
}: {
  profil_consommation: {
    graph1_evolution: {
      series: {
        annee: number;
        mois: number[];
        consommation: number[];
      }[];
    };
    tableau_variation_conso: {
      annee: number;
      consommation: number;
      variation?: number;
    };
    graph2_hc_hp_facturation: {
      annees: number[];
      hc: number[];
      hp: number[];
      facturation: number[];
    };
    tableau_variation_facturation: {
      annee: number;
      facturation: number;
      variation?: number;
    }[];
    tableau_prix_unitaire: {
      annee: number;
      consommation: number;
      facturation: number;
      prix_unitaire: number;
    }[];
    tableau_recapitulatif: {
      annee: number;
      consommation_totale: number;
      consommation_moyenne: number;
      heures_creuses: number;
      heures_pointe: number;
      mois_consommation_max: string;
      facturation_totale: number;
    }[];
  };
}) {
  return (
    <div>
      <div className="space-y-6">
        {/* Graph 1: Évolution */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Évolution de la consommation mensuelle
          </h3>
          <Plot
            data={profil_consommation.graph1_evolution.series.map(
              (serie, idx) => {
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
                title: "Mois",
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
              yaxis: { title: "Consommation (kWh)" },
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
                ) as any,
                y: profil_consommation.graph2_hc_hp_facturation.hc,
                type: "bar" as any,
                name: "Heures Creuses",
                marker: { color: "#059669" },
                text: profil_consommation.graph2_hc_hp_facturation.hc.map(
                  (val) => `${val.toFixed(2)} MWh`,
                ),
                textposition: "inside" as any,
                yaxis: "y" as any,
              },
              {
                x: profil_consommation.graph2_hc_hp_facturation.annees.map(
                  String,
                ) as any,
                y: profil_consommation.graph2_hc_hp_facturation.hp,
                type: "bar" as any,
                name: "Heures Pointe",
                marker: { color: "#7C2D12" },
                text: profil_consommation.graph2_hc_hp_facturation.hp.map(
                  (val) => `${val.toFixed(2)} MWh`,
                ),
                textposition: "inside" as any,
                yaxis: "y" as any,
              },
              {
                x: profil_consommation.graph2_hc_hp_facturation.annees.map(
                  String,
                ) as any,
                y: profil_consommation.graph2_hc_hp_facturation.facturation,
                type: "scatter" as any,
                mode: "lines+markers" as any,
                name: "Facturation",
                line: { color: "#2563eb", width: 3 },
                marker: { size: 10 },
                yaxis: "y2" as any,
              },
            ]}
            layout={{
              autosize: true,
              height: 450,
              xaxis: { title: "Année" },
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
    </div>
  );
}
