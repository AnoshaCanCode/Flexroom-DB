import React from 'react';
import styles from './CodeViewer.module.css';

function CodeViewer({ submissionCode, keyCode, title, testCases }) {
  return (
    <div className={styles.viewerContainer}>
      <h2>{title}</h2>
      <div className={styles.mainContent}>
        <div className={styles.codeDiffView}>
          <div className={styles.pane}>
            <div className={styles.paneHeader}>Submission</div>
            <pre className={styles.codeBlock}>
              <code>{submissionCode}</code>
            </pre>
          </div>
          <div className={styles.pane}>
            <div className={styles.paneHeader}>Key</div>
            <pre className={styles.codeBlock}>
              <code>{keyCode}</code>
            </pre>
          </div>
        </div>

        {/* Test Cases Panel */}
        <aside className={styles.testCasesPanel}>
          <div className={styles.panelHeader}>Test Cases</div>
          {testCases.map((tc, index) => (
            <div key={index} className={styles.testCaseItem}>
              <div className={styles.idCircle}>{index + 1}</div>
              <pre className={styles.testCaseData}>{tc.data}</pre>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

export default CodeViewer;