-- יצירת טבלת users
CREATE TABLE ET_Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    HashedPassword VARCHAR(255) NOT NULL,
    Role NVARCHAR(10) DEFAULT 'User' CHECK (Role IN ('Admin', 'User')),
    CreatedAt DATETIME DEFAULT GETDATE()
);



-- הכנסת נתונים לדוגמה לטבלת users
INSERT INTO ET_Users (FirstName, LastName, Email, HashedPassword, Role, CreatedAt)
VALUES 
    ('David', 'Cohen', 'david.cohen@example.com', 'hashed_password_123', 'Admin', GETDATE()),
    ('Rachel', 'Levi', 'rachel.levi@example.com', 'hashed_password_456', 'User', GETDATE()),
    ('Omer', 'Sharon', 'omer.sharon@example.com', 'hashed_password_789', 'User', GETDATE()),
    ('Noa', 'Bar', 'noa.bar@example.com', 'hashed_password_101', 'Admin', GETDATE()),
    ('Yossi', 'Mizrahi', 'yossi.mizrahi@example.com', 'hashed_password_202', 'User', GETDATE());


SELECT * FROM ET_Users

ALTER TABLE ET_Users 
ADD isActive BIT DEFAULT 1 NOT NULL;



DROP TABLE ET_Users;



-- יצירת טבלת ET_Users
CREATE TABLE ET_Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Role NVARCHAR(10) DEFAULT 'User' CHECK (Role IN ('Admin', 'User')),
    isActive BIT DEFAULT 1 NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- הכנסת נתונים לדוגמה לטבלת ET_Users
INSERT INTO ET_Users (FirstName, LastName, Email, Password, Role, isActive, CreatedAt)
VALUES 
    ('David', 'Cohen', 'david.cohen@example.com', 'hashed_password_123', 'Admin', 1, GETDATE()),
    ('Rachel', 'Levi', 'rachel.levi@example.com', 'hashed_password_456', 'User', 1, GETDATE()),
    ('Omer', 'Sharon', 'omer.sharon@example.com', 'hashed_password_789', 'User', 1, GETDATE()),
    ('Noa', 'Bar', 'noa.bar@example.com', 'hashed_password_101', 'Admin', 0, GETDATE()), -- משתמש לא פעיל
    ('Yossi', 'Mizrahi', 'yossi.mizrahi@example.com', 'hashed_password_202', 'User', 1, GETDATE());



	CREATE PROCEDURE sp_ET_AddUser
    @FirstName VARCHAR(50),
    @LastName VARCHAR(50),
    @Email VARCHAR(255),
    @Password VARCHAR(255),
    @Role NVARCHAR(10) = 'User', -- ברירת מחדל User
    @isActive BIT = 1 -- ברירת מחדל פעיל
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO ET_Users (FirstName, LastName, Email, Password, Role, isActive, CreatedAt)
    VALUES (@FirstName, @LastName, @Email, @Password, @Role, @isActive, GETDATE());
END;



EXEC sp_ET_AddUser
    @FirstName = 'Eli',
    @LastName = 'Avraham',
    @Email = 'eli.avraham@example.com',
    @Password = 'hashed_password_123',
    @Role = 'User',
    @isActive = 1;



	CREATE PROCEDURE sp_ET_UpdateUser
    @UserID INT,
    @FirstName VARCHAR(50) = NULL,
    @LastName VARCHAR(50) = NULL,
    @Email VARCHAR(255) = NULL,
    @Password VARCHAR(255) = NULL,
    @Role NVARCHAR(10) = NULL,
    @isActive BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE ET_Users
    SET 
        FirstName = COALESCE(@FirstName, FirstName),
        LastName = COALESCE(@LastName, LastName),
        Email = COALESCE(@Email, Email),
        Password = COALESCE(@Password, Password),
        Role = COALESCE(@Role, Role),
        isActive = COALESCE(@isActive, isActive)
    WHERE UserID = @UserID;
END;


EXEC sp_ET_UpdateUser 
    @UserID = 6, 
    @FirstName = 'Shaked',
    @LastName = 'Tol',
    @Role = 'Admin',
	@Email='shakedtol@gmail.com'


	CREATE PROCEDURE sp_ET_DeactivateUser
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE ET_Users
    SET isActive = 0
    WHERE UserID = @UserID;
