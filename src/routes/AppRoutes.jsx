import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';

// Auth
import { LoginPage } from '../pages/auth/LoginPage';

// Student
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { EnrollmentPage } from '../pages/student/EnrollmentPage';
import { SchedulePage } from '../pages/student/SchedulePage';
import { PaymentsPage } from '../pages/student/PaymentsPage';
import { ClearancePage } from '../pages/student/ClearancePage';
import { GradesPage } from '../pages/student/GradesPage';
import { DocumentRequestsPage } from '../pages/student/DocumentRequestsPage';
import { NotificationsPage } from '../pages/student/NotificationsPage';
import { ProfilePage } from '../pages/student/ProfilePage';
import { AppointmentsPage } from '../pages/student/AppointmentsPage';

// Registrar
import { RegistrarDashboard } from '../pages/registrar/RegistrarDashboard';
import { EnrollmentRequestsPage } from '../pages/registrar/EnrollmentRequestsPage';
import { GradeValidationPage } from '../pages/registrar/GradeValidationPage';
import { DocumentRequestsQueuePage } from '../pages/registrar/DocumentRequestsQueuePage';
import { StudentRecordsPage } from '../pages/registrar/StudentRecordsPage';
import { RegistrarClearancePage } from '../pages/registrar/RegistrarClearancePage';

// Cashier
import { CashierDashboard } from '../pages/cashier/CashierDashboard';
import { PaymentVerificationPage } from '../pages/cashier/PaymentVerificationPage';
import { FeeAssessmentPage } from '../pages/cashier/FeeAssessmentPage';
import { CashierClearancePage } from '../pages/cashier/CashierClearancePage';

// Department
import { DepartmentDashboard } from '../pages/department/DepartmentDashboard';
import { SubjectOfferingsPage } from '../pages/department/SubjectOfferingsPage';
import { GradeEncodingPage } from '../pages/department/GradeEncodingPage';
import { DepartmentClearancePage } from '../pages/department/DepartmentClearancePage';

// Admin
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { AuditLogsPage } from '../pages/admin/AuditLogsPage';
import { SystemSettingsPage } from '../pages/admin/SystemSettingsPage';
import { AppointmentManagementPage } from '../pages/registrar/AppointmentManagementPage';
import { AppointmentQueueDisplayPage } from '../pages/queue/AppointmentQueueDisplayPage';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="appointment-queue/display" element={<AppointmentQueueDisplayPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Student Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Student']} />}>
        <Route element={<AppLayout />}>
          <Route path="student/dashboard" element={<StudentDashboard />} />
          <Route path="student/enrollment" element={<EnrollmentPage />} />
          <Route path="student/schedule" element={<SchedulePage />} />
          <Route path="student/payments" element={<PaymentsPage />} />
          <Route path="student/clearance" element={<ClearancePage />} />
          <Route path="student/grades" element={<GradesPage />} />
          <Route path="student/documents" element={<DocumentRequestsPage />} />
          <Route path="student/notifications" element={<NotificationsPage />} />
          <Route path="student/profile" element={<ProfilePage />} />
          <Route path="student/appointments" element={<AppointmentsPage />} />
        </Route>
      </Route>

      {/* Registrar Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Registrar']} />}>
        <Route element={<AppLayout />}>
          <Route path="registrar/dashboard" element={<RegistrarDashboard />} />
          <Route path="registrar/enrollments" element={<EnrollmentRequestsPage />} />
          <Route path="registrar/students" element={<StudentRecordsPage />} />
          <Route path="registrar/grades" element={<GradeValidationPage />} />
          <Route path="registrar/clearance" element={<RegistrarClearancePage />} />
          <Route path="registrar/documents" element={<DocumentRequestsQueuePage />} />
          <Route path="registrar/appointments" element={<AppointmentManagementPage />} />
        </Route>
      </Route>

      {/* Cashier Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Cashier']} />}>
        <Route element={<AppLayout />}>
          <Route path="cashier/dashboard" element={<CashierDashboard />} />
          <Route path="cashier/payments" element={<PaymentVerificationPage />} />
          <Route path="cashier/fees" element={<FeeAssessmentPage />} />
          <Route path="cashier/clearance" element={<CashierClearancePage />} />
        </Route>
      </Route>

      {/* Department Staff Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Department Staff']} />}>
        <Route element={<AppLayout />}>
          <Route path="department/dashboard" element={<DepartmentDashboard />} />
          <Route path="department/subjects" element={<SubjectOfferingsPage />} />
          <Route path="department/grades" element={<GradeEncodingPage />} />
          <Route path="department/clearance" element={<DepartmentClearancePage />} />
          <Route path="department/appointments" element={<AppointmentManagementPage dashboardPath="/department/dashboard" />} />
        </Route>
      </Route>

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Administrator']} />}>
        <Route element={<AppLayout />}>
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/users" element={<UserManagementPage />} />
          <Route path="admin/audit-logs" element={<AuditLogsPage />} />
          <Route path="admin/settings" element={<SystemSettingsPage />} />
          <Route path="admin/appointments" element={<AppointmentManagementPage dashboardPath="/admin/dashboard" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
