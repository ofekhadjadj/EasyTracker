﻿using EasyTracker.BL;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SteamApp.BL;


namespace EasyTracker.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SessionController : ControllerBase
    {

        [HttpPost("start_auto_session")]
        public IActionResult StartSession([FromQuery] int userID, [FromQuery] int projectID, [FromQuery] DateTime startDate)
        {
            Session sessionLogic = new Session();
            int newSessionID = sessionLogic.InsertNewSessionAutomatic(userID, projectID, startDate);

            return Ok(new { sessionID = newSessionID });
        }

        [HttpPut("update_session")]
        public IActionResult UpdateSession([FromBody] Session session)
        {
            Session s = new Session();
            var res = s.UpdateSession(session);

            return Ok(res);
        }

        [HttpPut("delete_session")]
        public IActionResult DeleteSession([FromQuery] int SessionID)
        {
            Session sessionLogic = new Session();
            int deletedSessionID = sessionLogic.DeleteSession(SessionID);

            return Ok(new { sessionID = deletedSessionID });
        }



        [HttpPost("insert_session_Manually")]
        public IActionResult InsertSessionManually([FromBody] Session Session)
        {
            Session sessionLogic = new Session();
            int newSessionID = sessionLogic.InsertNewSessionManually(Session);

            return Ok(new { sessionID = newSessionID });
        }

       
        [HttpGet("GetAllSessionsByUserAndProject")]
        public IActionResult GetAllSessionsByUserAndProject([FromQuery] int userID, int projectID)
        {
            Session s = new Session();
            var sessions = s.GetAllSessionsByUserAndProject(userID, projectID);
            return Ok(sessions);
        }

        [HttpGet("CheckActiveSession")]
        public IActionResult CheckActiveSession([FromQuery] int userID, int projectID)
        {
            Session sessionLogic = new Session();
            var activeSession = sessionLogic.GetActiveSession(userID, projectID);
            
            if (activeSession != null)
            {
                return Ok(new { 
                    hasActiveSession = true,
                    sessionData = activeSession
                });
            }
            else
            {
                return Ok(new { 
                    hasActiveSession = false
                });
            }
        }

    }
}
