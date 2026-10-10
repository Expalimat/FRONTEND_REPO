import React, { useState } from 'react';

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  requiresReason = false,
  reasonPlaceholder = 'Please enter reason or remarks...',
  loading = false
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requiresReason && !reason.trim()) {
      setError('Please provide a reason before submitting.');
      return;
    }
    setError('');
    onConfirm(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  const btnVariantClass = {
    primary: 'btn-success',
    danger: 'btn-danger',
    warning: 'btn-warning',
    info: 'btn-info'
  }[variant] || 'btn-primary';

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold text-dark">{title}</h5>
            <button type="button" className="btn-close" onClick={handleClose} disabled={loading}></button>
          </div>
          <div className="modal-body py-3">
            <p className="text-muted mb-3">{message}</p>
            {requiresReason && (
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">
                  Reason / Remarks <span className="text-danger">*</span>
                </label>
                <textarea
                  className={`form-control ${error ? 'is-invalid' : ''}`}
                  rows="3"
                  placeholder={reasonPlaceholder}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (error) setError('');
                  }}
                  disabled={loading}
                />
                {error && <div className="invalid-feedback">{error}</div>}
              </div>
            )}
          </div>
          <div className="modal-footer border-0 pt-0">
            <button type="button" className="btn btn-light" onClick={handleClose} disabled={loading}>
              {cancelText}
            </button>
            <button type="button" className={`btn ${btnVariantClass}`} onClick={handleConfirm} disabled={loading}>
              {loading && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
