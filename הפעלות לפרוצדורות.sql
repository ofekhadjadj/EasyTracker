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
