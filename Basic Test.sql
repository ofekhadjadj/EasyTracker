select * from ET_Sessions
select * from ET_Clients
select * from ET_Labels
select * from ET_Users
select * from ET_Projects
select * from ET_UserProjects


select * 
from ET_Projects inner join ET_UserProjects on ET_Projects.ProjectID=ET_UserProjects.ProjectID
where ET_UserProjects.UserID=3



CREATE PROCEDURE sp_ET_GetProjectsById    
    @UserID INT
AS    
BEGIN    
    SET NOCOUNT OFF;  
  
        -- ����� ������ �����  
        select ET_Projects.ProjectID,
		ET_Projects.ProjectName,
		ET_Projects.Description,
		ET_Projects.HourlyRate,
		ET_Projects.Image,
		ET_Projects.ClientID,
		ET_Projects.isArchived,
		ET_Projects.CreatedByUserID
		from ET_Projects  inner join ET_UserProjects  on ET_Projects.ProjectID=ET_UserProjects.ProjectID
		where ET_UserProjects.UserID= @UserID
       
    
END;  


exec sp_ET_GetProjectsById  @UserID=3



EXEC sp_help 'sp_ET_AddProject';



-------------------------------------------------------------------------------------
--���� ����� �� ��� ���
EXEC sp_helptext 'sp_ET_AddSession';

CREATE PROCEDURE sp_ET_AddSessionManually  
    @ProjectID INT,  
    @UserID INT,  
    @StartDate DATETIME,  
    @EndDate DATETIME,  
    @DurationSeconds INT,  
    @HourlyRate DECIMAL(10,2) = NULL,
    @Description TEXT = NULL,
    @LabelID INT = NULL
AS  
BEGIN  
    SET NOCOUNT OFF;  
      
    INSERT INTO ET_Sessions (ProjectID, UserID, StartDate, EndDate, DurationSeconds, HourlyRate, Description, LabelID, isArchived)  
    VALUES (@ProjectID, @UserID, @StartDate, @EndDate, @DurationSeconds, @HourlyRate, @Description, @LabelID, 0);  
END;

DECLARE @StartDate DATETIME = DATEADD(DAY, -2, GETDATE());
DECLARE @EndDate DATETIME = DATEADD(HOUR, 2, @StartDate);  -- ������ ����
DECLARE @DurationSeconds INT = DATEDIFF(SECOND, @StartDate, @EndDate);

EXEC sp_ET_AddSessionManually
    @ProjectID = 16,
    @UserID = 2,
    @StartDate = @StartDate,
    @EndDate = @EndDate,
    @DurationSeconds = @DurationSeconds,
    @HourlyRate = 100.00,
    @Description = N'��� ����� �������',
    @LabelID = NULL;


--������ �� ���� ��� �������
ALTER PROCEDURE sp_ET_AddStartSessionAutomatic  
    @ProjectID INT,  
    @UserID INT,  
    @StartDate DATETIME
AS  
BEGIN  
    SET NOCOUNT OFF;

    DECLARE @ExistingSessionID INT;

    -- ���� �� ���� ��� ���� Paused
    SELECT TOP 1 @ExistingSessionID = SessionID
    FROM ET_Sessions
    WHERE UserID = @UserID 
      AND ProjectID = @ProjectID 
      AND SessionStatus = 'Paused'
    ORDER BY StartDate DESC;

    IF @ExistingSessionID IS NOT NULL
    BEGIN
        -- ������� �� ���� ������
        UPDATE ET_Sessions
        SET 
            --StartDate = @StartDate, -- ���� �� ����� �� ���� �� �����
            EndDate = NULL,
            DurationSeconds = NULL,
            SessionStatus = 'Active'
        WHERE SessionID = @ExistingSessionID;

        SELECT @ExistingSessionID AS SessionID;
        RETURN;
    END

    -- ��� ��� ����� � ������ ���
    INSERT INTO ET_Sessions (ProjectID, UserID, StartDate, isArchived, SessionStatus)  
    VALUES (@ProjectID, @UserID, @StartDate, 0, 'Active');

    SELECT SCOPE_IDENTITY() AS SessionID;
END;

