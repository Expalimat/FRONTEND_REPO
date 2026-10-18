import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { Modal } from '../../components/feedback/Modal';
import { auditService } from '../../services/auditService';
import { pageParams, readPage } from '../../services/api';

export const AuditLogsPage = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogs = async (page = 1, nextFilters = filters) => {
    setLoading(true);
    try {
      const result = readPage(await auditService.getLogs(pageParams(page, nextFilters)));
      setLogs(result.data);
      setPagination(result);
      setFilters(nextFilters);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const columns = [
    {
      header: 'Log ID',
      accessor: 'id',
      render: (row) => <span className="font-monospace fw-bold text-dark">{row.id}</span>
    },
    {
      header: 'User / Actor',
      accessor: 'user',
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{row.user}</div>
        </div>
      )
    },
    {
      header: 'Action Performed',
      accessor: 'action',
      render: (row) => (
        <span className="badge bg-light text-dark border">
          <i className="bi bi-activity me-1 text-success"></i>
          {row.action}
        </span>
      )
    },
    {
      header: 'System Module',
      accessor: 'module',
      render: (row) => (
        <span className="badge bg-secondary-subtle text-secondary">
          {row.module}
        </span>
      )
    },
    {
      header: 'Timestamp',
      accessor: 'dateTime',
      render: (row) => <span className="small text-muted font-monospace">{row.dateTime}</span>
    },
    {
      header: 'Event Details',
      accessor: 'details',
      render: (row) => (
        <div className="d-flex align-items-center justify-content-between gap-2">
          <span className="small text-muted text-truncate" style={{ maxWidth: '240px' }}>
            {row.details}
          </span>
          <button
            className="btn btn-xs btn-outline-secondary py-0 px-1"
            onClick={() => setSelectedLog(row)}
            title="View Full Payload"
          >
            <i className="bi bi-info-circle"></i>
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="System Security & Audit Trails"
        subtitle="Append-only immutable audit trail recording all administrative, financial, academic, and user operations."
        breadcrumbs={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Audit Logs', to: '/admin/audit-logs' }
        ]}
        actions={
          <button className="btn btn-sm btn-outline-secondary" onClick={() => window.print()}>
            <i className="bi bi-printer me-1"></i>Export Audit Report
          </button>
        }
      />

      {/* Security Immutability Notice */}
      <div className="alert alert-secondary small d-flex align-items-center gap-2 mb-4" role="alert">
        <i className="bi bi-shield-lock-fill text-dark fs-5"></i>
        <div>
          <strong>Compliance Standard:</strong> In accordance with university data governance guidelines, audit logs are append-only. Modification and deletion capabilities are strictly disabled to ensure full forensic accountability.
        </div>
      </div>

      <div className="pnc-card">
        <div className="pnc-card-header">
          <span>Immutable Audit Log Trail</span>
        </div>
        <div className="pnc-card-body">
          <DataTable
            columns={columns}
            data={logs}
            filterField="module"
            filterOptions={[
              { label: 'Enrollment', value: 'Enrollment' },
              { label: 'Payments', value: 'Payments' },
              { label: 'Grades', value: 'Grades' },
              { label: 'Clearance', value: 'Clearance' },
              { label: 'Document Requests', value: 'Document Requests' },
              { label: 'Users', value: 'Users' },
              { label: 'System Settings', value: 'System Settings' }
            ]}
            filterPlaceholder="Filter Module"
            searchPlaceholder="Search user, action, log ID or details..."
            loading={loading}
            serverPagination={{ ...pagination, onPageChange: loadLogs }}
          />
        </div>
      </div>

      {/* Full Log Details Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Log Record: ${selectedLog.id}`}
          size="md"
        >
          <div className="small">
            <div className="p-3 bg-light rounded border mb-3">
              <div className="mb-2"><strong>Timestamp:</strong> {selectedLog.dateTime}</div>
              <div className="mb-2"><strong>Actor / User:</strong> {selectedLog.user}</div>
              <div className="mb-2"><strong>Action:</strong> <span className="badge bg-success">{selectedLog.action}</span></div>
              <div className="mb-2"><strong>Module:</strong> {selectedLog.module}</div>
              <div><strong>Security Status:</strong> <span className="text-success"><i className="bi bi-patch-check-fill me-1"></i>Verified System Event</span></div>
            </div>

            <h6 className="fw-bold text-dark mb-1">Audit Payload Description:</h6>
            <div className="p-3 bg-white rounded border font-monospace text-dark mb-0">
              {selectedLog.details}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
