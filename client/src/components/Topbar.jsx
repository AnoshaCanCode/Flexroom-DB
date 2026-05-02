import React from 'react';
import { FaUserCircle } from 'react-icons/fa'; 
import { HiMenu } from 'react-icons/hi'; // 1. Added import
import styles from './Topbar.module.css';
import LogoImage from './assets/Flexroom-white.png';

// addtoggleSidebar to the props here
const Topbar = ({ userName, toggleSidebar }) => {
    return (
        <header className={styles.topbar}>
            {/* Left Side: Burger Menu + Logo */}
            <div className={styles.leftSection}>
                <button onClick={toggleSidebar} className={styles.menuButton}>
                    <HiMenu size={32} />
                </button>
                <img src={LogoImage} alt="Logo" className={styles.logo} />
            </div>

            {/* Right Side: User Greeting */}
            <div className={styles.rightSection}>
                <span className={styles.greeting}>Hi {userName}!</span>
                <FaUserCircle size={32} /> {/* Increased size */}
            </div>
        </header>
    );
};

export default Topbar;