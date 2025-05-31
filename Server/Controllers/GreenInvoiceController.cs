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

        [HttpPost("CreateInvoice")]
        public async Task<IActionResult> CreateInvoice([FromBody] object invoiceData)
        {
            try
            {
                Console.WriteLine("נתקבלה בקשה ליצירת חשבונית");
                Console.WriteLine($"נתוני החשבונית שהתקבלו: {JsonSerializer.Serialize(invoiceData)}");

                // קבלת הטוקן מה-Authorization header
                var authHeader = Request.Headers["Authorization"].FirstOrDefault();
                if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                {
                    Console.WriteLine("שגיאה: לא נמצא טוקן Authorization");
                    return BadRequest(new { error = "לא נמצא טוקן Authorization" });
                }

                var token = authHeader.Substring("Bearer ".Length).Trim();
                Console.WriteLine($"טוקן שהתקבל: {token.Substring(0, Math.Min(10, token.Length))}...");

                using (HttpClient client = new HttpClient())
                {
                    // הוספת הטוקן לכותרות
                    client.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);

                    var content = new StringContent(
                        JsonSerializer.Serialize(invoiceData),
                        Encoding.UTF8,
                        "application/json");
                        
                    Console.WriteLine("שולח בקשה ל-Green Invoice API...");
                    var response = await client.PostAsync(
                        "https://sandbox.d.greeninvoice.co.il/api/v1/documents",
                        content);
                        
                    var responseContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"תגובה מ-Green Invoice: Status={response.StatusCode}, Content={responseContent}");
                    
                    if (response.IsSuccessStatusCode)
                    {
                        return Content(responseContent, "application/json");
                    }
                    else
                    {
                        Console.WriteLine($"שגיאה מ-Green Invoice: {response.StatusCode} - {responseContent}");
                        return StatusCode((int)response.StatusCode, responseContent);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"שגיאה בשרת: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return BadRequest(new { error = ex.Message });
            }
        }
    }
} 