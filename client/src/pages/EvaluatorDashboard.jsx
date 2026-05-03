import React from 'react';
import { Link } from 'react-router-dom';
import ClassCard from '../components/ClassCard';
import { classList } from '../data/ClassData';
import styles from '../components/DashboardLayout.module.css';

const defaultClassContext = {
    courseTitle: 'Operating Systems',
    courseCode: 'BSCS-4J',
};

export default function EvaluatorDashboard() {
    return (
        <div className={styles.dashboardContainer}>
            <h1>My Classes</h1>
            <div className={styles.grid}>
                {classList.map((cls) => (
                    <ClassCard key={cls.id} {...cls} />
                ))}
            </div>
            <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <Link
                    to="/create-doc-assignment"
                    state={defaultClassContext}
                    className="btn btn-lg"
                    style={{ background: '#6a714b', color: '#fff', borderRadius: 999 }}
                >
                    New document assignment
                </Link>
                <Link
                    to="/create-code-assignment"
                    state={defaultClassContext}
                    className="btn btn-lg"
                    style={{ background: '#6a714b', color: '#fff', borderRadius: 999 }}
                >
                    New code assignment
                </Link>
            </div>
        </div>
    );
}
