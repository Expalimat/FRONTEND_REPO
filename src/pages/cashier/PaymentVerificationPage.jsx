import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/feedback/ConfirmationModal';
import { Modal } from '../../components/feedback/Modal';
import { paymentService } from '../../services/paymentService';
import { pageParams, readPage } from '../../services/api';

export const PaymentVerificationPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [actionType, setActionType] = useState(null); // 'Verified' | 'Rejected'
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadPayments = async (page = 1, filters = {}) => {
    setLoading(true);
    try {
      const result = readPage(await paymentService.getPayments(pageParams(page, filters)));
      setPayments(result.data);
      setPagination(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleConfirmAction = async (reason) => {
    if (!selectedPayment || !actionType) return;
    setProcessing(true);
    try {
      await paymentService.verifyPayment(
        selectedPayment.id,
        actionType,
        reason,
        currentUser?.name || 'Ricardo Gonzales (Cashier)'
      );
      setToastMessage(`Payment ${selectedPayment.id} marked as ${actionType}.`);
      setActionType(null);
      setSelectedPayment(null);
      setShowSlipModal(false);
      loadPayments();
    } catch (err) {
      alert('Failed to update payment status.');
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      header: 'Payment ID',
      accessor: 'id',
      render: (row) => <span className="font-monospace fw-bold text-dark">{row.id}</span>
    },
    {
      header: 'Student',
      accessor: 'studentName',
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{row.studentName}</div>
          <div className="small text-muted font-monospace">{row.studentNumber}</div>
        </div>
      )
    },
    {
      header: 'Enrollment Ref',
      accessor: 'enrollmentId',
      render: (row) => <span className="badge bg-light text-dark border">{row.enrollmentId}</span>
    },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (row) => (
        <span className="fw-bold text-success font-monospace">
          ₱{row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Channel & Ref',
      accessor: 'referenceNumber',
      render: (row) => (
        <div>
          <div className="small text-dark fw-semibold">{row.paymentMethod}</div>
          <div className="small text-muted font-monospace">{row.referenceNumber}</div>
        </div>
      )
    },
    {
      header: 'Date Submitted',
      accessor: 'paymentDate',
      render: (row) => <span className="small text-muted">{row.paymentDate}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Action',
      render: (row) => (
        <div className="d-flex align-items-center gap-1">
          <button
            className="btn btn-xs btn-outline-primary py-1 px-2"
            onClick={() => {
              setSelectedPayment(row);
              setShowSlipModal(true);
            }}
            title="View Deposit Slip"
          >
            <i className="bi bi-receipt me-1"></i>Slip
          </button>
          {row.status === 'Pending' && (
            <>
              <button
                className="btn btn-xs btn-success py-1 px-2"
                onClick={() => {
                  setSelectedPayment(row);
                  setActionType('Verified');
                }}
                title="Verify & Post Payment"
              >
                Verify
              </button>
              <button
                className="btn btn-xs btn-danger py-1 px-2"
                onClick={() => {
                  setSelectedPayment(row);
                  setActionType('Rejected');
                }}
                title="Reject Slip"
              >
                Reject
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Payment Verification Work Queue"
        subtitle="Inspect submitted bank deposit slips, GCash payments, and issue official cashier verification."
        breadcrumbs={[
          { label: 'Dashboard', to: '/cashier/dashboard' },
          { label: 'Payment Verification', to: '/cashier/payments' }
        ]}
      />

      {toastMessage && (
        <div className="alert alert-success alert-dismissible fade show small mb-3" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {toastMessage}
          <button type="button" className="btn-close" onClick={() => setToastMessage('')}></button>
        </div>
      )}

      <div className="pnc-card">
        <div className="pnc-card-header">
          <span>All Payment Submissions</span>
        </div>
        <div className="pnc-card-body">
          <DataTable
            columns={columns}
            data={payments}
            serverPagination={{ ...pagination, onPageChange: loadPayments }}
            filterField="status"
            filterOptions={[
              { label: 'Pending Verification', value: 'Pending' },
              { label: 'Verified', value: 'Verified' },
              { label: 'Rejected', value: 'Rejected' }
            ]}
            filterPlaceholder="Filter Status"
            searchPlaceholder="Search by payment ID, student, reference number..."
            loading={loading}
          />
        </div>
      </div>

      {/* Deposit Slip & Proof Preview Modal */}
      {selectedPayment && (
        <Modal
          isOpen={showSlipModal}
          onClose={() => setShowSlipModal(false)}
          title={`Payment Verification: ${selectedPayment.id}`}
          size="lg"
          footer={
            <div className="d-flex justify-content-between w-100">
              <div>
                <StatusBadge status={selectedPayment.status} />
              </div>
              <div className="d-flex gap-2">
                {selectedPayment.status === 'Pending' && (
                  <>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => setActionType('Rejected')}
                    >
                      Reject Slip
                    </button>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => setActionType('Verified')}
                    >
                      Confirm & Verify Payment
                    </button>
                  </>
                )}
                <button className="btn btn-sm btn-light" onClick={() => setShowSlipModal(false)}>
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div className="row g-3">
            <div className="col-md-6">
              <div className="p-3 bg-light rounded border small mb-3">
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-2">Transaction Summary</h6>
                <div className="mb-1"><strong>Student:</strong> {selectedPayment.studentName} ({selectedPayment.studentNumber})</div>
                <div className="mb-1"><strong>Enrollment Ref:</strong> {selectedPayment.enrollmentId}</div>
                <div className="mb-1"><strong>Amount:</strong> <span className="text-success fw-bold">₱{selectedPayment.amount.toLocaleString()}</span></div>
                <div className="mb-1"><strong>Payment Channel:</strong> {selectedPayment.paymentMethod}</div>
                <div className="mb-1"><strong>Bank Ref No:</strong> {selectedPayment.referenceNumber}</div>
                <div><strong>Submission Date:</strong> {selectedPayment.paymentDate}</div>
              </div>

              {selectedPayment.remarks && (
                <div className="alert alert-secondary small">
                  <strong>Remarks:</strong> {selectedPayment.remarks}
                </div>
              )}
            </div>

            <div className="col-md-6">
              <h6 className="fw-bold text-dark mb-2">Uploaded Proof of Payment:</h6>
              <div className="p-3 border rounded text-center bg-white shadow-sm">
                <div
                  className="bg-light d-flex flex-column align-items-center justify-content-center p-4 rounded mb-2 border"
                  style={{ minHeight: '180px' }}
                >
                  <i className="bi bi-file-earmark-pdf text-danger fs-1 mb-2"></i>
                  <div className="fw-bold text-dark small">{selectedPayment.proofFileName}</div>
                  <div className="text-muted small">{selectedPayment.proofFileSize} &bull; Uploaded file preview</div>
                </div>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`Viewing full-resolution payment slip: ${selectedPayment.proofFileName}`);
                  }}
                  className="btn btn-sm btn-outline-secondary"
                >
                  <i className="bi bi-zoom-in me-1"></i>Enlarge Slip Document
                </a>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Action Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!actionType}
        onClose={() => setActionType(null)}
        onConfirm={handleConfirmAction}
        title={`${actionType === 'Verified' ? 'Verify' : 'Reject'} Payment Transaction`}
        message={`Are you sure you want to mark payment ${selectedPayment?.id} for ₱${selectedPayment?.amount?.toLocaleString()} as ${actionType}?`}
        confirmText={`Confirm ${actionType}`}
        variant={actionType === 'Verified' ? 'primary' : 'danger'}
        requiresReason={actionType === 'Rejected'}
        reasonPlaceholder="Provide reason for rejection (e.g., Unclear deposit reference or amount mismatch)..."
        loading={processing}
      />
    </div>
  );
};
