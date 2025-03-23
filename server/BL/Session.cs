using System;

namespace SteamApp.BL
{
    public class Session
    {
        int SessionID;
        int ProjectID;
        DateTime StartDate;
        DateTime EndDate;
        int DurationSeconds;
        decimal? HourlyRate;
        string? Description;
        int? LabelID;
        bool isArchived;
        int? UserID;

        public Session() { }

        public Session(int sessionID, int projectID, DateTime startDate, DateTime endDate, int durationSeconds, decimal? hourlyRate, string? description, int? labelID, bool isArchived, int? userID)
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
        }

        public int SessionID1 { get => SessionID; set => SessionID = value; }
        public int ProjectID1 { get => ProjectID; set => ProjectID = value; }
        public DateTime StartDate1 { get => StartDate; set => StartDate = value; }
        public DateTime EndDate1 { get => EndDate; set => EndDate = value; }
        public int DurationSeconds1 { get => DurationSeconds; set => DurationSeconds = value; }
        public decimal? HourlyRate1 { get => HourlyRate; set => HourlyRate = value; }
        public string? Description1 { get => Description; set => Description = value; }
        public int? LabelID1 { get => LabelID; set => LabelID = value; }
        public bool IsArchived { get => isArchived; set => isArchived = value; }
        public int? UserID1 { get => UserID; set => UserID = value; }





    }
}
