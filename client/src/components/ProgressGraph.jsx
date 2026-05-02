import React, { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./ProgressGraph.css";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

const users = [
  {
    UserID: 11,
    Name: "Apple",
    Email: "apple@gmail.com",
    UserRole: "student",
    CreatedAt: "2026-01-05T11:00:00.000Z",
  },
];

const courseClass = {
  classID: 601,
  courseID: 100,
  className: "Operating Systems",
  sectionLabel: "BSCS-4J",
  classCode: 4015,
  generatedDate: "2026-01-01",
  numStudents: 80,
};

const assessments = [
  {
    assessmentID: 1,
    classID: 601,
    title: "Lab-1 Process Basics",
    type: "code",
    marks: 100,
    uploadingDate: "2026-01-10",
    dueDate: "2026-01-16",
    status: "marked",
  },
  {
    assessmentID: 3,
    classID: 601,
    title: "Assignment-2 Scheduling",
    type: "document",
    marks: 100,
    uploadingDate: "2026-01-18",
    dueDate: "2026-01-25",
    status: "marked",
  },
  {
    assessmentID: 4,
    classID: 601,
    title: "Lab-3 Deadlocks",
    type: "code",
    marks: 100,
    uploadingDate: "2026-01-26",
    dueDate: "2026-02-03",
    status: "marked",
  },
  {
    assessmentID: 7,
    classID: 601,
    title: "Quiz-4 Memory",
    type: "bubble",
    marks: 100,
    uploadingDate: "2026-02-04",
    dueDate: "2026-02-09",
    status: "marked",
  },
];

const submissions = [
  {
    SubmissionID: 9001,
    AssignmentID: 1,
    StudentID: 11,
    FileName: "lab1_apple.zip",
    SubmissionDate: "2026-01-15T10:23:00.000Z",
    Status: "On-Time",
  },
  {
    SubmissionID: 9002,
    AssignmentID: 3,
    StudentID: 11,
    FileName: "assignment2_apple.pdf",
    SubmissionDate: "2026-01-24T13:46:00.000Z",
    Status: "On-Time",
  },
  {
    SubmissionID: 9003,
    AssignmentID: 4,
    StudentID: 11,
    FileName: "lab3_apple.zip",
    SubmissionDate: "2026-02-02T17:31:00.000Z",
    Status: "On-Time",
  },
  {
    SubmissionID: 9004,
    AssignmentID: 7,
    StudentID: 11,
    FileName: "quiz4_apple.pdf",
    SubmissionDate: "2026-02-08T09:05:00.000Z",
    Status: "On-Time",
  },
];

const matchResults = [
  {
    MatchID: 5001,
    TargetSubmissionID: 9001,
    SourceSubmissionID: 8201,
    SimilarityPercentage: 18.2,
    AnalysisDate: "2026-01-15T12:00:00.000Z",
  },
  {
    MatchID: 5002,
    TargetSubmissionID: 9002,
    SourceSubmissionID: 8212,
    SimilarityPercentage: 29.1,
    AnalysisDate: "2026-01-24T15:00:00.000Z",
  },
  {
    MatchID: 5003,
    TargetSubmissionID: 9003,
    SourceSubmissionID: 8238,
    SimilarityPercentage: 14.3,
    AnalysisDate: "2026-02-02T19:00:00.000Z",
  },
  {
    MatchID: 5004,
    TargetSubmissionID: 9004,
    SourceSubmissionID: 8240,
    SimilarityPercentage: 21.7,
    AnalysisDate: "2026-02-08T10:00:00.000Z",
  },
];

const performanceByAssessment = {
  1: { myMarks: 84, classAverage: 74, classMin: 30, classMax: 96 },
  3: { myMarks: 93, classAverage: 68, classMin: 82, classMax: 103 },
  4: { myMarks: 88, classAverage: 85, classMin: 79, classMax: 90 },
  7: { myMarks: 97, classAverage: 88, classMin: 73, classMax: 98 },
};

const graphLinePalette = {
  myPerformance: "#8B5A2B",
  classAverage: "#9EA15D",
  classMin: "#B3262E",
  classMax: "#2E6B3A",
};

function ProgressGraph() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const chartData = useMemo(() => {
    const student = users[0];

    return assessments
      .filter((assessment) => assessment.classID === courseClass.classID)
      .map((assessment) => {
        const submission = submissions.find(
          (item) => item.AssignmentID === assessment.assessmentID && item.StudentID === student.UserID
        );
        const match = submission
          ? matchResults.find((result) => result.TargetSubmissionID === submission.SubmissionID)
          : null;
        const performance = performanceByAssessment[assessment.assessmentID];

        return {
          assessmentLabel: String(assessment.assessmentID),
          assignmentTitle: assessment.title,
          myPerformance: performance.myMarks,
          classAverage: performance.classAverage,
          classMin: performance.classMin,
          classMax: performance.classMax,
          submissionStatus: submission?.Status ?? "Missing",
          similarity: match?.SimilarityPercentage ?? 0,
        };
      });
  }, []);

  return (
    <div className="progress-page">
      <div className="progress-shell">
        <Topbar userName={users[0].Name} toggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

        <div className="content-row">
          <Sidebar isOpen={isSidebarOpen} userRole={users[0].UserRole} />

          <main className="main-panel">
            <div className="subject-strip">
              <h1 className="subject-title">{courseClass.className}</h1>
              <p className="subject-subtitle">{courseClass.sectionLabel}</p>
            </div>

            <section className="chart-section">
              <p className="chart-axis-label">Performance (%)</p>

              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 14,
                      right: isSidebarOpen ? 35 : 42,
                      left: isSidebarOpen ? 3 : 9,
                      bottom: 15,
                    }}
                  >
                    <CartesianGrid stroke="#d9d9cf" vertical={false} />
                    <XAxis dataKey="assessmentLabel" tick={{ fill: "#3e4432", fontSize: 11 }} stroke="#8f9481" />
                    <YAxis
                      domain={[0, 120]}
                      tickCount={7}
                      tick={{ fill: "#3e4432", fontSize: 11 }}
                      stroke="#8f9481"
                    />
                    <Tooltip
                      cursor={{ stroke: "#9ba089", strokeDasharray: "3 3" }}
                      contentStyle={{
                        borderRadius: "8px",
                        borderColor: "#c6c7b9",
                        fontSize: "12px",
                      }}
                      formatter={(value, key) => {
                        if (key === "similarity") {
                          return [`${value}%`, "Similarity"];
                        }
                        return [value, key];
                      }}
                    />
                    <Legend verticalAlign="top" align="right" iconType="square" wrapperStyle={{ fontSize: "10px" }} />

                    <Line
                      type="monotone"
                      dataKey="myPerformance"
                      name="My Performance"
                      stroke={graphLinePalette.myPerformance}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="classAverage"
                      name="Class Average"
                      stroke={graphLinePalette.classAverage}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="classMin"
                      name="Class Min"
                      stroke={graphLinePalette.classMin}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="classMax"
                      name="Class Max"
                      stroke={graphLinePalette.classMax}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="marked-summary">
                <p>
                  Marked
                  <br />
                  Assignments
                  <br />
                  (4/{courseClass.numStudents})
                </p>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default ProgressGraph;
