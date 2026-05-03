# Flexroom Project Context
## Tech Stack:
- Frontend: React.js (with Tailwind/Bootstrap)
- Backend: Node.js (Express)
- Database: SQL Server (mssql package)

## Key SQL Schemas:
''' sql
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1) NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) check(Email LIKE '%@gmail.com') UNIQUE,
    Password NVARCHAR(100) check(LEN(Password)>=8),
    UserRole NVARCHAR(20) NOT NULL check(UserRole IN ('student','evaluator')),
    CreatedAt DATETIME DEFAULT GETDATE()
);   
-- where Password: hashed

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

CREATE TABLE Course (
    courseID INT PRIMARY KEY,
    courseName NVARCHAR(100) NOT NULL,
    courseCode INT NOT NULL UNIQUE,
    generatedDate NVARCHAR(20) NOT NULL,
    numClasses INT DEFAULT 0
); 

CREATE TABLE CourseClass (
    classID INT PRIMARY KEY,
    courseID INT NOT NULL REFERENCES Course(courseID),
    className NVARCHAR(100) NOT NULL,
    classCode INT NOT NULL UNIQUE,
    generatedDate NVARCHAR(20) NOT NULL,
    numStudents INT DEFAULT 0
);

--to understand differnece between Course and CourseClass: e.g. 
--Course: Physics
--CourseClass: Physics BSCS 4D, Physics BSCS 4E (different 
--section classes of same course) 

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
'''

## Core Logic:
- Authentication: JWT-based login/register
- Plagiarism: Comparing current StudentID file for which plagiarism detection is called, with all the submitted files in database

## Business Rules:
- Passwords must be at least 8 characters.
- Students can only see their own submissions.
- Evaluators can see all submissions and plagiarism results.
- File uploads are stored as binary in SQL.
- Frontend must send JSON objects with keys matching SQL column names.

##Design Patterns to Implement:
- State
- Template
- Adapter 
- Observer
- Iterator
- Singleton 
- Factory
- Composite Design Pattern

