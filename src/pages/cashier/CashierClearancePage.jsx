import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/feedback/ConfirmationModal';
import { clearanceService } from '../../services/clearanceService';
import { pageParams, readPage } from '../../services/api';

export const CashierClearancePage = () => {
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
        'Cashier',
        actionType,
        reason || (actionType === 'Signed' ? 'Zero account balance verified.' : ''),
        currentUser?.name || 'Ricardo Gonzales (Cashier)'
      );
      setToastMessage(`Cashier clearance for ${selectedClearance.studentName} marked as ${actionType}.`);
      setActionType(null);
      setSelectedClearance(null);
      loadClearances();
    } catch (err) {
      alert('Failed to update clearance.');
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
      header: 'Program & Term',
      accessor: 'program',
      render: (row) => (
        <div>
          <div className="small text-dark">{row.program}</div>
          <div className="small text-muted">{row.term}</div>
        </div>
      )
    },
    {
      header: 'Cashier Signoff',
      render: (row) => {
        const cashierSign = row.signoffs.find((s) => s.officeName.toLowerCase().includes('cashier'));
        return cashierSign ? <StatusBadge status={cashierSign.status} /> : <StatusBadge status="Pending" />;
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
        const cashierSign = row.signoffs.find((s) => s.officeName.toLowerCase().includes('cashier'));
        const isSigned = cashierSign && cashierSign.status === 'Signed';
        return isSigned ? (
          <span className="small text-success"><i className="bi bi-check-circle-fill me-1"></i>Cleared</span>
        ) : (
          <div className="d-flex gap-1">
            <button
              className="btn btn-xs btn-success py-1 px-2"
              onClick={() => {
                setSelectedClearance(row);
                setActionType('Signed');
              }}
            >
              Sign Clearance
            </button>
            <button
              className="btn btn-xs btn-outline-danger py-1 px-2"
              onClick={() => {
                setSelectedClearance(row);
                setActionType('Rejected');
              }}
            >
              Hold/Reject
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div>
      <PageHeader
        title="Cashier Clearance Signoff Queue"
        subtitle="Verify student financial settlement and authorize clearance signoff."
        breadcrumbs={[
          { label: 'Dashboard', to: '/cashier/dashboard' },
          { label: 'Clearance', to: '/cashier/clearance' }
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
          <span>Financial Clearance Queue</span>
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
        title={`${actionType === 'Signed' ? 'Authorize' : 'Hold'} Cashier Clearance`}
        message={`Are you sure you want to mark the Cashier clearance for ${selectedClearance?.studentName} (${selectedClearance?.studentNumber}) as ${actionType}?`}
        confirmText={actionType === 'Signed' ? 'Authorize Clearance' : 'Hold Clearance'}
        variant={actionType === 'Signed' ? 'primary' : 'danger'}
        requiresReason={actionType === 'Rejected'}
        reasonPlaceholder="State outstanding account balance or hold reason..."
        loading={processing}
      />
    </div>
  );
};
