namespace EasyTracker.BL
{
    public class ET_Task
    {
        int taskID;
        int projectID;
        int userID;
        string? description;
        DateTime dueDate;
        bool isDone;
        DateTime? completedAt;
        DateTime createdAt;
        bool isArchived;

        public ET_Task() { }

        public ET_Task(int taskID, int projectID, int userID, string description, DateTime dueDate, bool isDone, DateTime? completedAt, DateTime createdAt, bool isArchived)
        {
            TaskID = taskID;
            ProjectID = projectID;
            UserID = userID;
            Description = description;
            DueDate = dueDate;
            IsDone = isDone;
            CompletedAt = completedAt;
            CreatedAt = createdAt;
            IsArchived = isArchived;
        }

        public int TaskID { get => taskID; set => taskID = value; }
        public int ProjectID { get => projectID; set => projectID = value; }
        public int UserID { get => userID; set => userID = value; }
        public string? Description { get => description; set => description = value; }
        public DateTime DueDate { get => dueDate; set => dueDate = value; }
        public bool IsDone { get => isDone; set => isDone = value; }
        public DateTime? CompletedAt { get => completedAt; set => completedAt = value; }
        public DateTime CreatedAt { get => createdAt; set => createdAt = value; }
        public bool IsArchived { get => isArchived; set => isArchived = value; }

        

        public int AddTask()
        {
            DBservices dbs = new DBservices();
            return dbs.AddTask(this);
        }

        public int UpdateTask()
        {
            DBservices dbs = new DBservices();
            return dbs.UpdateTask(this);
        }

        public int UpdateTaskStatus()
        {
            DBservices dbs = new DBservices();
            return dbs.UpdateTaskStatus(this.TaskID, this.IsDone);
        }

        public int ArchiveTask()
        {
            DBservices dbs = new DBservices();
            return dbs.ArchiveTask(this.TaskID);
        }

        public List<ET_Task> GetTasksByUserAndProject(int userID, int projectID)
        {
            DBservices dbs = new DBservices();
            return dbs.GetTasksByUserAndProject(userID, projectID);
        }

        public static List<int> AddMultipleTasksByEmail(string email, int projectID, List<ET_Task> tasks)
        {
            DBservices dbs = new DBservices();
            return dbs.AddMultipleTasksByEmail(email, projectID, tasks);
        }

        
    }
}