END;



EXEC sp_ET_DeactivateUser @UserID = 1;






-- יצירת טבלת ET_Clients
CREATE TABLE ET_Clients (
    ClientID INT IDENTITY(1,1) PRIMARY KEY,
    CompanyName VARCHAR(255) NOT NULL,
    ContactPerson VARCHAR(255) NULL,
    Email VARCHAR(255) NULL,
    ContactPersonPhone VARCHAR(50) NULL,
    OfficePhone VARCHAR(50) NULL,
    UserID INT NULL,
    CONSTRAINT FK_User FOREIGN KEY (UserID) REFERENCES ET_Users(UserID) ON DELETE CASCADE
);







-- יצירת טבלת ET_Projects
CREATE TABLE ET_Projects (
    ProjectID INT IDENTITY(1,1) PRIMARY KEY,
    ProjectName VARCHAR(255) NOT NULL,
    Description TEXT NULL,
    HourlyRate DECIMAL(10,2) NULL,
    Image VARCHAR(255) NULL,
    ClientID INT NULL,
    CONSTRAINT FK_Client FOREIGN KEY (ClientID) REFERENCES ET_Clients(ClientID) ON DELETE SET NULL
);



INSERT INTO ET_Clients (CompanyName, ContactPerson, Email, ContactPersonPhone, OfficePhone, UserID)
VALUES 
    ('Tech Solutions Ltd', 'David Cohen', 'david@techsolutions.com', '052-1234567', '03-5678901', 1),
    ('Green Energy Inc.', 'Rachel Levi', 'rachel@greenenergy.com', '054-9876543', '02-3456789', 2),
    ('Blue Ocean Consulting', 'Omer Sharon', 'omer@blueocean.com', NULL, '04-7654321', 3),
    ('Smart Home Systems', 'Noa Bar', 'noa@smarthome.com', '053-5678912', NULL, 4),
    ('Digital Marketing Agency', 'Yossi Mizrahi', 'yossi@digitalmarketing.com', '055-8765432', '09-8765432', 5);




	INSERT INTO ET_Projects (ProjectName, Description, HourlyRate, Image, ClientID)
VALUES 
    ('Website Development', 'Building a responsive e-commerce website.', 120.50, 'images/web_dev.png', 1),
    ('Solar Panel Installation', 'Installation of solar panels for residential areas.', 200.00, 'images/solar_panels.png', 2),
    ('Business Strategy Consulting', 'Helping businesses optimize their operations.', 180.75, 'images/consulting.png', 3),
    ('Smart Home Automation', 'Installing IoT devices for smart home automation.', 150.00, 'images/smart_home.png', 4),
    ('SEO & Digital Marketing', 'Improving search engine ranking for businesses.', 100.00, 'images/seo_marketing.png', 5);


	select * from  ET_Projects
	select * from  ET_Clients



	-- הוספת עמודה חדשה isArchived עם ברירת מחדל 0 (לא בארכיון)
ALTER TABLE ET_Projects 
ADD isArchived BIT DEFAULT 0 NOT NULL;



CREATE PROCEDURE sp_ET_AddProject
    @ProjectName VARCHAR(255),
    @Description TEXT = NULL,
    @HourlyRate DECIMAL(10,2) = NULL,
    @Image VARCHAR(255) = NULL,
    @ClientID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO ET_Projects (ProjectName, Description, HourlyRate, Image, ClientID, isArchived)
    VALUES (@ProjectName, @Description, @HourlyRate, @Image, @ClientID, 0);
END;




CREATE PROCEDURE sp_ET_UpdateProject
    @ProjectID INT,
    @ProjectName VARCHAR(255) = NULL,
    @Description TEXT = NULL,
    @HourlyRate DECIMAL(10,2) = NULL,
    @Image VARCHAR(255) = NULL,
    @ClientID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE ET_Projects
    SET 
        ProjectName = COALESCE(@ProjectName, ProjectName),
        Description = COALESCE(@Description, Description),
        HourlyRate = COALESCE(@HourlyRate, HourlyRate),
        Image = COALESCE(@Image, Image),
        ClientID = COALESCE(@ClientID, ClientID)
    WHERE ProjectID = @ProjectID;
