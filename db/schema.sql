USE FlexroomDB;
GO

CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) check(Email LIKE '%@gmail.com') UNIQUE,
    Password NVARCHAR(100) check(LEN(Password)>=8),
    UserRole NVARCHAR(20) NOT NULL check(UserRole IN ('student','evaluator')),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

INSERT INTO Users (Name, Email, Password, UserRole)
VALUES 
('Anosha Asher', 'anoshaasher@gmail.com', 'TeamLead2026!', 'evaluator'),
('Muhammad Ibrahim', 'mibrahim@gmail.com', 'LogicPass123', 'student'),
('Amal Fazeel', 'amalfazeel@gmail.com', 'AmalSecure456', 'student'),
('Dr. Smith', 'dr.smith@gmail.com', 'ProfessorPass!', 'evaluator'),
('John Doe', 'johndoe.test@gmail.com', 'StudentPass789', 'student');

SELECT * FROM Users;


    USE FlexroomDB;
GO
    create TABLE Submissions (
    SubmissionID INT PRIMARY KEY IDENTITY(1,1) NOT NULL,
    AssignmentID INT NOT NULL, 
    StudentID INT NOT NULL,    -- Foreign Key to Users table
    FileName NVARCHAR(255) NOT NULL,
    FileContent VARBINARY(MAX), -- The actual file data (0s and 1s)
    SubmissionDate DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(50) DEFAULT 'On-Time',
    
    FOREIGN KEY (StudentID) REFERENCES Users(UserID) ON DELETE CASCADE,
    Foreign Key (AssignmentID) References Assessment(assessmentID) on delete cascade
);


CREATE TABLE MatchResults (
    MatchID INT PRIMARY KEY IDENTITY(1,1) NOT NULL,
    TargetSubmissionID INT NOT NULL, -- The file being checked
    SourceSubmissionID INT NOT NULL, -- The file it is being compared against
    SimilarityPercentage DECIMAL(5,2) NOT NULL,
    FlaggedStatus AS (CASE WHEN SimilarityPercentage > 30.00 THEN 1 ELSE 0 END), -- Auto-flag if > 30%
    AnalysisDate DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Match_Target FOREIGN KEY (TargetSubmissionID) 
        REFERENCES Submissions(SubmissionID),
    CONSTRAINT FK_Match_Source FOREIGN KEY (SourceSubmissionID) 
        REFERENCES Submissions(SubmissionID)
);

INSERT INTO Submissions (AssignmentID, StudentID, FileName, FileContent, Status)
VALUES ( 6, 2, 'lab1_logic.cpp', CAST('int main() { return 0; }' AS VARBINARY(MAX)), 'On-Time');

INSERT INTO Submissions ( AssignmentID, StudentID, FileName, FileContent, Status)
VALUES (6, 3, 'lab1_final.cpp', CAST('int main() { return 0; }' AS VARBINARY(MAX)), 'On-Time');

INSERT INTO MatchResults (TargetSubmissionID, SourceSubmissionID, SimilarityPercentage)
VALUES (2, 1, 95.50);

Select * from Submissions
select * from MatchResults



CREATE TABLE StudentProfiles (
    UserID INT PRIMARY KEY NOT NULL,
    EducationLevel NVARCHAR(50) NOT NULL check(EducationLevel IN ('school','college','graduate','postgraduate')),
    EducationYear INT check(EducationYear >= 1),--school class level or higher education year
    JoinClassNum INT DEFAULT 0, --number of classes joined
    Foreign Key (UserID) REFERENCES Users
);

CREATE TABLE EvaluatorProfiles (
    UserID INT PRIMARY KEY NOT NULL,
    EvalClassNum INT DEFAULT 0, --number of classes evaluated
    Foreign Key (UserID) REFERENCES Users
);
GO

INSERT INTO StudentProfiles (UserID, EducationLevel, EducationYear) 
VALUES 
(2, 'graduate', 2),
(3, 'graduate', 3),
(5, 'graduate', 1);

INSERT INTO EvaluatorProfiles (UserID) 
VALUES 
(1),
(4);

SELECT * FROM StudentProfiles;
SELECT * FROM EvaluatorProfiles;

