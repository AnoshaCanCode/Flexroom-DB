import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './DocumentViewer.module.css';

function DocumentViewer({ submissionUrl, keyUrl, title }) {
  const [page, setPage] = useState(1);
  const totalPages = 6; // Mock data

  return (
    <div className={styles.viewerContainer}>
      <h2>{title}</h2>
      <div className={styles.dualPane}>
        {/* Submission Pane */}
        <div className={styles.pane}>
          <div className={styles.paneHeader}>Submission</div>
          <div className={styles.mediaFrame}>
            {/* Pagination Controls */}
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className={`${styles.navBtn} ${styles.left}`}
              disabled={page === 1}
            >
              <ChevronLeft />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className={`${styles.navBtn} ${styles.right}`}
              disabled={page === totalPages}
            >
              <ChevronRight />
            </button>
            
            {/* PDF Embed (Mock) */}
            <div className={styles.pdfMock}>
              <p>Representing {submissionUrl}</p>
              <p>Page {page} of {totalPages}</p>
            </div>
          </div>
        </div>

        {/* Key Pane */}
        <div className={styles.pane}>
          <div className={styles.paneHeader}>Key</div>
          <div className={styles.mediaFrame}>
             {/* PDF Embed (Mock) */}
             <div className={styles.pdfMock}>
              <p>Representing {keyUrl}</p>
              <p>Page {page} of {totalPages}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentViewer;