using System;
using System.Collections.Generic;
using EasyTracker.BL;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;


namespace EasyTracker.Controllers
{
    


    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {/*
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

        // סימון הודעות פרטיות כנקראו
        // POST api/Chat/MarkPrivateAsRead?userID=...&otherUserID=...&projectID=...
        [HttpPost("MarkPrivateAsRead")]
        public IActionResult MarkPrivateAsRead(int userID, int otherUserID, int projectID)
        {
            try
            {
                DBservices dbs = new DBservices();
                int rows = dbs.MarkPrivateAsRead(userID, otherUserID, projectID);
                return Ok(rows);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // סימון הודעות קבוצתיות כנקראו
        // POST api/Chat/MarkGroupAsRead?userID=...&projectID=...
        [HttpPost("MarkGroupAsRead")]
        public IActionResult MarkGroupAsRead(int userID, int projectID)
        {
            try
            {
                DBservices dbs = new DBservices();
                int rows = dbs.MarkGroupAsRead(userID, projectID);
                return Ok(rows);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        // שליפת מצב unread לבאנדגים
        // GET api/Chat/GetUnreadStatus?userID=...&projectID=...
        [HttpGet("GetUnreadStatus")]
        public IActionResult GetUnreadStatus(int userID, int projectID)
        {
            try
            {
                DBservices dbs = new DBservices();
                UnreadStatus status = dbs.GetUnreadStatus(userID, projectID);
                return Ok(status);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }*/

    }
}
