import React from 'react';
import { HiHome, HiCalendar, HiUserGroup, HiCog, HiLogout } from 'react-icons/hi';
import styles from './Sidebar.module.css';
import CircleLogo from './assets/round-green.png';
import { Link } from 'react-router-dom'; // 1. Import Link

const Sidebar = ({ isOpen, userRole }) => {
    
    // 1. Group items that stay at the top
    // Added 'path' to these objects
    const mainNav = [
        { name: 'Home', icon: <HiHome />, path: '/student' }, // Change '/home' to '/student'
        userRole === 'student'
            ? { name: 'Calendar', icon: <HiCalendar />, path: '/student/calendar' } // Updated path
            : { name: 'People', icon: <HiUserGroup />, path: '/evaluator/people' }
    ];

    // 2. Group items for the bottom
    const footerNav = [
        { name: 'Settings', icon: <HiCog />, path: '/student/settings' }, // Updated path
        { name: 'Logout', icon: <HiLogout />, path: '/logout' }
    ];

    return (
        <nav className={`${styles.sidebar} ${!isOpen ? styles.closed : ''}`}>
            {/* Top Section */}
            <div className={styles.topSection}>
                <ul className={styles.navMenu}>
                    {mainNav.map((item) => (
                        <li key={item.name} className={styles.navItem}>
                            {/* Wrap your icon and text in the Link component */}
                            <Link to={item.path} className={styles.navLink}>
                                <span className={styles.icon}>{item.icon}</span>
                                {/* Only show text if sidebar is open */}
                                {isOpen && <span>{item.name}</span>}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Bottom Section */}
            <div className={styles.bottomSection}>
                <ul className={styles.navMenu}>
                    {footerNav.map((item) => (
                        <li key={item.name} className={styles.navItem}>
                            {/* Wrap your icon and text in the Link component */}
                            <Link to={item.path} className={styles.navLink}>
                                <span className={styles.icon}>{item.icon}</span>
                                {isOpen && <span>{item.name}</span>}
                            </Link>
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