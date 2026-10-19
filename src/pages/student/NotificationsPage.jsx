import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/feedback/EmptyState';
import { PaginationControls } from '../../components/tables/PaginationControls';
import { LoadingState } from '../../components/feedback/LoadingState';
import { notificationService } from '../../services/notificationService';
import { pageParams, readPage } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';

export const NotificationsPage = () => {
  const { unreadCount, totalCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState('All'); // 'All' | 'Unread'
  const [pageNotifications, setPageNotifications] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });
  const [loading, setLoading] = useState(true);

  const loadPage = async (page = 1, currentFilter = filter) => {
    setLoading(true);
    try {
      const filters = currentFilter === 'Unread'
        ? { filterField: 'isRead', filterValue: '0' }
        : {};
      const result = readPage(await notificationService.getUserNotifications(pageParams(page, filters)));
      setPageNotifications(result.data);
      setPagination(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(1, filter);
  }, [filter]);

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
    await loadPage(pagination.currentPage);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    await loadPage(1);
  };

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
          <button className="btn btn-sm btn-outline-success" onClick={handleMarkAllAsRead}>
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
          All ({totalCount})
        </button>
        <button
          className={`btn btn-sm ${filter === 'Unread' ? 'btn-success' : 'btn-light border'}`}
          onClick={() => setFilter('Unread')}
        >
          Unread ({unreadCount})
        </button>
      </div>

      <div className="pnc-card">
        <div className="pnc-card-body p-0">
          {loading ? (
            <LoadingState message="Loading notifications..." />
          ) : pageNotifications.length === 0 ? (
            <EmptyState
              icon="bi-bell-slash"
              title="No notifications"
              message={filter === 'Unread' ? 'You have caught up with all your notifications!' : 'No notifications found.'}
            />
          ) : (
            <div className="list-group list-group-flush">
              {pageNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`list-group-item p-3 d-flex align-items-start gap-3 ${!n.isRead ? 'bg-light' : ''}`}
                  onClick={() => handleMarkAsRead(n.id)}
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
          {!loading && (
            <div className="px-3 pb-3">
              <PaginationControls {...pagination} onPageChange={(page) => loadPage(page)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
