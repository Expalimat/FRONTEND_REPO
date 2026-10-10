import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    const role = currentUser?.role;
    switch (role) {
      case 'Student':
        return [
          { to: '/student/dashboard', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
          { to: '/student/enrollment', icon: 'bi-journal-plus', label: 'Enrollment' },
          { to: '/student/schedule', icon: 'bi-calendar-week', label: 'My Schedule' },
          { to: '/student/payments', icon: 'bi-credit-card-2-front', label: 'Payments' },
          { to: '/student/clearance', icon: 'bi-clipboard-check', label: 'Clearance' },
          { to: '/student/grades', icon: 'bi-mortarboard', label: 'Grades' },
          { to: '/student/documents', icon: 'bi-file-earmark-text', label: 'Document Requests' },
          { to: '/student/notifications', icon: 'bi-bell', label: 'Notifications', badge: unreadCount },
          { to: '/student/profile', icon: 'bi-person-circle', label: 'Profile' }
        ];

      case 'Registrar':
        return [
          { to: '/registrar/dashboard', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
          { to: '/registrar/enrollments', icon: 'bi-journal-check', label: 'Enrollment Requests' },
          { to: '/registrar/students', icon: 'bi-people', label: 'Student Records' },
          { to: '/registrar/grades', icon: 'bi-patch-check', label: 'Grade Validation' },
          { to: '/registrar/clearance', icon: 'bi-clipboard-check', label: 'Clearance' },
          { to: '/registrar/documents', icon: 'bi-file-earmark-arrow-up', label: 'Document Requests' }
        ];

      case 'Cashier':
        return [
          { to: '/cashier/dashboard', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
          { to: '/cashier/payments', icon: 'bi-cash-coin', label: 'Payment Verification' },
          { to: '/cashier/fees', icon: 'bi-receipt-cutoff', label: 'Fee Assessment' },
          { to: '/cashier/clearance', icon: 'bi-clipboard-check', label: 'Clearance' }
        ];

      case 'Department Staff':
        return [
          { to: '/department/dashboard', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
          { to: '/department/subjects', icon: 'bi-book', label: 'Subject Offerings' },
          { to: '/department/grades', icon: 'bi-keyboard', label: 'Grade Encoding' },
          { to: '/department/clearance', icon: 'bi-clipboard-check', label: 'Clearance' }
        ];

      case 'Administrator':
        return [
          { to: '/admin/dashboard', icon: 'bi-grid-1x2-fill', label: 'Dashboard' },
          { to: '/admin/users', icon: 'bi-person-gear', label: 'User Management' },
          { to: '/admin/audit-logs', icon: 'bi-shield-check', label: 'Audit Logs' },
          { to: '/admin/settings', icon: 'bi-sliders', label: 'System Settings' }
        ];

      default:
        return [];
    }
  };

  const links = getNavLinks();

  return (
    <>
      {isOpen && <div className="sidebar-backdrop d-lg-none" onClick={onClose}></div>}

      <aside className={`app-sidebar ${isOpen ? 'show' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">PnC</div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">PnC-OESS</span>
            <span className="sidebar-brand-subtitle">Student Services Portal</span>
          </div>
        </div>

        <div className="sidebar-nav">
          <div className="nav-section-title">{currentUser?.role || 'Navigation'} Menu</div>
          {links.map((link, idx) => (
            <NavLink
              key={idx}
              to={link.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <i className={`bi ${link.icon}`}></i>
              <span>{link.label}</span>
              {link.badge > 0 && (
                <span className="badge bg-danger rounded-pill ms-auto small">{link.badge}</span>
              )}
            </NavLink>
          ))}
        </div>

        {/* User Footer Profile & Quick Logout */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{currentUser?.avatar || 'U'}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{currentUser?.name || 'User'}</div>
            <div className="sidebar-user-role">{currentUser?.role}</div>
          </div>
          <button
            className="btn btn-sm text-white-50 hover-white p-1"
            onClick={handleLogout}
            title="Logout"
          >
            <i className="bi bi-box-arrow-right fs-5"></i>
          </button>
        </div>
      </aside>
    </>
  );
};
