import React, { useState, useMemo } from 'react';
import { EmptyState } from '../feedback/EmptyState';
import { LoadingState } from '../feedback/LoadingState';

export const DataTable = ({
  columns = [],
  data = [],
  searchable = true,
  searchPlaceholder = 'Search records...',
  filterField = '',
  filterOptions = [],
  filterPlaceholder = 'All Statuses',
  itemsPerPage = 5,
  loading = false,
  emptyTitle = 'No records found',
  emptyMessage = 'No data is currently available.',
  keyField = 'id',
  customCardRenderer // Optional for custom mobile rendering
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and Search
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Status or custom filter
      if (filterField && filterValue && item[filterField] !== filterValue) {
        return false;
      }
      // Search across all text fields
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        return Object.values(item).some((val) => {
          if (typeof val === 'string' || typeof val === 'number') {
            return String(val).toLowerCase().includes(term);
          }
          return false;
        });
      }
      return true;
    });
  }, [data, searchTerm, filterField, filterValue]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return <LoadingState message="Loading records..." />;
  }

  return (
    <div>
      {/* Search and Filters */}
      {(searchable || filterOptions.length > 0) && (
        <div className="row g-2 mb-3 align-items-center">
          {searchable && (
            <div className="col-md-6 col-lg-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control form-control-sm border-start-0 ps-0"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>
          )}

          {filterOptions.length > 0 && (
            <div className="col-md-4 col-lg-3 ms-auto">
              <select
                className="form-select form-select-sm"
                value={filterValue}
                onChange={(e) => {
                  setFilterValue(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">{filterPlaceholder}</option>
                {filterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {filteredData.length === 0 ? (
        <EmptyState title={emptyTitle} message={emptyMessage} />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="table-responsive d-none d-md-block">
            <table className="table table-hover table-pnc align-middle">
              <thead>
                <tr>
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      style={col.width ? { width: col.width } : {}}
                      className={col.className || ''}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, rowIdx) => (
                  <tr key={row[keyField] || rowIdx}>
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className={col.className || ''}>
                        {col.render ? col.render(row) : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="d-md-none">
            {paginatedData.map((row, rowIdx) => (
              <div key={row[keyField] || rowIdx} className="card mb-2 border p-3 shadow-sm">
                {customCardRenderer ? (
                  customCardRenderer(row)
                ) : (
                  <div>
                    {columns.map((col, colIdx) => (
                      <div
                        key={colIdx}
                        className="d-flex justify-content-between align-items-center py-1 border-bottom border-light"
                      >
                        <span className="small text-muted fw-semibold">{col.header}:</span>
                        <span className="small text-dark text-end">
                          {col.render ? col.render(row) : row[col.accessor]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
              <div className="small text-muted">
                Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                <strong>{Math.min(currentPage * itemsPerPage, filteredData.length)}</strong> of{' '}
                <strong>{filteredData.length}</strong> records
              </div>
              <nav aria-label="Page navigation">
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => handlePageChange(i + 1)}>
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};