END;




CREATE PROCEDURE sp_ET_ArchiveProject
    @ProjectID INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE ET_Projects
    SET isArchived = 1
    WHERE ProjectID = @ProjectID;
END;


EXEC sp_ET_AddProject 
    @ProjectName = 'AI DevFelopment BRILLIANT WEB',
    @Description = 'Building an AI-powered chatbot.',
    @HourlyRate = 1540.00,
    @Image = 'images/ai_dev.png',
    @ClientID = 1;


	EXEC sp_ET_UpdateProject 
    @ProjectID = 2, 
    @ProjectName = 'Updated AI Project',
    @HourlyRate = 180.00;


	EXEC sp_ET_ArchiveProject @ProjectID = 3;


	-- הוספת עמודה חדשה isArchived עם ברירת מחדל 0 (לא בארכיון)
ALTER TABLE ET_Clients 
ADD isArchived BIT DEFAULT 0 NOT NULL;

	select * from  ET_Sessions


	CREATE PROCEDURE sp_ET_AddClient
    @CompanyName VARCHAR(255),
    @ContactPerson VARCHAR(255) = NULL,
    @Email VARCHAR(255) = NULL,
    @ContactPersonPhone VARCHAR(50) = NULL,
    @OfficePhone VARCHAR(50) = NULL,
    @UserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO ET_Clients (CompanyName, ContactPerson, Email, ContactPersonPhone, OfficePhone, UserID, isArchived)
    VALUES (@CompanyName, @ContactPerson, @Email, @ContactPersonPhone, @OfficePhone, @UserID, 0);
END;



EXEC sp_ET_AddClient 
    @CompanyName = 'Future Tech Ltd',
    @ContactPerson = 'Michael Green',
    @Email = 'michael@futuretech.com',
    @ContactPersonPhone = '052-9876543',
    @OfficePhone = '03-1234567',
    @UserID = 2;




	CREATE PROCEDURE sp_ET_UpdateClient
    @ClientID INT,
    @CompanyName VARCHAR(255) = NULL,
    @ContactPerson VARCHAR(255) = NULL,
    @Email VARCHAR(255) = NULL,
    @ContactPersonPhone VARCHAR(50) = NULL,
    @OfficePhone VARCHAR(50) = NULL,
    @UserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE ET_Clients
    SET 
        CompanyName = COALESCE(@CompanyName, CompanyName),
        ContactPerson = COALESCE(@ContactPerson, ContactPerson),
        Email = COALESCE(@Email, Email),
        ContactPersonPhone = COALESCE(@ContactPersonPhone, ContactPersonPhone),
        OfficePhone = COALESCE(@OfficePhone, OfficePhone),
        UserID = COALESCE(@UserID, UserID)
    WHERE ClientID = @ClientID;
END;



EXEC sp_ET_UpdateClient 
    @ClientID = 4, 
    @CompanyName = 'Ofek`s company',
    @Email = 'newemail@futuretech.com';



	CREATE PROCEDURE sp_ET_ArchiveClient
    @ClientID INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE ET_Clients
    SET isArchived = 1
    WHERE ClientID = @ClientID;
END;




EXEC sp_ET_ArchiveClient @ClientID = 5;





ALTER TABLE ET_Sessions 
DROP COLUMN UserID;



SELECT name AS ForeignKeyName
FROM sys.foreign_keys
WHERE parent_object_id = OBJECT_ID('ET_Sessions');

ALTER TABLE ET_Sessions 
DROP CONSTRAINT FK_Session_User;


ALTER TABLE ET_Sessions 
DROP COLUMN UserID;
select * from ET_Sessions

select * from ET_UserProjects



