import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { postCreateAssessment } from '../../api/assignmentsApi';
import styles from './AssignmentCreateForm.module.css';

function newId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDisplayDate(d) {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function PdfDropzone({ label, file, onChange, inputId }) {
    const onDrop = useCallback(
        (accepted) => {
            if (accepted && accepted[0]) onChange(accepted[0]);
        },
        [onChange]
    );

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        multiple: false,
        noClick: true,
    });

    return (
        <div className={styles.dropSection}>
            <div className={styles.dropLabel}>{label}</div>
            <div
                {...getRootProps()}
                className={`${styles.dropZone} ${isDragActive ? styles.dropZoneActive : ''}`}
            >
                <input {...getInputProps()} id={inputId} />
                <p className={styles.dropHint}>Drag and Drop</p>
                <button type="button" className={styles.selectBtn} onClick={(e) => { e.stopPropagation(); open(); }}>
                    Select from PC
                </button>
                {file && <div className={styles.fileName}>{file.name}</div>}
            </div>
        </div>
    );
}

function isRubricComplete(items) {
    if (!items.length) return false;
    return items.every((r) => String(r.description || '').trim() !== '' && Number(r.marks) > 0);
}

function isTestCasesComplete(items) {
    if (!items.length) return false;
    return items.every((t) => String(t.inputText || '').trim() !== '' && Number(t.marks) > 0);
}

/**
 * @param {{ variant: 'document' | 'code' }} props
 */
