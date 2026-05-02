import React from 'react';
import { HiHome, HiCalendar, HiUserGroup, HiCog, HiLogout } from 'react-icons/hi';
import styles from './Sidebar.module.css';
import CircleLogo from './assets/round-green.png';

const Sidebar = ({ isOpen, userRole }) => {
    
    // 1. Group items that stay at the top
    const mainNav = [
        { name: 'Home', icon: <HiHome /> },
        userRole === 'student' // Show Calendar for Student, People for Evaluator
            ? { name: 'Calendar', icon: <HiCalendar /> } 
            : { name: 'People', icon: <HiUserGroup /> }
    ];

    // 2. Group items for the bottom
    const footerNav = [
        { name: 'Settings', icon: <HiCog /> },
        { name: 'Logout', icon: <HiLogout /> }
    ];

    return (
        <nav className={`${styles.sidebar} ${!isOpen ? styles.closed : ''}`}>
            {/* Top Section */}
            <div className={styles.topSection}>
                <ul className={styles.navMenu}>
                    {mainNav.map((item) => (
                        <li key={item.name} className={styles.navItem}>
                            <span className={styles.icon}>{item.icon}</span>
                            {/* Only show text if sidebar is open */}
                            {isOpen && <span>{item.name}</span>}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Bottom Section */}
            <div className={styles.bottomSection}>
                <ul className={styles.navMenu}>
                    {footerNav.map((item) => (
                        <li key={item.name} className={styles.navItem}>
                            <span className={styles.icon}>{item.icon}</span>
                            {isOpen && <span>{item.name}</span>}
                        </li>
                    ))}
                </ul>
                {/* Logo at the very bottom */}
                <div className={styles.logoContainer}>
                    <img src={CircleLogo} alt="Logo" className={styles.logo} />
                </div>
            </div>
        </nav>
    );
};

export default Sidebar;