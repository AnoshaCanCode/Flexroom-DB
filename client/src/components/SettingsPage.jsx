import React,  { useState }  from 'react';
import { useNavigate } from 'react-router-dom';
import flexroomLogo from '../components/assets/round-green.png'; 
import styles from './SettingsPage.module.css';
import { Pencil } from 'lucide-react'; 

const SettingsPage = () => {
  const navigate = useNavigate();

  // Your handler functions
  // Updated handler to navigate to your new page
  const handleEditProfile = () => navigate('/upload-picture');
  const handleChangePassword = () => navigate('/settings/change-password');
  const handleLogout = () => console.log("User logging out...");

  return (
    // NO <DashboardLayout> WRAPPER HERE. 
    // Just the container for your settings page.
    <div className={styles.settingsPageContainer}>
      <div className={styles.mainSettingsContent}>
        
        <div className={styles.profileSection}>
          <div className={styles.profileImageWrapper}>
            <div className={styles.largeProfileIcon}>👤</div>
            {/* Now triggering the navigation */}
            <button className={styles.editProfileBtn} onClick={handleEditProfile}>
              <Pencil size={18} strokeWidth={2.5} color="#4b5320" />
            </button>
          </div>
        </div>

        <div className={styles.actionsSection}>
          <button 
             className={styles.primaryActionBtn} 
            onClick={() => navigate('/change-password')} // Update this path
            >
             Change Password
            </button>
          <button className={styles.primaryActionBtn} onClick={handleLogout}>
            Log Out
          </button>
        </div>

        <div className={styles.footerSection}>
           <img src={flexroomLogo} alt="Flexroom Logo" className={styles.footerLogoImg} />
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;