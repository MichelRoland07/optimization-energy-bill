<<<<<<< HEAD
import React from 'react';
=======
import React from "react";
>>>>>>> development

interface TableauSyntheseProps {
  data: Array<Record<string, any>> | null;
  title: string;
}

<<<<<<< HEAD
export const TableauSynthese: React.FC<TableauSyntheseProps> = ({ data, title }) => {
=======
export const TableauSynthese: React.FC<TableauSyntheseProps> = ({
  data,
  title,
}) => {
>>>>>>> development
  if (!data || data.length === 0) {
    return null;
  }

  // Get all column names and sort them properly
  const allColumns = Object.keys(data[0]);

  // Sort columns: Indicateur first, then any total column, then months 1-12
  const columns = allColumns.sort((a, b) => {
<<<<<<< HEAD
    if (a === 'Indicateur') return -1;
    if (b === 'Indicateur') return 1;
=======
    if (a === "Indicateur") return -1;
    if (b === "Indicateur") return 1;
>>>>>>> development

    // Check if it's a month number (1-12)
    const isAMonth = /^\d+$/.test(a);
    const isBMonth = /^\d+$/.test(b);

    // Total columns (like "Optimisé 2025", "Projection 2026") come after Indicateur but before months
    if (!isAMonth && !isBMonth) return a.localeCompare(b);
    if (!isAMonth) return -1;
    if (!isBMonth) return 1;

    // Both are months, sort numerically
    return parseInt(a) - parseInt(b);
  });

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
<<<<<<< HEAD
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
=======
              <tr
                key={rowIndex}
                className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
>>>>>>> development
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-4 py-3 text-sm ${
                      colIndex === 0
<<<<<<< HEAD
                        ? 'font-medium text-gray-900'
                        : 'text-gray-700'
                    } border-r border-gray-300`}
                  >
                    {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
=======
                        ? "font-medium text-gray-900"
                        : "text-gray-700"
                    } border-r border-gray-300`}
                  >
                    {row[col] !== null && row[col] !== undefined
                      ? String(row[col])
                      : "-"}
>>>>>>> development
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
