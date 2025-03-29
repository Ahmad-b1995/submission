import { useState } from 'react';
import { useInsuranceSubmissions } from '../../hooks/useInsuranceForms';
import { Button } from '../ui/Button';

export function SubmissionsTable() {
  const { data: submissions, isLoading } = useInsuranceSubmissions();
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  if (isLoading) {
    return <div>Loading submissions...</div>;
  }

  if (!submissions) {
    return <div>No submissions found</div>;
  }

  const toggleColumn = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((col) => col !== column)
        : [...prev, column]
    );
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = [...submissions.data].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    }
    
    return 0;
  });

  const displayColumns = selectedColumns.length > 0
    ? selectedColumns
    : submissions.columns;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium">Toggle Columns:</span>
        {submissions.columns.map((column) => (
          <Button
            key={column}
            variant={selectedColumns.includes(column) ? 'primary' : 'outline'}
            size="sm"
            onClick={() => toggleColumn(column)}
          >
            {column}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {displayColumns.map((column) => (
                <th
                  key={column}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column}</span>
                    {sortColumn === column && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((row) => (
              <tr key={row.id}>
                {displayColumns.map((column) => (
                  <td
                    key={`${row.id}-${column}`}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    {row[column]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}