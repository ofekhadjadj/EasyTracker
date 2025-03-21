﻿using System.Xml.Linq;
using Microsoft.AspNetCore.Mvc;
using SteamApp.BL;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860
//this is my note
namespace SteamApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        // POST api/<UsersController>
        [HttpPost("addNewUser")]
        public int PostNewUser([FromBody] User user)
        {
            return user.InsertNewUser();
        }

        // GET api/<UsersController>/5
        [HttpGet("email/{Email}/password/{Password}")]
        public User Get(string Email, string Password)
        {
            User u = new User();
            return u.ReadUserDetails(Email, Password);
        }

        // POST api/<UsersController>
        [HttpPost("userID/{id}/isActive/{isActive}")]
        public int UpdateUserIsActive(int id, bool isActive)
        {
            User u = new User();
            return u.UpdateUserIsActive(id, isActive);
        }

        // PUT api/<UsersController>/5
        [HttpPut("{id}")]
        public int Put(int id, [FromBody] User user)
        {
            return user.UpdateUserDetails();
        }

        // GET api/<UsersController>/5
        [HttpGet("GetUsersWithGameStats")]
        public IActionResult GetUsersWithGameStats()
        {
            User u = new User();

            // קריאה לפונקציה שמחזירה את המידע
            var usersStats = u.GetUsersWithGameStats(); // זו מחזירה את המידע כ-List<Dictionary<string, object>>

            // החזרת התוצאה כ-JSON עם סטטוס 200
            return Ok(usersStats);
        }
        /*
        // GET: api/<GamesController>
        [HttpGet("Get all users")]
        public IEnumerable<User> Get()
        {
            User u = new User();
            return u.ReadAllUsers();
        }
       */
    }
}
