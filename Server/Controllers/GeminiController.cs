using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Text.Json;
using System.Text;
using System.Threading.Tasks;

namespace EasyTracker.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GeminiController : ControllerBase
    {
        private readonly HttpClient _httpClient;
        private const string GEMINI_API_KEY = "AIzaSyAqw2t3No2TBBLqhyfr9xXtPgYHsaMBgaQ";
        private const string GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAqw2t3No2TBBLqhyfr9xXtPgYHsaMBgaQ";

        public GeminiController(IHttpClientFactory httpClientFactory)
        {
            _httpClient = httpClientFactory.CreateClient();
        }

        [HttpPost("ask")]
        public async Task<IActionResult> AskGemini([FromBody] GeminiRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Prompt))
                return BadRequest("Prompt is required");

            var payload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = req.Prompt }
                        }
                    }
                }
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(GEMINI_API_URL, content);

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, await response.Content.ReadAsStringAsync());

            var resultJson = await response.Content.ReadAsStringAsync();
            return Content(resultJson, "application/json");
        }
    }

    public class GeminiRequest
    {
        public string Prompt { get; set; }
    }
}
