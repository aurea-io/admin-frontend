import type { ReactNode } from 'react';

interface TableProps {
  headers: string[];
  rows: ReactNode[];
}

export function Table({ headers, rows }: TableProps) {
  return (
    <div className="table-shell">
      <table className="table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => <tr key={index}>{row}</tr>)
          ) : (
            <tr>
              <td colSpan={headers.length}>Sin resultados</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
