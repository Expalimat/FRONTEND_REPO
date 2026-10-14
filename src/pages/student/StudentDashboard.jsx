import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { DashboardCard } from '../../components/common/DashboardCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/feedback/EmptyState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { enrollmentService } from '../../services/enrollmentService';
import { paymentService } from '../../services/paymentService';
import { clearanceService } from '../../services/clearanceService';
import { documentService } from '../../services/documentService';
import { gradeService } from '../../services/gradeService';
import { isEnrollmentCompleted } from '../../services/enrollmentService';

export const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [clearance, setClearance] = useState(null);
  const [documentRequests, setDocumentRequests] = useState([]);
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const studentNo = currentUser?.studentNumber || '2026-00001';
        const [enrData, payData, clrData, docData, grdData] = await Promise.all([
          enrollmentService.getEnrollmentByStudent(studentNo),
          paymentService.getPaymentsByStudent(studentNo),
          clearanceService.getClearanceByStudent(studentNo),
          documentService.getRequestsByStudent(studentNo),
          gradeService.getGradesByStudent(studentNo)
        ]);
        setEnrollments(enrData);
        setPayments(payData);
        setClearance(clrData);
        setDocumentRequests(docData);
        setGrades(grdData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  if (loading) {
    return <LoadingState message="Loading student dashboard..." />;
  }

  const latestEnrollmentRecord = enrollments[0];
  const latestEnrollment = latestEnrollmentRecord && isEnrollmentCompleted(latestEnrollmentRecord, payments)
    ? { ...latestEnrollmentRecord, status: 'Enrolled' }
    : latestEnrollmentRecord;
  const latestPayment = payments[0];
  const pendingDocsCount = documentRequests.filter((d) => d.status !== 'Released' && d.status !== 'Rejected').length;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${currentUser?.name || 'Student'}!`}
        subtitle={`Student No: ${currentUser?.studentNumber || '2026-00001'} | ${currentUser?.program || 'BS Information Technology'} (${currentUser?.yearLevel || '2nd Year'})`}
        actions={
          <Link to="/student/enrollment" className="btn btn-pnc-primary d-flex align-items-center gap-2">
            <i className="bi bi-journal-plus"></i>
            <span>Enroll Now</span>
          </Link>
        }
      />

      {/* Summary Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Enrollment Status"
            value={latestEnrollment ? latestEnrollment.status : 'Not Enrolled'}
            subtitle={latestEnrollment ? latestEnrollment.term : 'Current Term'}
            icon="bi-journal-check"
            color="primary"
            onClick={() => navigate('/student/enrollment')}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Payment Status"
            value={latestPayment ? latestPayment.status : 'No Dues'}
            subtitle={latestPayment ? `₱${latestPayment.amount.toLocaleString()}` : 'Tuition & Fees'}
            icon="bi-credit-card-2-front"
            color="secondary"
            onClick={() => navigate('/student/payments')}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Clearance Status"
            value={clearance ? clearance.overallStatus : 'Clearance Pending'}
            subtitle="All Offices Signoff"
            icon="bi-clipboard-check"
            color="info"
            onClick={() => navigate('/student/clearance')}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Pending Documents"
            value={pendingDocsCount}
            subtitle="Requests in progress"
            icon="bi-file-earmark-text"
            color="warning"
            onClick={() => navigate('/student/documents')}
          />
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="pnc-card mb-4">
        <div className="pnc-card-header">
          <span>
            <i className="bi bi-lightning-charge-fill text-warning me-2"></i>Quick Actions
          </span>
        </div>
        <div className="pnc-card-body">
          <div className="row g-3">
            <div className="col-6 col-md-4 col-lg-2">
              <Link to="/student/enrollment" className="btn btn-outline-success w-100 py-3 text-center d-flex flex-column align-items-center gap-2">
                <i className="bi bi-journal-plus fs-3"></i>
                <span className="small fw-semibold">Enroll Now</span>
              </Link>
            </div>
            <div className="col-6 col-md-4 col-lg-2">
              <Link to="/student/schedule" className="btn btn-outline-primary w-100 py-3 text-center d-flex flex-column align-items-center gap-2">
                <i className="bi bi-calendar-week fs-3"></i>
                <span className="small fw-semibold">View Schedule</span>
              </Link>
            </div>
            <div className="col-6 col-md-4 col-lg-2">
              <Link to="/student/payments" className="btn btn-outline-secondary w-100 py-3 text-center d-flex flex-column align-items-center gap-2">
                <i className="bi bi-cash-coin fs-3"></i>
                <span className="small fw-semibold">View Payments</span>
              </Link>
            </div>
            <div className="col-6 col-md-4 col-lg-2">
              <Link to="/student/clearance" className="btn btn-outline-info w-100 py-3 text-center d-flex flex-column align-items-center gap-2">
                <i className="bi bi-clipboard-check fs-3"></i>
                <span className="small fw-semibold">Check Clearance</span>
              </Link>
            </div>
            <div className="col-6 col-md-4 col-lg-2">
              <Link to="/student/grades" className="btn btn-outline-dark w-100 py-3 text-center d-flex flex-column align-items-center gap-2">
                <i className="bi bi-mortarboard fs-3"></i>
                <span className="small fw-semibold">View Grades</span>
              </Link>
            </div>
            <div className="col-6 col-md-4 col-lg-2">
              <Link to="/student/documents" className="btn btn-outline-warning w-100 py-3 text-center d-flex flex-column align-items-center gap-2">
                <i className="bi bi-file-earmark-arrow-up fs-3"></i>
                <span className="small fw-semibold">Request Document</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="row g-4">
        {/* Left Column: Current Enrollment & Clearance Overview */}
        <div className="col-lg-7">
          {/* Enrolled Subjects Snapshot */}
          <div className="pnc-card">
            <div className="pnc-card-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-book-half text-success"></i>
                <span>Current Term Enrollment</span>
              </div>
              {latestEnrollment && <StatusBadge status={latestEnrollment.status} />}
            </div>
            <div className="pnc-card-body p-0">
              {latestEnrollment ? (
                <div className="table-responsive">
                  <table className="table table-hover table-pnc mb-0">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Section</th>
                        <th>Units</th>
                        <th>Schedule</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestEnrollment.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="fw-semibold text-dark">{item.subjectCode}</div>
                            <div className="small text-muted">{item.subjectTitle}</div>
                          </td>
                          <td><span className="badge bg-light text-dark border">{item.section}</span></td>
                          <td>{item.units}</td>
                          <td className="small text-muted">{item.schedule}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No active enrollment record"
                  message="You have not submitted an enrollment for this academic term."
                  action={<Link to="/student/enrollment" className="btn btn-sm btn-pnc-primary">Enroll Now</Link>}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Clearance Status Progress & Document Tracker */}
        <div className="col-lg-5">
          {/* Clearance Progress Tracker Card */}
          <div className="pnc-card mb-4">
            <div className="pnc-card-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-shield-check text-success"></i>
                <span>Clearance Signoff Status</span>
              </div>
              {clearance && <StatusBadge status={clearance.overallStatus} />}
            </div>
            <div className="pnc-card-body">
              {clearance ? (
                <div className="d-flex flex-column gap-3">
                  {clearance.signoffs.map((s, idx) => (
                    <div key={idx} className="p-3 bg-light rounded border">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold small text-dark">{s.officeName}</span>
                        <StatusBadge status={s.status} size="sm" />
                      </div>
                      <div className="small text-muted">
                        {s.status === 'Signed' ? (
                          <div>
                            <i className="bi bi-check2 me-1 text-success"></i>
                            Signed by <strong>{s.signedBy}</strong> on {s.signedDate}
                          </div>
                        ) : (
                          <div>
                            <i className="bi bi-hourglass-split me-1 text-warning"></i>
                            Pending official office review
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No Clearance Record" message="Clearance requirements for this term are not yet generated." />
              )}
            </div>
          </div>

          {/* Recent Document Requests */}
          <div className="pnc-card">
            <div className="pnc-card-header">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-files text-success"></i>
                <span>Recent Document Requests</span>
              </div>
              <Link to="/student/documents" className="btn btn-sm btn-link text-decoration-none text-success p-0">
                View All
              </Link>
            </div>
            <div className="pnc-card-body p-0">
              {documentRequests.length > 0 ? (
                <div className="list-group list-group-flush">
                  {documentRequests.slice(0, 3).map((doc) => (
                    <div key={doc.id} className="list-group-item p-3">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <div className="fw-semibold small text-dark">{doc.documentType}</div>
                        <StatusBadge status={doc.status} size="sm" />
                      </div>
                      <div className="small text-muted mb-1">
                        Tracking: <span className="badge bg-secondary font-monospace">{doc.trackingNumber}</span>
                      </div>
                      <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                        Requested: {doc.requestDate}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No Document Requests" message="You have not submitted any document requests." />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
