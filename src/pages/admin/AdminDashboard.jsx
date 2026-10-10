import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DashboardCard } from '../../components/common/DashboardCard';
import { LoadingState } from '../../components/feedback/LoadingState';
import { userService } from '../../services/userService';
import { auditService } from '../../services/auditService';
import { systemSettingsService } from '../../services/systemSettingsService';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userList, logs, sysSettings] = await Promise.all([
          userService.getUsers(),
          auditService.getLogs(),
          systemSettingsService.getSettings()
        ]);
        setUsers(userList);
        setAuditLogs(logs);
        setSettings(sysSettings);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading Administrator Control Dashboard..." />;
  }

  const studentsCount = users.filter((u) => u.role === 'Student').length;
  const registrarCount = users.filter((u) => u.role === 'Registrar').length;
  const cashierCount = users.filter((u) => u.role === 'Cashier').length;
  const deptCount = users.filter((u) => u.role === 'Department Staff').length;

  return (
    <div>
      <PageHeader
        title="System Administration & Security"
        subtitle="Manage user accounts, monitor system-wide audit trails, and configure academic parameters."
      />

      {/* System Status Banner */}
      <div className="pnc-card mb-4 bg-light border-start border-4 border-success">
        <div className="pnc-card-body py-3">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
            <div>
              <span className="fw-bold text-dark">System Health Status:</span>{' '}
              <span className="badge bg-success me-2"><i className="bi bi-shield-fill-check me-1"></i>Optimal & Secure</span>
              <span className="small text-muted">Term: {settings.academicYear} ({settings.semester}) &bull; Enrollment: <strong>{settings.enrollmentStatus}</strong></span>
            </div>
            <div>
              <Link to="/admin/settings" className="btn btn-sm btn-outline-success">
                <i className="bi bi-sliders me-1"></i>System Settings
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* User Metrics Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Total Registered Users"
            value={users.length}
            subtitle="Active system accounts"
            icon="bi-people-fill"
            color="primary"
            onClick={() => navigate('/admin/users')}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Students"
            value={studentsCount}
            subtitle="Portal accounts"
            icon="bi-mortarboard-fill"
            color="secondary"
            onClick={() => navigate('/admin/users')}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Administrative Staff"
            value={registrarCount + cashierCount + deptCount}
            subtitle="Registrar, Cashier, Dept"
            icon="bi-person-badge-fill"
            color="info"
            onClick={() => navigate('/admin/users')}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Audit Trail Events"
            value={auditLogs.length}
            subtitle="Logged security events"
            icon="bi-shield-check"
            color="purple"
            onClick={() => navigate('/admin/audit-logs')}
          />
        </div>
      </div>

      {/* Recent Audit Logs & Activity Preview */}
      <div className="pnc-card">
        <div className="pnc-card-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-activity text-success"></i>
            <span>Live System Activity & Audit Logs</span>
          </div>
          <Link to="/admin/audit-logs" className="btn btn-sm btn-link text-decoration-none text-success p-0">
            View All Logs
          </Link>
        </div>
        <div className="pnc-card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-pnc align-middle mb-0">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>User / Actor</th>
                  <th>Action Performed</th>
                  <th>Module</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice(0, 5).map((log) => (
                  <tr key={log.id}>
                    <td className="font-monospace small fw-semibold">{log.id}</td>
                    <td className="fw-semibold text-dark">{log.user}</td>
                    <td>
                      <span className="badge bg-light text-dark border">{log.action}</span>
                    </td>
                    <td><span className="small text-muted">{log.module}</span></td>
                    <td className="small text-muted text-truncate" style={{ maxWidth: '300px' }}>
                      {log.details}
                    </td>
                    <td className="small text-muted font-monospace">{log.dateTime}</td>
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
