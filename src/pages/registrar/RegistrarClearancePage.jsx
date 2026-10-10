import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/feedback/ConfirmationModal';
import { clearanceService } from '../../services/clearanceService';

export const RegistrarClearancePage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clearances, setClearances] = useState([]);
  const [selectedClearance, setSelectedClearance] = useState(null);
  const [actionType, setActionType] = useState(null); // 'Signed' | 'Rejected'
  const [processing, setProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadClearances = async () => {
    setLoading(true);
    try {
      const data = await clearanceService.getClearances();
      setClearances(data);
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
        'Registrar',
        actionType,
        reason || (actionType === 'Signed' ? 'Matriculation records verified; no academic deficiency.' : ''),
        currentUser?.name || 'Maria Santos (Registrar)'
      );
      setToastMessage(`Clearance for ${selectedClearance.studentName} marked as ${actionType}.`);
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
      header: 'Registrar Signoff',
      render: (row) => {
        const reg = row.signoffs.find((s) => s.officeName.toLowerCase().includes('registrar'));
        return reg ? <StatusBadge status={reg.status} /> : <StatusBadge status="Pending" />;
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
        const reg = row.signoffs.find((s) => s.officeName.toLowerCase().includes('registrar'));
        const isSigned = reg && reg.status === 'Signed';
        return isSigned ? (
          <span className="small text-success"><i className="bi bi-check-circle-fill me-1"></i>Signed</span>
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
        title="Registrar Clearance Signoff Queue"
        subtitle="Review and grant official semestral clearance for student records and admission requirements."
        breadcrumbs={[
          { label: 'Dashboard', to: '/registrar/dashboard' },
          { label: 'Clearance', to: '/registrar/clearance' }
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
          <span>Registrar Clearance Work Queue</span>
        </div>
        <div className="pnc-card-body">
          <DataTable
            columns={columns}
            data={clearances}
            searchPlaceholder="Search student name or ID..."
            loading={loading}
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!actionType}
        onClose={() => setActionType(null)}
        onConfirm={handleSign}
        title={`${actionType === 'Signed' ? 'Sign Off' : 'Reject'} Registrar Clearance`}
        message={`Are you sure you want to mark the Registrar clearance signoff for ${selectedClearance?.studentName} (${selectedClearance?.studentNumber}) as ${actionType}?`}
        confirmText={actionType === 'Signed' ? 'Sign Clearance' : 'Reject Clearance'}
        variant={actionType === 'Signed' ? 'primary' : 'danger'}
        requiresReason={actionType === 'Rejected'}
        reasonPlaceholder="Provide reason for clearance hold (e.g., Missing Form 137 / PSA)..."
        loading={processing}
      />
    </div>
  );
};
