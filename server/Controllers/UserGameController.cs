using Microsoft.AspNetCore.Mvc;
using SteamApp.BL;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace SteamApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserGameController : ControllerBase
    {

        //// POST api/<UserGameController>
        //[HttpPost("userID/{id}/gameID/{appID}")]
        //public int PostNewUserGameConnection( int id, int appID)
        //{  
        //    UserGame UG = new UserGame();
        //    return UG.Insert(id, appID);
        //}

        //// DELETE api/<UserGameController>/5
        //[HttpDelete("RemoveFromUserGameConnection")]
        //public int RemoveFromUserGameConnection(int id, int appID)
        //{
        //    UserGame UG = new UserGame();
        //   return UG.Remove(id, appID);
        //}
        ///*
        //// GET api/<FlightsController>/5
        //[HttpGet("email/{Email}/password/{Password}")]
        //public List<User> Get(string Email, string Password)
        //{
        //    User u = new User();
        //    return u.Read(Email, Password);
        //    //return "value";
        //}*/

        ///*
        //// POST api/<UsersController>
        //[HttpPost("RemoveFromUserGameConnection")]
        //public int RemoveFromUserGameConnection([FromBody] UserGame UG)
        //{
        //    return UG.Remove(UG.user, UG.game);
        //}*/

        ///*
        //// GET: api/<UserGameController>
        //[HttpGet]
        //public IEnumerable<string> Get()
        //{
        //    return new string[] { "value1", "value2" };
        //}

        //// GET api/<UserGameController>/5
        //[HttpGet("{id}")]
        //public string Get(int id)
        //{
        //    return "value";
        //}

        //// POST api/<UserGameController>
        //[HttpPost]
        //public void Post([FromBody] string value)
        //{
        //}

        //// PUT api/<UserGameController>/5
        //[HttpPut("{id}")]
        //public void Put(int id, [FromBody] string value)
        //{
        //}

        //// DELETE api/<UserGameController>/5
        //[HttpDelete("{id}")]
        //public void Delete(int id)
        //{
        //}
        //*/
    }
}
