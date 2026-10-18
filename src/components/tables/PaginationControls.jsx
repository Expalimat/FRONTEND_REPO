import React from 'react';

export const PaginationControls = ({
  currentPage,
  lastPage,
  perPage,
  total,
  onPageChange
}) => {
  if (lastPage <= 1) return null;

  const firstPage = Math.max(1, Math.min(currentPage - 2, lastPage - 4));
  const pages = Array.from({ length: Math.min(lastPage, 5) }, (_, index) => firstPage + index);

  return (
    <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
      <div className="small text-muted">
        Showing <strong>{(currentPage - 1) * perPage + 1}</strong> to{' '}
        <strong>{Math.min(currentPage * perPage, total)}</strong> of <strong>{total}</strong> records
      </div>
      <nav aria-label="Page navigation">
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
          </li>
          {pages.map((page) => (
            <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
              <button className="page-link" onClick={() => onPageChange(page)}>{page}</button>
            </li>
          ))}
          <li className={`page-item ${currentPage === lastPage ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === lastPage}
              aria-label="Next page"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};
