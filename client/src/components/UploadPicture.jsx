import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUser } from 'react-icons/fa'; // Assuming FaUser for placeholder
import '../components/auth/auth.css'; 
import LogoImage from '../components/assets/Flexroom-white.png';

const UploadPicture = () => {
    const navigate = useNavigate();
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    return (
        <div className="container-fluid d-flex justify-content-center align-items-center auth-background vh-100">
            <FaArrowLeft className="back-arrow-extreme" onClick={() => navigate(-1)} />

            <form className="auth-form p-5 text-center">
                <h1 className="login-heading mb-4">Upload New Picture</h1>

                {/* Preview Circle */}
                <div className="profile-upload-circle mb-4">
                    {preview ? (
                        <img src={preview} alt="Profile" className="preview-img" />
                    ) : (
                        <FaUser className="placeholder-icon" />
                    )}
                </div>

                {/* Hidden Input & Trigger Button */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }} 
                    accept="image/*"
                />
                
                <div className="d-grid gap-2 mb-5">
                    <button 
                        type="button" 
                        className="btn-auth rounded-pill" 
                        onClick={() => fileInputRef.current.click()}
                    >
                        Upload Picture
                    </button>
                </div>

                <img src={LogoImage} alt="FlexRoom Logo" className="auth-logo-img" />
            </form>
        </div>
    );
};

export default UploadPicture;