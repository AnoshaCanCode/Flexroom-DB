USE FlexroomDB;
GO

IF COL_LENGTH('dbo.Grades', 'DetailJSON') IS NULL
    ALTER TABLE dbo.Grades ADD DetailJSON NVARCHAR(MAX) NULL;
GO

IF OBJECT_ID('dbo.StudentSelfEval', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.StudentSelfEval (
        SelfEvalID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        AssessmentID INT NOT NULL,
        StudentID INT NOT NULL,
        RubricScores NVARCHAR(MAX) NOT NULL CONSTRAINT DF_SE_Rubric DEFAULT '{}',
        TestCaseScores NVARCHAR(MAX) NULL,
        TotalMarks DECIMAL(5,2) NULL,
        UpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT UQ_StudentSelfEval UNIQUE (AssessmentID, StudentID),
        CONSTRAINT FK_StudentSelfEval_Assessment FOREIGN KEY (AssessmentID) REFERENCES dbo.Assessment (assessmentID),
        CONSTRAINT FK_StudentSelfEval_User FOREIGN KEY (StudentID) REFERENCES dbo.Users (UserID)
    );
END
GO
