namespace EasyTracker.BL
{
    
        public class AddTasksRequest
        {
            public string Email { get; set; }
            public int ProjectID { get; set; }
            public List<ET_Task> Tasks { get; set; }
        }

    
}
