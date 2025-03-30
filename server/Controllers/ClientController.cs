using EasyTracker.BL;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SteamApp.BL;

namespace EasyTracker.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClientController : ControllerBase
    {
        [HttpGet("GetAllClientsByUserID")]
        public IEnumerable<Client> GetAllClientsByUserID([FromQuery] int userID)
        {
            Client c = new Client();
            return c.GetAllClientsByUserID(userID);
        }
    }









}
