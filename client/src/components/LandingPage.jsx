import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

// Asset Imports
import flexroomWhite from './assets/Flexroom-white.png';
import flexroomCircle from './assets/round-white.png';
import backgroundGraphic from './assets/background.png';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container" style={{ backgroundImage: `url(${backgroundGraphic})` }}>
      
      {/* Topbar: Matches global dimensions and color #6a714b */}
      <nav className="landing-topbar">
        <div className="nav-right-section">
          <button onClick={() => navigate('/signup')} className="btn-signup">Sign Up</button>
          <button onClick={() => navigate('/login')} className="btn-login">Login</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <img src={flexroomWhite} alt="FlexRoom Logo" className="hero-logo-img" />
          <p className="hero-tagline">An Academic Workspace and Evaluation System</p>
        </div>
      </header>

      {/* Center Content Section */}
      <main className="content-wrapper">
        <div className="about-container">
          <h2 className="about-heading">About Us</h2>
          <div className="about-text">
            <p>
              FlexRoom is an integrated academic workflow and evaluation system designed to 
              streamline the way institutions manage teaching, learning, and assessment. It brings 
              together students, instructors, and administrators on a single platform to ensure 
              clarity, consistency, and efficiency across all academic processes.
            </p>
            <p>
              Our platform simplifies course management, assignment tracking, grading, and 
              performance evaluation through an intuitive and structured interface. By 
              centralizing these functions, FlexRoom reduces administrative overhead while 
              enabling educators to focus on meaningful engagement and learning outcomes. 
              Students benefit from clear timelines, organized resources, and transparent 
              feedback that supports continuous improvement.
            </p>
            <p>
              FlexRoom is built with adaptability in mind, making it suitable for a wide range of 
              academic environments. Whether used for small classrooms or large institutions, it 
              supports scalable workflows that align with evolving educational needs.
            </p>
            <p>
              We are committed to improving academic productivity through reliable technology 
              and thoughtful design. FlexRoom empowers institutions to maintain high standards 
              of evaluation while fostering a more organized and collaborative learning experience.
            </p>
          </div>
        </div>
      </main>

      {/* Footer: Matches Topbar dimensions, color #5F5F5E */}
      <footer className="landing-footer">
        <p className="footer-credits">Developed by AAM Loug ®</p>
        <img src={flexroomCircle} alt="FR Logo" className="footer-logo-img" />
      </footer>
    </div>
  );
};

export default LandingPage;