CREATE PROCEDURE sp_ET_AddUserToProject
    @UserID INT,
    @ProjectID INT,
    @Role NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    -- בדיקה אם המשתמש כבר משויך לפרויקט
    IF EXISTS (
        SELECT 1 FROM ET_UserProjects 
        WHERE UserID = @UserID AND ProjectID = @ProjectID
    )
    BEGIN
        PRINT 'User is already assigned to this project.';
        RETURN;
    END

    -- הוספת המשתמש לטבלת ET_UserProjects עם התפקיד שנבחר
    INSERT INTO ET_UserProjects (UserID, ProjectID, Role)
    VALUES (@UserID, @ProjectID, @Role);
    
    PRINT 'User successfully added to the project.';
END;




CREATE PROCEDURE sp_ET_AddProject
    @ProjectName VARCHAR(255),
    @Description TEXT = NULL,
    @HourlyRate DECIMAL(10,2) = NULL,
    @Image VARCHAR(255) = NULL,
    @ClientID INT = NULL,
    @CreatedByUserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @NewProjectID INT;

    -- יצירת הפרויקט והחזרת ה-ID שלו
    INSERT INTO ET_Projects (ProjectName, Description, HourlyRate, Image, ClientID, CreatedByUserID, isArchived)
    VALUES (@ProjectName, @Description, @HourlyRate, @Image, @ClientID, @CreatedByUserID, 0);

    -- שמירת ה-ID של הפרויקט שנוצר
    SET @NewProjectID = SCOPE_IDENTITY();

    -- קריאה לפרוצדורה שמוסיפה את המשתמש שיצר את הפרויקט לטבלת הקשר
    EXEC sp_ET_AddUserToProject @UserID = @CreatedByUserID, @ProjectID = @NewProjectID, @Role = 'ProjectManager';
END;





ALTER TABLE ET_Projects 
ADD CreatedByUserID INT NOT NULL;

ALTER TABLE ET_Projects 
ADD CreatedByUserID INT NULL;


DROP PROCEDURE IF EXISTS sp_ET_AddProject;



INSERT INTO ET_Projects 
    (ProjectName, Description, HourlyRate, Image, ClientID, CreatedByUserID, isArchived)
VALUES 
    (
        'Time Tracking System',
        'Development of a web-based time tracking solution for freelancers.',
        150.00,
        'images/timetracker.png',
        2,              -- ClientID
        3,              -- CreatedByUserID
        0               -- isArchived
    );


select * from ET_UserProjects
select * from ET_Projects



EXEC sp_helptext sp_ET_AddUserToProject;


PRINT 'CreatedByUserID: ' + CAST(@CreatedByUserID AS VARCHAR);
PRINT 'ProjectID: ' + CAST(@NewProjectID AS VARCHAR);


DELETE FROM ET_Projects;

select * from ET_Projects
select * from ET_UserProjects



INSERT INTO ET_Projects 
    (ProjectName, Description, HourlyRate, Image, ClientID, CreatedByUserID, isArchived)
VALUES
    (
        'Website Redesign',
        'Modernizing the company website for better UX and SEO.',
        150.00,
        'images/website_redesign.png',
        1,
        2,
        0
    ),
    (
        'Mobile App Development',
        'Creating a cross-platform mobile app for internal communication.',
        180.00,
        'images/mobile_app.png',
        2,
        3,
        0
    ),
    (
        'Cloud Migration',
        'Migrating legacy systems to the cloud with minimal downtime.',
        200.00,
        'images/cloud_migration.png',
        3,
        4,
        0
    );


	DROP PROCEDURE IF EXISTS sp_ET_AddUserToProject;






	ALTER PROCEDURE sp_ET_AddProject
    @ProjectName VARCHAR(255),
    @Description TEXT = NULL,
    @HourlyRate DECIMAL(10,2) = NULL,
    @Image VARCHAR(255) = NULL,
    @ClientID INT = NULL,
    @CreatedByUserID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @NewProjectID INT;

    -- הוספת הפרויקט
    INSERT INTO ET_Projects (
        ProjectName,
        Description,
        HourlyRate,
        Image,
        ClientID,
        CreatedByUserID,
        isArchived
    )
    VALUES (
        @ProjectName,
        @Description,
        @HourlyRate,
        @Image,
        @ClientID,
        @CreatedByUserID,
        0
    );

    -- קבלת מזהה הפרויקט החדש
    SET @NewProjectID = SCOPE_IDENTITY();

    -- הוספת היוזר שיצר את הפרויקט כ-ProjectManager לטבלת ET_UserProjects
    INSERT INTO ET_UserProjects (UserID, ProjectID, Role)
    VALUES (@CreatedByUserID, @NewProjectID, 'ProjectManager');
