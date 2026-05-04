import React, { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import Layout from './Layout';
import RubricPanel from './RubricPanel';
import DocumentViewer from './DocumentViewer';
import CodeViewer from './CodeViewer';
import styles from './EvaluationInterface.module.css';

// Mock data fetching based on assignmentId and studentId (params)
// and assignmentType (from location state)
const mockDocData = {
  title: "Assignment 1",
  course: { title: "Operating Systems", code: "BSCS-4J" },
  type: "document",
  submissionUrl: "/mock/student_submission.pdf",
  keyUrl: "/mock/assignment_key.pdf",
  rubric: [
    { id: 'Q1', criteria: 'Q1', maxMarks: 2 },
    { id: 'Q2', criteria: 'Q2', maxMarks: 2 },
    { id: 'Q3', criteria: 'Q3', maxMarks: 3 },
    { id: 'Q4', criteria: 'Q4', maxMarks: 2 },
    { id: 'Q5', criteria: 'Q5', maxMarks: 3 },
    { id: 'Q6', criteria: 'Q6', maxMarks: 3 },
  ]
};

const mockCodeData = {
  title: "Assignment 2",
  course: { title: "Operating Systems", code: "BSCS-4J" },
  type: "code",
  submissionCode: `#include <stdio.h>\nint main() {\n  // Student Code\n}`,
  keyCode: `#include <stdio.h>\nint main() {\n  // Key Code\n}`,
  rubric: [
    { id: 1, criteria: 'Precision', maxMarks: 33 },
    { id: 2, criteria: 'Logic', maxMarks: 34 },
    { id: 3, criteria: 'Correct Datastructure', maxMarks: 33 },
  ],
  testCases: [
    { data: "x = 3,\ny = -2" },
    { data: "x = 0,\ny = -2" },
    { data: "x = -5,\ny = -2" },
  ]
};

function EvaluationInterface() {
  const { assignmentId, studentId } = useParams();
  const location = useLocation();
  const assignmentType = location.state?.type; // Crucial: passed during navigation

  // In real app: fetch data here based on type/ids
  const assignmentData = assignmentType === 'code' ? mockCodeData : mockDocData;

  const [marksObtained, setMarksObtained] = useState({});

  const handleMarkChange = (id, value) => {
    setMarksObtained(prev => ({ ...prev, [id]: value }));
  };

  const totalMarks = assignmentData.rubric.reduce((sum, item) => sum + item.maxMarks, 0);

  return (
    <Layout sidebarVariant="evaluator" displayName="Apple">
      <div className={styles.courseBanner}>
        <h2>{assignmentData.course.title}</h2>
        <p>{assignmentData.course.code}</p>
      </div>

      <div className={styles.evaluationGrid}>
        {/* Main Media Area */}
        <main className={styles.mediaArea}>
          {assignmentData.type === 'code' ? (
            <CodeViewer
              title={assignmentData.title}
              submissionCode={assignmentData.submissionCode}
              keyCode={assignmentData.keyCode}
              testCases={assignmentData.testCases}
            />
          ) : (
            <DocumentViewer
              title={assignmentData.title}
              submissionUrl={assignmentData.submissionUrl}
              keyUrl={assignmentData.keyUrl}
            />
          )
          }
        </main>

        {/* Shared Rubric Panel */}
        <aside className={styles.rubricArea}>
          <RubricPanel
            rubric={assignmentData.rubric}
            totalMarks={totalMarks}
            marksObtained={marksObtained}
            onMarkChange={handleMarkChange}
          />
          <button className={styles.submitMarksBtn}>Submit Marks</button>
        </aside>
      </div>
    </Layout>
  );
}

export default EvaluationInterface;