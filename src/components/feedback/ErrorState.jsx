import React from 'react';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'Unable to fetch the requested information. Please try again or contact system support.',
  onRetry
}) => {
  return (
    <div className="text-center py-5 px-3">
      <div
        className="d-inline-flex align-items-center justify-content-center bg-danger-subtle text-danger rounded-circle mb-3"
        style={{ width: '64px', height: '64px', fontSize: '1.75rem' }}
      >
        <i className="bi bi-exclamation-triangle-fill"></i>
      </div>
      <h5 className="fw-semibold text-danger mb-1">{title}</h5>
      <p className="text-muted small mx-auto mb-3" style={{ maxWidth: '420px' }}>
        {message}
      </p>
      {onRetry && (
        <button className="btn btn-sm btn-outline-danger" onClick={onRetry}>
          <i className="bi bi-arrow-clockwise me-1"></i>Try Again
        </button>
      )}
    </div>
  );
};
