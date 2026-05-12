import React, { useState } from 'react';
import './auth.css'; 
import LogoImage from '../assets/Flexroom-white.png';
import { useNavigate } from 'react-router-dom'; 
import { FaArrowLeft, FaEnvelope, FaLock } from 'react-icons/fa'; 

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userRole, setUserRole] = useState('');

    const handleLogin = async (e, selectedRole) => {
        if (e) e.preventDefault();
        
        try {
            const response = await fetch('http://localhost:5000/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role: selectedRole }) 
            });

            const data = await response.json();

            if (response.ok) {
                // Storing user in sessionStorage to satisfy ProtectedRoute
                sessionStorage.setItem('flexroom_token', data.token);
                sessionStorage.setItem('flexroom_user', JSON.stringify(data.user));

                // Navigate based on the role
                navigate(data.user.role === 'student' ? '/student' : '/evaluator');
            } else {
                alert(data.message || data.error || "Login failed");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            alert("Server connection failed. Check if backend is running on port 5000.");
        }
    };

    return (
        <div className="container-fluid d-flex justify-content-center align-items-center auth-background vh-100">
            <FaArrowLeft className="back-arrow-extreme" onClick={() => navigate('/')} /> 
            <form className="auth-form p-5 text-center" onSubmit={(e) => e.preventDefault()}>
                <h1 className="login-heading mb-5">Login</h1>

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
                        placeholder="Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <FaLock className="input-icon" />
                </div>

                <div className="text-start mb-5">
                    <button type="button" className="forgot-password bg-transparent border-0 p-0">Forgot Password?</button>
                </div>

                <div className="d-grid gap-2 mb-5">
                    <button
                        type="button"
                        className={`btn-auth rounded-pill ${userRole === 'student' ? 'active' : ''}`}
                        onClick={(e) => {
                            setUserRole('student');
                            handleLogin(e, 'student');
                        }}
                    >
                        Login As Student
                    </button>
                    <button
                        type="button"
                        className={`btn-auth rounded-pill ${userRole === 'evaluator' ? 'active' : ''}`}
                        onClick={(e) => {
                            setUserRole('evaluator');
                            handleLogin(e, 'evaluator');
                        }}
                    >
                        Login As Evaluator
                    </button>
                </div>

                <div className="mt-5">
                    <img src={LogoImage} alt="FlexRoom Logo" className="auth-logo-img" />
                </div>
            </form>
        </div>
    );
};

export default Login;