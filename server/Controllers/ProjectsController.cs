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
        public IActionResult GetAllProjectsByUserId(int id)
        {
            Project project = new Project();

            var userProjects = project.GetAllProjectsByUserId(id);
            return Ok(userProjects);
        }

        // GET: api/<GamesController>/GetGamesByUser/{id}
        [HttpGet("GetLast5ProjectsByUserId/{id}")]
        public IActionResult GetLast5ProjectsByUserId(int id)
        {
            Project project = new Project();

            var user5LastProjects = project.GetLast5ProjectsByUserId(id);
            return Ok(user5LastProjects);
        }


        [HttpPut("delete_project")]
        public IActionResult DeleteProject([FromQuery] int ProjectId)
        {
            Project projectLogic = new Project();
            int deletedProhjectID = projectLogic.DeleteProject(ProjectId);

            return Ok(new { ProjectId = deletedProhjectID });
        }

        // POST api/<UsersController>
        [HttpPost("AddNewTeamMemberToProject")]
        public IActionResult AddNewTeamMemberToProject([FromQuery] string TeamMemberEmail, int projectID)
        {
            Project p = new Project();
            int numEffected = p.AddNewTeamMemberToProject(TeamMemberEmail, projectID);

            return Ok(numEffected);
            
        }

        [HttpPut("RemoveTeamMemberFromProject")]
        public IActionResult RemoveTeamMemberFromProject([FromQuery] string TeamMemberEmail, int ProjectID)
        {
            Project p = new Project();
            int numEffected = p.RemoveTeamMemberFromProject(TeamMemberEmail, ProjectID);

            return Ok(numEffected);

        }

        // GET: api/<GamesController>/GetProjectTeam
        [HttpGet("GetProjectTeam")]
        public IActionResult GetProjectTeam(int ProjectID)
        {
            Project p = new Project();

            var Team = p.GetProjectTeam(ProjectID);
            return Ok(Team);
        }

        [HttpPut("update_project")]
        public IActionResult UpdateProject([FromBody] Project project)
        {
            Project p = new Project();
            int res = p.UpdateProject(project);

            return Ok(res);
        }

    }
}
