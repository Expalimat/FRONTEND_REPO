import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/feedback/LoadingState';
import { gradeService } from '../../services/gradeService';
import { studentService } from '../../services/studentService';

export const GradeEncodingPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('IT201');
  const [selectedSection, setSelectedSection] = useState('BSIT 2A');
  const [selectedTerm, setSelectedTerm] = useState('2nd Semester 2025-2026');
  const [students, setStudents] = useState([]);
  const [gradesMap, setGradesMap] = useState({});
  const [savedGrades, setSavedGrades] = useState([]);
  const [savingIndex, setSavingIndex] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [stdList, grdList] = await Promise.all([
        studentService.getAllStudents(),
        gradeService.getGrades()
      ]);
      setStudents(stdList);
      setSavedGrades(grdList);

      // Initialize inputs from existing records
      const initialMap = {};
      stdList.forEach((s) => {
        const existing = grdList.find(
          (g) => g.studentNumber === s.studentNumber && g.subjectCode === selectedSubject
        );
        initialMap[s.studentNumber] = existing ? existing.grade : '1.50';
      });
      setGradesMap(initialMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSubject]);

  const handleGradeChange = (studentNumber, val) => {
    setGradesMap({
      ...gradesMap,
      [studentNumber]: val
    });
  };

  const handleSaveGrade = async (student, index) => {
    setSavingIndex(index);
    try {
      const enteredGrade = gradesMap[student.studentNumber] || '1.50';
      await gradeService.encodeGrade(
        {
          studentNumber: student.studentNumber,
          studentName: student.name,
          subjectCode: selectedSubject,
          subjectTitle: selectedSubject === 'IT201' ? 'Data Structures and Algorithms' : 'Information Management',
          term: selectedTerm,
          units: 3,
          grade: enteredGrade
        },
        currentUser?.name || 'Dr. Arnaldo Perez (Faculty)'
      );
      setToastMessage(`Grade (${enteredGrade}) saved as Encoded for ${student.name}. Sent to Registrar for validation.`);
      const updatedGrades = await gradeService.getGrades();
      setSavedGrades(updatedGrades);
    } catch (err) {
      alert('Failed to encode grade.');
    } finally {
      setSavingIndex(null);
    }
  };

  if (loading) {
    return <LoadingState message="Loading student rosters for grade entry..." />;
  }

  return (
    <div>
      <PageHeader
        title="Department Grade Encoding Entry"
        subtitle="Encode final academic grades for class section rosters. Saved grades are sent to the Registrar for dual-control validation."
        breadcrumbs={[
          { label: 'Dashboard', to: '/department/dashboard' },
          { label: 'Grade Encoding', to: '/department/grades' }
        ]}
      />

      {toastMessage && (
        <div className="alert alert-success alert-dismissible fade show small mb-3" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {toastMessage}
          <button type="button" className="btn-close" onClick={() => setToastMessage('')}></button>
        </div>
      )}

      {/* Filter / Class Selector Card */}
      <div className="pnc-card mb-4">
        <div className="pnc-card-body py-3">
          <div className="row g-3 align-items-center">
            <div className="col-md-4">
              <label className="form-label small fw-bold text-muted mb-1">Select Subject Offering:</label>
              <select
                className="form-select form-select-sm"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="IT201">IT201 - Data Structures and Algorithms</option>
                <option value="IT202">IT202 - Information Management (Databases)</option>
                <option value="IT203">IT203 - Web Systems and Technologies 1</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold text-muted mb-1">Select Section:</label>
              <select
                className="form-select form-select-sm"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                <option value="BSIT 2A">BSIT 2A (Regular)</option>
                <option value="BSIT 2B">BSIT 2B (Regular)</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-bold text-muted mb-1">Academic Term:</label>
              <select
                className="form-select form-select-sm"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
              >
                <option value="2nd Semester 2025-2026">2nd Semester 2025-2026 (Open)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Control Notice */}
      <div className="alert alert-warning small d-flex align-items-center gap-2 mb-4" role="alert">
        <i className="bi bi-shield-exclamation fs-5 text-warning"></i>
        <div>
          <strong>Dual-Control System Notice:</strong> Grades saved in this module are stamped as <strong>Encoded</strong>. The University Registrar retains the final authorization to validate and publish grades to official student records.
        </div>
      </div>

      {/* Grade Entry Table */}
      <div className="pnc-card">
        <div className="pnc-card-header d-flex justify-content-between align-items-center">
          <span>Class Roster & Grade Input ({selectedSubject} - {selectedSection})</span>
          <span className="badge bg-light text-dark border">{students.length} Enrolled Students</span>
        </div>
        <div className="pnc-card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-pnc align-middle mb-0">
              <thead>
                <tr>
                  <th>Student Number</th>
                  <th>Student Full Name</th>
                  <th>Program & Year</th>
                  <th style={{ width: '160px' }}>Final Grade</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => {
                  const existing = savedGrades.find(
                    (g) => g.studentNumber === student.studentNumber && g.subjectCode === selectedSubject
                  );
                  const currentStatus = existing ? existing.status : 'Not Encoded';
                  const isSaving = savingIndex === idx;

                  return (
                    <tr key={student.studentNumber}>
                      <td className="font-monospace fw-bold">{student.studentNumber}</td>
                      <td>
                        <div className="fw-semibold text-dark">{student.name}</div>
                        <div className="small text-muted">{student.email}</div>
                      </td>
                      <td>
                        <div className="small text-dark">{student.program}</div>
                        <div className="small text-muted">{student.yearLevel}</div>
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm font-monospace fw-bold"
                          value={gradesMap[student.studentNumber] || '1.50'}
                          onChange={(e) => handleGradeChange(student.studentNumber, e.target.value)}
                          disabled={existing?.status === 'Validated'}
                        >
                          <option value="1.00">1.00 (Excellent)</option>
                          <option value="1.25">1.25 (Superior)</option>
                          <option value="1.50">1.50 (Very Good)</option>
                          <option value="1.75">1.75 (Good)</option>
                          <option value="2.00">2.00 (Satisfactory)</option>
                          <option value="2.25">2.25 (Fair)</option>
                          <option value="2.50">2.50 (Passing)</option>
                          <option value="3.00">3.00 (Conditional)</option>
                          <option value="5.00">5.00 (Failed)</option>
                          <option value="INC">INC (Incomplete)</option>
                          <option value="DRP">DRP (Dropped)</option>
                        </select>
                      </td>
                      <td>
                        {currentStatus === 'Not Encoded' ? (
                          <span className="badge bg-secondary-subtle text-secondary">
                            <i className="bi bi-dash me-1"></i>Not Encoded
                          </span>
                        ) : (
                          <StatusBadge status={currentStatus} />
                        )}
                      </td>
                      <td>
                        {existing?.status === 'Validated' ? (
                          <span className="small text-muted"><i className="bi bi-lock-fill me-1"></i>Validated</span>
                        ) : (
                          <button
                            className="btn btn-sm btn-pnc-primary py-1 px-3 d-flex align-items-center gap-1"
                            onClick={() => handleSaveGrade(student, idx)}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : (
                              <i className="bi bi-save"></i>
                            )}
                            Save as Encoded
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
