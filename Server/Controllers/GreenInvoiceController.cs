using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace EasyTracker.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GreenInvoiceController : ControllerBase
    {
        [HttpPost("GetToken")]
        public async Task<IActionResult> GetToken([FromBody] object tokenData)
        {
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    var content = new StringContent(
                        JsonSerializer.Serialize(tokenData),
                        Encoding.UTF8,
                        "application/json");
                        
                    var response = await client.PostAsync(
                        "https://sandbox.d.greeninvoice.co.il/api/v1/account/token",
                        content);
                        
                    var responseContent = await response.Content.ReadAsStringAsync();
                    return Content(responseContent, "application/json");
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
} 