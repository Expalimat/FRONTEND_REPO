import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/feedback/Modal';
import { studentService } from '../../services/studentService';
import { enrollmentService } from '../../services/enrollmentService';
import { gradeService } from '../../services/gradeService';

export const StudentRecordsPage = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentGrades, setStudentGrades] = useState([]);
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await studentService.getAllStudents();
        setStudents(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleViewStudent = async (student) => {
    setSelectedStudent(student);
    const [grd, enr] = await Promise.all([
      gradeService.getGradesByStudent(student.studentNumber),
      enrollmentService.getEnrollmentByStudent(student.studentNumber)
    ]);
    setStudentGrades(grd);
    setStudentEnrollments(enr);
    setShowModal(true);
  };

  const columns = [
    {
      header: 'Student Number',
      accessor: 'studentNumber',
      render: (row) => <span className="font-monospace fw-bold">{row.studentNumber}</span>
    },
    {
      header: 'Student Full Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{row.name}</div>
          <div className="small text-muted">{row.email}</div>
        </div>
      )
    },
    {
      header: 'Program',
      accessor: 'program',
      render: (row) => <span className="small text-dark">{row.program}</span>
    },
    {
      header: 'Year Level',
      accessor: 'yearLevel',
      render: (row) => <span className="badge bg-light text-dark border">{row.yearLevel}</span>
    },
    {
      header: 'Academic Status',
      accessor: 'academicStatus',
      render: (row) => <StatusBadge status={row.academicStatus === 'Regular' ? 'Active' : 'Pending'} customLabel={row.academicStatus} />
    },
    {
      header: 'Cumulative GPA',
      accessor: 'gpa',
      render: (row) => <span className="fw-bold text-success font-monospace">{row.gpa}</span>
    },
    {
      header: 'Action',
      render: (row) => (
        <button
          className="btn btn-xs btn-outline-primary py-1 px-2"
          onClick={() => handleViewStudent(row)}
        >
          <i className="bi bi-folder2-open me-1"></i>View Record
        </button>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Student Master Records"
        subtitle="Inspect student enrollment history, academic performance transcripts, and curriculum standing."
        breadcrumbs={[
          { label: 'Dashboard', to: '/registrar/dashboard' },
          { label: 'Student Records', to: '/registrar/students' }
        ]}
      />

      <div className="pnc-card">
        <div className="pnc-card-header">
          <span>Official Student Directory</span>
        </div>
        <div className="pnc-card-body">
          <DataTable
            columns={columns}
            data={students}
            searchPlaceholder="Search by name, student number or program..."
            loading={loading}
          />
        </div>
      </div>

      {/* Master Student Record Modal */}
      {selectedStudent && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`Student Master Record: ${selectedStudent.name} (${selectedStudent.studentNumber})`}
          size="lg"
        >
          <div>
            <div className="row g-3 p-3 bg-light rounded border mb-3 small">
              <div className="col-md-6"><strong>Student No:</strong> {selectedStudent.studentNumber}</div>
              <div className="col-md-6"><strong>Full Name:</strong> {selectedStudent.name}</div>
              <div className="col-md-6"><strong>Degree Program:</strong> {selectedStudent.program}</div>
              <div className="col-md-6"><strong>Year Level:</strong> {selectedStudent.yearLevel} ({selectedStudent.academicStatus})</div>
              <div className="col-md-6"><strong>Email:</strong> {selectedStudent.email}</div>
              <div className="col-md-6"><strong>Contact:</strong> {selectedStudent.contact}</div>
              <div className="col-md-12"><strong>Address:</strong> {selectedStudent.address}</div>
            </div>

            <h6 className="fw-bold text-dark mb-2">Academic Record / Grades Transcript:</h6>
            <div className="table-responsive mb-3">
              <table className="table table-sm table-bordered table-pnc small mb-0">
                <thead>
                  <tr>
                    <th>Term</th>
                    <th>Subject</th>
                    <th>Title</th>
                    <th>Units</th>
                    <th>Grade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentGrades.map((g) => (
                    <tr key={g.id}>
                      <td>{g.term}</td>
                      <td className="fw-bold">{g.subjectCode}</td>
                      <td>{g.subjectTitle}</td>
                      <td>{g.units}</td>
                      <td className="fw-bold text-success">{g.grade}</td>
                      <td><StatusBadge status={g.status} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
