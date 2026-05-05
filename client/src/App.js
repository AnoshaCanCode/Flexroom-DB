import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProgressGraph from "./components/ProgressGraph";
import StudentPage from './components/flexroom/StudentPage';
import EvaluatorPage from './components/flexroom/EvaluatorPage';
import DashboardLayout from './components/DashboardLayout';
import StudentDashboard from './pages/StudentDashboard';
import EvaluatorDashboard from './pages/EvaluatorDashboard';
import SettingsPage from './components/SettingsPage';
import ChangePassword from './components/ChangePassword';
import UploadPicture from './components/UploadPicture';
import CalendarPage from './pages/CalendarPage';
import PeoplePage from './pages/PeoplePage';
import SubmissionPage from './pages/SubmissionPage';
import CreateDocAssignmentPage from './pages/CreateDocAssignmentPage';
import CreateCodeAssignmentPage from './pages/CreateCodeAssignmentPage';
import EvaluatorMarkingPage from './components/flexroom/EvaluatorMarkingPage';
import { StudentSelfEvalPage } from './components/flexroom/StudentPage';
import StudentClassView from './components/flexroom/StudentClassView';

const FRAME_WIDTH = 1440;
const FRAME_HEIGHT = 1024;

function ScaledFrame({ children }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const syncScale = () => {
      const widthScale = window.innerWidth / FRAME_WIDTH;
      setScale(widthScale);
    };

    syncScale();
    window.addEventListener('resize', syncScale);
    return () => window.removeEventListener('resize', syncScale);
  }, []);

  return (
    <div
      className="d-flex justify-content-center"
      style={{
        width: '100vw',
        height: '100vh',
        overflowX: 'hidden',
        overflowY: 'auto',
        background: '#e4e6e2',
      }}
    >
      <div
        style={{
          width: FRAME_WIDTH * scale,
          height: FRAME_HEIGHT * scale,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/progress" element={<ProgressGraph />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/upload-picture" element={<UploadPicture />} />

        <Route
          path="/flexroom/student"
          element={(
            <ProtectedRoute role="student">
              <ScaledFrame><StudentPage /></ScaledFrame>
            </ProtectedRoute>
          )}
        />
        <Route
          path="/flexroom/evaluator"
          element={(
            <ProtectedRoute role="evaluator">
              <ScaledFrame><EvaluatorPage /></ScaledFrame>
            </ProtectedRoute>
          )}
        />

        <Route
          path="/evaluator/class/:id"
          element={(
            <ProtectedRoute role="evaluator">
              <ScaledFrame><EvaluatorPage /></ScaledFrame>
            </ProtectedRoute>
          )}
        />

        <Route
          path="/evaluator/evaluate/:assignmentId/:studentId"
          element={(
            <ProtectedRoute role="evaluator">
              <EvaluatorMarkingPage />
            </ProtectedRoute>
          )}
        />

        <Route
          path="/student/class/:classId"
          element={(
            <ProtectedRoute role="student">
              <StudentClassView />
            </ProtectedRoute>
          )}
        />

        <Route
          path="/student/class/:classId/assignment/:assessmentId"
          element={(
            <ProtectedRoute role="student">
              <ScaledFrame>
                <StudentPage />
              </ScaledFrame>
            </ProtectedRoute>
          )}
        />

        <Route
          path="/student/class/:classId/assignment/:assessmentId/self-eval"
          element={(
            <ProtectedRoute role="student">
              <ScaledFrame>
                <StudentSelfEvalPage />
              </ScaledFrame>
            </ProtectedRoute>
          )}
        />

        <Route
          path="/student"
          element={(
            <ProtectedRoute role="student">
              <DashboardLayout userRole="student" />
            </ProtectedRoute>
          )}
        >
          <Route index element={<StudentDashboard />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
        </Route>

        <Route
          path="/evaluator"
          element={(
            <ProtectedRoute role="evaluator">
              <DashboardLayout userRole="evaluator" />
            </ProtectedRoute>
          )}
        >
          <Route index element={<EvaluatorDashboard />} />
          <Route path="people" element={<PeoplePage />} />
          <Route path="progress/:studentId" element={<ProgressGraph />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="submissions/:id" element={<SubmissionPage />} />
        </Route>

        <Route
          path="/create-doc-assignment"
          element={(
            <ProtectedRoute role="evaluator">
              <DashboardLayout userRole="evaluator" />
            </ProtectedRoute>
          )}
        >
          <Route index element={<CreateDocAssignmentPage />} />
        </Route>
        <Route
          path="/create-code-assignment"
          element={(
            <ProtectedRoute role="evaluator">
              <DashboardLayout userRole="evaluator" />
            </ProtectedRoute>
          )}
        >
          <Route index element={<CreateCodeAssignmentPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