export default function AssignmentCreateForm({ variant }) {
    const navigate = useNavigate();
    const location = useLocation();
    const outlet = useOutletContext();
    const setCourseHeader = outlet?.setCourseHeader;

    const defaults = useMemo(
        () => ({
            courseTitle: location.state?.courseTitle ?? 'Operating Systems',
            courseCode: location.state?.courseCode ?? 'BSCS-4J',
        }),
        [location.state]
    );

    const evaluatorName = useMemo(() => {
        try {
            return window.localStorage.getItem('flexroomDisplayNameEvaluator') || 'Rida Amir';
        } catch {
            return 'Rida Amir';
        }
    }, []);

    const todayLabel = useMemo(() => formatDisplayDate(new Date()), []);

    const [title, setTitle] = useState('');
    const [titleActive, setTitleActive] = useState(false);
    const [dueDate, setDueDate] = useState('');
    const [dueActive, setDueActive] = useState(false);
    const [totalMarks, setTotalMarks] = useState('');
    const [marksActive, setMarksActive] = useState(false);

    const [questionPdf, setQuestionPdf] = useState(null);
    const [solutionKey, setSolutionKey] = useState(null);

    const [rubricItems, setRubricItems] = useState([]);
    const [testCases, setTestCases] = useState([]);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const dueDateLabel = useMemo(() => {
        if (!dueDate) return '';
        const d = new Date(`${dueDate}T12:00:00`);
        return Number.isNaN(d.getTime()) ? dueDate : formatDisplayDate(d);
    }, [dueDate]);

    useEffect(() => {
        if (!setCourseHeader) return undefined;
        setCourseHeader({ title: defaults.courseTitle, code: defaults.courseCode });
        return () => setCourseHeader({ title: null, code: null });
    }, [defaults.courseTitle, defaults.courseCode, setCourseHeader]);

    const addRubricRow = () => {
        setRubricItems((prev) => [...prev, { id: newId(), description: '', marks: '' }]);
    };

    const updateRubric = (id, patch) => {
        setRubricItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    };

    const addTestCaseRow = () => {
        setTestCases((prev) => [...prev, { id: newId(), inputText: '', marks: '' }]);
    };

    const updateTestCase = (id, patch) => {
        setTestCases((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    };

    const canSubmit = useMemo(() => {
        const base =
            title.trim() !== '' &&
            dueDate !== '' &&
            questionPdf != null &&
            isRubricComplete(rubricItems);
        if (variant === 'code') {
            return base && isTestCasesComplete(testCases);
        }
        return base;
    }, [title, dueDate, questionPdf, rubricItems, testCases, variant]);

    const handleCreateAssignment = async () => {
        if (!canSubmit || submitting) return;
        setError(null);
        setSuccess(false);
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('dueDate', dueDate);
            formData.append('assessmentType', variant === 'code' ? 'code' : 'document');
            formData.append('courseTitle', defaults.courseTitle);
            formData.append('courseCode', defaults.courseCode);
            if (totalMarks.trim() !== '') {
                formData.append('totalMarks', totalMarks.trim());
            }
            formData.append(
                'rubric',
                JSON.stringify(
                    rubricItems.map((r, i) => ({
                        order: i + 1,
                        description: r.description.trim(),
                        marks: Number(r.marks),
                    }))
                )
            );
            if (variant === 'code') {
                formData.append(
                    'testCases',
                    JSON.stringify(
                        testCases.map((t, i) => ({
                            order: i + 1,
                            input: t.inputText.trim(),
                            marks: Number(t.marks),
                        }))
                    )
                );
            }
            formData.append('questionPdf', questionPdf);
            if (solutionKey) {
                formData.append('solutionKey', solutionKey);
            }

            await postCreateAssessment(formData);
            setSuccess(true);
            window.setTimeout(() => {
                navigate('/evaluator', { replace: true });
            }, 900);
        } catch (e) {
            const msg =
                e?.response?.data?.message ||
                e?.message ||
                'Could not create assignment. Please try again.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const titleDisplay = title.trim() === '' ? 'Add title' : title;

    return (
        <div className={styles.page}>
            {error && <div className={styles.bannerError}>{error}</div>}
            {success && (
                <div className={styles.bannerSuccess}>
                    Assignment created. Returning to your class dashboard…
                </div>
            )}

            <div className={styles.grid}>
                <section className={styles.mainCard}>
                    <div className={styles.titleRow}>
                        {!titleActive ? (
                            <button
                                type="button"
                                className={styles.titlePlaceholder}
                                onClick={() => setTitleActive(true)}
                            >
                                {titleDisplay}
                            </button>
                        ) : (
                            <input
                                className={styles.titleInput}
                                autoFocus
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={() => setTitleActive(false)}
                                placeholder="Assignment title"
                                aria-label="Assignment title"
                            />
                        )}

                        {!dueActive ? (
                            <button
                                type="button"
                                className={styles.duePlaceholder}
                                onClick={() => setDueActive(true)}
                            >
                                {dueDate ? dueDateLabel : 'Add due date'}
                            </button>
                        ) : (
                            <input
                                type="date"
                                className={styles.dueInput}
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                onBlur={() => setDueActive(false)}
                                aria-label="Due date"
                            />
                        )}
                    </div>

                    <div className={styles.metaRow}>
                        <span>{evaluatorName}</span>
                        <span>{todayLabel}</span>
                        {!marksActive ? (
                            <button
                                type="button"
                                className={styles.marksBtn}
                                onClick={() => setMarksActive(true)}
                            >
                                {totalMarks.trim() !== '' ? `Marks: ${totalMarks}` : 'Add marks'}
                            </button>
                        ) : (
                            <input
                                className={styles.marksInput}
                                type="number"
                                min={0}
                                placeholder="Marks"
                                value={totalMarks}
                                onChange={(e) => setTotalMarks(e.target.value)}
                                onBlur={() => setMarksActive(false)}
                                aria-label="Total marks"
                            />
                        )}
                    </div>

                    <PdfDropzone
                        label="Add question PDF"
                        file={questionPdf}
                        onChange={setQuestionPdf}
                        inputId="question-pdf"
                    />
                    <PdfDropzone
                        label="Add key"
                        file={solutionKey}
                        onChange={setSolutionKey}
                        inputId="solution-key"
                    />

                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.addBtn}
                            disabled={!canSubmit || submitting}
                            onClick={handleCreateAssignment}
                        >
                            Add
                            {submitting && <span className={styles.loading}>Saving…</span>}
                        </button>
                    </div>
                </section>

                <aside className={styles.sideStack}>
                    <div className={styles.panel}>
                        <div className={styles.panelHead}>Rubric</div>
                        <div className={styles.panelBody}>
                            {rubricItems.map((row, index) => (
                                <div key={row.id} className={styles.rubricRow}>
                                    <div className={styles.badge}>+{row.marks || '…'}</div>
                                    <div className={styles.rowFields}>
                                        <input
                                            className={styles.rowInput}
                                            placeholder="Add description"
                                            value={row.description}
                                            onChange={(e) => updateRubric(row.id, { description: e.target.value })}
                                        />
                                        <input
                                            className={styles.rowMarks}
                                            type="number"
                                            min={1}
                                            placeholder="Marks"
                                            value={row.marks}
                                            onChange={(e) => updateRubric(row.id, { marks: e.target.value })}
                                            aria-label={`Rubric ${index + 1} marks`}
                                        />
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                className={styles.addRowBtn}
                                onClick={addRubricRow}
                                aria-label="Add rubric criterion"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {variant === 'code' && (
                        <div className={styles.panel}>
                            <div className={styles.panelHead}>Test Cases</div>
                            <div className={styles.panelBody}>
                                {testCases.map((row, index) => (
                                    <div key={row.id} className={styles.testRow}>
                                        <div className={styles.badge}>{index + 1}</div>
                                        <div className={styles.rowFields}>
                                            <input
                                                className={styles.rowInput}
                                                placeholder="e.g. x = 3, y = -2"
                                                value={row.inputText}
                                                onChange={(e) =>
                                                    updateTestCase(row.id, { inputText: e.target.value })
                                                }
                                            />
                                            <input
                                                className={styles.rowMarks}
                                                type="number"
                                                min={1}
                                                placeholder="Marks"
                                                value={row.marks}
                                                onChange={(e) => updateTestCase(row.id, { marks: e.target.value })}
                                                aria-label={`Test case ${index + 1} marks`}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className={styles.addRowBtn}
                                    onClick={addTestCaseRow}
                                    aria-label="Add test case"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
