import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RowActionMenu } from '../../components/common/RowActionMenu';
import { ConfirmationModal } from '../../components/feedback/ConfirmationModal';
import { Modal } from '../../components/feedback/Modal';
import { documentService } from '../../services/documentService';
import { pageParams, readPage } from '../../services/api';

export const DocumentRequestsQueuePage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [actionType, setActionType] = useState(null); // 'Processing' | 'Released' | 'Rejected'
  const [processing, setProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showViewModal, setShowViewModal] = useState(false);

  const loadRequests = async (page = 1, filters = {}) => {
    setLoading(true);
    try {
      const result = readPage(await documentService.getRequests(pageParams(page, filters)));
      setRequests(result.data);
      setPagination(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleConfirmAction = async (reason) => {
    if (!selectedDoc || !actionType) return;
    setProcessing(true);
    try {
      await documentService.updateRequestStatus(
        selectedDoc.id,
        actionType,
        reason,
        currentUser?.name || 'Maria Santos (Registrar)'
      );
      setToastMessage(`Request ${selectedDoc.trackingNumber} is now ${actionType.toLowerCase()}.`);
      setActionType(null);
      setSelectedDoc(null);
      setShowViewModal(false);
      loadRequests();
    } catch (err) {
      alert('Failed to update document status.');
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      header: 'Tracking No.',
      accessor: 'trackingNumber',
      render: (row) => <span className="badge bg-secondary font-monospace">{row.trackingNumber}</span>
    },
    {
      header: 'Student Name & No.',
      accessor: 'studentName',
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{row.studentName}</div>
          <div className="small text-muted font-monospace">{row.studentNumber}</div>
        </div>
      )
    },
    {
      header: 'Document Type',
      accessor: 'documentType',
      render: (row) => <span className="fw-bold text-dark">{row.documentType}</span>
    },
    {
      header: 'Purpose',
      accessor: 'purpose',
      render: (row) => <span className="small text-muted">{row.purpose}</span>
    },
    {
      header: 'Date Requested',
      accessor: 'requestDate',
      render: (row) => <span className="small text-muted">{row.requestDate}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="d-flex align-items-center gap-1">
          <button
            className="btn btn-xs btn-outline-primary py-1 px-2"
            onClick={() => {
              setSelectedDoc(row);
              setShowViewModal(true);
            }}
            title="View Details"
          >
            <i className="bi bi-eye"></i>
          </button>
          {(row.status === 'Pending' || row.status === 'Processing') && (
            <RowActionMenu
              label={`Document request actions for ${row.trackingNumber}`}
              actions={[
                ...(row.status === 'Pending'
                  ? [{
                      label: 'Mark as Processing',
                      icon: 'bi-arrow-repeat',
                      onClick: () => {
                        setSelectedDoc(row);
                        setActionType('Processing');
                      }
                    }]
                  : []),
                {
                  label: 'Release Document',
                  icon: 'bi-check-lg',
                  variant: 'text-success',
                  onClick: () => {
                    setSelectedDoc(row);
                    setActionType('Released');
                  }
                },
                {
                  label: 'Reject Request',
                  icon: 'bi-x-lg',
                  variant: 'text-danger',
                  onClick: () => {
                    setSelectedDoc(row);
                    setActionType('Rejected');
                  }
                }
              ]}
            />
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Document Requests Processing Queue"
        subtitle="Review student document applications, generate credentials, and manage releases."
        breadcrumbs={[
          { label: 'Dashboard', to: '/registrar/dashboard' },
          { label: 'Document Requests', to: '/registrar/documents' }
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
          <span>All Document Requests</span>
        </div>
        <div className="pnc-card-body">
          <DataTable
            columns={columns}
            data={requests}
            serverPagination={{ ...pagination, onPageChange: loadRequests }}
            filterField="status"
            filterOptions={[
              { label: 'Pending', value: 'Pending' },
              { label: 'Processing', value: 'Processing' },
              { label: 'Released', value: 'Released' },
              { label: 'Rejected', value: 'Rejected' }
            ]}
            filterPlaceholder="Filter Status"
            searchPlaceholder="Search by tracking number, student or document..."
            loading={loading}
          />
        </div>
      </div>

      {/* Request Details Modal */}
      {selectedDoc && (
        <Modal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          title={`Request Details: ${selectedDoc.trackingNumber}`}
          size="md"
        >
          <div className="small">
            <div className="mb-3 p-3 bg-light rounded border">
              <div><strong>Student:</strong> {selectedDoc.studentName} ({selectedDoc.studentNumber})</div>
              <div><strong>Document:</strong> {selectedDoc.documentType}</div>
              <div><strong>Purpose:</strong> {selectedDoc.purpose}</div>
              <div><strong>Date Filed:</strong> {selectedDoc.requestDate}</div>
              <div><strong>Current Status:</strong> <StatusBadge status={selectedDoc.status} /></div>
              {selectedDoc.releaseDate && <div><strong>Released On:</strong> {selectedDoc.releaseDate}</div>}
            </div>
            {selectedDoc.remarks && (
              <div className="mb-3">
                <strong>Remarks / Notes:</strong>
                <div className="p-2 bg-light rounded border mt-1">{selectedDoc.remarks}</div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Action Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!actionType}
        onClose={() => setActionType(null)}
        onConfirm={handleConfirmAction}
        title={`${actionType} Document Request`}
        message={`Are you sure you want to mark document request ${selectedDoc?.trackingNumber} (${selectedDoc?.documentType}) as ${actionType}?`}
        confirmText={`Confirm ${actionType}`}
        variant={actionType === 'Released' ? 'primary' : actionType === 'Rejected' ? 'danger' : 'info'}
        requiresReason={actionType === 'Rejected'}
        reasonPlaceholder="Provide reason for rejection (e.g., Unsettled financial accounts)..."
        loading={processing}
      />
    </div>
  );
};
