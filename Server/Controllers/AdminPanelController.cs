using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EasyTracker.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminPanelController : ControllerBase
    {
        [HttpGet("GetAllUsersOverview")]
        public IActionResult GetAllUsersOverview()
        {
            try
            {
                DBservices dbs = new DBservices();
                var data = dbs.GetAllUsersOverview();
                return Ok(data);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "שגיאה בעת שליפת נתוני המשתמשים: " + ex.Message);
            }
        }

        [HttpGet("GetSystemSummary")]
        public IActionResult GetSystemSummary()
        {
            try
            {
                DBservices dbs = new DBservices();
                var data = dbs.GetSystemSummary();
                return Ok(data);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "שגיאה בעת שליפת סיכום המערכת: " + ex.Message);
            }
        }


        [HttpPut("ToggleUserActiveStatus")]
        public IActionResult ToggleUserActiveStatus([FromQuery] int userId)
        {
            try
            {
                DBservices dbs = new DBservices();
                int rowsAffected = dbs.ToggleUserActiveStatus(userId);

                return Ok(new
                {
                    Message = "הסטטוס של המשתמש עודכן בהצלחה.",
                    RowsAffected = rowsAffected
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "שגיאה בעת עדכון סטטוס המשתמש: " + ex.Message);
            }
        }



        [HttpGet("GetTop5EarningUsers")]
        public IActionResult GetTop5EarningUsers()
        {
            try
            {
                DBservices dbs = new DBservices();
                var data = dbs.GetTop5EarningUsers();
                return Ok(data);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "שגיאה בעת שליפת המשתמשים המרווחים ביותר: " + ex.Message);
            }
        }

        [HttpGet("GetTop5ActiveUsers")]
        public IActionResult GetTop5ActiveUsers()
        {
            try
            {
                DBservices dbs = new DBservices();
                var data = dbs.GetTop5ActiveUsers();
                return Ok(data);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "שגיאה בעת שליפת המשתמשים הפעילים ביותר: " + ex.Message);
            }
        }

        [HttpPut("ResetUserPassword")]
        public IActionResult ResetUserPassword([FromQuery] int userId)
        {
            try
            {
                DBservices dbs = new DBservices();
                int rowsAffected = dbs.ResetUserPassword(userId);

                if (rowsAffected > 0)
                {
                    return Ok(new
                    {
                        Message = "✅ הסיסמה אופסה בהצלחה.",
                        TemporaryPassword = "EasyTrackerTempPass1234",
                        RowsAffected = rowsAffected
                    });
                }
                else
                {
                    return NotFound(new
                    {
                        Message = "❌ לא נמצא משתמש עם מזהה זה.",
                        RowsAffected = 0
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Message = "שגיאה באיפוס הסיסמה: " + ex.Message
                });
            }
        }



    }
}
