using EasyTracker.BL;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EasyTracker.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TaskController : ControllerBase
    {
        [HttpPost("AddTasks")]
        public IActionResult AddTasks([FromBody] AddTasksRequest request)
        {
            try
            {
                List<int> insertedTaskIds = ET_Task.AddMultipleTasksByEmail(request.Email, request.ProjectID, request.Tasks);
                return Ok(insertedTaskIds);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("GetTasksByUserAndProject")]
        public IActionResult GetTasksByUserAndProject(int userID, int projectID)
        {
            try
            {
                ET_Task task = new ET_Task();
                List<ET_Task> tasks = task.GetTasksByUserAndProject(userID, projectID);
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("UpdateTask")]
        public IActionResult UpdateTask([FromBody] ET_Task task)
        {
            try
            {
                int result = task.UpdateTask();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("UpdateTaskStatus")]
        public IActionResult UpdateTaskStatus(int taskID, bool isDone)
        {
            try
            {
                ET_Task task = new ET_Task();
                task.TaskID = taskID;
                task.IsDone = isDone;

                int result = task.UpdateTaskStatus();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }


        [HttpPut("ArchiveTask")]
        public IActionResult ArchiveTask(int taskID)
        {
            try
            {
                ET_Task task = new ET_Task();
                task.TaskID = taskID;

                int result = task.ArchiveTask();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("AddTask")]
        public IActionResult AddTask([FromBody] ET_Task task)
        {
            try
            {
                int newTaskID = task.AddTask();
                return Ok(newTaskID); // מחזיר את TaskID החדש
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }


    }
}
