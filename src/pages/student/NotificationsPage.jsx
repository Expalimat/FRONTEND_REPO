import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/feedback/EmptyState';
import { useNotifications } from '../../context/NotificationContext';

export const NotificationsPage = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState('All'); // 'All' | 'Unread'

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'Unread') return !n.isRead;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Notifications & Activity Alerts"
        subtitle="Keep track of enrollment approvals, grade releases, payments, and clearance updates."
        breadcrumbs={[
          { label: 'Dashboard', to: '/student/dashboard' },
          { label: 'Notifications', to: '/student/notifications' }
        ]}
        actions={
          <button className="btn btn-sm btn-outline-success" onClick={markAllAsRead}>
            <i className="bi bi-check2-all me-1"></i>Mark All as Read
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm ${filter === 'All' ? 'btn-success' : 'btn-light border'}`}
          onClick={() => setFilter('All')}
        >
          All ({notifications.length})
        </button>
        <button
          className={`btn btn-sm ${filter === 'Unread' ? 'btn-success' : 'btn-light border'}`}
          onClick={() => setFilter('Unread')}
        >
          Unread ({notifications.filter((n) => !n.isRead).length})
        </button>
      </div>

      <div className="pnc-card">
        <div className="pnc-card-body p-0">
          {filteredNotifications.length === 0 ? (
            <EmptyState
              icon="bi-bell-slash"
              title="No notifications"
              message={filter === 'Unread' ? 'You have caught up with all your notifications!' : 'No notifications found.'}
            />
          ) : (
            <div className="list-group list-group-flush">
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`list-group-item p-3 d-flex align-items-start gap-3 ${!n.isRead ? 'bg-light' : ''}`}
                  onClick={() => markAsRead(n.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div
                    className={`rounded-circle p-2 d-flex align-items-center justify-content-center ${
                      n.isRead ? 'bg-secondary-subtle text-secondary' : 'bg-success text-white'
                    }`}
                    style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}
                  >
                    <i className="bi bi-bell-fill"></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <h6 className="fw-bold text-dark mb-0 fs-6">{n.title}</h6>
                      <div className="d-flex align-items-center gap-2">
                        {n.relatedModule && (
                          <span className="badge bg-secondary-subtle text-secondary">
                            {n.relatedModule}
                          </span>
                        )}
                        {!n.isRead && <span className="badge bg-success">New</span>}
                      </div>
                    </div>
                    <p className="text-muted small mb-1">{n.message}</p>
                    <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                      <i className="bi bi-clock me-1"></i>
                      {n.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
