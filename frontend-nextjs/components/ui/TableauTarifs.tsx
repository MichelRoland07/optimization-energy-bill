import React from 'react';
import { TarifsInfo } from '@/services/data.service';

interface TableauTarifsProps {
  tarifs: TarifsInfo;
  title: string;
  annee: number;
}

export const TableauTarifs: React.FC<TableauTarifsProps> = ({ tarifs, title, annee }) => {
  return (
    <div className="mb-6">
      <h4 className="text-md font-semibold text-gray-800 mb-3">{title}</h4>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-700 mb-2">
          <strong>Configuration:</strong> Type {tarifs.type_tarifaire} - {tarifs.categorie}
        </p>
        <p className="text-sm text-gray-700 mb-4">
          <strong>Tarifs appliqués en {annee}:</strong>
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300 bg-white border border-gray-300">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300">
                  Temps de fonctionnement
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300">
                  Heures Creuses (FCFA/kWh)
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-r border-gray-300">
                  Heures Pointe (FCFA/kWh)
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                  Prime Fixe (FCFA/kW)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tarifs.tableau_tarifs.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900 border-r border-gray-200">
                    {row.temps_fonctionnement}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                    {row.tarif_hc.toFixed(3)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700 border-r border-gray-200">
                    {row.tarif_hp.toFixed(3)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {row.prime_fixe.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
