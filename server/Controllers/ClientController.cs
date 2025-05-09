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

        [HttpPost("Add Client")]
        public IActionResult InsertNewClient([FromBody] Client client)
        {
            try
            {
                if (client == null)
                {
                    return BadRequest("Client object is null");
                }
                Client c = new Client();
                int result = c.AddClient(client);

                return Ok(new { message = "Client added successfully", result = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Could not add client", error = ex.Message });
            }
        }

        [HttpPut("Update Client")]
        public IActionResult UpdateClient([FromBody] Client client)
        {
            try
            {
                Client c = new Client();
                int result = c.UpdateClient(client);
                if (result > 0)
                    return Ok("Client updated successfully");
                else
                    return BadRequest(new { message = "Error updating client", client = client });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Could not update client", error = ex.Message });
            }
        }

        [HttpPut("Delete client/{clientID}")]
        public IActionResult ArchiveClient(int clientID)
        {
            try
            {
                Client c = new Client();
                int result = c.ArchiveClient(clientID);

                if (result > 0)
                    return Ok("Client archived successfully");
                else
                    return NotFound(new { message = "Client not found or already archived", clientID = clientID });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Exception during archive", error = ex.Message });
            }
        }


        [HttpGet("GetClientSummariesByUserID")]
        public IActionResult GetClientSummariesByUserID(int userID)
        {
            try
            {
                DBservices dbs = new DBservices();
                var (clients, projects) = dbs.GetClientsAndProjectsSummaryByUserID(userID);

                var result = new ClientSummaryResult
                {
                    Clients = clients,
                    Projects = projects
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"שגיאה בשרת: {ex.Message}");
            }
        }



    }

}
