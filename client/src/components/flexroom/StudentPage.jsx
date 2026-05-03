import React, { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import Layout from './Layout';

/** Accept attribute + extension check (some browsers omit MIME for .docx). */
const ASSIGNMENT_EXTENSIONS = /\.(txt|docx)$/i;
const ACCEPT_INPUT =
  '.txt,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';

const RUBRIC = [
  { id: '1', label: '1. Precision', points: '+33' },
  { id: '2', label: '2. Logic', points: '+34' },
  { id: '3', label: '3. Correct Datastructure', points: '+33' },
];

/** Optional: signup can set `flexroomDisplayName` in localStorage. */
function readDisplayName() {
  try {
    const saved = window.localStorage.getItem('flexroomDisplayName');
    if (saved && saved.trim()) return saved.trim();
  } catch (_) {
    /* ignore */
  }
  return 'Apple';
}

function CourseBanner() {
  return (
    <div className="fr-course-banner">
      <h2>Operating Systems</h2>
      <p>BSCS-4J</p>
    </div>
  );
}

function StudentPage({ displayName: displayNameProp } = {}) {
  const resolvedName =
    typeof displayNameProp === 'string' && displayNameProp.trim()
      ? displayNameProp.trim()
      : readDisplayName();

  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [comment, setComment] = useState('');

  const clearInput = () => {
    const el = inputRef.current;
    if (el) el.value = '';
  };

  const setFileIfAllowed = useCallback((file) => {
    if (!file) return;
    if (!ASSIGNMENT_EXTENSIONS.test(file.name)) {
      alert('Only .txt and .docx files are accepted.');
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
    const file = e.dataTransfer.files?.[0];
    setFileIfAllowed(file);
  };

  const handleTurnIn = () => {
    if (!selectedFile) {
      alert('Please select a .txt or .docx file before turning in.');
      return;
    }
    alert(`Turned in: ${selectedFile.name}`);
  };

  return (
    <Layout sidebarVariant="student" displayName={resolvedName} defaultSidebarOpen={false}>
      <CourseBanner />

      <div className="fr-page-pad fr-student-page">
        <div className="d-flex align-items-center justify-content-between mb-4 fr-student-toolbar">
          <Link
            to="/"
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
              <div>
                <h2 style={{ color: '#2a2d26' }}>Assignment 1</h2>
                <p className="mb-1 small fr-muted">
                  Rida Amir · April 20, 2026
                </p>
                <p className="mb-0 small" style={{ color: '#5c6054', fontWeight: 600 }}>100 marks</p>
              </div>
              <p className="small fr-muted">Due April 23, 2026</p>
            </header>

            <div className="fr-upload-stack">
              <div className="fr-pdf-box mb-3">
                <span>PDF</span>
              </div>

              <div className="fr-upload-card rounded p-3">
                <button
                  type="button"
                  aria-label="Submission area"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`w-100 d-flex align-items-center justify-content-center fr-drop ${dragOver ? 'drag' : ''}`}
                >
                  Drag and Drop
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT_INPUT}
                  className="d-none"
                  onChange={handleFileChange}
                />

                {selectedFile && (
                  <p className="small text-center mt-2 mb-0" style={{ color: '#4a5044' }}>
                    Selected:{' '}
                    <strong>{selectedFile.name}</strong>
                  </p>
                )}

                <div className="fr-upload-actions mt-3">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="btn fr-green-btn"
                  >
                    Select from PC
                  </button>
                  <button
                    type="button"
                    onClick={handleTurnIn}
                    className="btn fr-green-btn"
                  >
                    Turn In
                  </button>
                </div>
              </div>
            </div>
            </div>
          </section>

          <aside className="fr-student-sidebar">
            <section className="fr-card border mb-3 fr-rubric-panel">
              <div className="side-panel-header">Rubric</div>
              <ul className="list-unstyled mb-0 p-3" style={{ background: '#f5f6f3' }}>
                {RUBRIC.map((item) => (
                  <li key={item.id} className="d-flex gap-2 py-3 border-bottom">
                    <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: 44, height: 44, background: '#7d8b63', fontSize: 12, fontWeight: 700 }}>
                      {item.points}
                    </div>
                    <div>
                      <p className="mb-2" style={{ color: '#2a2d26' }}>{item.label}</p>
                      <p className="mb-0 small fr-muted">Obtained: _____</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="fr-card border fr-comment-panel">
              <div className="side-panel-header">Private Comments</div>
              <div className="p-2" style={{ background: '#f0f1ed' }}>
                <label className="visually-hidden" htmlFor="student-private-comment">
                  Private comment
                </label>
                <div className="d-flex gap-2 rounded border px-2 py-1" style={{ background: '#ebece8', borderColor: '#d8dcd3' }}>
                  <input
                    id="student-private-comment"
                    type="text"
                    placeholder="Add comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="form-control border-0 bg-transparent shadow-none p-1"
                  />
                  <button
                    type="button"
                    aria-label="Send comment"
                    className="btn btn-sm"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </section>
          </aside>
        </div>

      </div>
    </Layout>
  );
}

export default StudentPage;
