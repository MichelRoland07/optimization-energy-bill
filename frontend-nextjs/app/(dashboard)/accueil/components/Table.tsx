import React from "react";

export default function Table({
  availableServices,
  selectedService,
  setSelectedService,
}: {
  availableServices: Array<{
    service_no: string;
    nom_client: string;
    region: string;
    division: string;
    agence: string;
    puissance_souscrite: number;
    puissance_max_atteinte: number;
    nb_depassements: number;
    penalites_cosphi_2025: number;
  }>;
  selectedService: string | null;
  setSelectedService: (serviceNo: string) => void;
}) {
  return (
    <div className="overflow-x-auto mb-6">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">
              N° Service
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">
              Nom Client
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">
              Région
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">
              Division
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">
              Agence
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">
              Puissance Souscrite (kW)
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">
              Puissance Max Atteinte (kW)
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">
              Nb Dépassements
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Pénalités Cos Phi 2025 (FCFA)
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {availableServices.map((service, index) => (
            <tr
              key={service.service_no}
              className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} ${
                selectedService === service.service_no
                  ? "ring-2 ring-primary-500"
                  : ""
              } cursor-pointer hover:bg-blue-50`}
              onClick={() => setSelectedService(service.service_no)}
            >
              <td className="px-3 py-2 text-sm font-medium text-gray-900 border-r border-gray-200">
                {service.service_no}
              </td>
              <td className="px-3 py-2 text-sm text-gray-700 border-r border-gray-200">
                {service.nom_client}
              </td>
              <td className="px-3 py-2 text-sm text-gray-700 border-r border-gray-200">
                {service.region}
              </td>
              <td className="px-3 py-2 text-sm text-gray-700 border-r border-gray-200">
                {service.division}
              </td>
              <td className="px-3 py-2 text-sm text-gray-700 border-r border-gray-200">
                {service.agence}
              </td>
              <td className="px-3 py-2 text-sm text-gray-700 border-r border-gray-200 text-right">
                {service.puissance_souscrite.toFixed(0)}
              </td>
              <td className="px-3 py-2 text-sm text-gray-700 border-r border-gray-200 text-right">
                {service.puissance_max_atteinte.toFixed(0)}
              </td>
              <td className="px-3 py-2 text-sm text-gray-700 border-r border-gray-200 text-center">
                {service.nb_depassements}
              </td>
              <td className="px-3 py-2 text-sm text-gray-700 text-right">
                {service.penalites_cosphi_2025.toLocaleString("fr-FR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
