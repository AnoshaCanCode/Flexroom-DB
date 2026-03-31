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