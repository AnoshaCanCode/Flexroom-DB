import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PeoplePage.module.css';

const SubmissionsPage = () => {
    const navigate = useNavigate();

    // Section 1: Submissions Data (Only S.No and Name)
    const pendingSubmissions = {
        title: 'Submissions',
        data: [
            { id: 1, name: 'Anosha Asher' },
            { id: 2, name: 'Amal Fazeel' },
            { id: 3, name: 'Muhammad Ibrahim' },
            { id: 4, name: 'Faiqa Qureshi' },
        ]
    };

    // Section 2: Marked Data (S.No, Name, and Marks)
    const markedSubmissions = {
        title: 'Marked',
        data: [
            { id: 1, name: 'Ali Ahsan', marks: '18/20' },
            { id: 2, name: 'Zainab Ali', marks: '15/20' },
            { id: 3, name: 'Mustafa Khan', marks: '19/20' },
        ]
    };

    return (
        <div className={styles.pageContainer}>
            {/* --- SUBMISSIONS SECTION --- */}
            <div className={styles.headerContainer}>
                <h1 className={styles.classTitle}>{pendingSubmissions.title}</h1>
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th style={{ width: '80px' }}>S.No#</th>
                        <th>Name</th>
                    </tr>
                </thead>
                <tbody>
                    {pendingSubmissions.data.map((student) => (
                        <tr key={student.id}>
                            <td>{student.id}.</td>
                            <td>{student.name}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ marginTop: '40px' }}></div>

            {/* --- MARKED SECTION --- */}
            <div className={styles.headerContainer}>
                <h1 className={styles.classTitle}>{markedSubmissions.title}</h1>
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th style={{ width: '80px' }}>S.No#</th>
                        <th>Name</th>
                        <th style={{ width: '150px' }}>Marks</th>
                    </tr>
                </thead>
                <tbody>
                    {markedSubmissions.data.map((student) => (
                        <tr key={student.id}>
                            <td>{student.id}.</td>
                            <td>{student.name}</td>
                            <td>{student.marks}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SubmissionsPage;