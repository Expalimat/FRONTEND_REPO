import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/feedback/EmptyState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { clearanceService } from '../../services/clearanceService';

export const ClearancePage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clearance, setClearance] = useState(null);

  useEffect(() => {
    const fetchClearance = async () => {
      setLoading(true);
      try {
        const data = await clearanceService.getClearanceByStudent(currentUser?.studentNumber || '2026-00001');
        setClearance(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClearance();
  }, [currentUser]);

  if (loading) {
    return <LoadingState message="Loading clearance tracking records..." />;
  }

  if (!clearance) {
    return (
      <div>
        <PageHeader
          title="Semestral Clearance Tracking"
          subtitle="Track your clearance signoffs across all academic and administrative offices."
          breadcrumbs={[
            { label: 'Dashboard', to: '/student/dashboard' },
            { label: 'Clearance', to: '/student/clearance' }
          ]}
        />
        <EmptyState
          icon="bi-clipboard-x"
          title="No Clearance Found"
          message="There is no clearance record initialized for your student account for this semester."
        />
      </div>
    );
  }

  const isAllClear = clearance.overallStatus === 'Clearance Complete';
  const signedCount = clearance.signoffs.filter((s) => s.status === 'Signed').length;
  const totalOffices = clearance.signoffs.length;
  const progressPercent = Math.round((signedCount / totalOffices) * 100);

  return (
    <div>
      <PageHeader
        title="Semestral Clearance Tracking"
        subtitle={`Academic Term: ${clearance.term} | Student ID: ${clearance.studentNumber}`}
        breadcrumbs={[
          { label: 'Dashboard', to: '/student/dashboard' },
          { label: 'Clearance', to: '/student/clearance' }
        ]}
        actions={
          <button className="btn btn-sm btn-outline-secondary" onClick={() => window.print()}>
            <i className="bi bi-printer me-1"></i>Print Clearance Slip
          </button>
        }
      />

      {/* Overall Status Banner Card */}
      <div className={`pnc-card mb-4 border-2 ${isAllClear ? 'border-success' : 'border-warning'}`}>
        <div className="pnc-card-body p-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center ${isAllClear ? 'bg-success text-white' : 'bg-warning-subtle text-warning'}`}
                style={{ width: '56px', height: '56px', fontSize: '1.75rem' }}
              >
                <i className={`bi ${isAllClear ? 'bi-shield-fill-check' : 'bi-hourglass-split'}`}></i>
              </div>
              <div>
                <h5 className="fw-bold text-dark mb-1">Overall Status: {clearance.overallStatus}</h5>
                <p className="text-muted small mb-0">
                  {isAllClear
                    ? 'All required university offices have signed off. Your clearance is officially completed.'
                    : `${signedCount} of ${totalOffices} offices have signed off. Please settle pending requirements.`}
                </p>
              </div>
            </div>
            <div className="text-md-end">
              <StatusBadge status={clearance.overallStatus} size="normal" />
              <div className="small text-muted mt-1">{progressPercent}% Completed</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="progress mt-3" style={{ height: '8px' }}>
            <div
              className={`progress-bar ${isAllClear ? 'bg-success' : 'bg-warning'}`}
              role="progressbar"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Offices Signoff Breakdown */}
      <div className="pnc-card">
        <div className="pnc-card-header">
          <span>Office Signoff Status Details</span>
        </div>
        <div className="pnc-card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-pnc align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Office / Department</th>
                  <th style={{ width: '15%' }}>Signoff Status</th>
                  <th style={{ width: '25%' }}>Signatory Details</th>
                  <th style={{ width: '30%' }}>Remarks / Instructions</th>
                </tr>
              </thead>
              <tbody>
                {clearance.signoffs.map((s, idx) => (
                  <tr key={idx} className={s.status === 'Signed' ? '' : 'table-warning-subtle'}>
                    <td>
                      <div className="fw-bold text-dark">{s.officeName}</div>
                      <div className="small text-muted">
                        {idx === 0 && 'Academic Dean / Department Head'}
                        {idx === 1 && 'Financial Obligations & Accounts'}
                        {idx === 2 && 'Student Records & Matriculation'}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td>
                      {s.status === 'Signed' ? (
                        <div className="small">
                          <div className="fw-semibold text-dark"><i className="bi bi-pen-fill me-1 text-success"></i>{s.signedBy}</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{s.signedDate}</div>
                        </div>
                      ) : (
                        <span className="small text-muted fst-italic">Pending Signoff</span>
                      )}
                    </td>
                    <td>
                      {s.remarks ? (
                        <span className="small text-dark">{s.remarks}</span>
                      ) : s.status === 'Signed' ? (
                        <span className="small text-success">Requirement cleared.</span>
                      ) : (
                        <span className="small text-muted">No deficiency recorded. Office review pending.</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
