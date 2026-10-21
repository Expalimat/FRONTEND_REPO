import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DashboardCard } from '../../components/common/DashboardCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/feedback/LoadingState';
import { enrollmentService } from '../../services/enrollmentService';
import { gradeService } from '../../services/gradeService';
import { documentService } from '../../services/documentService';
import { clearanceService } from '../../services/clearanceService';

export const RegistrarDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [clearances, setClearances] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [enrList, grdList, docList, clrList] = await Promise.all([
          enrollmentService.getEnrollments(),
          gradeService.getGrades(),
          documentService.getRequests(),
          clearanceService.getClearances()
        ]);
        setEnrollments(enrList);
        setGrades(grdList);
        setDocuments(docList);
        setClearances(clrList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading Registrar Work Queues..." />;
  }

  const pendingEnrollments = enrollments.filter((e) => e.status === 'Pending');
  const pendingGrades = grades.filter((g) => g.status === 'Encoded');
  const pendingDocs = documents.filter((d) => d.status === 'Pending' || d.status === 'Processing');
  const pendingRegistrarClearance = clearances.filter((c) => {
    const regSignoff = c.signoffs.find((s) => s.officeName.toLowerCase().includes('registrar'));
    return regSignoff && regSignoff.status === 'Pending';
  });

  return (
    <div>
      <PageHeader
        title="Registrar Dashboard"
        subtitle="Manage enrollments, grades, documents, and clearances."
      />

      {/* Work Queue Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Pending Enrollments"
            value={pendingEnrollments.length}
            subtitle="Awaiting admission approval"
            icon="bi-journal-check"
            color="primary"
            onClick={() => navigate('/registrar/enrollments')}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Grades to Validate"
            value={pendingGrades.length}
            subtitle="Faculty submissions"
            icon="bi-patch-check"
            color="warning"
            onClick={() => navigate('/registrar/grades')}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Document Requests"
            value={pendingDocs.length}
            subtitle="TOR, COG, Good Moral"
            icon="bi-file-earmark-arrow-up"
            color="info"
            onClick={() => navigate('/registrar/documents')}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Clearance Queue"
            value={pendingRegistrarClearance.length}
            subtitle="Registrar review"
            icon="bi-clipboard-check"
            color="purple"
            onClick={() => navigate('/registrar/clearance')}
          />
        </div>
      </div>

      {/* Queues Preview Grid */}
      <div className="row g-4">
        {/* Pending Enrollments Table */}
        <div className="col-lg-6">
          <div className="pnc-card h-100 mb-0">
            <div className="pnc-card-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-journal-text text-success"></i>
                <span>Recent Enrollment Applications</span>
              </div>
              <Link to="/registrar/enrollments" className="btn btn-sm btn-link text-decoration-none text-success p-0">
                View All ({pendingEnrollments.length})
              </Link>
            </div>
            <div className="pnc-card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover table-pnc align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Program</th>
                      <th>Units</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.slice(0, 4).map((enr) => (
                      <tr key={enr.id}>
                        <td>
                          <div className="fw-semibold text-dark">{enr.studentName}</div>
                          <div className="small text-muted font-monospace">{enr.studentNumber}</div>
                        </td>
                        <td className="small">{enr.program}</td>
                        <td>{enr.totalUnits}</td>
                        <td><StatusBadge status={enr.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Grades Awaiting Validation */}
        <div className="col-lg-6">
          <div className="pnc-card h-100 mb-0">
            <div className="pnc-card-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-patch-question text-warning"></i>
                <span>Grades Awaiting Validation</span>
              </div>
              <Link to="/registrar/grades" className="btn btn-sm btn-link text-decoration-none text-success p-0">
                Review All ({pendingGrades.length})
              </Link>
            </div>
            <div className="pnc-card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover table-pnc align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Subject</th>
                      <th>Grade</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.slice(0, 4).map((grd) => (
                      <tr key={grd.id}>
                        <td>
                          <div className="fw-semibold text-dark">{grd.studentName}</div>
                          <div className="small text-muted">{grd.studentNumber}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">{grd.subjectCode}</span>
                        </td>
                        <td className="fw-bold text-success">{grd.grade}</td>
                        <td><StatusBadge status={grd.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
