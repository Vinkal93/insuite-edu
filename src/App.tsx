import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { initializeDatabase } from './db/database';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Students
import StudentList from './pages/students/StudentList';
import NewAdmission from './pages/students/NewAdmission';
import StudentProfile from './pages/students/StudentProfile';

// Staff
import StaffList from './pages/staff/StaffList';

// Classes
import ClassList from './pages/classes/ClassList';

// Attendance
import StudentAttendance from './pages/attendance/StudentAttendance';

// Fees
import FeeCollection from './pages/fees/FeeCollection';
import FeeStructure from './pages/fees/FeeStructure';
import PendingFees from './pages/fees/PendingFees';

// Exams
import ExamList from './pages/exams/ExamList';
import MarksEntry from './pages/exams/MarksEntry';
import Results from './pages/exams/Results';

// Notices
import NoticeList from './pages/notices/NoticeList';

// Reports
import Reports from './pages/reports/Reports';

// Settings
import Settings from './pages/settings/Settings';

// Student Portal
import StudentDashboard from './pages/student-portal/StudentDashboard';

// Admin Pages (Super Admin only)
import InstitutesPage from './pages/admin/InstitutesPage';
import UsersPage from './pages/admin/UsersPage';

function App() {
  const { isAuthenticated, isStudent, isSuperAdmin, loading } = useAuth();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initializeDatabase().then(() => setDbReady(true));
  }, []);

  if (loading || !dbReady) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div className="login-logo">E</div>
          <h2 style={{ marginTop: '1rem' }}>Loading...</h2>
          <p style={{ color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
            Initializing InSuite Edu
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // If student is logged in, show student portal
  if (isStudent) {
    return <StudentDashboard />;
  }

  // Staff/Admin view
  return (
    <MainLayout>
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Students */}
        <Route path="/students" element={<StudentList />} />
        <Route path="/students/new" element={<NewAdmission />} />
        <Route path="/students/:id" element={<StudentProfile />} />

        {/* Staff */}
        <Route path="/staff" element={<StaffList />} />

        {/* Classes */}
        <Route path="/classes" element={<ClassList />} />

        {/* Attendance */}
        <Route path="/attendance" element={<StudentAttendance />} />
        <Route path="/attendance/students" element={<StudentAttendance />} />

        {/* Fees */}
        <Route path="/fees" element={<FeeCollection />} />
        <Route path="/fees/structure" element={<FeeStructure />} />
        <Route path="/fees/pending" element={<PendingFees />} />

        {/* Exams */}
        <Route path="/exams" element={<ExamList />} />
        <Route path="/exams/marks" element={<MarksEntry />} />
        <Route path="/exams/results" element={<Results />} />

        {/* Notices */}
        <Route path="/notices" element={<NoticeList />} />

        {/* Reports */}
        <Route path="/reports" element={<Reports />} />

        {/* Settings */}
        <Route path="/settings" element={<Settings />} />

        {/* Super Admin Routes */}
        {isSuperAdmin && (
          <>
            <Route path="/admin/institutes" element={<InstitutesPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
          </>
        )}

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
