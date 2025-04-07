using SteamApp.BL;


namespace EasyTracker.BL
{
    public class Project
    {
        int projectid;
        string? projectname;
        string? description;
        float? hourlyrate;
        string? image;
        int? clientid;
        bool? isarchived;
        int? createdbyuserid;
        bool? isDone;
        decimal? durationGoal;

        static List<Project> projectsList = new List<Project>();


        public Project() { }



        public Project(int projectid,
                       string projectname,
                       string description,
                       float hourlyrate,
                       string image,
                       int clientid,
                       bool isarchived,
                       int createdbyuserid,
                       bool isDone,
                       decimal durationGoal)
        {
            this.projectid = projectid;
            this.projectname = projectname;
            this.description = description;
            this.hourlyrate = hourlyrate;
            this.image = image;
            this.clientid = clientid;
            this.isarchived = isarchived;
            this.createdbyuserid = createdbyuserid;
            this.isDone = isDone; 
            this.DurationGoal = durationGoal;
        }



        public int Projectid { get => projectid; set => projectid = value; }
        public string? Projectname { get => projectname; set => projectname = value; }
        public string? Description { get => description; set => description = value; }
        public float? Hourlyrate { get => hourlyrate; set => hourlyrate = value; }
        public string? Image { get => image; set => image = value; }
        public int? Clientid { get => clientid; set => clientid = value; }
        public bool? Isarchived { get => isarchived; set => isarchived = value; }
        public int? Createdbyuserid { get => createdbyuserid; set => createdbyuserid = value; }
        public bool? IsDone { get => isDone; set => isDone = value; }
        public decimal? DurationGoal { get => durationGoal; set => durationGoal = value; }

        public int InsertNewProject()
        {
            DBservices dbs = new DBservices();
            return dbs.InsertNewProject(this);
        }

        public List<Dictionary<string, object>> GetAllProjectsByUserId(int id)
        {
            DBservices dbs = new DBservices();
            return dbs.GetAllProjectsByUserId(id);
        }

        public List<Dictionary<string, object>> GetLast5ProjectsByUserId(int id)
        {
            DBservices dbs = new DBservices();
            return dbs.GetLast5ProjectsByUserId(id);
        }

        public int DeleteProject(int ProjectId)
        {
            DBservices dbs = new DBservices();
            return dbs.DeleteProject(ProjectId);
        }

        public int AddNewTeamMemberToProject(string TeamMemberEmail, int projectID)
        {
            DBservices dbs = new DBservices();
            return dbs.AddNewTeamMemberToProject(TeamMemberEmail, projectID);
        }

        public int RemoveTeamMemberFromProject(string TeamMemberEmail, int ProjectID)
        {
            DBservices dbs = new DBservices();
            return dbs.RemoveTeamMemberFromProject(TeamMemberEmail, ProjectID);
        }

        public List<Dictionary<string, object>> GetProjectTeam(int ProjectID)
        {
            DBservices dbs = new DBservices();
            return dbs.GetProjectTeam(ProjectID);
        }

        public int UpdateProject(Project project)
        {
            DBservices dbs = new DBservices();
            return dbs.UpdateProject(project);
        }




    }
}
