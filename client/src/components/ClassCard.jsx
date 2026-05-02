// src/components/ClassCard.jsx
import React from 'react';
import styles from './ClassCard.module.css';

const ClassCard = ({ name, icon, color }) => {
    return (
        <div className={styles.card}>
            {/* Header */}
            <div className={styles.cardHeader} style={{ backgroundColor: color }}>
                <h3>{name}</h3>
            </div>
            
            {/* Body */}
            <div className={styles.cardBody}>
                <div className={styles.iconWrapper} style={{ color: color }}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default ClassCard;