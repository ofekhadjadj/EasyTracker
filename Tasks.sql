CREATE TABLE ET_Tasks (
    TaskID INT PRIMARY KEY IDENTITY(1,1), 
    ProjectID INT NOT NULL,               
    UserID INT NOT NULL,                  
    Description NVARCHAR(MAX),            
    DueDate DATE NOT NULL,                
    IsDone BIT NOT NULL DEFAULT 0, 
	CompletedAt DATETIME NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
	IsArchived BIT NOT NULL DEFAULT 0,

    CONSTRAINT FK_Tasks_Projects FOREIGN KEY (ProjectID) REFERENCES ET_Projects(ProjectID),
    CONSTRAINT FK_Tasks_Users FOREIGN KEY (UserID) REFERENCES ET_Users(UserID)
);

CREATE TYPE ET_TaskTableType AS TABLE
(
    Description NVARCHAR(MAX),
    DueDate DATE
);

CREATE PROCEDURE ET_AddMultipleTasksByEmail
    @Email NVARCHAR(200),
    @ProjectID INT,
    @Tasks ET_TaskTableType READONLY
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @UserID INT;

    -- מציאת מזהה המשתמש לפי המייל
    SELECT @UserID = UserID
    FROM ET_Users
    WHERE Email = @Email;

    -- בדיקה: אם המשתמש לא קיים
    IF @UserID IS NULL
    BEGIN
        RAISERROR('User not found with provided email.', 16, 1);
        RETURN;
    END

    -- טבלה זמנית לשמירת מזהי המשימות החדשות
    DECLARE @InsertedTasks TABLE (TaskID INT);

    -- הוספת המשימות וקבלת המזהים שהוקצו להן
    INSERT INTO ET_Tasks (
        ProjectID,
        UserID,
        Description,
        DueDate,
        IsDone,
        CreatedAt,
        IsArchived
    )
    OUTPUT INSERTED.TaskID INTO @InsertedTasks(TaskID)
    SELECT
        @ProjectID,
        @UserID,
        Description,
        DueDate,
        0,             -- IsDone
        GETDATE(),     -- CreatedAt
        0              -- IsArchived
    FROM @Tasks;

    -- החזרת מזהי המשימות ללקוח
    SELECT * FROM @InsertedTasks;
END;

CREATE PROCEDURE ET_GetTasksByUserAndProject
    @UserID INT,
    @ProjectID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        TaskID,
        ProjectID,
        UserID,
        Description,
        DueDate,
        IsDone,
        CompletedAt,
        CreatedAt,
        IsArchived
    FROM ET_Tasks
    WHERE UserID = @UserID AND ProjectID = @ProjectID AND IsArchived = 0
    ORDER BY DueDate ASC;
END;

exec ET_GetTasksByUserAndProject 3, 15

ALTER PROCEDURE ET_UpdateTask
    @TaskID INT,
    @Description NVARCHAR(MAX),
    @DueDate DATE
AS
BEGIN
    SET NOCOUNT OFF;

    UPDATE ET_Tasks
    SET 
        Description = @Description,
        DueDate = @DueDate
    WHERE TaskID = @TaskID;
END;

CREATE PROCEDURE ET_UpdateTaskStatus
    @TaskID INT,
    @IsDone BIT
AS
BEGIN
    SET NOCOUNT OFF;

    UPDATE ET_Tasks
    SET 
        IsDone = @IsDone,
        CompletedAt = CASE 
                         WHEN @IsDone = 1 AND CompletedAt IS NULL THEN GETDATE()
                         WHEN @IsDone = 0 THEN NULL
                         ELSE CompletedAt
                     END
    WHERE TaskID = @TaskID;
END;

CREATE PROCEDURE ET_ArchiveTask
    @TaskID INT
AS
BEGIN
    SET NOCOUNT OFF;

    UPDATE ET_Tasks
    SET IsArchived = 1
    WHERE TaskID = @TaskID;
END;


CREATE PROCEDURE ET_AddTask
    @UserID INT,
    @ProjectID INT,
    @Description NVARCHAR(MAX),
    @DueDate DATE
AS
BEGIN
    SET NOCOUNT OFF;

    DECLARE @NewTaskID INT;

    INSERT INTO ET_Tasks (
        ProjectID,
        UserID,
        Description,
        DueDate,
        IsDone,
        CreatedAt,
        IsArchived
    )
    VALUES (
        @ProjectID,
        @UserID,
        @Description,
        @DueDate,
        0,               -- IsDone
        GETDATE(),       -- CreatedAt
        0                -- IsArchived
    );

    -- החזרת TaskID חדש
    SET @NewTaskID = SCOPE_IDENTITY();
    SELECT @NewTaskID AS TaskID;
END;
