import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/feedback/ConfirmationModal';
import { clearanceService } from '../../services/clearanceService';
import { pageParams, readPage } from '../../services/api';

export const DepartmentClearancePage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clearances, setClearances] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [selectedClearance, setSelectedClearance] = useState(null);
  const [actionType, setActionType] = useState(null); // 'Signed' | 'Rejected'
  const [processing, setProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadClearances = async (page = 1, nextFilters = filters) => {
    setLoading(true);
    try {
      const result = readPage(await clearanceService.getClearances(pageParams(page, nextFilters)));
      setClearances(result.data);
      setPagination(result);
      setFilters(nextFilters);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClearances();
  }, []);

  const handleSign = async (reason) => {
    if (!selectedClearance || !actionType) return;
    setProcessing(true);
    try {
      await clearanceService.signClearance(
        selectedClearance.id,
        'Department',
        actionType,
        reason || (actionType === 'Signed' ? 'Laboratory property and project accountabilities cleared.' : ''),
        currentUser?.name || 'Dr. Arnaldo Perez (Department Dean)'
      );
      setToastMessage(`Department clearance for ${selectedClearance.studentName} marked as ${actionType}.`);
      setActionType(null);
      setSelectedClearance(null);
      loadClearances();
    } catch (err) {
      alert(err.message || 'Failed to update clearance.');
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
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
      header: 'Degree Program',
      accessor: 'program',
      render: (row) => <span className="small text-dark">{row.program}</span>
    },
    {
      header: 'Term',
      accessor: 'term',
      render: (row) => <span className="small text-muted">{row.term}</span>
    },
    {
      header: 'Department Signoff',
      render: (row) => {
        const deptSign = row.signoffs.find((s) => s.officeName.toLowerCase().includes('department'));
        return deptSign ? <StatusBadge status={deptSign.status} /> : <StatusBadge status="Pending" />;
      }
    },
    {
      header: 'Overall Clearance',
      accessor: 'overallStatus',
      render: (row) => <StatusBadge status={row.overallStatus} />
    },
    {
      header: 'Action',
      render: (row) => {
        const deptSign = row.signoffs.find((s) => s.officeName.toLowerCase().includes('department'));
        const isSigned = deptSign && deptSign.status === 'Signed';
        return isSigned ? (
          <div className="small text-success">
            <i className="bi bi-check-circle-fill me-1"></i>Signed by {deptSign.signedBy}
          </div>
        ) : (
          <div className="d-flex gap-1">
            <button
              className="btn btn-xs btn-success py-1 px-2"
              onClick={() => {
                setSelectedClearance(row);
                setActionType('Signed');
              }}
            >
              <i className="bi bi-pen-fill me-1"></i>Sign Clearance
            </button>
            <button
              className="btn btn-xs btn-outline-danger py-1 px-2"
              onClick={() => {
                setSelectedClearance(row);
                setActionType('Rejected');
              }}
            >
              Reject
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div>
      <PageHeader
        title="Department Academic & Laboratory Clearance"
        subtitle="Review student laboratory accountabilities, project submissions, and grant department signoff."
        breadcrumbs={[
          { label: 'Dashboard', to: '/department/dashboard' },
          { label: 'Clearance', to: '/department/clearance' }
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
          <span>Department Clearance Signoff Queue</span>
        </div>
        <div className="pnc-card-body">
          <DataTable
            columns={columns}
            data={clearances}
            searchPlaceholder="Search student name or ID..."
            loading={loading}
            serverPagination={{ ...pagination, onPageChange: loadClearances }}
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!actionType}
        onClose={() => setActionType(null)}
        onConfirm={handleSign}
        title={`${actionType === 'Signed' ? 'Authorize' : 'Reject'} Department Clearance`}
        message={`Are you sure you want to mark the Department clearance signoff for ${selectedClearance?.studentName} (${selectedClearance?.studentNumber}) as ${actionType}?`}
        confirmText={actionType === 'Signed' ? 'Sign Clearance' : 'Reject Clearance'}
        variant={actionType === 'Signed' ? 'primary' : 'danger'}
        requiresReason={actionType === 'Rejected'}
        reasonPlaceholder="State laboratory deficiency or missing accountability..."
        loading={processing}
      />
    </div>
  );
};
