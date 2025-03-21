using Microsoft.AspNetCore.Mvc;
using SteamApp.BL;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace SteamApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GamesController : ControllerBase
    {
        // GET: api/<GamesController>
        [HttpGet("Get all games")]
        public IEnumerable<Game> Get()
        {
            Game game = new Game();
            return game.ReadAllGames();
        }

        // GET: api/<GamesController>/GetGamesByUser/{id}
        [HttpGet("GetGamesNotLinkedToUser/{id}")]
        public IEnumerable<Game> GetGamesNotLinkedToUser(int id)
        {
            Game game = new Game();
            return game.ReadGamesNotLinkedToUser(id);
        }

        // GET: api/<GamesController>/GetGamesByUser/{id}
        [HttpGet("GetGamesByUserID/{id}")]
        public IEnumerable<Game> GetGamesByUserID(int id)
        {
            Game game = new Game();
            return game.ReadGamesByUserID(id);
        }

        // GET: api/<GamesController>/GetGameByMinPrice/{minPrice}
        [HttpGet("GetGameByMinPrice/id/{id}/minPrice/{minPrice}")]
        public IEnumerable<Game> GetGameByMinPrice(int id, double minPrice)
        {
            Game game = new Game();
            return game.ReadGameByMinPrice(id,minPrice);
        }

        // GET: api/<GamesController>/GetGameByMinRank/{minRank}
        [HttpGet("GetGameByMinRank/id/{id}/minRank/{minRank}")]
        public IEnumerable<Game> GetGameByMinRank(int id, int minRank)
        {
            Game game = new Game();
            return game.ReadGameByMinRank(id, minRank);
        }

        // GET: api/<GamesController>
        [HttpGet("GetGamesWithStats")]
        public IActionResult GetGamesWithStats()
        {
            Game game = new Game();

            // קריאה לפונקציה שמחזירה את המידע
            var gamesStats = game.GetGamesWithStats(); // זו מחזירה את המידע כ-List<Dictionary<string, object>>

            // החזרת התוצאה כ-JSON עם סטטוס 200
            return Ok(gamesStats);
        }



        /*
        // GET api/<GamesController>/5
        [HttpGet("{id}")]
        public string Get(int id)
        {
            return "value";
        }*/
        /*
        // POST api/<StudentsController>
        [HttpPost]
        public bool Post([FromBody] Game game)
        {
            return game.Insert();
        }*/
        /*
        // POST api/<StudentsController>
        [HttpPost("addNewGame")]
        public int PostNewGame([FromBody] Game game)
        {
            return game.InsertNewGame();
        }*/
        /*
        // PUT api/<GamesController>/5
        [HttpPut("{id}")]
        public void Put(int id, [FromBody] string value)
        {
        }*/
        /*
        // DELETE api/<GamesController>/5
        [HttpDelete("{id}")]
        public bool Delete(int id)
        {
            Game game = new Game();
            game.DeleteByID(id);
            return true;
        }

        [HttpGet("GetByPrice")] // this uses the QueryString
        public IEnumerable<Game> GetByPrice(double minPrice)
        {
            Game game = new Game();
            return game.GetByPrice(minPrice);
        }*/
        /*
        [HttpGet("searchByRankScore/minRankScore/{minRankScore}")] // this uses resource routing
        public IEnumerable<Game> GetByRankScore(int minRankScore)
        {
            Game game = new Game();
            return game.GetByRankScore(minRankScore);
        }*/
    }
}
