-- יצירת פרוצדורה לבדיקת סשן פעיל
CREATE PROCEDURE sp_ET_GetActiveSession      
    @ProjectID INT,      
    @UserID INT    
AS      
BEGIN      
    SET NOCOUNT ON;    
    
    -- חיפוש סשן פעיל (Active) או מושהה (Paused) - שניהם נחשבים פעילים מבחינת הלוגיקה שלנו
    SELECT TOP 1 
        SessionID,
        ProjectID,
        StartDate,
        EndDate,
        DurationSeconds,
        HourlyRate,
        Description,
        LabelID,
        isArchived,
        UserID,
        SessionStatus
    FROM ET_Sessions    
    WHERE UserID = @UserID     
      AND ProjectID = @ProjectID     
      AND SessionStatus IN ('Active', 'Paused')
      AND isArchived = 0
    ORDER BY StartDate DESC;    
END; 