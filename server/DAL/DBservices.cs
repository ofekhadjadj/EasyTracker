﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.SqlClient;
using System.Data;
using System.Text;
using SteamApp.BL;
using System.Security.Cryptography;

/// <summary>
/// DBServices is a class created by me to provides some DataBase Services
/// </summary>
public class DBservices
{
    

    public DBservices()
    {
        //
        // TODO: Add constructor logic here
        //
    }

    //--------------------------------------------------------------------------------------------------
    // This method creates a connection to the database according to the connectionString name in the web.config 
    //--------------------------------------------------------------------------------------------------
    public SqlConnection connect(String conString)
    {

        // read the connection string from the configuration file
        IConfigurationRoot configuration = new ConfigurationBuilder()
        .AddJsonFile("appsettings.json").Build();
        string cStr = configuration.GetConnectionString("myProjDB");
        SqlConnection con = new SqlConnection(cStr);
        con.Open();
        return con;
    }


    //**** USERS TABLE ****

    //--------------------------------------------------------------------------------------------------
    // This method inserts a new user to the users table 
    //--------------------------------------------------------------------------------------------------
    public int InsertNewUser(User user)
    {

        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@FirstName", user.FirstName);
        paramDic.Add("@LastName", user.LastName);
        paramDic.Add("@Email", user.Email);
        paramDic.Add("@Password", user.Password);
       

        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_AddUser", con, paramDic);          // create the command

        try
        {
            int numEffected = cmd.ExecuteNonQuery(); // execute the command
            return numEffected;
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        finally
        {
            if (con != null)
            {
                // close the db connection
                con.Close();
            }
        }

    }

    
    //--------------------------------------------------------------------------------------------------
    // This method inserts a new user to the users table 
    //--------------------------------------------------------------------------------------------------
    public int UpdateUserDetails(User user)
    {

        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@userID", user.Id);
        paramDic.Add("@Email", user.Email);
        paramDic.Add("@Password", user.Password);
        //paramDic.Add("@Name", user.Name);

        cmd = CreateCommandWithStoredProcedureGeneral("SP_UpdateUserDetails", con, paramDic);          // create the command

        try
        {
            int numEffected = cmd.ExecuteNonQuery(); // execute the command
            return numEffected;
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        finally
        {
            if (con != null)
            {
                // close the db connection
                con.Close();
            }
        }

    }

    //--------------------------------------------------------------------------------------------------
    // This method get user details email and password
    //--------------------------------------------------------------------------------------------------
    public User ReadUserDetails(string Email, string Password)
    {

        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        //List<User> Users = new List<User>();
        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@Email", Email);
        paramDic.Add("@Password", Password);


        cmd = CreateCommandWithStoredProcedureGeneral("SP_GetUser", con, paramDic);

        try
        {

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);


            if (!dataReader.Read())
            {
                // אם לא נמצא משתמש כזה, זרוק שגיאה שקשורה לפרטי התחברות שגויים
                throw new Exception("Incorrect login details");
            }



            User u = new User();
            u.Id = Convert.ToInt32(dataReader["Id"]);
            u.Email = dataReader["Email"].ToString();
            u.Password = dataReader["Password"].ToString();
            //u.Name = dataReader["Name"].ToString();
            u.IsActive = Convert.ToBoolean(dataReader["IsActive"]);

            return u;

            /*
            if (u.IsActive)
            {
                // אם משתמש קיים ובססטוס פעיל אז נחזיר את פרטיו
                return u;
            }
            else
            {
                // אם משתמש קיים אבל בסטטוס לא פעיל, נזרוק שגיאה מותאמת
                throw new Exception("Your account is inactive");
            }*/
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }
        finally
        {
            if (con != null)
            {
                // close the db connection
                con.Close();
            }
        }

    }

    //---------------------------------------------------------------------------------
    // This method get the users statictics
    //---------------------------------------------------------------------------------
    public List<Dictionary<string, object>> GetUsersWithGameStats()
    {
        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // יצירת חיבור
        }
        catch (Exception ex)
        {
            // רשום שגיאה אם יש
            throw (ex);
        }

        List<Dictionary<string, object>> usersStatsList = new List<Dictionary<string, object>>();

        cmd = CreateCommandWithStoredProcedureGeneral("GetUsersWithGameStats", con, null);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                // יצירת אובייקט דינמי (Ad-Hoc Object) לכל שורה ב-DataReader
                var userStats = new Dictionary<string, object>();
                userStats.Add("UserID", Convert.ToInt32(dataReader["UserID"]));
                userStats.Add("UserName", dataReader["UserName"].ToString());
                userStats.Add("NumberOfGamesBought", Convert.ToInt32(dataReader["NumberOfGamesBought"]));
                userStats.Add("TotalAmountSpent", Convert.ToDouble(dataReader["TotalAmountSpent"]));
                userStats.Add("IsActive", Convert.ToBoolean(dataReader["IsActive"]));
                usersStatsList.Add(userStats);
            }

