using EasyTracker.BL;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SteamApp.BL;

namespace EasyTracker.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LabelController : ControllerBase
    {

        // POST api/<LabelController>
        [HttpPost("addNewLabel")]
        public IActionResult PostNewLabel([FromBody] Label label)
        {
            try
            {
                int result = label.InsertNewLabel();

                if (result == -1)
                    return Conflict("❌ תגית בשם זה כבר קיימת.");

                return Ok(new { LabelID = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "שגיאת שרת: " + ex.Message);
            }
        }


        [HttpPut("delete_label")]
        public IActionResult DeleteLabel([FromQuery] int LabelID)
        {
            Label l = new Label();
            int rowsAffected = l.DeleteLabel(LabelID);

            return Ok(rowsAffected);
        }

        [HttpGet("GetAllLabelsByUserID")]
        public IActionResult GetAllLabelsByUserID(int userID)
        {
            Label l = new Label();
            var userLabels = l.GetAllLabelsByUserID(userID);

            return Ok(userLabels);
        }

        [HttpGet("Get6ToplLabelsByUserID")]
        public IEnumerable<Label> Get6ToplLabelsByUserID([FromQuery] int userID)
        {
            Label l = new Label();
            return l.Get6ToplLabelsByUserID(userID);
        }

        [HttpPut("update_label")]
        public IActionResult UpdateLabel([FromBody] Label label)
        {
            Label l = new Label();
            try
            {
                int rowsAffected = l.UpdateLabel(label);
                return Ok(rowsAffected);
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("תגית בשם זה כבר קיימת"))
                {
                    return Conflict(ex.Message); // 409 - כפילות
                }

                return StatusCode(500, "שגיאה בשרת: " + ex.Message); // כל שגיאה אחרת
            }
        }







    }
}
