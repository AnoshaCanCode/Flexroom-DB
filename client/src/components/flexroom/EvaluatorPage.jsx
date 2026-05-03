import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { createPortal } from 'react-dom';
import Layout from './Layout';

const ASSIGNMENT_EXTENSIONS = /\.(txt|docx)$/i;
const ACCEPT_INPUT =
  '.txt,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';

const ASSIGNMENTS = [
  { serial: 1, title: 'Assignment 1: Fork', submitted: 33, left: 3 },
  { serial: 2, title: 'Class Activity 1', submitted: 1, left: 35 },
  { serial: 3, title: 'Assignment 2: Pipes', submitted: 30, left: 5 },
  { serial: 4, title: 'Quiz 1', submitted: 32, left: 4 },
  { serial: 5, title: 'Assignment 3: MLFQ', submitted: 36, left: '-' },
  { serial: 6, title: 'Quiz 2', submitted: 10, left: 26 },
  { serial: 7, title: 'Class Activity 2', submitted: 29, left: 7 },
];

/**
 * Optional localStorage keys from signup/auth:
 * - `flexroomDisplayNameEvaluator` (preferred)
 * - `flexroomDisplayName` (fallback)
 */
function readDisplayName() {
  try {
    const ev = window.localStorage.getItem('flexroomDisplayNameEvaluator');
    if (ev && ev.trim()) return ev.trim();
    const generic = window.localStorage.getItem('flexroomDisplayName');
    if (generic && generic.trim()) return generic.trim();
  } catch (_) {
    /* ignore */
  }
  return 'Hayyan';
}

function CourseBanner() {
  return (
    <div className="fr-course-banner">
      <h2>Operating Systems</h2>
      <p>BSCS-4J</p>
    </div>
  );
}

function EvaluatorModal({ open, onClose, onChosen }) {
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const closeModal = () => {
    onClose?.();
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ASSIGNMENT_EXTENSIONS.test(file.name)) {
      alert('Only .txt and .docx files are accepted.');
      e.target.value = '';
      return;
    }
    onChosen?.(file);
    closeModal();
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fr-modal-backdrop d-flex align-items-center justify-content-center p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="eval-upload-title"
    >
      <div className="bg-white border rounded shadow" style={{ width: '100%', maxWidth: 480 }}>
        <div className="px-4 py-2 text-white" style={{ background: '#7d8b63' }}>
          <h2 id="eval-upload-title" className="h5 mb-0">
            Upload assignment document
          </h2>
        </div>
        <div className="p-4">
          <p className="small" style={{ color: '#4a5044' }}>
            Choose an assignment instructions file (.txt or .docx).
          </p>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT_INPUT}
            className="d-none"
            id="eval-assignment-upload"
            onChange={handleChange}
          />
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn fr-green-btn"
            >
              Browse files…
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="btn btn-light border"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function EvaluatorPage({ displayName: displayNameProp } = {}) {
  const resolvedName =
    typeof displayNameProp === 'string' && displayNameProp.trim()
      ? displayNameProp.trim()
      : readDisplayName();

  const [modalOpen, setModalOpen] = useState(false);

  const openUploader = useCallback(() => setModalOpen(true), []);

  return (
    <Layout sidebarVariant="evaluator" displayName={resolvedName} defaultSidebarOpen={true}>
      <CourseBanner />

      <div className="fr-page-pad fr-evaluator-page">
        <div className="d-flex align-items-center justify-content-between mb-4 fr-evaluator-toolbar">
          <Link
            to="/"
            className="text-dark"
            aria-label="Go back"
          >
            <ArrowLeft size={24} aria-hidden />
          </Link>
          <button
            type="button"
            onClick={openUploader}
            className="btn border-0"
            aria-label="Add assignment"
          >
            <Plus size={28} strokeWidth={2.5} aria-hidden />
          </button>
        </div>

        <div className="fr-eval-table-wrap">
          <table className="table mb-0 fr-eval-table" style={{ borderCollapse: 'collapse', border: '1px solid black' }}>
            <colgroup>
              <col style={{ width: '14%' }} />
              <col style={{ width: '46%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
            </colgroup>
            <thead>
              <tr style={{ background: '#b7b7a4' }}>
                <th style={{ border: '1px solid black', padding: '10px 14px' }}>
                  S.No#
                </th>
                <th style={{ border: '1px solid black', padding: '10px 14px' }}>
                  Title
                </th>
                <th style={{ border: '1px solid black', padding: '10px 14px' }}>
                  Submitted
                </th>
                <th style={{ border: '1px solid black', padding: '10px 14px' }}>
                  Left
                </th>
              </tr>
            </thead>
            <tbody>
              {ASSIGNMENTS.map((row) => (
                <tr key={row.serial} style={{ background: '#e9ecef' }}>
                  <td style={{ border: '1px solid black', padding: '10px 14px', color: '#2a2d26' }}>
                    {row.serial}.
                  </td>
                  <td style={{ border: '1px solid black', padding: '10px 14px', color: '#2a2d26', fontWeight: 500 }}>
                    {row.title}
                  </td>
                  <td style={{ border: '1px solid black', padding: '10px 14px', color: '#2a2d26' }}>
                    {row.submitted}
                  </td>
                  <td style={{ border: '1px solid black', padding: '10px 14px', color: '#2a2d26' }}>
                    {row.left}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      <EvaluatorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onChosen={(file) => alert(`Assignment document selected: ${file.name}`)}
      />
    </Layout>
  );
}

export default EvaluatorPage;