/*
ALTER PROCEDURE sp_ET_AddStartSessionAutomatic  
    @ProjectID INT,  
    @UserID INT,  
    @StartDate DATETIME
AS  
BEGIN  
    SET NOCOUNT OFF;  
      
    INSERT INTO ET_Sessions (ProjectID, UserID, StartDate, isArchived)  
    VALUES (@ProjectID, @UserID, @StartDate, 0);  

	SELECT SCOPE_IDENTITY() AS SessionID;
END;*/

DECLARE @Now DATETIME = GETDATE();
EXEC sp_ET_AddStartSessionAutomatic 
    @ProjectID = 13,
    @UserID = 4,
    @StartDate = @Now;

	--------------------------------------------------------------------------------------------------
EXEC sp_helptext 'sp_ET_UpdateSession';
--������ �� ����� �� ����
ALTER PROCEDURE sp_ET_UpdateSession  
    @SessionID INT,
	@StartDate DATETIME = NULL, 
    @EndDate DATETIME = NULL,  
    @DurationSeconds INT = NULL,  
    @HourlyRate DECIMAL(10,2) = NULL,  
    @Description TEXT = NULL,  
    @LabelID INT = NULL,
    @Status VARCHAR(20) = NULL
AS  
BEGIN  
    SET NOCOUNT OFF;  

    UPDATE ET_Sessions
    SET 
		StartDate = COALESCE(@StartDate, StartDate),
		EndDate = @EndDate,
        DurationSeconds = COALESCE(@DurationSeconds, DATEDIFF(SECOND, StartDate, @EndDate)),
        HourlyRate = COALESCE(@HourlyRate, HourlyRate),
        Description = COALESCE(@Description, Description),
        LabelID = COALESCE(@LabelID, LabelID),
        SessionStatus = COALESCE(@Status, SessionStatus)
    WHERE SessionID = @SessionID;

    SELECT @SessionID AS UpdatedSessionID;
END


/*
ALTER PROCEDURE sp_ET_UpdateSession  
    @SessionID INT,
    @EndDate DATETIME = NULL,  
    @DurationSeconds INT = NULL,  
    @HourlyRate DECIMAL(10,2) = NULL,  
    @Description TEXT = NULL,  
    @LabelID INT = NULL  
AS  
BEGIN  
    SET NOCOUNT OFF;  

    UPDATE ET_Sessions
    SET 
        EndDate = @EndDate,
        DurationSeconds = COALESCE(@DurationSeconds, DATEDIFF(SECOND, StartDate, @EndDate)),
        HourlyRate = COALESCE(@HourlyRate, HourlyRate),
        Description = COALESCE(@Description, Description),
        LabelID = COALESCE(@LabelID, LabelID)
    WHERE SessionID = @SessionID;
END
*/

DECLARE @Now DATETIME = GETDATE()+2;
EXEC sp_ET_UpdateSession
    @ProjectID = 16,
    @UserID = 2,
    @EndDate = @Now,
    @DurationSeconds = 5000,
    @HourlyRate = 132.90,
	@Description = '����� ����� ���';
--------------------------------------------------------------------------------------------------
ALTER PROCEDURE sp_ET_GetSessionsByUserAndProject
    @UserID INT,
    @ProjectID INT
AS
BEGIN
    SET NOCOUNT OFF;

    SELECT *
    FROM ET_Sessions
    WHERE UserID = @UserID
      AND ProjectID = @ProjectID
	  AND isArchived = 0;
END;

exec sp_ET_GetSessionsByUserAndProject 20, 20
--------------------------------------------------------------------------------------------------
EXEC sp_helptext 'sp_ET_ArchiveSession';
--����� ���
ALTER PROCEDURE sp_ET_ArchiveSession  
    @SessionID INT  
AS  
BEGIN  
    SET NOCOUNT OFF;  
  
    UPDATE ET_Sessions  
    SET isArchived = 1  
    WHERE SessionID = @SessionID;  
END;  

exec sp_ET_ArchiveSession 43
-----------------------------------------------------------------------------------


select * from ET_Sessions
select * from ET_Sessions WHERE ProjectID =20;
select * from ET_Projects

SELECT * FROM ET_Projects WHERE ProjectID = 10;
--2025-03-25T14:30:00.000

-----------------------------------------------------------------------------------
