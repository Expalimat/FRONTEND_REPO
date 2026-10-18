import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/feedback/ConfirmationModal';
import { Modal } from '../../components/feedback/Modal';
import { enrollmentService } from '../../services/enrollmentService';
import { pageParams, readPage } from '../../services/api';

export const EnrollmentRequestsPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [selectedEnr, setSelectedEnr] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'Approve' | 'Reject'
  const [targetEnrollment, setTargetEnrollment] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadEnrollments = async (page = 1, nextFilters = filters) => {
    setLoading(true);
    try {
      const result = readPage(await enrollmentService.getEnrollments(pageParams(page, nextFilters)));
      setEnrollments(result.data);
      setPagination(result);
      setFilters(nextFilters);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, []);

  const handleOpenAction = (enr, type) => {
    setTargetEnrollment(enr);
    setActionType(type);
  };

  const handleConfirmAction = async (reason) => {
    if (!targetEnrollment || !actionType) return;
    setProcessing(true);
    try {
      const status = actionType === 'Approve'
        ? 'Approved'
        : actionType === 'Pre-Assess'
          ? 'Pre-Assessed'
          : 'Rejected';
      await enrollmentService.updateEnrollmentStatus(
        targetEnrollment.id,
        status,
        reason,
        currentUser?.name || 'Registrar Staff'
      );
      setToastMessage(`Enrollment ${targetEnrollment.id} has been ${status.toLowerCase()} successfully.`);
      setActionType(null);
      setTargetEnrollment(null);
      setShowViewModal(false);
      loadEnrollments();
    } catch (err) {
      alert('Failed to update status.');
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      header: 'Student Number',
      accessor: 'studentNumber',
      render: (row) => <span className="font-monospace fw-semibold">{row.studentNumber}</span>
    },
    {
      header: 'Student Name',
      accessor: 'studentName',
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{row.studentName}</div>
          <div className="small text-muted">{row.program}</div>
        </div>
      )
    },
    {
      header: 'Term',
      accessor: 'term',
      render: (row) => <span className="small text-muted">{row.term}</span>
    },
    {
      header: 'Units',
      accessor: 'totalUnits',
      render: (row) => <span className="fw-bold">{row.totalUnits} Units</span>
    },
    {
      header: 'Enrollment Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Date Submitted',
      accessor: 'dateSubmitted',
      render: (row) => <span className="small text-muted">{row.dateSubmitted}</span>
    },
    {
      header: 'Action',
      render: (row) => (
        <div className="d-flex align-items-center gap-1">
          <button
            className="btn btn-xs btn-outline-primary py-1 px-2"
            onClick={() => {
              setSelectedEnr(row);
              setShowViewModal(true);
            }}
            title="View Subject Details"
          >
            <i className="bi bi-eye me-1"></i>View
          </button>
          {row.status === 'Pending' && (
            <>
              <button
                className="btn btn-xs btn-success py-1 px-2"
                onClick={() => handleOpenAction(row, 'Approve')}
                title="Approve Application"
              >
                <i className="bi bi-check-lg me-1"></i>Approve
              </button>
              <button
                className="btn btn-xs btn-outline-primary py-1 px-2"
                onClick={() => handleOpenAction(row, 'Pre-Assess')}
                title="Pre-Assess Application"
              >
                <i className="bi bi-clipboard-check me-1"></i>Pre-Assess
              </button>
              <button
                className="btn btn-xs btn-danger py-1 px-2"
                onClick={() => handleOpenAction(row, 'Reject')}
                title="Reject Application"
              >
                <i className="bi bi-x-lg me-1"></i>Reject
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
        title="Enrollment Work Queue"
        subtitle="Review, evaluate, and approve semestral subject matriculation submissions."
        breadcrumbs={[
          { label: 'Dashboard', to: '/registrar/dashboard' },
          { label: 'Enrollment Requests', to: '/registrar/enrollments' }
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
          <span>All Enrollment Submissions</span>
        </div>
        <div className="pnc-card-body">
          <DataTable
            columns={columns}
            data={enrollments}
            filterField="status"
            filterOptions={[
              { label: 'Pending Approval', value: 'Pending' },
              { label: 'Pre-Assessed', value: 'Pre-Assessed' },
              { label: 'Approved', value: 'Approved' },
              { label: 'Rejected', value: 'Rejected' }
            ]}
            filterPlaceholder="Filter by Status"
            searchPlaceholder="Search by student name, ID or program..."
            loading={loading}
            serverPagination={{ ...pagination, onPageChange: loadEnrollments }}
          />
        </div>
      </div>

      {/* Subject Details Modal */}
      {selectedEnr && (
        <Modal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          title={`Enrollment Details: ${selectedEnr.id} (${selectedEnr.studentName})`}
          size="lg"
          footer={
            <div className="d-flex justify-content-between w-100">
              <div>
                <StatusBadge status={selectedEnr.status} />
              </div>
              <div className="d-flex gap-2">
                {selectedEnr.status === 'Pending' && (
                  <>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleOpenAction(selectedEnr, 'Reject')}
                    >
                      Reject Application
                    </button>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handleOpenAction(selectedEnr, 'Approve')}
                    >
                      Approve Application
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleOpenAction(selectedEnr, 'Pre-Assess')}
                    >
                      Pre-Assess
                    </button>
                  </>
                )}
                <button className="btn btn-sm btn-light" onClick={() => setShowViewModal(false)}>
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div>
            <div className="row g-2 mb-3 bg-light p-3 rounded border small">
              <div className="col-md-4">
                <strong>Student No:</strong> {selectedEnr.studentNumber}
              </div>
              <div className="col-md-4">
                <strong>Program:</strong> {selectedEnr.program}
              </div>
              <div className="col-md-4">
                <strong>Date Submitted:</strong> {selectedEnr.dateSubmitted}
              </div>
            </div>

            <h6 className="fw-bold text-dark mb-2">Selected Course Offerings:</h6>
            <div className="table-responsive mb-3">
              <table className="table table-sm table-bordered table-pnc">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Title</th>
                    <th>Section</th>
                    <th>Schedule</th>
                    <th>Units</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEnr.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold">{item.subjectCode}</td>
                      <td>{item.subjectTitle}</td>
                      <td>{item.section}</td>
                      <td>{item.schedule}</td>
                      <td className="fw-bold text-center">{item.units}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="table-light">
                    <td colSpan="4" className="text-end fw-bold">Total Units:</td>
                    <td className="text-center fw-bold text-success">{selectedEnr.totalUnits}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {selectedEnr.remarks && (
              <div className="alert alert-secondary small mb-0">
                <strong>Registrar Remarks:</strong> {selectedEnr.remarks}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Approval / Rejection Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!actionType}
        onClose={() => setActionType(null)}
        onConfirm={handleConfirmAction}
        title={
          actionType === 'Approve'
            ? 'Approve Enrollment Submission'
            : actionType === 'Pre-Assess'
              ? 'Pre-Assess Enrollment Submission'
              : 'Reject Enrollment Submission'
        }
        message={
          actionType === 'Pre-Assess'
            ? `Pre-assess the enrollment application of ${targetEnrollment?.studentName}? This will allow the student to submit proof of payment.`
            : `Are you sure you want to ${actionType?.toLowerCase()} the enrollment application of ${targetEnrollment?.studentName} (${targetEnrollment?.totalUnits} units)?`
        }
        confirmText={
          actionType === 'Approve'
            ? 'Approve Enrollment'
            : actionType === 'Pre-Assess'
              ? 'Mark as Pre-Assessed'
              : 'Reject Enrollment'
        }
        variant={actionType === 'Approve' ? 'primary' : actionType === 'Pre-Assess' ? 'info' : 'danger'}
        requiresReason={actionType === 'Reject'}
        reasonPlaceholder="State reason for rejection (e.g., Unresolved prerequisite deficiency)..."
        loading={processing}
      />
    </div>
  );
};
