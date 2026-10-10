import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/feedback/EmptyState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { gradeService } from '../../services/gradeService';

export const GradesPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('2nd Semester 2025-2026');

  useEffect(() => {
    const fetchGrades = async () => {
      setLoading(true);
      try {
        const data = await gradeService.getGradesByStudent(currentUser?.studentNumber || '2026-00001');
        setGrades(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, [currentUser]);

  if (loading) {
    return <LoadingState message="Loading student grades & academic standing..." />;
  }

  // Filter by selected term
  const termGrades = grades.filter((g) => g.term === selectedTerm);

  // Calculate GPA for validated grades only
  const validatedGrades = termGrades.filter((g) => g.status === 'Validated');
  let totalGradePoints = 0;
  let totalValidatedUnits = 0;

  validatedGrades.forEach((g) => {
    const numGrade = parseFloat(g.grade);
    if (!isNaN(numGrade)) {
      totalGradePoints += numGrade * g.units;
      totalValidatedUnits += g.units;
    }
  });

  const gpa = totalValidatedUnits > 0 ? (totalGradePoints / totalValidatedUnits).toFixed(2) : 'N/A';

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
          <div className="pnc-card h-100 mb-0 bg-success-subtle border-success-subtle">
            <div className="pnc-card-body d-flex align-items-center justify-content-between">
              <div>
                <div className="small text-success fw-bold">Term Grade Point Average (GPA)</div>
                <div className="fs-3 fw-bold text-success">{gpa}</div>
                <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                  Computed from {validatedGrades.length} validated subject(s)
                </div>
              </div>
              <div className="rounded-circle bg-success text-white p-3">
                <i className="bi bi-award fs-3"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Control Note */}
      <div className="alert alert-info small d-flex align-items-center gap-2 mb-4" role="alert">
        <i className="bi bi-info-circle-fill fs-5 text-info"></i>
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
                            <span className="badge bg-success fs-6 fw-bold font-monospace px-3 py-1">
                              {g.grade}
                            </span>
                          ) : (
                            <span className="badge bg-light text-muted border fst-italic p-2">
                              <i className="bi bi-hourglass-split me-1 text-warning"></i>
                              Awaiting Registrar Validation
                            </span>
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
