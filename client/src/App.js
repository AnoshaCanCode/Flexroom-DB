import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/auth/Login'; 
import Signup from './components/auth/Signup'; 
import ProgressGraph from "./components/ProgressGraph";
import DashboardLayout from './components/DashboardLayout';
import StudentDashboard from './pages/StudentDashboard';
import EvaluatorDashboard from './pages/EvaluatorDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/progress" element={<ProgressGraph />} />
        {/* Student Route with Layout */}
        <Route path="/student" element={<DashboardLayout userRole="student" />}>
          <Route index element={<StudentDashboard />} />
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