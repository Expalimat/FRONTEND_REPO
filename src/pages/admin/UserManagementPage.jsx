import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/feedback/Modal';
import { ConfirmationModal } from '../../components/feedback/ConfirmationModal';
import { userService } from '../../services/userService';
import { pageParams, readPage } from '../../services/api';

export const UserManagementPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, perPage: 10, total: 0 });
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    role: 'Student',
    studentNumber: '',
    program: 'BS Information Technology',
    yearLevel: '1st Year',
    department: ''
  });

  const loadUsers = async (page = 1, filters = {}) => {
    setLoading(true);
    try {
      const result = readPage(await userService.getUsers(pageParams(page, filters)));
      setUsers(result.data);
      setPagination(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setTargetId(null);
    setFormData({
      username: '',
      name: '',
      email: '',
      role: 'Student',
      studentNumber: `2026-0000${pagination.total + 1}`,
      program: 'BS Information Technology',
      yearLevel: '1st Year',
      department: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setIsEditing(true);
    setTargetId(user.id);
    setFormData({
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      studentNumber: user.studentNumber || '',
      program: user.program || '',
      yearLevel: user.yearLevel || '',
      department: user.department || ''
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await userService.updateUser(targetId, formData, currentUser?.name || 'Admin');
        setToastMessage(`User ${formData.username} updated successfully.`);
      } else {
        await userService.createUser(formData, currentUser?.name || 'Admin');
        setToastMessage(`User ${formData.username} created successfully.`);
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      alert('Failed to save user.');
    }
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    setProcessing(true);
    try {
      await userService.toggleUserStatus(toggleTarget.id, currentUser?.name || 'Admin');
      setToastMessage(`Status for ${toggleTarget.username} updated.`);
      setToggleTarget(null);
      loadUsers();
    } catch (err) {
      alert('Failed to change status.');
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      header: 'User Account',
      accessor: 'name',
      render: (row) => (
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center fw-bold small"
            style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}
          >
            {row.avatar || 'U'}
          </div>
          <div>
            <div className="fw-semibold text-dark">{row.name}</div>
            <div className="small text-muted font-monospace">@{row.username}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => (
        <span
          className={`badge ${
            row.role === 'Student'
              ? 'bg-primary-subtle text-primary'
              : row.role === 'Administrator'
              ? 'bg-danger-subtle text-danger'
              : 'bg-success-subtle text-success'
          }`}
        >
          {row.role}
        </span>
      )
    },
    {
      header: 'Email / Contact',
      accessor: 'email',
      render: (row) => <span className="small text-muted">{row.email}</span>
    },
    {
      header: 'Affiliation / ID',
      render: (row) => (
        <span className="small text-dark font-monospace">
          {row.studentNumber || row.department || 'PnC Personnel'}
        </span>
      )
    },
    {
      header: 'Account Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="d-flex align-items-center gap-1">
          <button
            className="btn btn-xs btn-outline-primary py-1 px-2"
            onClick={() => handleOpenEdit(row)}
            title="Edit User Profile"
          >
            <i className="bi bi-pencil"></i>
          </button>
          <button
            className={`btn btn-xs py-1 px-2 ${row.status === 'Active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
            onClick={() => setToggleTarget(row)}
            title={row.status === 'Active' ? 'Deactivate' : 'Activate'}
          >
            {row.status === 'Active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="System User Management"
        subtitle="Administer accounts, roles, access privileges, and account active statuses."
        breadcrumbs={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'User Management', to: '/admin/users' }
        ]}
        actions={
          <button className="btn btn-pnc-primary" onClick={handleOpenAdd}>
            <i className="bi bi-person-plus me-1"></i>Add New User
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
          <span>All Registered Portal Users</span>
        </div>
        <div className="pnc-card-body">
          <DataTable
            columns={columns}
            data={users}
            serverPagination={{ ...pagination, onPageChange: loadUsers }}
            filterField="role"
            filterOptions={[
              { label: 'Student', value: 'Student' },
              { label: 'Registrar', value: 'Registrar' },
              { label: 'Cashier', value: 'Cashier' },
              { label: 'Department Staff', value: 'Department Staff' },
              { label: 'Administrator', value: 'Administrator' }
            ]}
            filterPlaceholder="Filter by Role"
            searchPlaceholder="Search name, username, email or ID..."
            loading={loading}
          />
        </div>
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEditing ? 'Edit User Account' : 'Create New User Account'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-dark">Full Legal Name <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-dark">Username <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control form-control-sm font-monospace"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-dark">Email Address <span className="text-danger">*</span></label>
              <input
                type="email"
                className="form-control form-control-sm"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-dark">Assigned System Role <span className="text-danger">*</span></label>
              <select
                className="form-select form-select-sm"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                <option value="Student">Student</option>
                <option value="Registrar">Registrar</option>
                <option value="Cashier">Cashier</option>
                <option value="Department Staff">Department Staff</option>
                <option value="Administrator">Administrator</option>
              </select>
            </div>
          </div>

          {formData.role === 'Student' ? (
            <div className="row g-3 mb-3 p-3 bg-light rounded border">
              <div className="col-md-4">
                <label className="form-label small fw-semibold text-dark">Student Number</label>
                <input
                  type="text"
                  className="form-control form-control-sm font-monospace"
                  value={formData.studentNumber}
                  onChange={(e) => setFormData({ ...formData, studentNumber: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold text-dark">Program</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold text-dark">Year Level</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={formData.yearLevel}
                  onChange={(e) => setFormData({ ...formData, yearLevel: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <label className="form-label small fw-semibold text-dark">Department / Office Unit</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="e.g. University Registrar or Treasury"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 pt-3 border-top">
            <button type="button" className="btn btn-sm btn-light" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-sm btn-pnc-primary">
              {isEditing ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Activate / Deactivate Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleConfirmToggle}
        title={`${toggleTarget?.status === 'Active' ? 'Deactivate' : 'Activate'} User Account`}
        message={`Are you sure you want to change the status of ${toggleTarget?.name} (@${toggleTarget?.username}) to ${toggleTarget?.status === 'Active' ? 'Inactive' : 'Active'}?`}
        confirmText={toggleTarget?.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
        variant={toggleTarget?.status === 'Active' ? 'danger' : 'primary'}
        loading={processing}
      />
    </div>
  );
};