            return usersStatsList;
        }
        catch (Exception ex)
        {
            // רשום שגיאה אם יש
            throw (ex);
        }
        finally
        {
            if (con != null)
            {
                // סגור את החיבור
                con.Close();
            }
        }
    }

    //--------------------------------------------------------------------------------------------------
    // This method inserts a new user to the users table 
    //--------------------------------------------------------------------------------------------------
    public int UpdateUserIsActive(int id, bool isActive)
    {

        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@userID", id);
        paramDic.Add("@isActive", isActive);


        cmd = CreateCommandWithStoredProcedureGeneral("SP_UpdateUserIsActive", con, paramDic);          // create the command

        try
        {
            int numEffected = cmd.ExecuteNonQuery(); // execute the command
            return numEffected;
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        finally
        {
            if (con != null)
            {
                // close the db connection
                con.Close();
            }
        }

    }
    //**** GAMES TABLE ****

    //---------------------------------------------------------------------------------
    // This method get the games table 
    //---------------------------------------------------------------------------------
    public List<Game> ReadAllGames()
    {

        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        List<Game> games = new List<Game>();

        cmd = CreateCommandWithStoredProcedureGeneral("GetAllGames", con, null);

        try
        {

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                Game g = new Game();
                g.AppID = Convert.ToInt32(dataReader["AppID"]);
                g.Name = dataReader["Name"].ToString();
                g.ReleaseDate = Convert.ToDateTime(dataReader["Release_date"]);
                g.Price = Convert.ToDouble(dataReader["Price"]);
                g.Description = dataReader["Description"].ToString();
                g.HeaderImage = dataReader["Header_image"].ToString();
                g.Website = dataReader["Website"].ToString();
                g.Windows = Convert.ToInt32(dataReader["Windows"]) == 1;
                g.Mac = Convert.ToInt32(dataReader["Mac"]) == 1;
                g.Linux = Convert.ToInt32(dataReader["Linux"]) == 1;
                g.ScoreRank = Convert.ToInt32(dataReader["Score_rank"]);
                g.Recommendations = dataReader["Recommendations"].ToString();
                g.Publisher = dataReader["Developers"].ToString();
                g.NumberOfPurchases = Convert.ToInt32(dataReader["numberOfPurchases"]);
                games.Add(g);
            }
            return games;
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }
        finally
        {
            if (con != null)
            {
                // close the db connection
                con.Close();
            }
        }


    }

    //---------------------------------------------------------------------------------
    // This method get the games that NOT LINKED to user  
    //---------------------------------------------------------------------------------
    public List<Game> ReadGamesNotLinkedToUser(int id)
    {

        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        List<Game> games = new List<Game>();
        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@userID", id);

        cmd = CreateCommandWithStoredProcedureGeneral("GetGamesNotLinkedToUser", con, paramDic);

        try
        {

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                Game g = new Game();
                g.AppID = Convert.ToInt32(dataReader["AppID"]);
                g.Name = dataReader["Name"].ToString();
                g.ReleaseDate = Convert.ToDateTime(dataReader["Release_date"]);
                g.Price = Convert.ToDouble(dataReader["Price"]);
                g.Description = dataReader["Description"].ToString();
                g.HeaderImage = dataReader["Header_image"].ToString();
                g.Website = dataReader["Website"].ToString();
                g.Windows = Convert.ToInt32(dataReader["Windows"]) == 1;
                g.Mac = Convert.ToInt32(dataReader["Mac"]) == 1;
                g.Linux = Convert.ToInt32(dataReader["Linux"]) == 1;
                g.ScoreRank = Convert.ToInt32(dataReader["Score_rank"]);
                g.Recommendations = dataReader["Recommendations"].ToString();
                g.Publisher = dataReader["Developers"].ToString();
                g.NumberOfPurchases = Convert.ToInt32(dataReader["numberOfPurchases"]);
                games.Add(g);
            }
            return games;
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }
        finally
        {
            if (con != null)
            {
                // close the db connection
                con.Close();
            }
        }


    }

    //---------------------------------------------------------------------------------
    // This method get the games by user ID  
    //---------------------------------------------------------------------------------
    public List<Game> ReadGamesByUserID(int id)
    {

        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        List<Game> games = new List<Game>();
        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@userID", id);

        cmd = CreateCommandWithStoredProcedureGeneral("SP_GetGamesByUserId", con, paramDic);

        try
        {

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                Game g = new Game();
                g.AppID = Convert.ToInt32(dataReader["AppID"]);
                g.Name = dataReader["Name"].ToString();
                g.ReleaseDate = Convert.ToDateTime(dataReader["Release_date"]);
                g.Price = Convert.ToDouble(dataReader["Price"]);
                g.Description = dataReader["Description"].ToString();
                g.HeaderImage = dataReader["Header_image"].ToString();
                g.Website = dataReader["Website"].ToString();
                g.Windows = Convert.ToInt32(dataReader["Windows"]) == 1;
                g.Mac = Convert.ToInt32(dataReader["Mac"]) == 1;
                g.Linux = Convert.ToInt32(dataReader["Linux"]) == 1;
                g.ScoreRank = Convert.ToInt32(dataReader["Score_rank"]);
                g.Recommendations = dataReader["Recommendations"].ToString();
                g.Publisher = dataReader["Developers"].ToString();
                g.NumberOfPurchases = Convert.ToInt32(dataReader["numberOfPurchases"]);
                games.Add(g);
            }
            return games;
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }
        finally
        {
            if (con != null)
            {
                // close the db connection
                con.Close();
            }
        }


    }

    //---------------------------------------------------------------------------------
    // This method get the games by min price  
    //---------------------------------------------------------------------------------
    public List<Game> ReadGameByMinPrice(int id, double price)
    {

        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        List<Game> games = new List<Game>();
        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@UserID", id);
        paramDic.Add("@Price", price);

        cmd = CreateCommandWithStoredProcedureGeneral("SP_GetGamesByMinPrice", con, paramDic);

        try
        {

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                Game g = new Game();
                g.AppID = Convert.ToInt32(dataReader["AppID"]);
                g.Name = dataReader["Name"].ToString();
                g.ReleaseDate = Convert.ToDateTime(dataReader["Release_date"]);
                g.Price = Convert.ToDouble(dataReader["Price"]);
                g.Description = dataReader["Description"].ToString();
                g.HeaderImage = dataReader["Header_image"].ToString();
                g.Website = dataReader["Website"].ToString();
                g.Windows = Convert.ToInt32(dataReader["Windows"]) == 1;
                g.Mac = Convert.ToInt32(dataReader["Mac"]) == 1;
                g.Linux = Convert.ToInt32(dataReader["Linux"]) == 1;
                g.ScoreRank = Convert.ToInt32(dataReader["Score_rank"]);
                g.Recommendations = dataReader["Recommendations"].ToString();
                g.Publisher = dataReader["Developers"].ToString();
                g.NumberOfPurchases = Convert.ToInt32(dataReader["numberOfPurchases"]);
                games.Add(g);
            }
            return games;
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }
        finally
        {
            if (con != null)
            {
                // close the db connection
                con.Close();
            }
        }


    }

    //---------------------------------------------------------------------------------
    // This method get the games by min rank score  
    //---------------------------------------------------------------------------------
    public List<Game> ReadGameByMinRank(int id, int rank)
    {

        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        List<Game> games = new List<Game>();
        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@UserID", id);
        paramDic.Add("@RankScore", rank);

        cmd = CreateCommandWithStoredProcedureGeneral("SP_GetGamesByMinRank", con, paramDic);

        try
        {

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                Game g = new Game();
                g.AppID = Convert.ToInt32(dataReader["AppID"]);
                g.Name = dataReader["Name"].ToString();
                g.ReleaseDate = Convert.ToDateTime(dataReader["Release_date"]);
                g.Price = Convert.ToDouble(dataReader["Price"]);
                g.Description = dataReader["Description"].ToString();
                g.HeaderImage = dataReader["Header_image"].ToString();
                g.Website = dataReader["Website"].ToString();
                g.Windows = Convert.ToInt32(dataReader["Windows"]) == 1;
                g.Mac = Convert.ToInt32(dataReader["Mac"]) == 1;
                g.Linux = Convert.ToInt32(dataReader["Linux"]) == 1;
                g.ScoreRank = Convert.ToInt32(dataReader["Score_rank"]);
                g.Recommendations = dataReader["Recommendations"].ToString();
                g.Publisher = dataReader["Developers"].ToString();
                g.NumberOfPurchases = Convert.ToInt32(dataReader["numberOfPurchases"]);
                games.Add(g);
            }
            return games;
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }
        finally
        {
            if (con != null)
            {
                // close the db connection
                con.Close();
            }
        }


    }

    //---------------------------------------------------------------------------------
    // This method get the games statictics
    //---------------------------------------------------------------------------------
    public List<Dictionary<string, object>> GetGamesWithStats()
    {
        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // יצירת חיבור
        }
        catch (Exception ex)
        {
            // רשום שגיאה אם יש
            throw (ex);
        }

        List<Dictionary<string, object>> gameStatsList = new List<Dictionary<string, object>>();

        cmd = CreateCommandWithStoredProcedureGeneral("GetGamesWithStats", con, null);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                // יצירת אובייקט דינמי (Ad-Hoc Object) לכל שורה ב-DataReader
                var gameStats = new Dictionary<string, object>();
                gameStats.Add("AppID", Convert.ToInt32(dataReader["GameID"]));
                gameStats.Add("Name", dataReader["Title"].ToString());
                gameStats.Add("NumberOfDownloads", Convert.ToInt32(dataReader["NumberOfDownloads"]));
                gameStats.Add("TotalRevenue", Convert.ToDouble(dataReader["TotalAmountPaid"]));

                gameStatsList.Add(gameStats);
            }

            return gameStatsList;
        }
        catch (Exception ex)
        {
            // רשום שגיאה אם יש
            throw (ex);
        }
        finally
        {
            if (con != null)
            {
                // סגור את החיבור
                con.Close();
            }
        }
    }

    //**** USER GAME CONNECTION TABLE ****

    //--------------------------------------------------------------------------------------------------
    // This method inserts a new user-game connection to the users-games table 
    //--------------------------------------------------------------------------------------------------
    public int Insert(int id, int appID)
    {

        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@userID", id);
        paramDic.Add("@gameID", appID);


        cmd = CreateCommandWithStoredProcedureGeneral("SP_addGameToMyGames", con, paramDic);          // create the command

        try
        {
            int numEffected = cmd.ExecuteNonQuery(); // execute the command
            return numEffected;
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        finally
        {
            if (con != null)
            {
                // close the db connection
                con.Close();
            }
        }

    }

    //--------------------------------------------------------------------------------------------------
    // This method removes a new user-game connection from the users-games table 
    //--------------------------------------------------------------------------------------------------
    public int Remove(int id, int appID)
    {

        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@userID", id);
        paramDic.Add("@gameID", appID);


        cmd = CreateCommandWithStoredProcedureGeneral("SP_RemoveGameFromMyGames", con, paramDic);          // create the command

        try
        {
            int numEffected = cmd.ExecuteNonQuery(); // execute the command
            return numEffected;
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        finally
        {
            if (con != null)
            {
                // close the db connection
                con.Close();
            }
        }

    }


    //---------------------------------------------------------------------------------
    // Create the SqlCommand
    //---------------------------------------------------------------------------------
    private SqlCommand CreateCommandWithStoredProcedureGeneral(String spName, SqlConnection con, Dictionary<string, object> paramDic)
    {

        SqlCommand cmd = new SqlCommand(); // create the command object

        cmd.Connection = con;              // assign the connection to the command object

        cmd.CommandText = spName;      // can be Select, Insert, Update, Delete 

        cmd.CommandTimeout = 10;           // Time to wait for the execution' The default is 30 seconds

        cmd.CommandType = System.Data.CommandType.StoredProcedure; // the type of the command, can also be text

        if (paramDic != null)
            foreach (KeyValuePair<string, object> param in paramDic)
            {
                cmd.Parameters.AddWithValue(param.Key, param.Value);

            }


        return cmd;
    }



    //---------------------------------------------------------------------------------
    // This method get the users table 
    //---------------------------------------------------------------------------------
    /*
    public List<User> ReadAllUsers()
    {

        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        List<User> users = new List<User>();

        cmd = CreateCommandWithStoredProcedureGeneral("GetAllUsers", con, null);

        try
        {

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                User u = new User();
                u.Id = Convert.ToInt32(dataReader["Id"]);
                u.Email = dataReader["Email"].ToString();
                u.Password = dataReader["Password"].ToString();
                u.Name = dataReader["Name"].ToString();
                users.Add(u);
            }
            return users;
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }
        finally
        {
            if (con != null)
            {
                // close the db connection
                con.Close();
            }
        }


    }
    */


    //--------------------------------------------------------------------------------------------------
    // This method inserts a new game to the games table 
    //--------------------------------------------------------------------------------------------------
    /*public int InsertNewGame(Game game)
    {

        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@AppID", game.AppID);
        paramDic.Add("@Name", game.Name);
        paramDic.Add("@Release_date", game.ReleaseDate);
        paramDic.Add("@Price", game.Price);
        paramDic.Add("@Description", game.Description);
        paramDic.Add("@Header_image", game.HeaderImage);
        paramDic.Add("@Website", game.Website);
        paramDic.Add("@Windows", game.Windows);
        paramDic.Add("@Mac", game.Mac);
        paramDic.Add("@Linux", game.Linux);
        paramDic.Add("@Score_rank", game.ScoreRank);
        paramDic.Add("@Recommendations", game.Recommendations);
        paramDic.Add("@Developers", game.Publisher);
        




        cmd = CreateCommandWithStoredProcedureGeneral("InsertNewGame2025", con, paramDic);          // create the command

        try
        {
            int numEffected = cmd.ExecuteNonQuery(); // execute the command
            return numEffected;
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        finally
        {
            if (con != null)
            {
                // close the db connection
                con.Close();
            }
        }

    }*/






}

