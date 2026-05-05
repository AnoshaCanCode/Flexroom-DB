import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Layout from './Layout';
import RubricPanel from './RubricPanel';
import DocumentViewer from './DocumentViewer';
import CodeViewer from './CodeViewer';
import styles from './EvaluationInterface.module.css';
import { downloadAssessmentKey, fetchSubmissionFileBlob } from '../../api/assignmentsApi';
import { getStoredUser } from '../auth/ProtectedRoute';

const mockDocData = {
    title: 'Assignment 1',
    course: { title: 'Operating Systems', code: 'BSCS-4J' },
    type: 'document',
    rubric: [
        { id: 'Q1', criteria: 'Q1', maxMarks: 2 },
        { id: 'Q2', criteria: 'Q2', maxMarks: 2 },
        { id: 'Q3', criteria: 'Q3', maxMarks: 3 },
        { id: 'Q4', criteria: 'Q4', maxMarks: 2 },
        { id: 'Q5', criteria: 'Q5', maxMarks: 3 },
        { id: 'Q6', criteria: 'Q6', maxMarks: 3 },
    ],
};

const mockCodeData = {
    title: 'Assignment 2',
    course: { title: 'Operating Systems', code: 'BSCS-4J' },
    type: 'code',
    submissionCode: `#include <stdio.h>\nint main() {\n  // Student Code\n}`,
    keyCode: `#include <stdio.h>\nint main() {\n  // Key Code\n}`,
    rubric: [
        { id: 1, criteria: 'Precision', maxMarks: 33 },
        { id: 2, criteria: 'Logic', maxMarks: 34 },
        { id: 3, criteria: 'Correct Datastructure', maxMarks: 33 },
    ],
    testCases: [{ data: 'x = 3,\ny = -2' }, { data: 'x = 0,\ny = -2' }, { data: 'x = -5,\ny = -2' }],
};

function EvaluationInterface() {
    const { assignmentId, studentId } = useParams();
    const location = useLocation();
    const assignmentType = location.state?.type || 'document';
    const submissionId = location.state?.submissionId;

    const baseData = assignmentType === 'code' ? mockCodeData : mockDocData;

    const [marksObtained, setMarksObtained] = useState({});
    const [docUrls, setDocUrls] = useState({ submission: null, key: null });
    const [docLoading, setDocLoading] = useState(false);
    const [docError, setDocError] = useState(null);
    const blobRef = useRef({ submission: null, key: null });

    useEffect(() => {
        if (assignmentType !== 'document' || !assignmentId) return undefined;

        let cancelled = false;

        (async () => {
            setDocLoading(true);
            setDocError(null);
            try {
                let subUrl;
                if (submissionId) {
                    const subBlob = await fetchSubmissionFileBlob(submissionId);
                    if (!cancelled) subUrl = URL.createObjectURL(subBlob);
                }
                const keyBlob = await downloadAssessmentKey(assignmentId);
                const keyUrl = !cancelled ? URL.createObjectURL(keyBlob) : null;
                if (cancelled) {
                    if (subUrl) URL.revokeObjectURL(subUrl);
                    if (keyUrl) URL.revokeObjectURL(keyUrl);
                    return;
                }
                blobRef.current = { submission: subUrl || null, key: keyUrl };
                setDocUrls(blobRef.current);
            } catch (e) {
                if (!cancelled) setDocError(e.message || 'Could not load documents');
            } finally {
                if (!cancelled) setDocLoading(false);
            }
        })();

        return () => {
            cancelled = true;
            if (blobRef.current.submission) URL.revokeObjectURL(blobRef.current.submission);
            if (blobRef.current.key) URL.revokeObjectURL(blobRef.current.key);
            blobRef.current = { submission: null, key: null };
        };
    }, [assignmentType, assignmentId, submissionId]);

    const handleMarkChange = (id, value) => {
        setMarksObtained((prev) => ({ ...prev, [id]: value }));
    };

    const rubricMaxSum = baseData.rubric.reduce((sum, item) => sum + item.maxMarks, 0);

    const displayName = getStoredUser()?.name || 'Evaluator';

    return (
        <Layout sidebarVariant="evaluator" displayName={displayName}>
            <div className={styles.courseBanner}>
                <h2>{baseData.course.title}</h2>
                <p>{baseData.course.code}</p>
            </div>

            <div className={styles.evaluationGrid}>
                <main className={styles.mediaArea}>
                    {assignmentType === 'code' ? (
                        <CodeViewer
                            title={baseData.title}
                            submissionCode={mockCodeData.submissionCode}
                            keyCode={mockCodeData.keyCode}
                            testCases={mockCodeData.testCases}
                        />
                    ) : (
                        <>
                            {docLoading && <p>Loading submission and key…</p>}
                            {docError && (
                                <p style={{ color: '#c62828' }}>{docError}</p>
                            )}
                            {!docLoading && !docError && (
                                <DocumentViewer
                                    title={`${baseData.title} · student ${studentId}`}
                                    submissionUrl={docUrls.submission}
                                    keyUrl={docUrls.key}
                                />
                            )}
                        </>
                    )}
                </main>

                <aside className={styles.rubricArea}>
                    <RubricPanel
                        rubric={baseData.rubric}
                        maxAssessmentMarks={rubricMaxSum}
                        marksObtained={marksObtained}
                        onMarkChange={handleMarkChange}
                    />
                    <button type="button" className={styles.submitMarksBtn}>
                        Submit Marks
                    </button>
                </aside>
            </div>
        </Layout>
    );
}

export default EvaluationInterface;
