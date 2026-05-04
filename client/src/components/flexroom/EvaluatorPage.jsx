import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { createPortal } from 'react-dom';
import Layout from './Layout';

const ASSIGNMENTS = [
  { serial: 1, title: 'Assignment 1: Fork', submitted: 33, left: 3 },
  { serial: 2, title: 'Class Activity 1', submitted: 1, left: 35 },
  { serial: 3, title: 'Assignment 2: Pipes', submitted: 30, left: 5 },
  { serial: 4, title: 'Quiz 1', submitted: 32, left: 4 },
  { serial: 5, title: 'Assignment 3: MLFQ', submitted: 36, left: '-' },
  { serial: 6, title: 'Quiz 2', submitted: 10, left: 26 },
  { serial: 7, title: 'Class Activity 2', submitted: 29, left: 7 },
];

function readDisplayName() {
  try {
    const ev = window.localStorage.getItem('flexroomDisplayNameEvaluator');
    if (ev && ev.trim()) return ev.trim();
    const generic = window.localStorage.getItem('flexroomDisplayName');
    if (generic && generic.trim()) return generic.trim();
  } catch (_) {}
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

function EvaluatorModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fr-modal-backdrop d-flex align-items-center justify-content-center p-3" role="dialog" aria-modal="true">
      <div className="bg-white border rounded shadow" style={{ width: '100%', maxWidth: 400 }}>
        <div className="px-4 py-3 text-white d-flex justify-content-between align-items-center" style={{ background: '#7d8b63' }}>
          <h2 className="h6 mb-0">Select Assessment Type</h2>
          <button onClick={onClose} className="btn-close btn-close-white" aria-label="Close"></button>
        </div>
        <div className="p-4 d-grid gap-3">
          <Link to="/upload-coding-assessment" className="btn btn-outline-dark py-3 d-flex flex-column align-items-center" style={{ borderColor: '#7d8b63' }}>
            <strong>Upload Coding Assessment</strong>
            <small className="text-muted">Automated test cases & scripts</small>
          </Link>
          <Link to="/upload-doc-assessment" className="btn btn-outline-dark py-3 d-flex flex-column align-items-center" style={{ borderColor: '#7d8b63' }}>
            <strong>Upload Doc Assessment</strong>
            <small className="text-muted">Instruction manuals or PDFs</small>
          </Link>
          <button type="button" onClick={onClose} className="btn btn-light border mt-2">Cancel</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function EvaluatorPage({ displayName: displayNameProp } = {}) {
  const resolvedName = displayNameProp?.trim() || readDisplayName();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Layout sidebarVariant="evaluator" displayName={resolvedName} defaultSidebarOpen={true}>
      <CourseBanner />

      <div className="fr-page-pad fr-evaluator-page">
        <div className="d-flex align-items-center justify-content-between mb-4 fr-evaluator-toolbar">
          <Link to="/evaluator" className="text-dark">
            <ArrowLeft size={24} />
          </Link>
          <button type="button" onClick={() => setModalOpen(true)} className="btn border-0">
            <Plus size={28} strokeWidth={2.5} />
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
                <th style={{ border: '1px solid black', padding: '10px 14px' }}>S.No#</th>
                <th style={{ border: '1px solid black', padding: '10px 14px' }}>Title</th>
                <th style={{ border: '1px solid black', padding: '10px 14px' }}>Submitted</th>
                <th style={{ border: '1px solid black', padding: '10px 14px' }}>Left</th>
              </tr>
            </thead>
            <tbody>
  {ASSIGNMENTS.map((row) => (
    <tr key={row.serial} style={{ background: '#e9ecef' }}>
      <td style={{ border: '1px solid black', padding: '10px 14px', color: '#2a2d26' }}>
        {row.serial}.
      </td>
      {/* Wrap the Title in a Link to navigate to the Submissions page */}
      <td style={{ border: '1px solid black', padding: '10px 14px', fontWeight: 500 }}>
        <Link 
          to={`/evaluator/submissions/${row.serial}`} 
          style={{ color: '#2a2d26', textDecoration: 'none' }}
          onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
          onMouseOut={(e) => e.target.style.textDecoration = 'none'}
        >
          {row.title}
        </Link>
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

      <EvaluatorModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Layout>
  );
}

export default EvaluatorPage;