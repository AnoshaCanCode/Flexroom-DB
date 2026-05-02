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

    return (
        <div className="container-fluid d-flex justify-content-center align-items-center auth-background vh-100">
            <FaArrowLeft className="back-arrow-extreme" onClick={() => navigate('/')} />

            <form className="auth-form p-5 text-center">

                <h1 className="login-heading mb-5">Sign Up</h1>

                {/* Name Input */}
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

                {/* Email Input */}
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

                {/* Password Input */}
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

                {/* Buttons */}
                <div className="d-grid gap-2 mb-5">
                    <button 
                        type="button" 
                        className={`btn-auth rounded-pill ${userRole === 'student' ? 'active' : ''}`}
                        onClick={() => setUserRole('student')}
                    >
                        Sign Up As Student
                    </button>
                    <button 
                        type="button" 
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