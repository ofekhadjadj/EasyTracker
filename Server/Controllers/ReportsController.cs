using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EasyTracker.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        [HttpGet("GetDashboardSummary")]
        public IActionResult GetDashboardSummary(int userID)
        {
            try
            {
                DBservices dbs = new DBservices();
                List<Dictionary<string, object>> summary = dbs.GetDashboardSummary(userID);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return BadRequest("Error: " + ex.Message);
            }
        }


        [HttpGet("GetTopEarning5Clients")]
        public IActionResult GetTopEarning5Clients(int userID)
        {
            try
            {
                DBservices dbs = new DBservices();
                var data = dbs.GetTopEarning5Clients(userID);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return BadRequest("Error: " + ex.Message);
            }
        }

        [HttpGet("GetTopEarning5Projects")]
        public IActionResult GetTopEarning5Projects(int userID)
        {
            try
            {
                DBservices dbs = new DBservices();
                var data = dbs.GetTopEarning5Projects(userID);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return BadRequest("Error: " + ex.Message);
            }
        }

        [HttpGet("GetClientSummaries")]
        public IActionResult GetClientSummaries(int userID)
        {
            try
            {
                DBservices dbs = new DBservices();
                var data = dbs.GetClientSummaries(userID);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return BadRequest("Error: " + ex.Message);
            }
        }

        [HttpGet("GetProjectSummaries")]
        public IActionResult GetProjectSummaries(int userID)
        {
            try
            {
                DBservices dbs = new DBservices();
                var data = dbs.GetProjectSummaries(userID);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return BadRequest("Error: " + ex.Message);
            }
        }


        [HttpGet("GetWorkSummaryOverTime")]
        public IActionResult GetWorkSummaryOverTime(int userID, string groupBy = null, DateTime? fromDate = null, DateTime? toDate = null, int? clientID = null, int? projectID = null)
        {
            try
            {
                DBservices dbs = new DBservices();
                var data = dbs.GetWorkSummaryOverTime(userID, groupBy, fromDate, toDate, clientID, projectID);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return BadRequest("Error: " + ex.Message);
            }
        }

        [HttpGet("GetWorkByLabel")]
        public IActionResult GetWorkByLabel(int userID, string groupBy = null, DateTime? fromDate = null, DateTime? toDate = null, int? clientID = null, int? projectID = null)
        {
            try
            {
                DBservices dbs = new DBservices();
                var data = dbs.GetWorkByLabel(userID, groupBy, fromDate, toDate, clientID, projectID);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return BadRequest("Error: " + ex.Message);
            }
        }

        [HttpGet("GetWorkAndEarningsByPeriod")]
        public IActionResult GetWorkAndEarningsByPeriod(int userID, string groupBy = null, DateTime? fromDate = null, DateTime? toDate = null, int? clientID = null, int? projectID = null)
        {
            try
            {
                DBservices dbs = new DBservices();
                var data = dbs.GetWorkAndEarningsByPeriod(userID, groupBy, fromDate, toDate, clientID, projectID);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return BadRequest("Error: " + ex.Message);
            }
        }

        [HttpGet("GetTeamMonitoringData")]
        public IActionResult GetTeamMonitoringData(int managerUserID)
        {
            try
            {
                DBservices dbs = new DBservices();
                var data = dbs.GetTeamMonitoringData(managerUserID);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return BadRequest("Error: " + ex.Message);
            }
        }

        [HttpGet("GetFullAssistantData")]
        public IActionResult GetFullAssistantData(int userId, DateTime? fromDate = null, DateTime? toDate = null)
        {
            try
            {
                DBservices dbs = new DBservices();
                var data = dbs.GetFullDataForAssistant(userId, fromDate, toDate);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "שגיאה בעת שליפת הנתונים: " + ex.Message);
            }
        }


    }
}
