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
  
        -- עדכון הסיסמה החדשה  
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
EXEC sp_helptext 'sp_ET_AddProject';



