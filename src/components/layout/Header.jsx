import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { DEMO_ACCOUNTS } from '../../data/demoAccounts';

export const Header = ({ onToggleSidebar }) => {
  const { currentUser, logout, switchMockUser } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRoleSwitch = async (user) => {
    setShowRoleSwitcher(false);
    try {
      await switchMockUser(user);
    } catch (err) {
      alert(err.message || 'Could not switch role.');
      return;
    }
    const rolePaths = {
      Student: '/student/dashboard',
      Registrar: '/registrar/dashboard',
      Cashier: '/cashier/dashboard',
      'Department Staff': '/department/dashboard',
      Administrator: '/admin/dashboard'
    };
    navigate(rolePaths[user.role] || '/login');
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="btn btn-light d-lg-none p-1 px-2 border"
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <i className="bi bi-list fs-5"></i>
        </button>
        <div className="d-none d-md-flex align-items-center text-muted small">
          <i className="bi bi-mortarboard-fill text-success me-2 fs-6"></i>
          <span className="fw-medium">Pamantasan ng Cabuyao</span>
          <span className="mx-2">•</span>
          <span className="badge bg-success-subtle text-success border border-success-subtle">
            A.Y. 2025-2026 (2nd Sem)
          </span>
        </div>
      </div>

      <div className="header-right">
        {/* Role Quick-Switch Demo Utility */}
        <div className="position-relative">
          <button
            className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            title="Quickly preview another user role"
          >
            <i className="bi bi-arrow-left-right"></i>
            <span className="d-none d-sm-inline">Switch Role Demo</span>
          </button>

          {showRoleSwitcher && (
            <div
              className="position-absolute end-0 mt-2 p-2 bg-white shadow-lg rounded border"
              style={{ width: '240px', zIndex: 1050 }}
            >
              <div className="small fw-bold text-muted px-2 py-1 border-bottom mb-1">
                Switch Active Role:
              </div>
              {DEMO_ACCOUNTS.map((u) => (
                <button
                  key={u.id}
                  className={`btn btn-sm w-100 text-start d-flex align-items-center gap-2 mb-1 ${
                    currentUser?.id === u.id ? 'btn-success text-white' : 'btn-light'
                  }`}
                  onClick={() => handleRoleSwitch(u)}
                >
                  <span className="badge bg-secondary">{u.role.substring(0, 3)}</span>
                  <div className="small text-truncate">
                    <div className="fw-semibold">{u.role}</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {u.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell Dropdown */}
        <div className="position-relative">
          <button
            className="btn btn-light position-relative p-2 rounded-circle border"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            aria-label="Notifications"
          >
            <i className="bi bi-bell text-dark"></i>
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div
              className="position-absolute end-0 mt-2 bg-white shadow-lg rounded border notifications-dropdown"
              style={{ zIndex: 1050 }}
            >
              <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
                <h6 className="fw-bold mb-0 fs-6">Notifications</h6>
                {unreadCount > 0 && (
                  <button
                    className="btn btn-link btn-sm p-0 text-decoration-none text-success small"
                    onClick={markAllAsRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="list-group list-group-flush">
                {notifications.length === 0 ? (
                  <div className="p-3 text-center text-muted small">No notifications yet.</div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className={`list-group-item list-group-item-action p-3 ${
                        !n.isRead ? 'bg-light' : ''
                      }`}
                      onClick={() => markAsRead(n.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <div className="fw-semibold small text-dark mb-1">{n.title}</div>
                        {!n.isRead && (
                          <span className="badge bg-primary" style={{ fontSize: '0.6rem' }}>
                            New
                          </span>
                        )}
                      </div>
                      <p className="small text-muted mb-1" style={{ fontSize: '0.78rem' }}>
                        {n.message}
                      </p>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                        <i className="bi bi-clock me-1"></i>
                        {n.date}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-top text-center bg-light">
                <Link
                  to={
                    currentUser?.role === 'Student'
                      ? '/student/notifications'
                      : `/${currentUser?.role?.toLowerCase().replace(/\s+/g, '')}/dashboard`
                  }
                  className="small text-decoration-none fw-semibold text-success"
                  onClick={() => setShowNotifMenu(false)}
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Account Menu */}
        <div className="position-relative">
          <button
            className="btn btn-light d-flex align-items-center gap-2 p-1 pe-2 rounded-pill border"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div
              className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center fw-bold"
              style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}
            >
              {currentUser?.avatar || 'U'}
            </div>
            <span className="small fw-semibold text-dark d-none d-md-inline text-truncate" style={{ maxWidth: '120px' }}>
              {currentUser?.name || 'User'}
            </span>
            <i className="bi bi-chevron-down small text-muted"></i>
          </button>

          {showUserMenu && (
            <div
              className="position-absolute end-0 mt-2 bg-white shadow-lg rounded border p-2"
              style={{ width: '200px', zIndex: 1050 }}
            >
              <div className="px-2 py-1 mb-1 border-bottom">
                <div className="fw-semibold small text-truncate">{currentUser?.name}</div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                  {currentUser?.role}
                </div>
              </div>
              {currentUser?.role === 'Student' && (
                <Link
                  to="/student/profile"
                  className="dropdown-item rounded p-2 small text-dark"
                  onClick={() => setShowUserMenu(false)}
                >
                  <i className="bi bi-person me-2"></i>My Profile
                </Link>
              )}
              <button
                className="dropdown-item rounded p-2 small text-danger"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right me-2"></i>Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