CREATE TABLE CourseClass (
    classID INT PRIMARY KEY,
    courseID INT NOT NULL DEFAULT 0,
    className NVARCHAR(100) NOT NULL,
    classCode INT NOT NULL UNIQUE,
    generatedDate NVARCHAR(20) NOT NULL,
    numStudents INT DEFAULT 0
);

CREATE TABLE Assessment (
    assessmentID INT PRIMARY KEY,
    classID INT NOT NULL REFERENCES CourseClass(classID),
    title NVARCHAR(200) NOT NULL,
    type NVARCHAR(20) NOT NULL,
        CHECK (type IN ('document', 'code', 'bubble')), 
    marks INT NOT NULL,
    uploadingDate NVARCHAR(20) NOT NULL,
    dueDate NVARCHAR(20) NULL,
    status NVARCHAR(20) DEFAULT 'unmarked'
);

INSERT INTO CourseClass (classID, courseID, className, classCode, generatedDate, numStudents)
VALUES
    (1, 1, 'OOP-A', 3011, '2025-01-10', 35),
    (2, 1, 'OOP-B', 3012, '2025-01-10', 30),
    (3, 2, 'DB-A', 3511, '2025-01-12', 40),
    (4, 3, 'SE-A', 4711, '2025-08-15', 38),
    (5, 4, 'DS-A', 2011, '2025-08-15', 42);

INSERT INTO Assessment
    (assessmentID, classID, title, type, marks, uploadingDate, dueDate, status)
VALUES
    (1, 1, 'Lab 1 – Inheritance Report', 'document', 10, '2025-02-20', '2025-03-10', 'marked'),
    (2, 1, 'Assignment 2 – Linked List', 'code', 20, '2025-03-01', '2025-03-20', 'unmarked'),
    (3, 3, 'Quiz 1 – ER Diagrams', 'bubble', 5, '2025-02-25', '2025-02-28', 'marked'),
    (4, 4, 'Assignment 1 – SRS Document', 'document', 25, '2025-03-20', '2025-04-05', 'unmarked'),
    (5, 5, 'Lab 3 – BST Implementation', 'code', 15, '2025-09-01', NULL, 'unmarked'),
    (6, 5, 'Mid Exam – Data Structures', 'document', 50, '2025-10-01', '2025-10-15', 'unmarked');

    SELECT * FROM CourseClass;
    SELECT * FROM Assessment;

    CREATE TABLE TestCases (
    TestCaseID INT PRIMARY KEY IDENTITY(1,1) NOT NULL,
    AssessmentID INT NOT NULL,
    Input NVARCHAR(MAX) NULL,          -- The stdin (e.g., "3 5")
    ExpectedOutput NVARCHAR(MAX) NOT NULL, -- The stdout (e.g., "8")
    Marks INT DEFAULT 0,                -- Marks awarded for passing THIS specific test
    FOREIGN KEY (AssessmentID) REFERENCES Assessment(assessmentID) ON DELETE CASCADE
);

-- Sample Data for Assessment 2 (Linked List - Code Type)
INSERT INTO TestCases (AssessmentID, Input, ExpectedOutput, Marks)
VALUES 
(2, '5 10 15', '15 10 5', 10), -- Test Case 1: Reverse logic
(2, '1', '1', 10);              -- Test Case 2: Single node


CREATE TABLE Grades (
    GradeID INT PRIMARY KEY IDENTITY(1,1) NOT NULL,
    AssessmentID INT NOT NULL,
    StudentID INT NOT NULL,
    TotalMarks DECIMAL(5,2),
    Feedback NVARCHAR(MAX),
    GradedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (AssessmentID) REFERENCES Assessment(assessmentID),
    FOREIGN KEY (StudentID) REFERENCES Users(UserID)
);

CREATE TABLE Rubrics (
    RubricID INT PRIMARY KEY IDENTITY(1,1) NOT NULL,
    AssessmentID INT NOT NULL,
    CriterionDescription NVARCHAR(255) NOT NULL,
    MaxPoints INT NOT NULL,
    FOREIGN KEY (AssessmentID) REFERENCES Assessment(assessmentID) ON DELETE CASCADE
);

ALTER TABLE Assessment ADD SolutionKey VARBINARY(MAX) NULL;
ALTER TABLE Assessment ADD SolutionKeyName NVARCHAR(255) NULL;
