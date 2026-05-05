import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Layout from './Layout';
import RubricPanel from './RubricPanel';
import styles from './EvaluationInterface.module.css';
import {
    downloadAssessmentKey,
    fetchSubmissionFileBlob,
    finalizeEvaluatorGrade,
    getEvaluatorMarkingContext,
    postAutograde,
    postPlagiarismRun,
} from '../../api/assignmentsApi';
import { getStoredUser } from '../auth/ProtectedRoute';

/** Shared marking UI — student self-eval (`panelTitle`) vs evaluator (`panelTitle="Rubric"`). */
export function MarkingWorkspace({
    panelTitle,
    courseTitle,
    sectionLabel,
    assignmentTitle,
    isDocumentPresentation,
    submissionCodeOrPlaceholder,
    keyCodeOrPlaceholder,
    submissionPdfUrl,
    keyPdfUrl,
    rubric,
    testCases,
    marksObtained,
    onMarkChange,
    testStates,
    onToggleTestCase,
    readOnlyTestToggles,
    maxAssessmentMarks,
    headerActions,
    footerActions,
}) {
    const showTests =
        Array.isArray(testCases) &&
        testCases.length > 0 &&
        !isDocumentPresentation;

    const tcKeys = useMemo(
        () =>
            testCases.map((tc, i) =>
                tc.id != null ? String(tc.id) : String(i),
            ),
        [testCases],
    );

    return (
        <>
            <div className={styles.courseBanner}>
                <h2>{courseTitle}</h2>
                <p>{sectionLabel}</p>
            </div>

            <div className={styles.evaluationGrid}>
                <main className={styles.mediaArea}>
                    <div className={styles.rubricHeader} style={{ marginBottom: 12 }}>
                        <h3 style={{ margin: 0 }}>{assignmentTitle}</h3>
                        {headerActions}
                    </div>

                    {!isDocumentPresentation ? (
                        <div className={styles.dualPane}>
                            <div className={styles.pane}>
                                <div className={styles.paneHeader}>Submission</div>
                                <pre className={styles.codeBlock}>
                                    <code>{submissionCodeOrPlaceholder}</code>
                                </pre>
                            </div>
                            <div className={styles.pane}>
                                <div className={styles.paneHeader}>Key</div>
                                <pre className={styles.codeBlock}>
                                    <code>{keyCodeOrPlaceholder}</code>
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.dualPane}>
                            <div className={styles.pane}>
                                <div className={styles.paneHeader}>Submission</div>
                                <iframe
                                    title="Submission"
                                    src={submissionPdfUrl || ''}
                                    className={styles.docFrame}
                                />
                            </div>
                            <div className={styles.pane}>
                                <div className={styles.paneHeader}>Key</div>
                                <iframe title="Key" src={keyPdfUrl || ''} className={styles.docFrame} />
                            </div>
                        </div>
                    )}
                </main>

                <aside className={styles.rubricArea}>
                    <RubricPanel
                        panelTitle={panelTitle}
                        rubric={rubric}
                        marksObtained={marksObtained}
                        onMarkChange={onMarkChange}
                        maxAssessmentMarks={maxAssessmentMarks}
                    />

                    {showTests && (
                        <div className={styles.testCasesPanel}>
                            <div className={styles.sideEvalHeader}>Test Cases</div>
                            {testCases.map((tc, i) => {
                                const key = tcKeys[i];
                                const st = testStates[key];
                                const circleClass =
                                    st === true
                                        ? styles.tcCirclePass
                                        : st === false
                                          ? styles.tcCircleFail
                                          : styles.tcCircleNeutral;
                                const label =
                                    tc.inputText != null ? tc.inputText : tc.label || '';
                                return (
                                    <div key={key} className={styles.testCaseRow}>
                                        <button
                                            type="button"
                                            className={`${styles.tcCircleBtn} ${circleClass}`}
                                            disabled={readOnlyTestToggles}
                                            onClick={() => onToggleTestCase?.(key)}
                                            aria-label={`Toggle test case ${i + 1}`}
                                        >
                                            {i + 1}
                                        </button>
                                        <pre className={styles.testCaseSnippet}>{label}</pre>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {footerActions}
                </aside>
            </div>
        </>
    );
}

export default function EvaluatorMarkingPage() {
    const { assignmentId, studentId } = useParams();
    const location = useLocation();
    const submissionId = location.state?.submissionId;

    const displayName = getStoredUser()?.name || 'Evaluator';

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ctx, setCtx] = useState(null);
    const [docUrls, setDocUrls] = useState({ submission: null, key: null });

    const [marksObtained, setMarksObtained] = useState({});
    const [feedback, setFeedback] = useState('');
    const [testStates, setTestStates] = useState({});
    const [plagiarism, setPlagiarism] = useState(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        if (!submissionId) {
            setError('Missing submission reference. Open this screen from the submissions list.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await getEvaluatorMarkingContext(submissionId);
            setCtx(data);
            const init = {};
            (data.rubric || []).forEach((r) => {
                init[r.id] = '';
            });
            setMarksObtained(init);
            if (data.grade?.feedback) setFeedback(data.grade.feedback);
        } catch (e) {
            setError(e.message || 'Failed to load marking context');
        } finally {
            setLoading(false);
        }
    }, [submissionId]);

    useEffect(() => {
        load();
    }, [load]);

    const isDocPresentation =
        ctx &&
        (String(ctx.assessment?.type).toLowerCase() === 'document' ||
            /\.pdf$/i.test(ctx.submission?.fileName || ''));

    useEffect(() => {
        if (!ctx || !submissionId || !isDocPresentation) return undefined;
        let subUrl;
        let keyUrl;
        let cancelled = false;
        (async () => {
            try {
                const sb = await fetchSubmissionFileBlob(submissionId);
                const kb = await downloadAssessmentKey(ctx.assessment.assessmentID);
                if (cancelled) return;
                subUrl = URL.createObjectURL(sb);
                keyUrl = URL.createObjectURL(kb);
                setDocUrls({ submission: subUrl, key: keyUrl });
            } catch (e) {
                if (!cancelled) setError(e.message || 'Could not load PDF viewers');
            }
        })();
        return () => {
            cancelled = true;
            if (subUrl) URL.revokeObjectURL(subUrl);
            if (keyUrl) URL.revokeObjectURL(keyUrl);
        };
    }, [ctx, submissionId, isDocPresentation]);

    const toggleTest = useCallback((key) => {
        setTestStates((prev) => {
            const cur = prev[key];
            const next =
                cur === undefined ? true : cur === true ? false : undefined;
            return { ...prev, [key]: next };
        });
    }, []);

    const handleMarkChange = useCallback((id, value) => {
        setMarksObtained((prev) => ({ ...prev, [id]: value }));
    }, []);

    const sumMarks = useMemo(() => {
        if (!ctx?.rubric) return 0;
        return ctx.rubric.reduce((s, item) => {
            const v = Number(marksObtained[item.id]);
            return s + (Number.isFinite(v) ? v : 0);
        }, 0);
    }, [ctx, marksObtained]);

    const runPlagiarism = async () => {
        if (!submissionId) return;
        setBusy(true);
        try {
            const r = await postPlagiarismRun(submissionId);
            setPlagiarism(r);
        } catch (e) {
            alert(e.message || 'Plagiarism run failed');
        } finally {
            setBusy(false);
        }
    };

    const runAutograde = async () => {
        if (!submissionId) return;
        if (String(ctx?.assessment?.type).toLowerCase() === 'document') {
            alert('Autograde applies to code assignments only.');
            return;
        }
        setBusy(true);
        try {
            const r = await postAutograde(submissionId);
            const nextTc = {};
            (r.testResults || []).forEach((row, idx) => {
                const tc = ctx.testCases[idx];
                const key =
                    tc?.id != null ? String(tc.id) : String(idx);
                nextTc[key] = Boolean(row.passed);
            });
            setTestStates(nextTc);
            if (r.suggestedRubricMarks) {
                const merged = { ...marksObtained };
                Object.entries(r.suggestedRubricMarks).forEach(([k, v]) => {
                    merged[k] = String(v);
                });
                setMarksObtained(merged);
            }
        } catch (e) {
            alert(e.message || 'Autograde failed');
        } finally {
            setBusy(false);
        }
    };

    const finalizeGrades = async () => {
        if (!ctx) return;
        setBusy(true);
        try {
            await finalizeEvaluatorGrade({
                assessmentId: ctx.assessment.assessmentID,
                studentId: Number(studentId),
                totalMarks: sumMarks,
                feedback,
                detail: {
                    rubricMarks: marksObtained,
                    testCaseResults: testStates,
                    plagiarismSummary: plagiarism,
                },
            });
            alert('Grades finalized.');
        } catch (e) {
            alert(e.message || 'Could not save grades');
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <Layout sidebarVariant="evaluator" displayName={displayName}>
                <div className="p-4">Loading marking workspace…</div>
            </Layout>
        );
    }

    if (error || !ctx) {
        return (
            <Layout sidebarVariant="evaluator" displayName={displayName}>
                <div className="p-4">
                    <p className="text-danger">{error || 'Nothing to display.'}</p>
                    <Link to={`/evaluator/submissions/${assignmentId}`}>Back</Link>
                </div>
            </Layout>
        );
    }

    const headerLinks = (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
                type="button"
                className={styles.linkBtn}
                disabled={busy}
                onClick={runPlagiarism}
            >
                Plagiarism Detection
            </button>
            {String(ctx.assessment.type).toLowerCase() !== 'document' && (
                <button
                    type="button"
                    className={styles.linkBtn}
                    disabled={busy}
                    onClick={runAutograde}
                >
                    Autograde
                </button>
            )}
            {plagiarism?.plagiarismDetected && (
                <span className={styles.plagiarismBadge}>
                    Plagiarism detected!
                    <strong>{Math.round(plagiarism.maxSimilarity || 0)}%</strong>
                </span>
            )}
            {plagiarism && !plagiarism.plagiarismDetected && plagiarism.maxSimilarity != null && (
                <span className={styles.plagiarismOk}>
                    Highest similarity: {Math.round(plagiarism.maxSimilarity)}%
                </span>
            )}
        </div>
    );

    const footer = (
        <>
            <label className={styles.feedbackLabel} htmlFor="eval-feedback">
                Feedback
            </label>
            <textarea
                id="eval-feedback"
                className={styles.feedbackArea}
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Comments for the student…"
            />
            <button
                type="button"
                className={styles.submitMarksBtn}
                disabled={busy}
                onClick={finalizeGrades}
            >
                Finalize Grades
            </button>
        </>
    );

    return (
        <Layout sidebarVariant="evaluator" displayName={displayName}>
            <Link
                to={`/evaluator/submissions/${assignmentId}`}
                className="text-dark px-3 pt-3 d-inline-block"
            >
                ← Back to submissions
            </Link>

            <MarkingWorkspace
                panelTitle="Rubric"
                courseTitle={ctx.assessment.className || 'Course'}
                sectionLabel={
                    ctx.submission.studentName ||
                    `Student ${studentId}`
                }
                assignmentTitle={ctx.assessment.title}
                isDocumentPresentation={Boolean(isDocPresentation)}
                submissionCodeOrPlaceholder={
                    ctx.submission.sourceText?.trim()
                        ? ctx.submission.sourceText
                        : '(No textual submission)'
                }
                keyCodeOrPlaceholder={
                    ctx.keyText?.trim() ? ctx.keyText : '(No key text stored)'
                }
                submissionPdfUrl={docUrls.submission}
                keyPdfUrl={docUrls.key}
                rubric={ctx.rubric}
                testCases={ctx.testCases}
                marksObtained={marksObtained}
                onMarkChange={handleMarkChange}
                testStates={testStates}
                onToggleTestCase={toggleTest}
                readOnlyTestToggles={false}
                maxAssessmentMarks={ctx.assessment.marks}
                headerActions={headerLinks}
                footerActions={footer}
            />

            {plagiarism?.report?.comparisons?.length > 0 && (
                <div className={styles.reportBox}>
                    <h4 className={styles.reportTitle}>Match results</h4>
                    <ul className={styles.reportList}>
                        {plagiarism.report.comparisons.map((row, idx) => (
                            <li key={idx}>
                                vs submission #{row.sourceId}:{' '}
                                {Math.round(row.similarityPercentage)}%
                                {row.flagged ? ' (flagged)' : ''}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Layout>
    );
}
