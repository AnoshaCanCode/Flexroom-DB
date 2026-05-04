import React from 'react';
import { FaUserCircle } from 'react-icons/fa'; 
import { HiMenu } from 'react-icons/hi'; // 1. Added import
import styles from './Topbar.module.css';
import LogoImage from './assets/Flexroom-white.png';

const Topbar = ({ userName, toggleSidebar, courseTitle, courseCode }) => {
    const showCourseBand = Boolean(courseTitle || courseCode);

    return (
        <header className={styles.topbarWrap}>
            <div className={styles.topbar}>
                <div className={styles.leftSection}>
                    <button type="button" onClick={toggleSidebar} className={styles.menuButton}>
                        <HiMenu size={32} />
                    </button>
                    <img src={LogoImage} alt="Logo" className={styles.logo} />
                </div>

                <div className={styles.rightSection}>
                    <span className={styles.greeting}>Hi {userName}!</span>
                    <FaUserCircle size={32} />
                </div>
            </div>

            {showCourseBand && (
                <div className={styles.courseBand}>
                    {courseTitle && <h1 className={styles.courseTitle}>{courseTitle}</h1>}
                    {courseCode && <p className={styles.courseCode}>{courseCode}</p>}
                </div>
            )}
        </header>
    );
};

export default Topbar;