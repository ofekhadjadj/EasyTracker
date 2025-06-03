//using SteamApp.BL;

namespace SteamApp.BL
{
    public class Session
    {
        int sessionID;
        int projectID;
        DateTime? startDate;
        DateTime? endDate;
        int? durationSeconds;
        decimal? hourlyRate;
        string? description;
        int? labelID;
        bool isArchived;
        int? userID;
        string? status;

        public Session() { }

        public Session(int sessionID, int projectID, DateTime startDate, DateTime endDate, int durationSeconds, decimal? hourlyRate, string? description, int? labelID, bool isArchived, int? userID, string status)
        {
            SessionID = sessionID;
            ProjectID = projectID;
            StartDate = startDate;
            EndDate = endDate;
            DurationSeconds = durationSeconds;
            HourlyRate = hourlyRate;
            Description = description;
            LabelID = labelID;
            this.isArchived = isArchived;
            UserID = userID;
            this.status = status;  
        }

        public int SessionID { get => sessionID; set => sessionID = value; }
        public int ProjectID { get => projectID; set => projectID = value; }
        public DateTime? StartDate { get => startDate; set => startDate = value; }
        public DateTime? EndDate { get => endDate; set => endDate = value; }
        public int? DurationSeconds { get => durationSeconds; set => durationSeconds = value; }
        public decimal? HourlyRate { get => hourlyRate; set => hourlyRate = value; }
        public string? Description { get => description; set => description = value; }
        public int? LabelID { get => labelID; set => labelID = value; }
        public bool IsArchived { get => isArchived; set => isArchived = value; }
        public int? UserID { get => userID; set => userID = value; }
        public string? Status { get => status; set => status = value; }


        public int InsertNewSessionAutomatic(int UserID, int ProjectID, DateTime StartDate)
        {
            DBservices dbs = new DBservices();
            return dbs.InsertNewSessionAutomatic(UserID, ProjectID, StartDate);
        }

        public List<Dictionary<string, object>> UpdateSession(Session Session)
        {
            DBservices dbs = new DBservices();
            return dbs.UpdateSession(Session);
        }

        public int InsertNewSessionManually(Session Session)
        {
            DBservices dbs = new DBservices();
            return dbs.InsertNewSessionManually(Session);
        }

        public List<Dictionary<string, object>> GetAllSessionsByUserAndProject(int userID, int projectID)
        {
            DBservices dbs = new DBservices();
            return dbs.GetAllSessionsByUserAndProject(userID, projectID);
        }

        public int DeleteSession(int SessionID)
        {
            DBservices dbs = new DBservices();
            return dbs.DeleteSession(SessionID);
        }

        public Dictionary<string, object> GetActiveSession(int userID, int projectID)
        {
            DBservices dbs = new DBservices();
            return dbs.GetActiveSession(userID, projectID);
        }

    }
}
