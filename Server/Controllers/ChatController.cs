using EasyTracker.BL;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EasyTracker.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        // שליחת הודעה חדשה
        [HttpPost("SendMessage")]
        public IActionResult SendMessage([FromBody] ChatMessage message)
        {
            try
            {
                DBservices dbs = new DBservices();
                int result = dbs.InsertChatMessage(message);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        // שליפת צ'אט פרטי בין שני משתמשים בפרויקט מסוים
        [HttpGet("GetPrivateChat")]
        public IActionResult GetPrivateChat(int userID1, int userID2, int projectID)
        {
            try
            {
                DBservices dbs = new DBservices();
                List<ChatMessage> messages = dbs.GetPrivateChat(userID1, userID2, projectID);
                return Ok(messages);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        // שליפת צ'אט קבוצתי בפרויקט
        [HttpGet("GetGroupChat")]
        public IActionResult GetGroupChat(int projectID)
        {
            try
            {
                DBservices dbs = new DBservices();
                List<ChatMessage> messages = dbs.GetGroupChat(projectID);
                return Ok(messages);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

    }
}
