import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { FaLock, FaArrowLeft, FaEnvelope } from 'react-icons/fa';
import '../components/auth/auth.css'; 
import LogoImage from '../components/assets/Flexroom-white.png';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleChangePassword = (e) => {
        e.preventDefault();
        // Add your logic here
        console.log("Changing password...");
        // After success, maybe navigate back
        // navigate('/student/settings');
    };

    return (
        <div className="container-fluid d-flex justify-content-center align-items-center auth-background vh-100">
            {/* Navigates to the previous page (Settings) */}
            <FaArrowLeft className="back-arrow-extreme" onClick={() => navigate(-1)} />

            <form className="auth-form p-5 text-center" onSubmit={handleChangePassword}>
                <h1 className="login-heading mb-5">Change Password</h1>

                {/* Email */}
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

                {/* Old Password */}
                <div className="input-container mb-4">
                    <input 
                        type="password" 
                        className="auth-input rounded-pill" 
                        placeholder="Old Password" 
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                    />
                    <FaLock className="input-icon" />
                </div>

                {/* New Password */}
                <div className="input-container mb-5">
                    <input 
                        type="password" 
                        className="auth-input rounded-pill" 
                        placeholder="New Password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <FaLock className="input-icon" />
                </div>

                {/* Submit Button */}
                <div className="d-grid gap-2 mb-5">
                    <button type="submit" className="btn-auth rounded-pill">
                        Change Password
                    </button>
                </div>

                <img src={LogoImage} alt="FlexRoom Logo" className="auth-logo-img" />
            </form>
        </div>
    );
};

export default ChangePassword;