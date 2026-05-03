import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/auth/Login'; 
import Signup from './components/auth/Signup'; 
import ProgressGraph from "./components/ProgressGraph";
import StudentPage from './components/flexroom/StudentPage';
import EvaluatorPage from './components/flexroom/EvaluatorPage';
import DashboardLayout from './components/DashboardLayout';
import StudentDashboard from './pages/StudentDashboard';
import EvaluatorDashboard from './pages/EvaluatorDashboard';
import SettingsPage from './components/SettingsPage';
import ChangePassword from './components/ChangePassword';
import UploadPicture from './components/UploadPicture';

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
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/progress" element={<ProgressGraph />} />

        {/* Add this flat route so it doesn't get the DashboardLayout */}
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/upload-picture" element={<UploadPicture />} />
        
        <Route
          path="/flexroom/student"
          element={<ScaledFrame><StudentPage /></ScaledFrame>}
        />
        <Route
          path="/flexroom/evaluator"
          element={<ScaledFrame><EvaluatorPage /></ScaledFrame>}
        />
        {/* Student Route with Layout */}
        <Route path="/student" element={<DashboardLayout userRole="student" />}>
          <Route index element={<StudentDashboard />} />
          <Route path="settings" element={<SettingsPage />} /> {/* This registers the route! */}
        </Route>

        {/* Evaluator Route with Layout */}
        <Route path="/evaluator" element={<DashboardLayout userRole="evaluator" />}>
          <Route index element={<EvaluatorDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;