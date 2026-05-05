import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import Layout from './Layout';
import {
    deleteStudentSubmission,
    downloadAssessmentKey,
    fetchServerTime,
    fetchStudentAssignmentDashboard,
} from '../../api/assignmentsApi';
import { getStoredUser } from '../auth/ProtectedRoute';

const ASSIGNMENT_EXTENSIONS = /\.(txt|docx|pdf|cpp|c|h)$/i;
const ACCEPT_INPUT =
  '.txt,.docx,.pdf,.cpp,.c,.h,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';

const RUBRIC = [
  { id: '1', label: '1. Precision', max: 33 },
  { id: '2', label: '2. Logic', max: 34 },
  { id: '3', label: '3. Correct Datastructure', max: 33 },
];

function readDisplayName() {
  try {
    const u = getStoredUser();
    if (u?.name) return u.name;
    const saved = window.localStorage.getItem('flexroomDisplayName');
    if (saved && saved.trim()) return saved.trim();
  } catch (_) {}
  return 'Apple';
}

/** Aligns with server `isDeadlinePassed` (calendar days, relative to reference instant). */
function computeDeadlinePassed(dueDateStr, referenceIsoOrDate) {
  if (dueDateStr == null || dueDateStr === '') return false;
  const due = new Date(dueDateStr);
  if (Number.isNaN(due.getTime())) return false;
  const ref =
    typeof referenceIsoOrDate === 'string'
      ? new Date(referenceIsoOrDate)
      : referenceIsoOrDate instanceof Date
        ? referenceIsoOrDate
        : new Date();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const refDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  return refDay > dueDay;
}

