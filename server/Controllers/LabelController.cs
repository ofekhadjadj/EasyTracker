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
        public int PostNewLabel([FromBody] Label label)
        {
            return label.InsertNewLabel();
        }

        [HttpPut("delete_label")]
        public IActionResult DeleteLabel([FromQuery] int LabelID)
        {
            Label l = new Label();
            int rowsAffected = l.DeleteLabel(LabelID);

            return Ok(rowsAffected);
        }

        [HttpGet("GetAllLabelsByUserID")]
        public IEnumerable<Label> GetAllLabelsByUserID([FromQuery] int userID)
        {
            Label l = new Label();
            return l.GetAllLabelsByUserID(userID);
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
            int rowsAffected = l.UpdateLabel(label);

            return Ok(rowsAffected);
        }





    }
}
