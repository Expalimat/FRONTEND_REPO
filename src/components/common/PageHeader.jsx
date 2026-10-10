import React from 'react';
import { Link } from 'react-router-dom';

export const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [],
  actions
}) => {
  return (
    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between pb-3 mb-4 border-bottom gap-3">
      <div>
        {breadcrumbs.length > 0 && (
          <nav aria-label="breadcrumb" className="mb-1">
            <ol className="breadcrumb mb-0 small">
              <li className="breadcrumb-item">
                <Link to="/" className="text-decoration-none text-muted">
                  <i className="bi bi-house-door me-1"></i>PnC-OESS
                </Link>
              </li>
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return isLast ? (
                  <li key={idx} className="breadcrumb-item active" aria-current="page">
                    {crumb.label}
                  </li>
                ) : (
                  <li key={idx} className="breadcrumb-item">
                    <Link to={crumb.to} className="text-decoration-none text-muted">
                      {crumb.label}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
        <h1 className="h3 fw-bold mb-1 text-dark">{title}</h1>
        {subtitle && <p className="text-muted mb-0 small">{subtitle}</p>}
      </div>
      {actions && <div className="d-flex align-items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
};
