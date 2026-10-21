import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DashboardCard } from '../../components/common/DashboardCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/feedback/LoadingState';
import { enrollmentService } from '../../services/enrollmentService';
import { gradeService } from '../../services/gradeService';
import { clearanceService } from '../../services/clearanceService';

export const DepartmentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [offerings, setOfferings] = useState([]);
  const [grades, setGrades] = useState([]);
  const [clearances, setClearances] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [offList, grdList, clrList] = await Promise.all([
          enrollmentService.getOfferings(),
          gradeService.getGrades(),
          clearanceService.getClearances()
        ]);
        setOfferings(offList);
        setGrades(grdList);
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
    return <LoadingState message="Loading Department Dashboard..." />;
  }

  const totalSections = offerings.length;
  const totalEncodedGrades = grades.length;
  const pendingDeptClearance = clearances.filter((c) => {
    const dept = c.signoffs.find((s) => s.officeName.toLowerCase().includes('department'));
    return dept && dept.status === 'Pending';
  });

  return (
    <div>
      <PageHeader
        title="Department Dashboard"
        subtitle="Manage subjects, grades, and clearances."
      />

      {/* Dashboard Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-4">
          <DashboardCard
            title="Active Subjects"
            value={totalSections}
            subtitle="Open and full sections"
            icon="bi-book"
            color="primary"
            onClick={() => navigate('/department/subjects')}
          />
        </div>
        <div className="col-sm-6 col-xl-4">
          <DashboardCard
            title="Encoded Grades"
            value={totalEncodedGrades}
            subtitle="Submitted to Registrar"
            icon="bi-keyboard"
            color="warning"
            onClick={() => navigate('/department/grades')}
          />
        </div>
        <div className="col-sm-6 col-xl-4">
          <DashboardCard
            title="Department Clearance"
            value={pendingDeptClearance.length}
            subtitle="Lab review"
            icon="bi-clipboard-check"
            color="info"
            onClick={() => navigate('/department/clearance')}
          />
        </div>
      </div>

      {/* Quick Subject Sections Table */}
      <div className="pnc-card">
        <div className="pnc-card-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-journal-bookmark-fill text-success"></i>
            <span>Department Course Sections</span>
          </div>
          <Link to="/department/subjects" className="btn btn-sm btn-link text-decoration-none text-success p-0">
            Manage Sections
          </Link>
        </div>
        <div className="pnc-card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-pnc align-middle mb-0">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Subject Title</th>
                  <th>Section</th>
                  <th>Instructor</th>
                  <th>Schedule</th>
                  <th>Slots</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {offerings.slice(0, 5).map((o) => (
                  <tr key={o.id}>
                    <td className="fw-bold text-dark">{o.subjectCode}</td>
                    <td>{o.subjectTitle}</td>
                    <td><span className="badge bg-light text-dark border">{o.section}</span></td>
                    <td className="small">{o.instructor}</td>
                    <td className="small text-muted">{o.schedule}</td>
                    <td className="small">{o.availableSlots} / {o.totalSlots}</td>
                    <td><StatusBadge status={o.status} /></td>
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
