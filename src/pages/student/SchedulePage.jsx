import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/feedback/EmptyState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { enrollmentService } from '../../services/enrollmentService';

export const SchedulePage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('2nd Semester 2025-2026');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await enrollmentService.getEnrollmentByStudent(currentUser?.studentNumber || '2026-00001');
        setEnrollments(data);
        if (data.length > 0) {
          setSelectedTerm(data[0].term);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  if (loading) {
    return <LoadingState message="Loading class schedule..." />;
  }

  const currentEnrollment = enrollments.find((e) => e.term === selectedTerm) || enrollments[0];
  const scheduleItems = currentEnrollment ? currentEnrollment.items : [];

  return (
    <div>
      <PageHeader
        title="My Class Schedule"
        subtitle="View your official class schedule and room assignments for the academic term."
        breadcrumbs={[
          { label: 'Dashboard', to: '/student/dashboard' },
          { label: 'My Schedule', to: '/student/schedule' }
        ]}
        actions={
          <div className="d-flex align-items-center gap-2">
            {/* View Mode Switcher */}
            <div className="btn-group btn-group-sm">
              <button
                className={`btn ${viewMode === 'table' ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <i className="bi bi-table me-1"></i>Table
              </button>
              <button
                className={`btn ${viewMode === 'cards' ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setViewMode('cards')}
                title="Card View"
              >
                <i className="bi bi-grid me-1"></i>Cards
              </button>
            </div>

            {/* Print schedule */}
            <button className="btn btn-sm btn-outline-secondary" onClick={() => window.print()}>
              <i className="bi bi-printer me-1"></i>Print
            </button>
          </div>
        }
      />

      {/* Term Selector Card */}
      <div className="pnc-card mb-4">
        <div className="pnc-card-body py-3">
          <div className="row align-items-center">
            <div className="col-md-3">
              <label className="form-label small fw-bold text-muted mb-md-0">Select Academic Term:</label>
            </div>
            <div className="col-md-5">
              <select
                className="form-select form-select-sm"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
              >
                {enrollments.map((enr) => (
                  <option key={enr.id} value={enr.term}>
                    {enr.term} ({enr.totalUnits} Units - {enr.status})
                  </option>
                ))}
                {enrollments.length === 0 && <option>2nd Semester 2025-2026</option>}
              </select>
            </div>
          </div>
        </div>
      </div>

      {scheduleItems.length === 0 ? (
        <EmptyState
          icon="bi-calendar-x"
          title="No Schedule Available"
          message="There are no confirmed class schedules found for the selected academic term."
        />
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="pnc-card">
          <div className="pnc-card-header d-flex justify-content-between align-items-center">
            <span className="fw-bold text-dark">Class Schedule ({selectedTerm})</span>
            <span className="badge bg-success-subtle text-success border border-success-subtle">
              {scheduleItems.length} Subjects Enrolled
            </span>
          </div>
          <div className="pnc-card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-pnc mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Subject Code</th>
                    <th>Subject Title</th>
                    <th>Section</th>
                    <th>Schedule & Time</th>
                    <th>Room</th>
                    <th>Units</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold text-success">{item.subjectCode}</td>
                      <td>{item.subjectTitle}</td>
                      <td><span className="badge bg-light text-dark border">{item.section}</span></td>
                      <td>
                        <i className="bi bi-clock me-1 text-muted"></i>
                        {item.schedule}
                      </td>
                      <td>
                        <i className="bi bi-geo-alt me-1 text-muted"></i>
                        <span className="badge bg-light text-secondary border">{item.room || 'TBA'}</span>
                      </td>
                      <td className="fw-bold text-center">{item.units}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Card / Grid View */
        <div className="row g-3">
          {scheduleItems.map((item, idx) => (
            <div key={idx} className="col-md-6 col-lg-4">
              <div className="pnc-card h-100 border-start border-4 border-success">
                <div className="pnc-card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-success">{item.subjectCode}</span>
                    <span className="badge bg-light text-dark border">{item.section}</span>
                  </div>
                  <h6 className="fw-bold text-dark mb-3">{item.subjectTitle}</h6>
                  <div className="d-flex flex-column gap-2 small text-muted">
                    <div>
                      <i className="bi bi-calendar3 me-2 text-success"></i>
                      <strong>Schedule:</strong> {item.schedule}
                    </div>
                    <div>
                      <i className="bi bi-door-closed me-2 text-success"></i>
                      <strong>Room:</strong> {item.room || 'TBA'}
                    </div>
                    <div>
                      <i className="bi bi-book me-2 text-success"></i>
                      <strong>Units:</strong> {item.units} Credit Units
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
