import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/feedback/Modal';
import { enrollmentService } from '../../services/enrollmentService';
import { pageParams, readPage } from '../../services/api';

export const FeeAssessmentPage = () => {
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [selectedEnr, setSelectedEnr] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const loadEnrollments = async (page = 1, nextFilters = filters) => {
    setLoading(true);
    try {
      const result = readPage(await enrollmentService.getEnrollments(pageParams(page, nextFilters)));
      setEnrollments(result.data);
      setPagination(result);
      setFilters(nextFilters);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, []);

  const columns = [
    {
      header: 'Enrollment Ref',
      accessor: 'id',
      render: (row) => <span className="font-monospace fw-bold">{row.id}</span>
    },
    {
      header: 'Student Name & ID',
      accessor: 'studentName',
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{row.studentName}</div>
          <div className="small text-muted font-monospace">{row.studentNumber}</div>
        </div>
      )
    },
    {
      header: 'Program',
      accessor: 'program',
      render: (row) => <span className="small text-dark">{row.program}</span>
    },
    {
      header: 'Units',
      accessor: 'totalUnits',
      render: (row) => <span className="fw-bold">{row.totalUnits} Units</span>
    },
    {
      header: 'Assessed Total',
      accessor: 'fees',
      render: (row) => (
        <span className="fw-bold text-success font-monospace fs-6">
          ₱{row.fees?.total?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Action',
      render: (row) => (
        <button
          className="btn btn-xs btn-outline-primary py-1 px-2"
          onClick={() => {
            setSelectedEnr(row);
            setShowBreakdown(true);
          }}
        >
          <i className="bi bi-receipt-cutoff me-1"></i>Assessment Slip
        </button>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Student Semestral Fee Assessment"
        subtitle="Inspect official tuition, miscellaneous fees, and laboratory charges assessed for enrolled courses."
        breadcrumbs={[
          { label: 'Dashboard', to: '/cashier/dashboard' },
          { label: 'Fee Assessment', to: '/cashier/fees' }
        ]}
      />

      <div className="pnc-card">
        <div className="pnc-card-header">
          <span>Assessment Master Directory</span>
        </div>
        <div className="pnc-card-body">
          <DataTable
            columns={columns}
            data={enrollments}
            searchPlaceholder="Search student, enrollment ID or program..."
            loading={loading}
            serverPagination={{ ...pagination, onPageChange: loadEnrollments }}
          />
        </div>
      </div>

      {/* Assessment Breakdown Modal */}
      {selectedEnr && (
        <Modal
          isOpen={showBreakdown}
          onClose={() => setShowBreakdown(false)}
          title={`Assessment Form: ${selectedEnr.id} (${selectedEnr.studentName})`}
          size="md"
          footer={
            <div className="d-flex justify-content-between w-100">
              <button className="btn btn-sm btn-outline-secondary" onClick={() => window.print()}>
                <i className="bi bi-printer me-1"></i>Print Assessment
              </button>
              <button className="btn btn-sm btn-light" onClick={() => setShowBreakdown(false)}>
                Close
              </button>
            </div>
          }
        >
          <div className="p-2">
            <div className="bg-light p-3 rounded border mb-3 small">
              <div className="row g-2">
                <div className="col-6"><strong>Student No:</strong> {selectedEnr.studentNumber}</div>
                <div className="col-6"><strong>Term:</strong> {selectedEnr.term}</div>
                <div className="col-6"><strong>Program:</strong> {selectedEnr.program}</div>
                <div className="col-6"><strong>Enrolled Units:</strong> {selectedEnr.totalUnits} Units</div>
              </div>
            </div>

            <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Itemized Fee Assessment Breakdown</h6>
            <div className="d-flex flex-column gap-2 small">
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Tuition Fee ({selectedEnr.totalUnits} units @ ₱200)</span>
                <span className="fw-semibold font-monospace">₱{selectedEnr.fees?.tuition?.toLocaleString() || '0.00'}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Miscellaneous & Registration Fees</span>
                <span className="fw-semibold font-monospace">₱{selectedEnr.fees?.miscellaneous?.toLocaleString() || '0.00'}</span>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Laboratory & Computer Usage Fee</span>
                <span className="fw-semibold font-monospace">₱{selectedEnr.fees?.laboratory?.toLocaleString() || '0.00'}</span>
              </div>
              {selectedEnr.fees?.library && (
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-muted">Library Fee</span>
                  <span className="fw-semibold font-monospace">₱{selectedEnr.fees.library.toLocaleString()}</span>
                </div>
              )}
              <div className="d-flex justify-content-between pt-3 fs-5 fw-bold text-success border-top">
                <span>Total Assessment Due:</span>
                <span className="font-monospace">₱{selectedEnr.fees?.total?.toLocaleString() || '0.00'}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