END;





INSERT INTO ET_Projects 
    (ProjectName, Description, HourlyRate, Image, ClientID, CreatedByUserID, isArchived)
VALUES
-- פרויקט עיצוב אתר
('Website Redesign', 
 'Redesign of the corporate website to improve usability and SEO.', 
 160.00, 
 'images/website_redesign.png', 
 1, 
 2, 
 0),

-- פרויקט אפליקציית מובייל
('Mobile App Dev', 
 'Building a mobile application for internal communication.', 
 180.00, 
 'images/mobile_app.png', 
 2, 
 3, 
 0),

-- פרויקט מעבר לענן
('Cloud Migration', 
 'Migrating company infrastructure to AWS.', 
 200.00, 
 'images/cloud_migration.png', 
 3, 
 4, 
 0),

-- פרויקט לוח ניהול
('Admin Dashboard', 
 'Developing a management dashboard with KPIs and analytics.', 
 170.00, 
 'images/admin_dashboard.png', 
 1, 
 2, 
 0),

-- פרויקט צ'אט בוט
('AI Chatbot', 
 'Building an AI chatbot for customer support automation.', 
 190.00, 
 'images/chatbot.png', 
 4, 
 5, 
 0);


 select * from ET_Projects
 select * from ET_UserProjects


 EXEC sp_ET_AddProject 
    @ProjectName = 'Marketing Analytics',
    @Description = 'Building dashboards to monitor campaign performance.',
    @HourlyRate = 130.00,
    @Image = 'images/marketing.png',
    @ClientID = 1,
    @CreatedByUserID = 2;

EXEC sp_ET_AddProject 
    @ProjectName = 'HR System Upgrade',
    @Description = 'Improving internal HR tools and workflows.',
    @HourlyRate = 150.00,
    @Image = 'images/hr_upgrade.png',
    @ClientID = 2,
    @CreatedByUserID = 3;

EXEC sp_ET_AddProject 
    @ProjectName = 'Cyber Threat Detection',
    @Description = 'Developing a system for real-time cyber threat analysis.',
    @HourlyRate = 200.00,
    @Image = 'images/cyber_threat.png',
    @ClientID = 3,
    @CreatedByUserID = 4;

EXEC sp_ET_AddProject 
    @ProjectName = 'Client Onboarding Portal',
    @Description = 'Creating a smooth onboarding experience for new clients.',
    @HourlyRate = 175.00,
    @Image = 'images/onboarding.png',
    @ClientID = 1,
    @CreatedByUserID = 5;

EXEC sp_ET_AddProject 
    @ProjectName = 'AI Voice Assistant',
    @Description = 'Developing a voice-controlled assistant for service requests.',
    @HourlyRate = 210.00,
    @Image = 'images/voice_assistant.png',
    @ClientID = 2,
    @CreatedByUserID = 2;


select * from ET_UserProjects
select * from ET_Projects


