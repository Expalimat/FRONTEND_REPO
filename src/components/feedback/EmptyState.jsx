import React from 'react';

export const EmptyState = ({
  icon = 'bi-inbox',
  title = 'No records found',
  message = 'There are no items matching your criteria or currently available in this section.',
  action
}) => {
  return (
    <div className="text-center py-5 px-3">
      <div
        className="d-inline-flex align-items-center justify-content-center bg-light text-muted rounded-circle mb-3"
        style={{ width: '72px', height: '72px', fontSize: '2rem' }}
      >
        <i className={`bi ${icon}`}></i>
      </div>
      <h5 className="fw-semibold text-dark mb-1">{title}</h5>
      <p className="text-muted small mx-auto mb-3" style={{ maxWidth: '420px' }}>
        {message}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
