--play
DECLARE @ProjectID INT = 20;
DECLARE @UserID INT = 20;
DECLARE @StartDate DATETIME = GETDATE();

EXEC sp_ET_AddStartSessionAutomatic  
    @ProjectID = @ProjectID,  
    @UserID = @UserID,  
    @StartDate = @StartDate;


--pause
DECLARE @SessionID INT = 41; -- מזהה הסשן שאתה רוצה לעדכן
DECLARE @EndDate DATETIME = GETDATE()+2;
DECLARE @DurationSeconds INT = 8000;

EXEC sp_ET_UpdateSession
    @SessionID = @SessionID,
    @EndDate = @EndDate,
    @DurationSeconds = @DurationSeconds,
    @Status = 'Paused';

--stop
DECLARE @SessionID INT = 41;
DECLARE @EndDate DATETIME = GETDATE()+1;
DECLARE @DurationSeconds INT = 4500;
DECLARE @HourlyRate DECIMAL(10,2) = 120.00;
DECLARE @Description NVARCHAR(MAX) = N' ביצוע עצירה לאחר השהייה';
DECLARE @LabelID INT = 2;

EXEC sp_ET_UpdateSession
    @SessionID = @SessionID,
    @EndDate = @EndDate,
    @DurationSeconds = @DurationSeconds,
    @HourlyRate = @HourlyRate,
    @Description = @Description,
    @LabelID = @LabelID,
    @Status = 'Ended';

select * from ET_Sessions where ProjectID = 20

EXEC sp_helptext 'sp_ET_AddLabel';

alter PROCEDURE sp_ET_AddLabel  
    @LabelName VARCHAR(255),  
    @LabelColor VARCHAR(7) = '#FFFFFF',  
    @UserID INT  
AS  
BEGIN  
    SET NOCOUNT OFF;  
      
    INSERT INTO ET_Labels (LabelName, LabelColor, UserID, isArchived)  
    VALUES (@LabelName, @LabelColor, @UserID, 0);  

	SELECT SCOPE_IDENTITY() AS LabelID;
END; 

exec sp_ET_AddLabel 'workdesk', '#2345ee', 1

EXEC sp_helptext 'sp_ET_ArchiveLabel';

ALTER PROCEDURE sp_ET_ArchiveLabel  
    @LabelID INT  
AS  
BEGIN  
    SET NOCOUNT OFF;  
  
    UPDATE ET_Labels  
    SET isArchived = 1  
    WHERE LabelID = @LabelID;  
END;

EXEC sp_helptext 'sp_ET_AddSessionManually';

ALTER PROCEDURE sp_ET_UpdateLabel  
    @LabelID INT,  
    @LabelName VARCHAR(255) = NULL,  
    @LabelColor VARCHAR(7) = NULL  
AS  
BEGIN  
    SET NOCOUNT OFF;  
  
    UPDATE ET_Labels  
    SET   
        LabelName = COALESCE(@LabelName, LabelName),  
        LabelColor = COALESCE(@LabelColor, LabelColor)  
    WHERE LabelID = @LabelID;  
END;

exec sp_ET_UpdateLabel 5, 'Zoom meeting'


select * from ET_Sessions where UserID =4
select * from ET_Clients
select * from ET_Labels
select * from ET_Users
select * from ET_Projects
select * from ET_UserProjects

exec sp_ET_ArchiveLabel 4
exec sp_ET_GetLabelsByUserId 4
exec sp_ET_GetPopularLabelsByUserId 4

select LabelID, count(SessionID) as count
from ET_Sessions
where UserID =4
group by LabelID
order by count desc

EXEC sp_helptext 'sp_ET_UpdateLabel';

ALTER PROCEDURE sp_ET_GetLabelsByUserId            
    @UserID INT        
AS            
BEGIN            
    SET NOCOUNT OFF;          
          
    -- רשימת התגיות      
    SELECT *
	FROM ET_Labels WHERE UserID = @UserID and isArchived = 0   
END;

exec sp_ET_GetPopularLabelsByUserId 1


CREATE PROCEDURE sp_ET_UpdateLabel    
    @LabelID INT,    
    @LabelName VARCHAR(255) = NULL,    
    @LabelColor VARCHAR(7) = NULL    
AS    
BEGIN    
    SET NOCOUNT OFF;    
    
    UPDATE ET_Labels    
    SET     
        LabelName = COALESCE(@LabelName, LabelName),    
        LabelColor = COALESCE(@LabelColor, LabelColor)    
    WHERE LabelID = @LabelID;    
END;