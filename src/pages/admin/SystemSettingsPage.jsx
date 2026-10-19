import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/feedback/LoadingState';
import { systemSettingsService } from '../../services/systemSettingsService';

export const SystemSettingsPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    academicYear: '2025-2026',
    semester: '2nd Semester',
    enrollmentStatus: 'Open',
    gradeEncodingStatus: 'Open',
    clearancePeriodStatus: 'Active',
    maxUnitsRegular: 24,
    maxUnitsIrregular: 18,
    universityName: 'Pamantasan ng Cabuyao (PnC)',
    systemVersion: 'v1.0.0-ImplementationReady'
  });
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const data = await systemSettingsService.getSettings();
        if (data && Object.keys(data).length > 0) {
          setSettings(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await systemSettingsService.updateSettings(settings, currentUser?.name || 'Administrator');
      setToastMessage('System settings and enrollment parameters updated successfully.');
    } catch (err) {
      alert(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading system parameters..." />;
  }

  return (
    <div>
      <PageHeader
        title="Academic Terms & System Parameters"
        subtitle="Control university-wide academic periods, enrollment portals, grade encoding windows, and unit caps."
        breadcrumbs={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'System Settings', to: '/admin/settings' }
        ]}
      />

      {toastMessage && (
        <div className="alert alert-success alert-dismissible fade show small mb-3" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {toastMessage}
          <button type="button" className="btn-close" onClick={() => setToastMessage('')}></button>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="row g-4">
          {/* Academic Term Configuration */}
          <div className="col-lg-6">
            <div className="pnc-card h-100 mb-0">
              <div className="pnc-card-header">
                <span>Active Academic Term Parameters</span>
              </div>
              <div className="pnc-card-body">
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">Active Academic Year</label>
                  <select
                    className="form-select form-select-sm"
                    value={settings.academicYear}
                    onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                  >
                    <option value="2025-2026">2025-2026</option>
                    <option value="2026-2027">2026-2027</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">Active Semester</label>
                  <select
                    className="form-select form-select-sm"
                    value={settings.semester}
                    onChange={(e) => setSettings({ ...settings, semester: e.target.value })}
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="Summer / Midyear">Summer / Midyear</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">Institutional University Title</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={settings.universityName}
                    onChange={(e) => setSettings({ ...settings, universityName: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Portal Gateways & Window Statuses */}
          <div className="col-lg-6">
            <div className="pnc-card h-100 mb-0">
              <div className="pnc-card-header">
                <span>Student & Staff Portal Gateways</span>
              </div>
              <div className="pnc-card-body">
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">Online Student Enrollment Gateway</label>
                  <select
                    className="form-select form-select-sm"
                    value={settings.enrollmentStatus}
                    onChange={(e) => setSettings({ ...settings, enrollmentStatus: e.target.value })}
                  >
                    <option value="Open">Open (Students can select subjects)</option>
                    <option value="Closed">Closed (Enrollment locked)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">Faculty Grade Encoding Window</label>
                  <select
                    className="form-select form-select-sm"
                    value={settings.gradeEncodingStatus}
                    onChange={(e) => setSettings({ ...settings, gradeEncodingStatus: e.target.value })}
                  >
                    <option value="Open">Open (Faculty can submit grades)</option>
                    <option value="Closed">Closed (Grading period concluded)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark">Semestral Clearance Signing Period</label>
                  <select
                    className="form-select form-select-sm"
                    value={settings.clearancePeriodStatus}
                    onChange={(e) => setSettings({ ...settings, clearancePeriodStatus: e.target.value })}
                  >
                    <option value="Active">Active (Offices can signoff clearance)</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Unit Caps */}
          <div className="col-lg-12">
            <div className="pnc-card mb-0">
              <div className="pnc-card-header">
                <span>Curriculum Load Constraints</span>
              </div>
              <div className="pnc-card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Maximum Units for Regular Students</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={settings.maxUnitsRegular}
                      onChange={(e) => setSettings({ ...settings, maxUnitsRegular: Number(e.target.value) })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Maximum Units for Irregular Students</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={settings.maxUnitsIrregular}
                      onChange={(e) => setSettings({ ...settings, maxUnitsIrregular: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                  <button type="submit" className="btn btn-pnc-primary px-4" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving Configuration...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2-circle me-1"></i>Save System Settings
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
