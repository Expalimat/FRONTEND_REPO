import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/feedback/LoadingState';
import { studentService } from '../../services/studentService';

export const ProfilePage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loadStudent = async () => {
      setLoading(true);
      try {
        const data = await studentService.getStudentByNumber(currentUser?.studentNumber || '2026-00001');
        if (data) {
          setStudent(data);
          setContact(data.contact);
          setAddress(data.address);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStudent();
  }, [currentUser]);

  const handleSaveContact = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (loading) {
    return <LoadingState message="Loading student profile details..." />;
  }

  return (
    <div>
      <PageHeader
        title="Student Profile & Records"
        subtitle="View verified academic information and manage your contact details."
        breadcrumbs={[
          { label: 'Dashboard', to: '/student/dashboard' },
          { label: 'Profile', to: '/student/profile' }
        ]}
      />

      {isSaved && (
        <div className="alert alert-success small py-2 px-3 mb-3" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          Contact information updated successfully.
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: ID Card */}
        <div className="col-lg-4">
          <div className="pnc-card text-center">
            <div className="pnc-card-body p-4">
              <div
                className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center fw-bold fs-2 shadow-sm mb-3"
                style={{ width: '90px', height: '90px' }}
              >
                {currentUser?.avatar || 'JD'}
              </div>
              <h5 className="fw-bold text-dark mb-1">{student?.name || currentUser?.name}</h5>
              <div className="font-monospace text-muted small mb-2">{student?.studentNumber || currentUser?.studentNumber}</div>
              <div className="mb-3">
                <StatusBadge status="Active" customLabel="Officially Enrolled" />
              </div>

              <div className="border-top pt-3 text-start small text-muted d-flex flex-column gap-2">
                <div>
                  <strong>Program:</strong>
                  <div className="text-dark fw-semibold">{student?.program}</div>
                </div>
                <div>
                  <strong>Year Level:</strong>
                  <div className="text-dark fw-semibold">{student?.yearLevel}</div>
                </div>
                <div>
                  <strong>Academic Standing:</strong>
                  <div className="text-dark fw-semibold">{student?.academicStatus}</div>
                </div>
                <div>
                  <strong>Cumulative GPA:</strong>
                  <div className="text-success fw-bold fs-6">{student?.gpa}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Information & Contact Form */}
        <div className="col-lg-8">
          <div className="pnc-card mb-4">
            <div className="pnc-card-header">
              <span>Academic Information (Official / Read-Only)</span>
            </div>
            <div className="pnc-card-body">
              <div className="row g-3 small">
                <div className="col-md-6">
                  <label className="fw-semibold text-muted">Full Legal Name</label>
                  <input type="text" className="form-control form-control-sm bg-light" value={student?.name || ''} readOnly />
                </div>
                <div className="col-md-6">
                  <label className="fw-semibold text-muted">Institutional Email</label>
                  <input type="text" className="form-control form-control-sm bg-light" value={currentUser?.email || ''} readOnly />
                </div>
                <div className="col-md-6">
                  <label className="fw-semibold text-muted">Degree Program</label>
                  <input type="text" className="form-control form-control-sm bg-light" value={student?.program || ''} readOnly />
                </div>
                <div className="col-md-6">
                  <label className="fw-semibold text-muted">Department / College</label>
                  <input type="text" className="form-control form-control-sm bg-light" value="College of Computing Studies" readOnly />
                </div>
              </div>
              <div className="small text-muted mt-3 fst-italic">
                * To request corrections to your official academic name or curriculum, contact the University Registrar.
              </div>
            </div>
          </div>

          <div className="pnc-card">
            <div className="pnc-card-header">
              <span>Contact & Residential Information</span>
            </div>
            <div className="pnc-card-body">
              <form onSubmit={handleSaveContact}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">Mobile / Contact Number</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">Residential Address</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows="2"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-sm btn-pnc-primary">
                  <i className="bi bi-check2 me-1"></i>Save Contact Info
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
