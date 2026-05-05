import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AssignmentsList from '../AssignmentsList';
import {
    downloadAssessmentQuestion,
    fetchClassAssessments,
} from '../../api/assignmentsApi';
import styles from '../DashboardLayout.module.css';

const StudentClassView = () => {
    const { classId } = useParams();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(() => {
        if (!classId) return;
        setLoading(true);
        setError(null);
        fetchClassAssessments(Number(classId))
            .then(setAssignments)
            .catch((e) => setError(e.message || 'Failed to load assignments'))
            .finally(() => setLoading(false));
    }, [classId]);

    useEffect(() => {
        load();
    }, [load]);

    const handleTitleDownload = async (a) => {
        try {
            const blob = await downloadAssessmentQuestion(a.assessmentID);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${a.title || 'question'}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert(e.message || 'Download failed');
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.headerRow}>
                <h1 className={styles.title}>My Assignments</h1>
            </div>

            <AssignmentsList
                classId={classId}
                assignments={assignments}
                loading={loading}
                error={error}
                onDownloadQuestion={handleTitleDownload}
            />
        </div>
    );
};

export default StudentClassView;