function formatDisplayDate(isoOrStr) {
  if (!isoOrStr) return '—';
  const d = new Date(isoOrStr);
  if (Number.isNaN(d.getTime())) return String(isoOrStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function allocateObtainedPerRubric(totalObtained, items) {
  const maxSum = items.reduce((s, i) => s + i.max, 0);
  if (!maxSum || totalObtained == null) return items.map(() => null);
  let remaining = totalObtained;
  return items.map((it, idx) => {
    if (idx === items.length - 1) return Math.max(0, Math.round(remaining));
    const share = Math.round((it.max / maxSum) * totalObtained);
    remaining -= share;
    return Math.max(0, share);
  });
}

function CourseBanner({ courseTitle, sectionCode }) {
  return (
    <div className="fr-course-banner">
      <h2>{courseTitle || 'Class'}</h2>
      <p>{sectionCode != null ? String(sectionCode) : '—'}</p>
    </div>
  );
}

function StudentPage({ displayName: displayNameProp } = {}) {
  const params = useParams();
  const [searchParams] = useSearchParams();

  const classId = params.classId ?? searchParams.get('classId');
  const assessmentId = params.assessmentId ?? searchParams.get('assessmentId');

  const resolvedName =
    typeof displayNameProp === 'string' && displayNameProp.trim()
      ? displayNameProp.trim()
      : readDisplayName();

  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [comment, setComment] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [serverTimeIso, setServerTimeIso] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [keyBlobUrl, setKeyBlobUrl] = useState(null);
  const [keyError, setKeyError] = useState(null);

  const loadDashboard = useCallback(async () => {
    if (!assessmentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      let serverIso = new Date().toISOString();
      try {
        const timeData = await fetchServerTime();
        serverIso = timeData.currentTime;
      } catch {
        /* fall back to browser clock if /api/time fails */
      }
      const dash = await fetchStudentAssignmentDashboard(Number(assessmentId));
      setServerTimeIso(serverIso);
      setDashboard(dash);
    } catch (e) {
      setLoadError(e.message || 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const a = dashboard?.assessment;
  const submission = dashboard?.submission;
  const grade = dashboard?.grade;

  const deadlinePassed = useMemo(
    () => (a?.dueDate && serverTimeIso ? computeDeadlinePassed(a.dueDate, serverTimeIso) : false),
    [a?.dueDate, serverTimeIso],
  );

  const hasSubmitted = Boolean(submission);

  const showSelfEvaluateLink = deadlinePassed && hasSubmitted;
  const showMissingLabel = deadlinePassed && !hasSubmitted;
  const showPostDeadlineResources = deadlinePassed && hasSubmitted;
  const showTestCasesPanel =
    showPostDeadlineResources && a?.type && String(a.type).toLowerCase() !== 'document';

  const canUseDropZone = !hasSubmitted && !deadlinePassed;
  const selectAndTurnInEnabled = !hasSubmitted && !deadlinePassed;
  const unsubmitEnabled = hasSubmitted && !deadlinePassed;

  const totalObtained =
    grade?.totalMarks != null && showPostDeadlineResources && hasSubmitted
      ? Number(grade.totalMarks)
      : null;

  const rubricObtained = useMemo(
    () => allocateObtainedPerRubric(totalObtained, RUBRIC),
    [totalObtained],
  );

  useEffect(() => {
    if (!showPostDeadlineResources || !assessmentId) {
      setKeyBlobUrl(null);
      setKeyError(null);
      return undefined;
    }
    let revoked = false;
    let url;
    (async () => {
      try {
        const blob = await downloadAssessmentKey(Number(assessmentId));
        if (revoked) return;
        url = URL.createObjectURL(blob);
        setKeyBlobUrl(url);
        setKeyError(null);
      } catch (e) {
        if (!revoked) setKeyError(e.message || 'Could not load key');
      }
    })();
    return () => {
      revoked = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [showPostDeadlineResources, assessmentId]);

  const handleNavigateToSelfEval = useCallback(() => {
    console.info('[FlexRoom] Self Evaluation — replace with real route when ready');
  }, []);

  const clearInput = () => {
    const el = inputRef.current;
    if (el) el.value = '';
  };

  const setFileIfAllowed = useCallback((file) => {
    if (!file) return;
    if (!ASSIGNMENT_EXTENSIONS.test(file.name)) {
      alert('File type not accepted for this assignment.');
      return;
    }
    setSelectedFile(file);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFileIfAllowed(file);
    clearInput();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!canUseDropZone) return;
    const file = e.dataTransfer.files?.[0];
    setFileIfAllowed(file);
  };

  const handleTurnIn = async () => {
    if (!selectedFile || !assessmentId) {
      alert('Please select a file before turning in.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('assignmentId', String(assessmentId));

    const token = sessionStorage.getItem('flexroom_token');
    const API_BASE = process.env.REACT_APP_API_BASE || '';

    try {
      const response = await fetch(`${API_BASE}/api/files/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (response.ok) {
        alert(`Successfully turned in: ${selectedFile.name}`);
        setSelectedFile(null);
        await loadDashboard();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Upload failed: ${errorData.error || errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Server error during upload.');
    }
  };

  const handleUnsubmit = async () => {
    if (!submission?.submissionId) return;
    if (!window.confirm('Remove your submission? You can upload again before the deadline.')) return;
    try {
      await deleteStudentSubmission(submission.submissionId);
      await loadDashboard();
    } catch (e) {
      alert(e.message || 'Could not unsubmit');
    }
  };

  if (!assessmentId) {
    return (
      <Layout sidebarVariant="student" displayName={resolvedName} defaultSidebarOpen={false}>
        <CourseBanner courseTitle="FlexRoom" sectionCode="" />
        <div className="fr-page-pad p-4">
          <p className="text-muted">Open an assignment from a class, or add <code>?classId=1&amp;assessmentId=2</code> to the URL for testing.</p>
          <Link to="/student">Back to dashboard</Link>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout sidebarVariant="student" displayName={resolvedName} defaultSidebarOpen={false}>
        <CourseBanner courseTitle={a?.className} sectionCode={a?.classCode} />
        <div className="fr-page-pad p-4">
          <p>Loading assignment…</p>
        </div>
      </Layout>
    );
  }

  if (loadError || !a) {
    return (
      <Layout sidebarVariant="student" displayName={resolvedName} defaultSidebarOpen={false}>
        <CourseBanner />
        <div className="fr-page-pad p-4">
          <p className="text-danger">{loadError || 'Assignment not found.'}</p>
          <Link to={classId ? `/student/class/${classId}` : '/student'}>Go back</Link>
        </div>
      </Layout>
    );
  }

  const dueFormatted = formatDisplayDate(a.dueDate);
  const uploadFormatted = formatDisplayDate(a.uploadingDate);

  return (
    <Layout sidebarVariant="student" displayName={resolvedName} defaultSidebarOpen={false}>
      <CourseBanner courseTitle={a.className} sectionCode={a.classCode} />

      <div className="fr-page-pad fr-student-page">
        <div className="d-flex align-items-center justify-content-between mb-4 fr-student-toolbar">
          <Link
            to={classId ? `/student/class/${classId}` : '/student'}
            className="text-dark"
            aria-label="Go back"
          >
            <ArrowLeft size={24} aria-hidden />
          </Link>
        </div>

        <div className="fr-student-layout">
          <section className="fr-student-main flex-column">
            <div className="fr-card fr-assignment-main p-4 p-lg-4">
              <header className="d-flex flex-wrap justify-content-between gap-3 border-bottom pb-4 mb-4">
                <div className="flex-grow-1">
                  <div className="d-flex flex-wrap align-items-start gap-2 mb-2">
                    <h2 style={{ color: '#2a2d26', margin: 0 }}>{a.title}</h2>
                    {showSelfEvaluateLink && (
                      <div className="d-flex flex-column align-items-start">
                        <button
                          type="button"
                          className="fr-self-eval-link"
                          onClick={handleNavigateToSelfEval}
                        >
                          Self Evaluate
                        </button>
                        <span className="small fr-muted mt-1">Due {dueFormatted}</span>
                      </div>
                    )}
                    {showMissingLabel && (
                      <span className="fr-missing-label" role="status">
                        Missing
                      </span>
                    )}
                  </div>
                  <p className="mb-1 small fr-muted">
                    Instructor · {uploadFormatted}
                  </p>
                  <p className="mb-0 small" style={{ color: '#5c6054', fontWeight: 600 }}>
                    {a.marks} marks
                  </p>
                </div>
                {!showSelfEvaluateLink && (
                  <p className="small fr-muted mb-0 align-self-start">Due {dueFormatted}</p>
                )}
              </header>

              <div className="fr-upload-stack">
                <div className="fr-pdf-box mb-3">
                  <span>PDF</span>
                </div>

                <div
                  className={`fr-status-banner ${hasSubmitted ? 'fr-status-turned-in' : 'fr-status-draft'}`}
                >
                  {hasSubmitted ? 'Turned In' : 'Drag and Drop'}
                </div>

                <div className="fr-upload-card rounded p-3 mt-2">
                  <button
                    type="button"
                    aria-label="Submission area"
                    disabled={!canUseDropZone}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (canUseDropZone) setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => canUseDropZone && inputRef.current?.click()}
                    className={`w-100 d-flex align-items-center justify-content-center fr-drop ${dragOver ? 'drag' : ''} ${!canUseDropZone ? 'fr-drop-disabled' : ''}`}
                  >
                    {hasSubmitted ? 'Submission on file' : 'Drag and Drop'}
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPT_INPUT}
                    className="d-none"
                    onChange={handleFileChange}
                    disabled={!canUseDropZone}
                  />

                  {selectedFile && !hasSubmitted && (
                    <p className="small text-center mt-2 mb-0" style={{ color: '#4a5044' }}>
                      Selected: <strong>{selectedFile.name}</strong>
                    </p>
                  )}

                  {hasSubmitted && submission?.fileName && (
                    <p className="small text-center mt-2 mb-0" style={{ color: '#4a5044' }}>
                      File: <strong>{submission.fileName}</strong>
                    </p>
                  )}

                  <div className="fr-upload-actions mt-3">
                    <button
                      type="button"
                      disabled={!selectAndTurnInEnabled}
                      onClick={() => selectAndTurnInEnabled && inputRef.current?.click()}
                      className={`btn fr-green-btn ${!selectAndTurnInEnabled ? 'fr-btn-disabled' : ''}`}
                    >
                      Select from PC
                    </button>
                    {!hasSubmitted && (
                      <button
                        type="button"
                        disabled={!selectAndTurnInEnabled}
                        onClick={handleTurnIn}
                        className={`btn fr-green-btn ${!selectAndTurnInEnabled ? 'fr-btn-disabled' : ''}`}
                      >
                        Turn In
                      </button>
                    )}
                    {hasSubmitted && (
                      <button
                        type="button"
                        disabled={!unsubmitEnabled}
                        onClick={handleUnsubmit}
                        className={`btn fr-green-btn ${!unsubmitEnabled ? 'fr-btn-disabled' : ''}`}
                      >
                        Unsubmit
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {showPostDeadlineResources && (
                <div className="fr-key-section mt-4">
                  <div className="fr-key-bar-label">Key</div>
                  <div className="fr-key-body">
                    {keyError && <p className="small text-danger mb-0">{keyError}</p>}
                    {!keyError && keyBlobUrl && (
                      <iframe title="Solution key" src={keyBlobUrl} className="fr-key-iframe" />
                    )}
                    {!keyError && !keyBlobUrl && (
                      <p className="small text-muted mb-0">Loading key…</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="fr-student-sidebar">
            <section className="fr-card border mb-3 fr-rubric-panel">
              <div className="side-panel-header d-flex justify-content-between align-items-center">
                <span>Rubric</span>
                {totalObtained != null && (
                  <span className="small fw-normal">Total: {totalObtained}</span>
                )}
              </div>
              <ul className="list-unstyled mb-0 p-3" style={{ background: '#f5f6f3' }}>
                {RUBRIC.map((item, idx) => {
                  const obtained = rubricObtained[idx];
                  const showObtained =
                    totalObtained != null && showPostDeadlineResources && hasSubmitted;
                  return (
                    <li key={item.id} className="d-flex gap-2 py-3 border-bottom">
                      <div
                        className="rounded-circle d-flex align-items-center justify-content-center text-white"
                        style={{
                          width: 44,
                          height: 44,
                          background: '#7d8b63',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        +{item.max}
                      </div>
                      <div>
                        <p className="mb-2" style={{ color: '#2a2d26' }}>
                          {item.label}
                        </p>
                        <p className="mb-0 small fr-muted">
                          Obtained:{' '}
                          {showObtained && obtained != null ? `+${obtained}` : '_____'}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="fr-card border fr-comment-panel mb-3">
              <div className="side-panel-header">Private Comments</div>
              <div className="p-2" style={{ background: '#f0f1ed' }}>
                <label className="visually-hidden" htmlFor="student-private-comment">
                  Private comment
                </label>
                <div
                  className="d-flex gap-2 rounded border px-2 py-1"
                  style={{ background: '#ebece8', borderColor: '#d8dcd3' }}
                >
                  <input
                    id="student-private-comment"
                    type="text"
                    placeholder="Add comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="form-control border-0 bg-transparent shadow-none p-1"
                  />
                  <button type="button" aria-label="Send comment" className="btn btn-sm">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </section>

            {showTestCasesPanel && (
              <section className="fr-card border fr-test-cases-sidebar">
                <div className="side-panel-header">Test Cases</div>
                <pre className="fr-test-cases-snippet">
                  {`x = 3,
y = -2`}
                </pre>
              </section>
            )}
          </aside>
        </div>
      </div>
    </Layout>
  );
}

export default StudentPage;
