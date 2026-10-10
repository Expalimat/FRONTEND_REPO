import React from 'react';

export const LoadingState = ({
  message = 'Loading data, please wait...'
}) => {
  return (
    <div className="text-center py-5">
      <div className="spinner-border text-success mb-3" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-muted small mb-0">{message}</p>
    </div>
  );
};
