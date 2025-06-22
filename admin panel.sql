CREATE OR ALTER PROCEDURE sp_Admin_GetSystemSummary
AS
BEGIN
  SELECT 
    -- משתמשים (ללא אדמין)
    (SELECT COUNT(*) 
     FROM ET_Users 
     WHERE Role <> 'Admin') AS TotalUsers,

    (SELECT COUNT(*) 
     FROM ET_Users 
     WHERE Role <> 'Admin' AND IsActive = 1 AND EXISTS (
        SELECT 1 
        FROM ET_Sessions 
        WHERE UserID = ET_Users.UserID 
          AND DATEDIFF(DAY, StartDate, GETDATE()) <= 30
    )) AS ActiveUsers,

    (SELECT COUNT(*) 
     FROM ET_Users 
     WHERE Role <> 'Admin' AND IsActive = 0) AS InactiveUsers,

    -- פרויקטים
    (SELECT COUNT(*) FROM ET_Projects) AS TotalProjects,
    (SELECT COUNT(*) FROM ET_Projects WHERE isDone = 0) AS ActiveProjects,
    (SELECT COUNT(*) FROM ET_Projects WHERE isDone = 1) AS CompletedProjects,

    -- סטטיסטיקות
    (SELECT CAST(SUM(DurationSeconds / 3600.0 * HourlyRate) AS INT) 
     FROM ET_Sessions 
     WHERE isArchived = 0) AS TotalIncome,

    (SELECT CAST(SUM(DurationSeconds) / 3600 AS INT) 
     FROM ET_Sessions 
     WHERE isArchived = 0) AS TotalWorkHours,

    (SELECT COUNT(*) 
     FROM ET_Sessions 
     WHERE isArchived = 0) AS TotalSessions,

    (SELECT CAST(AVG(DurationSeconds) / 60 AS INT) 
     FROM ET_Sessions 
     WHERE isArchived = 0) AS AvgSessionDurationMinutes
END



exec sp_Admin_GetSystemSummary

select * from ET_Users
select * from ET_Projects
select * from ET_Sessions where isArchived = 0

CREATE OR ALTER PROCEDURE sp_Admin_GetTop5ActiveUsers
AS
BEGIN
  SELECT TOP 5
    U.UserID,
    U.FirstName,
    U.LastName,
    U.Email,
    COUNT(S.SessionID) AS TotalSessionsLast30Days
  FROM ET_Users U
  JOIN ET_Sessions S ON U.UserID = S.UserID
  WHERE S.isArchived = 0
    AND S.StartDate >= DATEADD(DAY, -30, GETDATE())
    AND U.Role <> 'Admin'
  GROUP BY U.UserID, U.FirstName, U.LastName, U.Email
  ORDER BY TotalSessionsLast30Days DESC
END


exec sp_Admin_GetSystemSummary
exec sp_Admin_GetTop5ActiveUsers

CREATE OR ALTER PROCEDURE sp_Admin_GetTop5EarningUsers
AS
BEGIN
  SELECT TOP 5
    U.UserID,
    U.FirstName,
    U.LastName,
    U.Email,
    CAST(SUM(S.DurationSeconds / 3600.0 * S.HourlyRate) AS INT) AS TotalEarnings
  FROM ET_Users U
  JOIN ET_Sessions S ON U.UserID = S.UserID
  WHERE S.isArchived = 0
    AND U.Role <> 'Admin'
  GROUP BY U.UserID, U.FirstName, U.LastName, U.Email
  ORDER BY TotalEarnings DESC
END


exec sp_Admin_GetTop5EarningUsers
exec sp_Admin_GetSystemSummary
exec sp_Admin_GetTop5ActiveUsers

CREATE OR ALTER PROCEDURE sp_Admin_GetAllUsersOverview
AS
BEGIN
  SELECT
    U.UserID,
    U.FirstName,
    U.LastName,
    U.Email,
    U.Role,
    U.IsActive,
    U.CreatedAt AS RegistrationDate, -- תאריך הרשמה למערכת
    U.image, -- תמונת המשתמש

    -- מספר הפרויקטים של המשתמש
    ISNULL(UserProjects.ProjectCount, 0) AS ProjectCount,

    -- סך הכנסה (שעות × תעריף)
    CAST(ISNULL(Earnings.TotalEarnings, 0) AS INT) AS TotalEarnings,

    -- מספר סשנים
    ISNULL(SessionStats.SessionCount, 0) AS SessionCount,

    -- תאריך הסשן האחרון
    SessionStats.LastSessionDate

  FROM ET_Users U

  -- פרויקטים שהמשתמש חבר בהם (לא מבוטל)
  LEFT JOIN (
    SELECT
      UP.UserID,
      COUNT(DISTINCT UP.ProjectID) AS ProjectCount
    FROM ET_UserProjects UP
    WHERE UP.isDisable = 0
    GROUP BY UP.UserID
  ) AS UserProjects ON UserProjects.UserID = U.UserID

  -- הכנסות מסשנים פעילים
  LEFT JOIN (
    SELECT
      S.UserID,
      SUM(S.DurationSeconds / 3600.0 * S.HourlyRate) AS TotalEarnings
    FROM ET_Sessions S
    WHERE S.isArchived = 0
    GROUP BY S.UserID
  ) AS Earnings ON Earnings.UserID = U.UserID

  -- סטטיסטיקות סשנים
  LEFT JOIN (
    SELECT
      S.UserID,
      COUNT(*) AS SessionCount,
      MAX(S.StartDate) AS LastSessionDate
    FROM ET_Sessions S
    WHERE S.isArchived = 0
    GROUP BY S.UserID
  ) AS SessionStats ON SessionStats.UserID = U.UserID

  WHERE U.Role <> 'Admin' -- החרגת אדמינים

  ORDER BY U.UserID
END



exec sp_Admin_GetSystemSummary
exec sp_Admin_GetAllUsersOverview
exec sp_Admin_GetTop5EarningUsers
exec sp_Admin_GetTop5ActiveUsers

exec sp_helptext 'sp_ET_DeactivateUser'

CREATE OR ALTER PROCEDURE sp_ET_ToggleUserActivation  
    @UserID INT  
AS  
BEGIN  
    SET NOCOUNT OFF;  
  
    UPDATE ET_Users  
    SET isActive = CASE  
        WHEN isActive = 1 THEN 0  
        ELSE 1  
    END  
    WHERE UserID = @UserID;  
END;

ALTER PROCEDURE sp_Admin_ResetPassword
    @UserID INT
AS
BEGIN
    SET NOCOUNT OFF;

    DECLARE @TempPassword VARCHAR(255) = 'EasyTrackerTempPass1234';

    UPDATE ET_Users
    SET Password = @TempPassword
    WHERE UserID = @UserID;
END;

exec sp_Admin_ResetPassword 2
select * from ET_Users 
exec sp_ET_ChangePassword 2, 'EasyTrackerTempPass1234', 'Arye1234q' 
exec sp_ET_ToggleUserActivation 2

INSERT INTO ET_Users (
    FirstName,
    LastName,
    Email,
    Password,
    Role,
    isActive,
    CreatedAt,
    Image
)
VALUES (
    'ADMIN',
    'ADMIN',
    'admin@easytracker.com',
    'EasyTrackerAdmin1234',
    'Admin',
    1,
    GETDATE(),
    NULL
);
