namespace SteamApp.BL
{
    public class Game
    {
       // int appID;
       // string name;
       // DateTime releaseDate;
       // double price;
       // string description;
       // string headerImage;
       // string website;
       // bool windows;
       // bool mac;
       // bool linux;
       // int scoreRank;
       // string recommendations;
       // string publisher;
       // int numberOfPurchases;

       // static List<Game> gamesList = new List<Game>();


       // public Game() { }

       // public Game(int appID, string name, DateTime releaseDate, double price, string description, string headerImage, string website, bool windows, bool mac, bool linux, int scoreRank, string recommendations, string publisher, int numberOfPurchases)
       // {
       //     AppID = appID;
       //     Name = name;
       //     ReleaseDate = releaseDate;
       //     Price = price;
       //     Description = description;
       //     HeaderImage = headerImage;
       //     Website = website;
       //     Windows = windows;
       //     Mac = mac;
       //     Linux = linux;
       //     ScoreRank = scoreRank;
       //     Recommendations = recommendations;
       //     Publisher = publisher;
       //     NumberOfPurchases = numberOfPurchases;

       // }

       // public int AppID { get => appID; set => appID = value; }
       // public string Name { get => name; set => name = value; }
       // public DateTime ReleaseDate { get => releaseDate; set => releaseDate = value; }
       // public double Price { get => price; set => price = value; }
       // public string Description { get => description; set => description = value; }
       // public string HeaderImage { get => headerImage; set => headerImage = value; }
       // public string Website { get => website; set => website = value; }
       // public bool Windows { get => windows; set => windows = value; }
       // public bool Mac { get => mac; set => mac = value; }
       // public bool Linux { get => linux; set => linux = value; }
       // public int ScoreRank { get => scoreRank; set => scoreRank = value; }
       // public string Recommendations { get => recommendations; set => recommendations = value; }
       // public string Publisher { get => publisher; set => publisher = value; }
       // public int NumberOfPurchases { get => numberOfPurchases; set => numberOfPurchases = value; }




       // public List<Game> ReadAllGames()
       // {
       //     DBservices dbs = new DBservices();
       //     return dbs.ReadAllGames();
       // }

       // public List<Game> ReadGamesNotLinkedToUser(int id)
       // {
       //     DBservices dbs = new DBservices();
       //     return dbs.ReadGamesNotLinkedToUser(id);
       // }

       // public List<Game> ReadGamesByUserID(int id)
       // {
       //     DBservices dbs = new DBservices();
       //     return dbs.ReadGamesByUserID(id);
       // }

       // public List<Game> ReadGameByMinPrice(int id, double price)
       // {
       //     //User u = new User();
       //     DBservices dbs = new DBservices();
       //     return dbs.ReadGameByMinPrice(id, price);
       // }

       // public List<Game> ReadGameByMinRank(int id, int rank)
       // {
       //     //User u = new User();
       //     DBservices dbs = new DBservices();
       //     return dbs.ReadGameByMinRank(id,rank);
       // }

       // public List<Dictionary<string, object>> GetGamesWithStats()
       // {
       //     DBservices dbs = new DBservices();
       //     return dbs.GetGamesWithStats();
       // }
       // /*
       //public int InsertNewGame()
       //{
       //    DBservices dbs = new DBservices();
       //    return dbs.InsertNewGame(this);
       //}*/
       // /*
       // public List<Game> Read()
       // {
       //     return gamesList;
       // }*/
       // /*
       // public bool Insert()
       // {
       //     bool isExists = false;

       //     foreach (Game item in gamesList)
       //     {
       //         if (item.AppID == this.AppID || item.Name == this.Name)
       //         {
       //             isExists = true;
       //         }
       //     }

       //     if (isExists)
       //     {
       //         return false;
       //     }
       //     else
       //     {
       //         gamesList.Add(this);
       //         return true;
       //     }

       // }*/
       // /*
       // public List<Game> GetByPrice(double minPrice)
       // {

       //     List<Game> filteredGamesList = new List<Game>();

       //     foreach (Game game in gamesList)
       //     {
       //         if (game.Price >= minPrice)
       //         {
       //             filteredGamesList.Add(game);
       //         }
       //     }
       //     return filteredGamesList;
       // }*/
       // /*
       // public List<Game> GetByRankScore(int rankScore)
       // {

       //     List<Game> filteredGamesList = new List<Game>();

       //     foreach (Game game in gamesList)
       //     {
       //         if (game.scoreRank >= rankScore)
       //         {
       //             filteredGamesList.Add(game);
       //         }
       //     }
       //     return filteredGamesList;
       // }*/
       // /*
       // public bool DeleteByID(int ID)
       // {
       //     List<Game> filteredGamesList = new List<Game>();

       //     foreach (Game game in gamesList)
       //     {
       //         if (game.appID != ID)
       //         {
       //             //gamesList.Remove(game);
       //             filteredGamesList.Add(game);
       //         }
       //     }

       //     if(filteredGamesList.Count == gamesList.Count)
       //     {
       //         throw new InvalidOperationException($"No game found with ID {ID}.");
       //         //Console.WriteLine($"No game found with ID {ID}.");
       //         return false;
       //     }
       //     gamesList = filteredGamesList;
       //     return true;
       // }*/


    }


}
