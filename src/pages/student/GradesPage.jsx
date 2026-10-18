import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/feedback/EmptyState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { gradeService } from '../../services/gradeService';
import { PaginationControls } from '../../components/tables/PaginationControls';
import { pageParams, readPage } from '../../services/api';

export const GradesPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });
  const [summary, setSummary] = useState({ validatedCount: 0, gpa: 'N/A' });
  const [selectedTerm, setSelectedTerm] = useState('2nd Semester 2025-2026');

  const loadGrades = async (page = 1) => {
    setLoading(true);
    try {
      const response = await gradeService.getGradesByStudent(
        currentUser?.studentNumber || '2026-00001',
        { ...pageParams(page), term: selectedTerm }
      );
      const result = readPage(response);
      setGrades(result.data);
      setPagination(result);
      setSummary(response.summary || { validatedCount: 0, gpa: 'N/A' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrades();
  }, [currentUser, selectedTerm]);

  if (loading) {
    return <LoadingState message="Loading student grades & academic standing..." />;
  }

  const termGrades = grades;

  return (
    <div>
      <PageHeader
        title="Official Grade Viewing"
        subtitle="View official semester grades validated and certified by the University Registrar."
        breadcrumbs={[
          { label: 'Dashboard', to: '/student/dashboard' },
          { label: 'Grades', to: '/student/grades' }
        ]}
        actions={
          <button className="btn btn-sm btn-outline-secondary" onClick={() => window.print()}>
            <i className="bi bi-printer me-1"></i>Print Grade Slip
          </button>
        }
      />

      {/* Term Selector & GPA Summary Banner */}
      <div className="row g-3 mb-4">
        <div className="col-md-7">
          <div className="pnc-card h-100 mb-0">
            <div className="pnc-card-body d-flex flex-column justify-content-center">
              <label className="form-label small fw-bold text-muted mb-2">Select Academic Term:</label>
              <select
                className="form-select form-select-sm"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
              >
                <option value="2nd Semester 2025-2026">2nd Semester 2025-2026 (Current)</option>
                <option value="1st Semester 2025-2026">1st Semester 2025-2026</option>
              </select>
            </div>
          </div>
        </div>
        <div className="col-md-5">
          <div className="pnc-card h-100 mb-0 bg-light">
            <div className="pnc-card-body d-flex align-items-center justify-content-between">
              <div>
                <div className="small text-muted fw-bold">Term Grade Point Average (GPA)</div>
                <div className="fs-3 fw-bold text-dark">{summary.gpa}</div>
                <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                  Computed from {summary.validatedCount} validated subject(s)
                </div>
              </div>
              <div className="rounded-circle bg-white text-secondary border p-3">
                <i className="bi bi-award fs-3"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Control Note */}
      <div className="alert alert-secondary small d-flex align-items-center gap-2 mb-4" role="alert">
        <i className="bi bi-info-circle-fill fs-5 text-secondary"></i>
        <div>
          <strong>Dual-Control Policy:</strong> In accordance with university academic guidelines, grades encoded by faculty instructors only become official and visible once validated and posted by the University Registrar.
        </div>
      </div>

      {/* Grades Table */}
      <div className="pnc-card">
        <div className="pnc-card-header">
          <span>Enrolled Subjects & Grades</span>
        </div>
        <div className="pnc-card-body p-0">
          {termGrades.length === 0 ? (
            <EmptyState
              icon="bi-file-earmark-spreadsheet"
              title="No Grades Recorded"
              message={`There are no grades encoded for ${selectedTerm}.`}
            />
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-pnc align-middle mb-0">
                <thead>
                  <tr>
                    <th>Subject Code</th>
                    <th>Subject Title</th>
                    <th>Units</th>
                    <th>Grade</th>
                    <th>Status</th>
                    <th>Validation Details</th>
                  </tr>
                </thead>
                <tbody>
                  {termGrades.map((g) => {
                    const isValidated = g.status === 'Validated';
                    return (
                      <tr key={g.id} className={!isValidated ? 'table-light' : ''}>
                        <td className="fw-bold text-dark">{g.subjectCode}</td>
                        <td>{g.subjectTitle}</td>
                        <td><span className="fw-semibold">{g.units}</span></td>
                        <td>
                          {isValidated ? (
                            <span className="badge bg-light text-dark border fs-6 fw-bold font-monospace px-3 py-1">
                              {g.grade}
                            </span>
                          ) : (
                            <span className="badge bg-light text-muted border fst-italic p-2">
                              <i className="bi bi-hourglass-split me-1 text-warning"></i>
                              Awaiting Registrar Validation
                            </span>
                          )}
                          {termGrades.length > 0 && (
                            <div className="px-3 pb-3">
                              <PaginationControls {...pagination} onPageChange={loadGrades} />
                            </div>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={g.status} />
                        </td>
                        <td>
                          {isValidated ? (
                            <div className="small">
                              <div className="fw-semibold text-dark">
                                <i className="bi bi-patch-check-fill text-success me-1"></i>
                                {g.validatedBy || 'University Registrar'}
                              </div>
                              <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                Validated: {g.dateValidated}
                              </div>
                            </div>
                          ) : (
                            <div className="small text-muted">
                              <div>Encoded by: {g.encodedBy}</div>
                              <div style={{ fontSize: '0.72rem' }}>{g.dateEncoded}</div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
