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

    const handleSignup = async (e) => {
    e.preventDefault(); 
    
    if (!name.trim() || !email.trim() || !password.trim() || !userRole) {
        alert('Please fill in all fields and select a role.');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/users/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: name.trim(), 
                email: email.trim(), 
                password: password, 
                role: userRole 
            }) 
        });

        const data = await response.json();

        if (response.ok) {
            alert("Signup successful! Please log in.");
            navigate('/login');
        } else {
            alert(data.message || "Signup failed");
        }
    } catch (error) {
        console.error("Signup error:", error);
        alert("Server connection failed. Check if backend is running on port 5000.");
    }
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