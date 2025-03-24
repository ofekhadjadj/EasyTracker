using EasyTracker.BL;
using Microsoft.AspNetCore.Mvc;
using SteamApp.BL;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace EasyTracker.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProjectsController : ControllerBase
    {
        // POST api/<UsersController>
        [HttpPost("addNewProject")]
        public int PostNewProject([FromBody] Project project)
        {
            return project.InsertNewProject();
        }



        // GET: api/<GamesController>/GetGamesByUser/{id}
        [HttpGet("GetProjectByUserId/{id}")]
        public IEnumerable<Project> GetAllProjectsByUserId(int id)
        {
            Project project = new Project();
            return project.GetAllProjectsByUserId(id);
        }



    }
}
