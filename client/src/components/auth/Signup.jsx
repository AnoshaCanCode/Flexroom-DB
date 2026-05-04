import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { FaUser, FaLock, FaArrowLeft, FaEnvelope } from 'react-icons/fa';
import './auth.css';
import LogoImage from '../assets/Flexroom-white.png';

const Signup = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userRole, setUserRole] = useState('');

    const handleSignup = (e) => {
    e.preventDefault(); 
    
    // 2. Validation
    if (!name.trim() || !email.trim() || !password.trim()) {
        alert('Please fill in name, email, and password first.');
        return;
    }
    if (!userRole) {
        alert('Please choose whether you are signing up as a Student or Evaluator.');
        return;
    }

    try {
        window.localStorage.setItem('flexroomDisplayName', name.trim());
        if (userRole === 'evaluator') {
            window.localStorage.setItem('flexroomDisplayNameEvaluator', name.trim());
        }
    } catch (_) {
        // ignore storage issues in local preview
    }

    // 3. Use the userRole state variable directly
    navigate(userRole === 'student' ? '/student' : '/evaluator');
};

    return (
        <div className="container-fluid d-flex justify-content-center align-items-center auth-background vh-100">
            <FaArrowLeft className="back-arrow-extreme" onClick={() => navigate('/')} />

            {/* Changed to onSubmit={handleSignup} to match Login pattern */}
            <form className="auth-form p-5 text-center" onSubmit={handleSignup}>

                <h1 className="login-heading mb-5">Sign Up</h1>

                <div className="input-container mb-4">
                    <input 
                        type="text" 
                        className="auth-input rounded-pill" 
                        placeholder="Name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <FaUser className="input-icon" />
                </div>

                <div className="input-container mb-4">
                    <input 
                        type="email" 
                        className="auth-input rounded-pill" 
                        placeholder="Email Address" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <FaEnvelope className="input-icon" />
                </div>

                <div className="input-container mb-3">
                    <input 
                        type="password" 
                        className="auth-input rounded-pill" 
                        placeholder="Create Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <FaLock className="input-icon" />
                </div>

                <div className="d-grid gap-2 mb-5">
                    <button 
                        type="submit" 
                        className={`btn-auth rounded-pill ${userRole === 'student' ? 'active' : ''}`}
                        onClick={() => setUserRole('student')}
                    >
                        Sign Up As Student
                    </button>
                    <button 
                        type="submit" 
                        className={`btn-auth rounded-pill ${userRole === 'evaluator' ? 'active' : ''}`}
                        onClick={() => setUserRole('evaluator')}
                    >
                        Sign Up As Evaluator
                    </button>
                </div>

                <img src={LogoImage} alt="FlexRoom Logo" className="auth-logo-img" />
            </form>
        </div>
    );
};

export default Signup;