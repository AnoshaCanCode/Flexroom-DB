import React, { useState } from 'react';
import './auth.css'; 

import LogoImage from '../assets/Flexroom-white.png';
// Import icons
import { useNavigate } from 'react-router-dom'; // Add for back arrow
import { FaArrowLeft, FaEnvelope, FaLock } from 'react-icons/fa'; 

const Login = () => {
    const navigate = useNavigate(); //added for arrow
    // state management; to remember what the user enters
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userRole, setUserRole] = useState(''); // Stores 'student' or 'evaluator'

    //when the user tries to log in:
    const handleLogin = (e, nextRole = userRole) => {
        e.preventDefault(); //prevents page from reloading
        
        //capture data
        console.log("LOGIN ATTEMPT:");
        console.log("Email:", email);
        console.log("Password:", password);
        console.log("Attempting to Login As:", nextRole);

        if (!nextRole) {
            alert("Please select if you are logging in as a Student or Evaluator.");
            return;
        }

        try {
            const rememberedName = window.localStorage.getItem(
                nextRole === 'student' ? 'flexroomDisplayName' : 'flexroomDisplayNameEvaluator'
            );
            if (!rememberedName && nextRole === 'student') {
                window.localStorage.setItem('flexroomDisplayName', 'Apple');
            }
            if (!rememberedName && nextRole === 'evaluator') {
                window.localStorage.setItem('flexroomDisplayNameEvaluator', 'Hayyan');
            }
        } catch (_) {
            // ignore storage issues in local preview
        }

        // --- WHERE THE BACKEND VERIFICATION CALL WILL GO LATER ---
        // (Next Victory: fetch('/api/login', { method: 'POST', ... }))
        navigate(nextRole === 'student' ? '/student' : '/evaluator');
    };

    return (
        <div className="container-fluid d-flex justify-content-center align-items-center auth-background vh-100">
            <FaArrowLeft className="back-arrow-extreme" onClick={() => navigate('/')} /> 
            <form className="auth-form p-5 text-center" onSubmit={handleLogin}>
                <h1 className="login-heading mb-5">Login</h1>

                {/* Email with Icon */}
                <div className="input-container mb-4">
                    <input 
                        type="email" 
                        className="auth-input rounded-pill" 
                        placeholder="Email Address" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} //updates the state; when the user types a letter, that new string of letters goes inside email bucket required
                        required
                    />
                    <FaEnvelope className="input-icon" />
                </div>

                {/* Password with Icon */}
                <div className="input-container mb-3">
                    <input 
                        type="password" 
                        className="auth-input rounded-pill" 
                        placeholder="Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <FaLock className="input-icon" />
                </div>

                {/* (Forgot Password link) */}
                <div className="text-start mb-5">
                    <button type="button" className="forgot-password bg-transparent border-0 p-0">Forgot Password?</button>

                </div>

                {/* 3. The Role/Submit Buttons */}
                {/* Note how we update the 'userRole' state on click, but don't submit yet.
                    To follow your design of specific buttons for roles: */}
                <div className="d-grid gap-2 mb-5">
                    <button 
                        type="submit" 
                        className={`btn-auth rounded-pill ${userRole === 'student' ? 'active' : ''}`}
                        onClick={(e) => {
                            setUserRole('student');
                            handleLogin(e, 'student');
                        }}
                    >
                        Login As Student
                    </button>
                    <button 
                        type="submit" 
                        className={`btn-auth rounded-pill ${userRole === 'evaluator' ? 'active' : ''}`}
                        onClick={(e) => {
                            setUserRole('evaluator');
                            handleLogin(e, 'evaluator');
                        }}
                    >
                        Login As Evaluator
                    </button>
                </div>

                {/* 4. The Logo */}
                <div className="mt-5">
                    <img 
                        src={LogoImage} 
                        alt="FlexRoom Logo" 
                        className="auth-logo-img" 
                        // Note: If it looks too big/small, we can fix that in CSS
                    />
                </div>

            </form>
        </div>
    );
};

export default Login;