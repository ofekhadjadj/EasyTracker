select * from ET_Sessions
select * from ET_Clients
select * from ET_Labels
select * from ET_Users
select * from ET_Projects
select * from ET_UserProjects


select * 
from ET_Projects inner join ET_UserProjects on ET_Projects.ProjectID=ET_UserProjects.ProjectID
where ET_UserProjects.UserID=3

EXEC sp_help 'sp_ET_AddProject';
EXEC sp_helptext 'sp_ET_AddProject';



 ALTER PROCEDURE sp_ET_ChangePassword    
    @UserID INT,    
    @OldPassword VARCHAR(255),    
    @NewPassword VARCHAR(255)    
AS    
BEGIN    
    SET NOCOUNT OFF;  
  
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
  
    END  
      
    
END;  





EXEC sp_ET_ChangePassword
    @UserID = 2,
    @OldPassword = 'hashed_password_456',
    @NewPassword = '123456';



