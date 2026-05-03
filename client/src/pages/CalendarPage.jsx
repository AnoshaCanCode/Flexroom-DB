import React, { useState } from 'react';
import styles from './CalendarPage.module.css';

// 1. ADD DATA BACK: Ensure your deadline data is available
const deadlineData = {
    "2026-05-05": [
        { class: "OS", title: "Assignment 1: Fork" },
        { class: "SDA", title: "Quiz: SOLID Principles" },
        { class: "DB", title: "Class Activity: ER Model" }
    ],
    "2026-05-07": [
        { class: "SDA", title: "Project Proposal Submission" }
    ]
};

const CalendarPage = () => {
    const today = new Date();
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [selectedDeadlineDate, setSelectedDeadlineDate] = useState(null);

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];

    const daysArray = Array.from({ length: firstDayOfMonth + daysInMonth }, (_, i) => 
        i < firstDayOfMonth ? null : i - firstDayOfMonth + 1
    );

    const handleDateClick = (day) => {
        if (!day) return;
        // Format to YYYY-MM-DD
        const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSelectedDeadlineDate(dateKey);
    };

    return (
        <div className={styles.calendarContainer}>
            {/* LEFT PANEL: Dynamic Content */}
            <div className={styles.deadlinePanelWrapper}>
                {selectedDeadlineDate ? (
                 <div className={styles.deadlineCard}>
                      <div className={styles.deadlineDateHeader}>{selectedDeadlineDate}</div>
        
                      {deadlineData[selectedDeadlineDate] ? (
                           deadlineData[selectedDeadlineDate].map((item, i) => (
                             <div key={i} className={styles.assignmentItem}>
                                  <span className={styles.classBadge}>{item.class}</span>
                                  <span className={styles.assignmentTitle}>{item.title}</span>
                             </div>
                          ))
                     ) : (
                  <p style={{ color: '#888' }}>No deadlines for this date.</p>
                 )}
                </div>
                ) : (
                <div className={styles.selectDateHelp}>
                      Select date to view deadlines →
                </div>
            )}
            </div>

            {/* RIGHT PANEL: Live Calendar */}
            <div className={styles.calendarWrapper}>
                <div className={styles.calendarHeader}>
                    <span className={styles.navArrow} onClick={() => viewMonth === 0 ? (setViewMonth(11), setViewYear(viewYear - 1)) : setViewMonth(viewMonth - 1)}>❮</span>
                    <span className={styles.headerText}>{monthNames[viewMonth]} {viewYear}</span>
                    <span className={styles.navArrow} onClick={() => viewMonth === 11 ? (setViewMonth(0), setViewYear(viewYear + 1)) : setViewMonth(viewMonth + 1)}>❯</span>
                </div>

                <div className={styles.daysGrid}>
                    {daysArray.map((day, index) => {
                        // Logic to identify Today
                        const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                        
                        return (
                            <div 
                                key={index} 
                                className={`${styles.day} ${isToday ? styles.currentDay : ''}`}
                                onClick={() => handleDateClick(day)}
                            >
                                {day}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarPage;