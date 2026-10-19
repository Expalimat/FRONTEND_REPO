import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ConfirmationModal } from '../../components/feedback/ConfirmationModal';
import { gradeService } from '../../services/gradeService';
import { pageParams, readPage } from '../../services/api';

export const GradeValidationPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadGrades = async (page = 1, filters = {}) => {
    setLoading(true);
    try {
      const result = readPage(await gradeService.getGrades(pageParams(page, filters)));
      setGrades(result.data);
      setPagination(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrades();
  }, []);

  const handleValidate = async () => {
    if (!selectedGrade) return;
    setProcessing(true);
    try {
      await gradeService.validateGrade(selectedGrade.id, currentUser?.name || 'Maria Santos (Registrar)');
      setToastMessage(`Grade for ${selectedGrade.studentName} in ${selectedGrade.subjectCode} validated successfully.`);
      setShowValidateModal(false);
      setSelectedGrade(null);
      loadGrades();
    } catch (err) {
      alert('Failed to validate grade.');
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      header: 'Student',
      accessor: 'studentName',
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{row.studentName}</div>
          <div className="small text-muted font-monospace">{row.studentNumber}</div>
        </div>
      )
    },
    {
      header: 'Subject Code & Title',
      accessor: 'subjectCode',
      render: (row) => (
        <div>
          <span className="badge bg-light text-dark border me-1">{row.subjectCode}</span>
          <span className="small text-muted">{row.subjectTitle}</span>
        </div>
      )
    },
    {
      header: 'Units',
      accessor: 'units',
      render: (row) => <span className="fw-semibold">{row.units}</span>
    },
    {
      header: 'Encoded Grade',
      accessor: 'grade',
      render: (row) => (
        <span className="badge bg-success-subtle text-success fs-6 fw-bold px-2 py-1">
          {row.grade}
        </span>
      )
    },
    {
      header: 'Faculty (Encoded By)',
      accessor: 'encodedBy',
      render: (row) => (
        <div className="small">
          <div className="text-dark"><i className="bi bi-person-fill text-muted me-1"></i>{row.encodedBy}</div>
          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{row.dateEncoded}</div>
        </div>
      )
    },
    {
      header: 'Validation Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Action',
      render: (row) => (
        <div>
          {row.status === 'Encoded' ? (
            <button
              className="btn btn-sm btn-success py-1 px-2 d-flex align-items-center gap-1"
              onClick={() => {
                setSelectedGrade(row);
                setShowValidateModal(true);
              }}
            >
              <i className="bi bi-shield-check"></i>Validate
            </button>
          ) : (
            <div className="small text-muted">
              <i className="bi bi-check-all text-success me-1"></i>
              Validated by {row.validatedBy || 'Registrar'}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Grade Validation Queue (Dual-Control)"
        subtitle="Review faculty encoded grade submissions and authorize official posting to student records."
        breadcrumbs={[
          { label: 'Dashboard', to: '/registrar/dashboard' },
          { label: 'Grade Validation', to: '/registrar/grades' }
        ]}
      />

      {toastMessage && (
        <div className="alert alert-success alert-dismissible fade show small mb-3" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {toastMessage}
          <button type="button" className="btn-close" onClick={() => setToastMessage('')}></button>
        </div>
      )}

      <div className="pnc-card">
        <div className="pnc-card-header">
          <span>Grade Submission Queue</span>
        </div>
        <div className="pnc-card-body">
          <DataTable
            columns={columns}
            data={grades}
            serverPagination={{ ...pagination, onPageChange: loadGrades }}
            filterField="status"
            filterOptions={[
              { label: 'Encoded (Awaiting Validation)', value: 'Encoded' },
              { label: 'Validated (Official)', value: 'Validated' }
            ]}
            filterPlaceholder="Filter Status"
            searchPlaceholder="Search student, subject or instructor..."
            loading={loading}
          />
        </div>
      </div>

      {/* Validation Confirmation Modal */}
      <ConfirmationModal
        isOpen={showValidateModal}
        onClose={() => setShowValidateModal(false)}
        onConfirm={handleValidate}
        title="Validate and Release Official Grade"
        message={`Are you sure you want to validate and publish the grade of ${selectedGrade?.grade} for ${selectedGrade?.studentName} in ${selectedGrade?.subjectCode}? Once validated, it will become permanently visible on the student's official grade slip.`}
        confirmText="Confirm & Validate Grade"
        variant="primary"
        loading={processing}
      />
    </div>
  );
};
