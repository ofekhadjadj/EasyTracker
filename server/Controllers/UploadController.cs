using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting.Internal;
using System.Net;

namespace EasyTracker.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UploadController : ControllerBase
    {

        // GET: api/<UploadController>
        [HttpGet]
        public IEnumerable<string> Get()
        {
            return new string[] { "value1", "value2" };
        }

        // GET api/<UploadController>/5
        [HttpGet("{id}")]
        public string Get(int id)
        {
            return "value";
        }

        // POST api/<UploadController>
        [HttpPost]
        public async Task<IActionResult> Post([FromForm] List<IFormFile> files)
        {


            List<string> imageLinks = new List<string>();

            string path = System.IO.Directory.GetCurrentDirectory();

            long size = files.Sum(f => f.Length);




            // מצביע לתיקיית uploadedFiles בתוך prod
            string prodUploadPath = Path.Combine(Directory.GetParent(Directory.GetCurrentDirectory()).Parent.FullName, "prod", "uploadedFiles");
            Directory.CreateDirectory(prodUploadPath); // מוודא שהתיקייה קיימת


            foreach (var formFile in files)
            {
                if (formFile.Length > 0)
                {
                    var filePath = Path.Combine(prodUploadPath, formFile.FileName);

                    using (var stream = System.IO.File.Create(filePath))
                    {
                        await formFile.CopyToAsync(stream);
                    }

                    // כתובת ציבורית לגישה לתמונה
                    imageLinks.Add($"https://proj.ruppin.ac.il/igroup4/prod/uploadedFiles/{formFile.FileName}");
                }
            }

            // Return status code  
            return Ok(imageLinks);

        }

        // PUT api/<UploadController>/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody] string value)
        {
        }

        // DELETE api/<UploadController>/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }
    }
}
