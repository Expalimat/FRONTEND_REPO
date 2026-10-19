import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/feedback/Modal';
import { enrollmentService } from '../../services/enrollmentService';
import { pageParams, readPage } from '../../services/api';

export const SubjectOfferingsPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [offerings, setOfferings] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [targetId, setTargetId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectTitle: '',
    units: 3,
    section: 'BSIT 2A',
    term: '2nd Semester 2025-2026',
    schedule: 'Mon / Wed 10:00 AM - 12:00 PM',
    room: 'CCS Lab 2',
    instructor: 'Dr. Arnaldo Perez',
    totalSlots: 40,
    prerequisites: 'None',
    isPrerequisiteSatisfied: true
  });
  const [toastMessage, setToastMessage] = useState('');

  const loadOfferings = async (page = 1, filters = {}) => {
    setLoading(true);
    try {
      const result = readPage(await enrollmentService.getOfferings(null, pageParams(page, filters)));
      setOfferings(result.data);
      setPagination(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfferings();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setTargetId(null);
    setFormData({
      subjectCode: '',
      subjectTitle: '',
      units: 3,
      section: 'BSIT 2B',
      term: '2nd Semester 2025-2026',
      schedule: 'Mon / Wed 01:00 PM - 03:00 PM',
      room: 'CCS Lab 1',
      instructor: currentUser?.name || 'Dr. Arnaldo Perez',
      totalSlots: 40,
      prerequisites: 'None',
      isPrerequisiteSatisfied: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditing(true);
    setTargetId(item.id);
    setFormData({
      subjectCode: item.subjectCode,
      subjectTitle: item.subjectTitle,
      units: item.units,
      section: item.section,
      term: item.term,
      schedule: item.schedule,
      room: item.room,
      instructor: item.instructor,
      totalSlots: item.totalSlots,
      prerequisites: item.prerequisites || 'None',
      isPrerequisiteSatisfied: item.isPrerequisiteSatisfied ?? true
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await enrollmentService.updateSubjectOffering(
          targetId,
          formData,
          currentUser?.name || 'Department Staff'
        );
        setToastMessage(`Updated course offering ${formData.subjectCode} (${formData.section}).`);
      } else {
        await enrollmentService.addSubjectOffering(
          formData,
          currentUser?.name || 'Department Staff'
        );
        setToastMessage(`Added new course offering section ${formData.subjectCode} (${formData.section}).`);
      }
      setShowModal(false);
      loadOfferings();
    } catch (err) {
      alert('Failed to save offering.');
    }
  };

  const columns = [
    {
      header: 'Subject Code',
      accessor: 'subjectCode',
      render: (row) => <span className="fw-bold text-success font-monospace">{row.subjectCode}</span>
    },
    {
      header: 'Subject Title',
      accessor: 'subjectTitle',
      render: (row) => <div className="fw-semibold text-dark">{row.subjectTitle}</div>
    },
    {
      header: 'Units',
      accessor: 'units',
      render: (row) => <span className="fw-bold">{row.units}</span>
    },
    {
      header: 'Section',
      accessor: 'section',
      render: (row) => <span className="badge bg-light text-dark border">{row.section}</span>
    },
    {
      header: 'Schedule & Room',
      accessor: 'schedule',
      render: (row) => (
        <div className="small">
          <div>{row.schedule}</div>
          <div className="text-muted">{row.room}</div>
        </div>
      )
    },
    {
      header: 'Instructor',
      accessor: 'instructor',
      render: (row) => <span className="small text-muted">{row.instructor}</span>
    },
    {
      header: 'Slots',
      accessor: 'availableSlots',
      render: (row) => (
        <span className="small text-dark font-monospace">
          {row.availableSlots} / {row.totalSlots}
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
          onClick={() => handleOpenEdit(row)}
          title="Edit Section"
        >
          <i className="bi bi-pencil me-1"></i>Edit
        </button>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Department Subject Offerings"
        subtitle="Manage curriculum course offerings, lecture/laboratory sections, faculty assignments, and slot capacities."
        breadcrumbs={[
          { label: 'Dashboard', to: '/department/dashboard' },
          { label: 'Subject Offerings', to: '/department/subjects' }
        ]}
        actions={
          <button className="btn btn-pnc-primary" onClick={handleOpenAdd}>
            <i className="bi bi-plus-circle me-1"></i>Add New Subject Section
          </button>
        }
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
          <span>Master List of Offered Sections</span>
        </div>
        <div className="pnc-card-body">
          <DataTable
            columns={columns}
            data={offerings}
            serverPagination={{ ...pagination, onPageChange: loadOfferings }}
            filterField="status"
            filterOptions={[
              { label: 'Open', value: 'Open' },
              { label: 'Full', value: 'Full' }
            ]}
            filterPlaceholder="Filter Status"
            searchPlaceholder="Search subject code, title, section, or instructor..."
            loading={loading}
          />
        </div>
      </div>

      {/* Add / Edit Offering Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEditing ? 'Edit Subject Offering Section' : 'Create New Subject Section'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label small fw-semibold text-dark">Subject Code <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control form-control-sm font-monospace"
                placeholder="e.g. IT301"
                value={formData.subjectCode}
                onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="col-md-8">
              <label className="form-label small fw-semibold text-dark">Subject Title <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g. Mobile Application Development"
                value={formData.subjectTitle}
                onChange={(e) => setFormData({ ...formData, subjectTitle: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-3">
              <label className="form-label small fw-semibold text-dark">Credit Units</label>
              <input
                type="number"
                className="form-control form-control-sm"
                min="1"
                max="6"
                value={formData.units}
                onChange={(e) => setFormData({ ...formData, units: Number(e.target.value) })}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold text-dark">Section Code</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g. BSIT 2A"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                required
              />
            </div>
            <div className="col-md-5">
              <label className="form-label small fw-semibold text-dark">Assigned Instructor</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g. Dr. A. Perez"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-dark">Schedule & Time</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g. Mon / Wed 08:00 AM - 10:00 AM"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-semibold text-dark">Room Assignment</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g. CCS Lab 3"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-semibold text-dark">Total Slots</label>
              <input
                type="number"
                className="form-control form-control-sm"
                min="10"
                max="60"
                value={formData.totalSlots}
                onChange={(e) => setFormData({ ...formData, totalSlots: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold text-dark">Prerequisites</label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="e.g. IT102 - Computer Programming 2 (or 'None')"
              value={formData.prerequisites}
              onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
            />
          </div>

          <div className="d-flex justify-content-end gap-2 pt-3 border-top">
            <button type="button" className="btn btn-sm btn-light" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-sm btn-pnc-primary">
              {isEditing ? 'Save Changes' : 'Create Section'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