Invoke-Sqlcmd -ServerInstance "ServerName\InstanceName" `
 -Query "BACKUP DATABASE [igroup4_prod
] TO DISK = N'C:\Backup\igroup4_prod
.bak' WITH FORMAT, INIT, NAME = 'EasyTracker Full Backup';"


SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'igroup4_prod';

select * from ET_Users

EXEC sp_helptext 'sp_ET_AddUser ';





ALTER PROCEDURE sp_ET_AddUser
    @FirstName NVARCHAR(50),
    @LastName NVARCHAR(50),
    @Email NVARCHAR(100),
    @Password NVARCHAR(100),
    @Role NVARCHAR(50) = 'User'  -- ברירת מחדל
AS
BEGIN
    -- מוודא שהשרת יחזיר את מספר השורות שהושפעו
    SET NOCOUNT OFF;

    INSERT INTO ET_Users (FirstName, LastName, Email, [Password], [Role])
    VALUES (@FirstName, @LastName, @Email, @Password, @Role);
END





ALTER TABLE ET_Sessions
ADD UserID INT NULL;




-- סשן תכנות למודול התחברות
EXEC sp_ET_AddSession
    @ProjectID = 10,
    @UserID = 2,
    @StartDate = '2025-03-21 09:00:00',
    @EndDate = '2025-03-21 11:00:00',
    @DurationSeconds = 7200,
    @HourlyRate = 150.00,
    @Description = 'פיתוח התחברות משתמשים',
    @LabelID = 1;

-- סשן עיצוב דשבורד
EXEC sp_ET_AddSession
    @ProjectID = 21,
    @UserID = 3,
    @StartDate = '2025-03-22 10:00:00',
    @EndDate = '2025-03-22 12:30:00',
    @DurationSeconds = 9000,
    @HourlyRate = 160.00,
    @Description = 'עיצוב דשבורד ניהול לקוחות',
    @LabelID = 2;

-- סשן QA ובדיקות
EXEC sp_ET_AddSession
    @ProjectID = 13,
    @UserID = 4,
    @StartDate = '2025-03-23 14:00:00',
    @EndDate = '2025-03-23 15:45:00',
    @DurationSeconds = 6300,
    @HourlyRate = 145.00,
    @Description = 'בדיקות פונקציונליות ו-QA לאפליקציה',
    @LabelID = 3;

-- סשן כתיבת תיעוד
EXEC sp_ET_AddSession
    @ProjectID = 1,
    @UserID = 5,
    @StartDate = '2025-03-24 08:30:00',
    @EndDate = '2025-03-24 10:00:00',
    @DurationSeconds = 5400,
    @HourlyRate = 140.00,
    @Description = 'כתיבת מסמכי API ומדריכים',
    @LabelID = NULL;

-- סשן תכנות בוקר
EXEC sp_ET_AddSession
    @ProjectID = 16,
    @UserID = 2,
    @StartDate = '2025-03-25 07:00:00',
    @EndDate = '2025-03-25 09:00:00',
    @DurationSeconds = 7200,
    @HourlyRate = 150.00,
    @Description = 'באגים ותיקונים קטנים',
    @LabelID = 2;



	ALTER PROCEDURE sp_ET_AddUser  
    @FirstName NVARCHAR(50),  
    @LastName NVARCHAR(50),  
    @Email NVARCHAR(100),  
    @Password NVARCHAR(100)  
AS  
BEGIN  
    SET NOCOUNT OFF;  
  
    INSERT INTO ET_Users (FirstName, LastName, Email, [Password], [Role])  
    VALUES (@FirstName, @LastName, @Email, @Password, 'User');  
END  



EXEC sp_ET_AddUser 
    @FirstName = N'דנה',
    @LastName = N'כהן',
    @Email = N'dana@example.com',
    @Password = N'SuperSecure123';





	drop PROCEDURE sp_ET_AuthenticateUser  
    @Email NVARCHAR(100),  
    @Password NVARCHAR(100)  
AS  
BEGIN  
    SET NOCOUNT OFF;

    IF EXISTS (
        SELECT 1 
        FROM ET_Users  
        WHERE Email = @Email AND [Password] = @Password
    )
    BEGIN
        SELECT 1 AS IsAuthenticated;  -- משתמש קיים
    END
    ELSE
    BEGIN
        SELECT 0 AS IsAuthenticated;  -- לא נמצא משתמש
    END
END


EXEC sp_ET_AuthenticateUser 
    @Email = 'dana@example.com', 
    @Password = 'SupכerSecure123';



alter PROCEDURE sp_ET_UpdateUser  
    @UserID INT,  
    @FirstName VARCHAR(50) = NULL,  
    @LastName VARCHAR(50) = NULL,  
    @Email VARCHAR(255) = NULL,  
    @Password VARCHAR(255) = NULL,  
    @Role NVARCHAR(10) = NULL,  
    @isActive BIT = NULL  
AS  
BEGIN  
    SET NOCOUNT ON;  
  
    UPDATE ET_Users  
    SET   
        FirstName = COALESCE(@FirstName, FirstName),  
        LastName = COALESCE(@LastName, LastName),  
        Email = COALESCE(@Email, Email),  
        Password = COALESCE(@Password, Password),  
        Role = COALESCE(@Role, Role),  
        isActive = COALESCE(@isActive, isActive)  
    WHERE UserID = @UserID;  
END;  



	CREATE PROCEDURE sp_ET_LoginUser
    @Email NVARCHAR(100),
    @Password NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT OFF;

    SELECT 
        UserID,
        FirstName,
        LastName,
        Email,
        [Role],
        IsActive
    FROM ET_Users
    WHERE Email = @Email AND [Password] = @Password;
END


EXEC sp_ET_LoginUser 
    @Email = 'dana@example.com',
    @Password = 'SuperSecure123';




	ALTER PROCEDURE sp_ET_LoginUser
    @Email NVARCHAR(100),
    @Password NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT OFF;

    IF EXISTS (
        SELECT 1 
        FROM ET_Users
        WHERE Email = @Email AND [Password] = @Password AND IsActive = 1
    )
    BEGIN
        SELECT 
            UserID,
            FirstName,
            LastName,
            Email,
            [Role],
            IsActive
        FROM ET_Users
        WHERE Email = @Email AND [Password] = @Password AND IsActive = 1;
    END
    ELSE
    BEGIN
        SELECT 0 AS Result;
    END
END




alter PROCEDURE sp_ET_LoginUser
    @Email NVARCHAR(100),
    @Password NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        UserID,
        FirstName,
        LastName,
        Email,
        [Role],
        IsActive
    FROM ET_Users
    WHERE Email = @Email AND [Password] = @Password;
END








ALTER PROCEDURE sp_ET_UpdateUser  
    @UserID INT,  
    @Password VARCHAR(255), -- חובה לבדוק התאמה
    @FirstName VARCHAR(50) = NULL,  
    @LastName VARCHAR(50) = NULL,  
    @Email VARCHAR(255) = NULL
AS  
BEGIN  
    SET NOCOUNT OFF;  

    -- נבדוק האם קיים משתמש עם הסיסמה וה-ID שנשלחו
    IF EXISTS (
        SELECT 1 
        FROM ET_Users 
        WHERE UserID = @UserID AND [Password] = @Password
    )
    BEGIN
        -- עדכון פרטים רק אם הסיסמה תואמת
        UPDATE ET_Users  
        SET   
            FirstName = COALESCE(@FirstName, FirstName),  
            LastName = COALESCE(@LastName, LastName),  
            Email = COALESCE(@Email, Email)
        WHERE UserID = @UserID;
    END
    ELSE
    BEGIN
        -- אם אין התאמה – לא מתבצע עדכון, אפשר להחזיר שורה לצורך בדיקה
        RAISERROR('Password does not match user record.', 16, 1);
    END
END;



EXEC sp_ET_UpdateUser
    @UserID = 13,
    @Password = 'SuperSecure123',
    @FirstName = 'דנה',
    @LastName = 'כהן חדשה',
    @Email = 'dana.new@example.com';





	CREATE PROCEDURE sp_ET_ChangePassword  
    @UserID INT,  
    @OldPassword VARCHAR(255),  
    @NewPassword VARCHAR(255)  
AS  
BEGIN  
    SET NOCOUNT ON;

    -- בדיקה אם המשתמש קיים והסיסמה הישנה תואמת
    IF EXISTS (
        SELECT 1 
        FROM ET_Users 
        WHERE UserID = @UserID AND [Password] = @OldPassword
    )
    BEGIN
        -- עדכון הסיסמה החדשה
        UPDATE ET_Users  
        SET [Password] = @NewPassword  
        WHERE UserID = @UserID;

        SELECT 1 AS Success, 'Password changed successfully' AS Message;
    END
    ELSE
    BEGIN
        -- לא נמצאה התאמה
        SELECT 0 AS Success, 'Incorrect current password' AS Message;
    END
END;



EXEC sp_ET_ChangePassword
    @UserID = 3,
    @OldPassword = 'hashed_password_789',
    @NewPassword = 'new5678';
