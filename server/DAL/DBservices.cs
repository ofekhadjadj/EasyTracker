using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.SqlClient;
using System.Data;
using System.Text;
using SteamApp.BL;
using System.Security.Cryptography;
using EasyTracker.BL;
using Microsoft.AspNetCore.Http;
using System.Diagnostics;
//using System.Reflection.Emit;

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


    //**** USERS TABLE ******** USERS TABLE ******** USERS TABLE ******** USERS TABLE ******** USERS TABLE ******** USERS TABLE ****

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
        paramDic.Add("@Image", user.Image);


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


        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_LoginUser", con, paramDic);

try
{

    SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);


    if (!dataReader.Read())
    {
        // אם לא נמצא משתמש כזה, זרוק שגיאה שקשורה לפרטי התחברות שגויים
        //throw new Exception("Incorrect login details");
         return null;

    }



    User u = new User();
    u.Id = Convert.ToInt32(dataReader["UserID"]);
    u.Email = dataReader["Email"].ToString();
    u.FirstName = dataReader["FirstName"].ToString();
    u.LastName = dataReader["LastName"].ToString();
    u.Role = dataReader["Role"].ToString();
    u.IsActive = Convert.ToBoolean(dataReader["IsActive"]);
    u.Image = dataReader["Image"].ToString();


            return u;

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
    // This method update user deatils in users table 
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
        paramDic.Add("@UserID", user.Id);
        paramDic.Add("@Email", user.Email);
        paramDic.Add("@FirstName", user.FirstName);
        paramDic.Add("@LastName", user.LastName);
        paramDic.Add("@Password", user.Password);
        paramDic.Add("@Image", user.Image);

        //paramDic.Add("@Name", user.Name);

        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_UpdateUser", con, paramDic);          // create the command

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
    // This method update user Password in users table 
    //--------------------------------------------------------------------------------------------------
    public int UpdateUserPassword(int Id, string OldPassword,string NewPassword)
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
        paramDic.Add("@UserID", Id);
        paramDic.Add("@OldPassword", OldPassword);
        paramDic.Add("@NewPassword", NewPassword);

        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_ChangePassword", con, paramDic);          // create the command

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

    //**** PROJECTS TABLE ******** PROJECTS TABLE ******** PROJECTS TABLE ******** PROJECTS TABLE ******** PROJECTS TABLE ******** PROJECTS TABLE ****
    //--------------------------------------------------------------------------------------------------
    // This method inserts a new project to the users table 
    //--------------------------------------------------------------------------------------------------
    public int InsertNewProject(Project project)
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
        paramDic.Add("@ProjectName", project.Projectname);
        paramDic.Add("@Description", project.Description);
        paramDic.Add("@HourlyRate", project.Hourlyrate);
        paramDic.Add("@Image", project.Image);
        paramDic.Add("@ClientID", project.Clientid);
        paramDic.Add("@CreatedByUserID", project.Createdbyuserid);
        paramDic.Add("@DurationGoal", project.DurationGoal);


        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_AddProject", con, paramDic);          // create the command

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
    // This method get user projects by ID
    //--------------------------------------------------------------------------------------------------
    public List<Dictionary<string, object>> GetAllProjectsByUserId(int id) //ad-hoc
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

        List<Dictionary<string, object>> result = new List<Dictionary<string, object>>(); //ad-hoc
        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@UserID", id);
        

        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_GetProjectsById", con, paramDic);

        try
        {

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                //ad-hoc
                var item = new Dictionary<string, object>();
                item["ProjectID"] = Convert.ToInt32(dataReader["ProjectID"]);
                item["ProjectName"] = dataReader["ProjectName"].ToString();
                item["Description"] = dataReader["Description"].ToString();
                item["HourlyRate"] = Convert.ToSingle(dataReader["HourlyRate"]);
                item["Image"] = dataReader["Image"].ToString();
                item["ClientID"] = Convert.ToInt32(dataReader["ClientID"]);
                item["isArchived"] = Convert.ToBoolean(dataReader["isArchived"]);
                item["CreatedByUserID"] = Convert.ToInt32(dataReader["CreatedByUserID"]);
                item["isDone"] = Convert.ToBoolean(dataReader["isDone"]);
                item["CompanyName"] = dataReader["CompanyName"].ToString();
                item["DurationGoal"] = Convert.ToDecimal(dataReader["DurationGoal"]);
                item["Role"] = dataReader["Role"].ToString();
                item["isDisable"] = dataReader["isDisable"].ToString();


                result.Add(item);
            }

            if (dataReader.NextResult() && dataReader.Read())
            {
                var stats = new Dictionary<string, object>();
                stats["NotDoneCount"] = Convert.ToInt32(dataReader["NotDoneCount"]);
                stats["DoneCount"] = Convert.ToInt32(dataReader["DoneCount"]);

                // נכניס את זה כאייטם מיוחד בתוך הרשימה
                var statsWrapper = new Dictionary<string, object>();
                statsWrapper["Stats"] = stats;

                result.Add(statsWrapper);
            }

            return result;

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
    // This method get user projects by ID
    //--------------------------------------------------------------------------------------------------
    public List<Dictionary<string, object>> GetLast5ProjectsByUserId(int id) //ad-hoc
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

        List<Dictionary<string, object>> result = new List<Dictionary<string, object>>(); //ad-hoc
        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@UserID", id);


        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_GetLast5ProjectsByUserId", con, paramDic);

        try
        {

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                //ad-hoc
                var item = new Dictionary<string, object>();
                item["ProjectID"] = Convert.ToInt32(dataReader["ProjectID"]);
                item["ProjectName"] = dataReader["ProjectName"].ToString();
                item["Description"] = dataReader["Description"].ToString();
                item["HourlyRate"] = Convert.ToSingle(dataReader["HourlyRate"]);
                item["Image"] = dataReader["Image"].ToString();
                item["ClientID"] = Convert.ToInt32(dataReader["ClientID"]);
                item["isArchived"] = Convert.ToBoolean(dataReader["isArchived"]);
                item["CreatedByUserID"] = Convert.ToInt32(dataReader["CreatedByUserID"]);
                item["isDone"] = Convert.ToBoolean(dataReader["isDone"]);
                //item["CompanyName"] = dataReader["CompanyName"].ToString();
                item["DurationGoal"] = Convert.ToDecimal(dataReader["DurationGoal"]);
                //item["Role"] = dataReader["Role"].ToString();
                //item["isDisable"] = dataReader["isDisable"].ToString();


                result.Add(item);
            }


            return result;

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
    // This method put project in Archive  
    //--------------------------------------------------------------------------------------------------
    public int DeleteProject(int ProjectId)
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
        paramDic.Add("@ProjectID", ProjectId);

        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_ArchiveProject", con, paramDic);          // create the command

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
    // This method get user projects by ID
    //--------------------------------------------------------------------------------------------------
    public int AddNewTeamMemberToProject(string TeamMemberEmail, int projectID)
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
        paramDic.Add("@TeamMemberEmail", TeamMemberEmail);
        paramDic.Add("@ProjectID", projectID);


        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_AddNewTeamMemberToProject", con, paramDic);

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
    // This method put Team Member in disable  
    //--------------------------------------------------------------------------------------------------
    public int RemoveTeamMemberFromProject(string TeamMemberEmail, int ProjectID)
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
        paramDic.Add("@Email", TeamMemberEmail);
        paramDic.Add("@ProjectID", ProjectID);

        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_RemoveTeamMemberFromProject", con, paramDic);          // create the command

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
    // This method get user projects by ID
    //--------------------------------------------------------------------------------------------------
    public List<Dictionary<string, object>> GetProjectTeam(int ProjectID) //ad-hoc
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

        List<Dictionary<string, object>> result = new List<Dictionary<string, object>>(); //ad-hoc
        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@ProjectID", ProjectID);


        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_GetProjectTeam", con, paramDic);

        try
        {

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                //ad-hoc
                var item = new Dictionary<string, object>();
                item["UserID"] = Convert.ToInt32(dataReader["UserID"]);
                item["Full name"] = dataReader["Full name"].ToString();
                item["Image"] = dataReader["Image"].ToString();
                item["Role"] = dataReader["Role"].ToString();
                
                result.Add(item);
            }

            return result;

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
    // This method get project by his ID
    //--------------------------------------------------------------------------------------------------
   
    public List<Dictionary<string, object>> GetThisProject(int ProjectID, int UserID) //ad-hoc
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

        List<Dictionary<string, object>> result = new List<Dictionary<string, object>>(); //ad-hoc
        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@ProjectID", ProjectID);
        paramDic.Add("@UserID", UserID);


        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_GetThisProject", con, paramDic);

        try
        {

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                //ad-hoc
                var item = new Dictionary<string, object>();
                item["ProjectID"] = Convert.ToInt32(dataReader["ProjectID"]);
                item["ProjectName"] = dataReader["ProjectName"].ToString();
                item["Description"] = dataReader["Description"].ToString();
                item["HourlyRate"] = Convert.ToSingle(dataReader["HourlyRate"]);
                item["Image"] = dataReader["Image"].ToString();
                item["ClientID"] = Convert.ToInt32(dataReader["ClientID"]);
                item["isArchived"] = Convert.ToBoolean(dataReader["isArchived"]);
                item["CreatedByUserID"] = Convert.ToInt32(dataReader["CreatedByUserID"]);
                item["isDone"] = Convert.ToBoolean(dataReader["isDone"]);
                item["CompanyName"] = dataReader["CompanyName"].ToString();
                item["DurationGoal"] = Convert.ToDecimal(dataReader["DurationGoal"]);
                item["Role"] = dataReader["Role"].ToString();
                item["isDisable"] = dataReader["isDisable"].ToString();


                result.Add(item);
            }

            return result;

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
    // This method inserts a new project to the users table 
    //--------------------------------------------------------------------------------------------------
    public int UpdateProject(Project project)
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
        paramDic.Add("@ProjectID", project.Projectid);
        paramDic.Add("@ProjectName", project.Projectname);
        paramDic.Add("@Description", project.Description);
        paramDic.Add("@HourlyRate", project.Hourlyrate);
        paramDic.Add("@Image", project.Image);
        paramDic.Add("@ClientID", project.Clientid);
        paramDic.Add("@DurationGoal", project.DurationGoal);


        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_UpdateProject", con, paramDic);          // create the command

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

    //**** SESSION TABLE ******** SESSION TABLE ******** SESSION TABLE ******** SESSION TABLE ******** SESSION TABLE ******** SESSION TABLE ****

    //--------------------------------------------------------------------------------------------------
    // This method inserts a new Session to the Sessions table 
    //--------------------------------------------------------------------------------------------------
    public int InsertNewSessionAutomatic(int UserID, int ProjectID, DateTime StartDate)
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
        paramDic.Add("@ProjectID", ProjectID);
        paramDic.Add("@UserID", UserID);
        paramDic.Add("@StartDate", StartDate);
        


        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_AddStartSessionAutomatic", con, paramDic);          // create the command

        try
        {
            //int numEffected = cmd.ExecuteNonQuery(); // execute the command
            //return numEffected;

            object result = cmd.ExecuteScalar(); // מחזיר את ה-SessionID
            int newSessionID = Convert.ToInt32(result);
            return newSessionID;
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
    // This method update session in Sessions table 
    //--------------------------------------------------------------------------------------------------
    public List<Dictionary<string, object>> UpdateSession(Session Session)
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
        List<Dictionary<string, object>> result = new List<Dictionary<string, object>>(); //ad-hoc

        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@SessionID", Session.SessionID);
        //paramDic.Add("@ProjectID", Session.ProjectID);
        //paramDic.Add("@UserID", Session.UserID);
        paramDic.Add("@StartDate", Session.StartDate); 
        paramDic.Add("@EndDate", Session.EndDate);
        paramDic.Add("@DurationSeconds", Session.DurationSeconds);
        paramDic.Add("@HourlyRate", Session.HourlyRate);
        paramDic.Add("@Description", Session.Description);
        paramDic.Add("@LabelID", Session.LabelID);
        paramDic.Add("@Status", Session.Status);
        //paramDic.Add("@isArchived", Session.IsArchived);
        

        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_UpdateSession", con, paramDic);          // create the command

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                //ad-hoc
                var item = new Dictionary<string, object>();
                item["UpdatedSessionID"] = Convert.ToInt32(dataReader["UpdatedSessionID"]);
                item["SessionStatus"] = dataReader["SessionStatus"].ToString();

                result.Add(item);
            }

            return result;
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
    // This method update session IsArchived in Sessions table 
    //--------------------------------------------------------------------------------------------------
    public int DeleteSession(int SessionID)
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
        paramDic.Add("@SessionID", SessionID);
      
        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_ArchiveSession", con, paramDic);          // create the command

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
    // This method inserts a new Session in Sessions table 
    //--------------------------------------------------------------------------------------------------
    public int InsertNewSessionManually(Session Session)
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
        paramDic.Add("@ProjectID", Session.ProjectID);
        paramDic.Add("@UserID", Session.UserID);
        paramDic.Add("@StartDate", Session.StartDate);
        paramDic.Add("@EndDate", Session.EndDate);
        paramDic.Add("@DurationSeconds", Session.DurationSeconds);
        paramDic.Add("@HourlyRate", Session.HourlyRate);
        paramDic.Add("@Description", Session.Description);
        paramDic.Add("@LabelID", Session.LabelID);
        
        





        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_AddSessionManually", con, paramDic);          // create the command

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
    // This method get sessions by user and Project
    //--------------------------------------------------------------------------------------------------
    public List<Dictionary<string, object>> GetAllSessionsByUserAndProject(int userID, int projectID)
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

        List<Dictionary<string, object>> result = new List<Dictionary<string, object>>(); //ad-hoc

        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@UserID", userID);
        paramDic.Add("@ProjectID", projectID);



        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_GetSessionsByUserAndProject", con, paramDic);

        try
        {

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                //ad-hoc
                var item = new Dictionary<string, object>();
                item["SessionID"] = Convert.ToInt32(dataReader["SessionID"]);
                item["ProjectID"] = Convert.ToInt32(dataReader["ProjectID"]);
                item["StartDate"] = Convert.ToDateTime(dataReader["StartDate"]);
                item["EndDate"] = dataReader["EndDate"] == DBNull.Value ? (DateTime?)null : Convert.ToDateTime(dataReader["EndDate"]);
                item["DurationSeconds"] = dataReader["DurationSeconds"] == DBNull.Value ? (int?)null : Convert.ToInt32(dataReader["DurationSeconds"]);
                item["HourlyRate"] = dataReader["HourlyRate"] == DBNull.Value ? (decimal?)null : Convert.ToDecimal(dataReader["HourlyRate"]);
                item["Description"] = dataReader["Description"] == DBNull.Value ? null : dataReader["Description"].ToString();
                item["LabelID"] = dataReader["LabelID"] == DBNull.Value ? (int?)null : Convert.ToInt32(dataReader["LabelID"]);
                item["IsArchived"] = Convert.ToBoolean(dataReader["isArchived"]);
                item["UserID"] = dataReader["UserID"] == DBNull.Value ? (int?)null : Convert.ToInt32(dataReader["UserID"]);
                item["SessionStatus"] = dataReader["SessionStatus"] == DBNull.Value ? null : dataReader["SessionStatus"].ToString();
                item["LabelName"] = dataReader["LabelName"] == DBNull.Value ? null : dataReader["LabelName"].ToString();
                item["LabelColor"] = dataReader["LabelColor"] == DBNull.Value ? null : dataReader["LabelColor"].ToString();

                result.Add(item);   
            }
            return result;

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


    //**** LABEL TABLE ******** LABEL TABLE ******** LABEL TABLE ******** LABEL TABLE ******** LABEL TABLE ******** LABEL TABLE ****

    //--------------------------------------------------------------------------------------------------
    // This method inserts a new label to the labels table 
    //
    public int InsertNewLabel(Label label)
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
        paramDic.Add("@LabelName", label.LabelName);
        paramDic.Add("@LabelColor", label.LabelColor);
        paramDic.Add("@UserID", label.UserID);


        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_AddLabel", con, paramDic);          // create the command

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
    // This method update label IsArchived in Labels table 
    //--------------------------------------------------------------------------------------------------
    public int DeleteLabel(int LabelID)
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
        paramDic.Add("@LabelID", LabelID);

        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_ArchiveLabel", con, paramDic);          // create the command

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
    // This method get labels by user ID
    //--------------------------------------------------------------------------------------------------
    public List<Label> GetAllLabelsByUserID(int userID)
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

        List<Label> Labels = new List<Label>();
        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@UserID", userID);




        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_GetLabelsByUserId", con, paramDic);

        try
        {

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                Label l = new Label();
                l.LabelID = Convert.ToInt32(dataReader["LabelID"]);
                l.LabelName = dataReader["LabelName"].ToString();
                l.LabelColor = dataReader["LabelColor"].ToString();
                l.UserID = Convert.ToInt32(dataReader["UserID"]);

                Labels.Add(l);
            }
            return Labels;

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
    // This method get 6 top labels by user ID
    //--------------------------------------------------------------------------------------------------
    public List<Label> Get6ToplLabelsByUserID(int userID)
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

        List<Label> Labels = new List<Label>();
        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@UserID", userID);




        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_GetPopularLabelsByUserId", con, paramDic);

        try
        {

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                Label l = new Label();
                l.LabelID = Convert.ToInt32(dataReader["LabelID"]);
                l.LabelName = dataReader["LabelName"].ToString();
                l.LabelColor = dataReader["LabelColor"].ToString();
                //l.UserID = Convert.ToInt32(dataReader["UserID"]);

                Labels.Add(l);
            }
            return Labels;

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
    // This method update user deatils in users table 
    //--------------------------------------------------------------------------------------------------
    public int UpdateLabel(Label label)
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
        paramDic.Add("@LabelID", label.LabelID);
        paramDic.Add("@LabelName", label.LabelName);
        paramDic.Add("@LabelColor", label.LabelColor);

        //paramDic.Add("@Name", user.Name);

        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_UpdateLabel", con, paramDic);          // create the command

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


    //**** CLIENT TABLE ******** CLIENT TABLE ******** CLIENT TABLE ******** CLIENT TABLE ******** CLIENT TABLE ******** CLIENT TABLE ****


    //--------------------------------------------------------------------------------------------------
    // This method get clients by user ID
    //--------------------------------------------------------------------------------------------------
    public List<Client> GetAllClientsByUserID(int userID)
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

        List<Client> Clients = new List<Client>();
        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@UserID", userID);
        



        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_GetClientsByUserID", con, paramDic);

        try
        {

            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            while (dataReader.Read())
            {
                Client c = new Client();
                c.ClientID = Convert.ToInt32(dataReader["ClientID"]);
                c.CompanyName = dataReader["CompanyName"].ToString();
                c.ContactPerson = dataReader["ContactPerson"] == DBNull.Value ? null : dataReader["ContactPerson"].ToString();
                c.Email = dataReader["Email"] == DBNull.Value ? null : dataReader["Email"].ToString();
                c.ContactPersonPhone = dataReader["ContactPersonPhone"] == DBNull.Value ? null : dataReader["ContactPersonPhone"].ToString();
                c.OfficePhone = dataReader["OfficePhone"] == DBNull.Value ? null : dataReader["OfficePhone"].ToString();
                c.UserID = Convert.ToInt32(dataReader["UserID"]);
                c.IsArchived = Convert.ToBoolean(dataReader["isArchived"]);
                c.Image = dataReader["Image"] == DBNull.Value ? null : dataReader["Image"].ToString();

                Clients.Add(c);
            }
            return Clients;

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

    //שקד מכאן

    //--------------------------------------------------------------------------------------------------
    // This method inserts a new client to the clients table 
    //--------------------------------------------------------------------------------------------------
    public int InsertNewClient(Client client)
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
        paramDic.Add("@companyName", client.CompanyName);
        paramDic.Add("@contactPerson", client.ContactPerson ?? (object)DBNull.Value);
        paramDic.Add("@email", client.Email ?? (object)DBNull.Value);
        paramDic.Add("@contactPersonPhone", client.ContactPersonPhone ?? (object)DBNull.Value);
        paramDic.Add("@officePhone", client.OfficePhone ?? (object)DBNull.Value);
        paramDic.Add("@userID", client.UserID);
        paramDic.Add("@image", client.Image ?? (object)DBNull.Value);



        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_AddClient", con, paramDic);          // create the command

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
    // This method get update Client
    //--------------------------------------------------------------------------------------------------
    public int UpdateClient(Client client)
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
        paramDic.Add("@ClientID", client.ClientID);
        paramDic.Add("@companyName", client.CompanyName);
        paramDic.Add("@contactPerson", client.ContactPerson ?? (object)DBNull.Value);
        paramDic.Add("@email", client.Email ?? (object)DBNull.Value);
        paramDic.Add("@contactPersonPhone", client.ContactPersonPhone ?? (object)DBNull.Value);
        paramDic.Add("@officePhone", client.OfficePhone ?? (object)DBNull.Value);
        paramDic.Add("@userID", client.UserID);
        paramDic.Add("@image", client.Image ?? (object)DBNull.Value);




        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_UpdateClient", con, paramDic);          // create the command

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


    ////--------------------------------------------------------------------------------------------------
    //// This method inserts a new user to the users table 
    ////--------------------------------------------------------------------------------------------------
    //public int UpdateUserDetails(User user)
    //{

    //    SqlConnection con;
    //    SqlCommand cmd;

    //    try
    //    {
    //        con = connect("myProjDB"); // create the connection
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }

    //    Dictionary<string, object> paramDic = new Dictionary<string, object>();
    //    paramDic.Add("@userID", user.Id);
    //    paramDic.Add("@Email", user.Email);
    //    paramDic.Add("@Password", user.Password);
    //    //paramDic.Add("@Name", user.Name);

    //    cmd = CreateCommandWithStoredProcedureGeneral("SP_UpdateUserDetails", con, paramDic);          // create the command

    //    try
    //    {
    //        int numEffected = cmd.ExecuteNonQuery(); // execute the command
    //        return numEffected;
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }

    //    finally
    //    {
    //        if (con != null)
    //        {
    //            // close the db connection
    //            con.Close();
    //        }
    //    }

    //}

    ////--------------------------------------------------------------------------------------------------
    //// This method get user details email and password
    ////--------------------------------------------------------------------------------------------------
    //public User ReadUserDetails(string Email, string Password)
    //{

    //    SqlConnection con;
    //    SqlCommand cmd;

    //    try
    //    {
    //        con = connect("myProjDB"); // create the connection
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }

    //    //List<User> Users = new List<User>();
    //    Dictionary<string, object> paramDic = new Dictionary<string, object>();
    //    paramDic.Add("@Email", Email);
    //    paramDic.Add("@Password", Password);


    //    cmd = CreateCommandWithStoredProcedureGeneral("SP_GetUser", con, paramDic);

    //    try
    //    {

    //        SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);


    //        if (!dataReader.Read())
    //        {
    //            // אם לא נמצא משתמש כזה, זרוק שגיאה שקשורה לפרטי התחברות שגויים
    //            throw new Exception("Incorrect login details");
    //        }



    //        User u = new User();
    //        u.Id = Convert.ToInt32(dataReader["Id"]);
    //        u.Email = dataReader["Email"].ToString();
    //        u.Password = dataReader["Password"].ToString();
    //        //u.Name = dataReader["Name"].ToString();
    //        u.IsActive = Convert.ToBoolean(dataReader["IsActive"]);

    //        return u;

    //        /*
    //        if (u.IsActive)
    //        {
    //            // אם משתמש קיים ובססטוס פעיל אז נחזיר את פרטיו
    //            return u;
    //        }
    //        else
    //        {
    //            // אם משתמש קיים אבל בסטטוס לא פעיל, נזרוק שגיאה מותאמת
    //            throw new Exception("Your account is inactive");
    //        }*/
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }
    //    finally
    //    {
    //        if (con != null)
    //        {
    //            // close the db connection
    //            con.Close();
    //        }
    //    }

    //}

    ////---------------------------------------------------------------------------------
    //// This method get the users statictics
    ////---------------------------------------------------------------------------------
    //public List<Dictionary<string, object>> GetUsersWithGameStats()
    //{
    //    SqlConnection con;
    //    SqlCommand cmd;

    //    try
    //    {
    //        con = connect("myProjDB"); // יצירת חיבור
    //    }
    //    catch (Exception ex)
    //    {
    //        // רשום שגיאה אם יש
    //        throw (ex);
    //    }

    //    List<Dictionary<string, object>> usersStatsList = new List<Dictionary<string, object>>();

    //    cmd = CreateCommandWithStoredProcedureGeneral("GetUsersWithGameStats", con, null);

    //    try
    //    {
    //        SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

    //        while (dataReader.Read())
    //        {
    //            // יצירת אובייקט דינמי (Ad-Hoc Object) לכל שורה ב-DataReader
    //            var userStats = new Dictionary<string, object>();
    //            userStats.Add("UserID", Convert.ToInt32(dataReader["UserID"]));
    //            userStats.Add("UserName", dataReader["UserName"].ToString());
    //            userStats.Add("NumberOfGamesBought", Convert.ToInt32(dataReader["NumberOfGamesBought"]));
    //            userStats.Add("TotalAmountSpent", Convert.ToDouble(dataReader["TotalAmountSpent"]));
    //            userStats.Add("IsActive", Convert.ToBoolean(dataReader["IsActive"]));
    //            usersStatsList.Add(userStats);
    //        }

    //        return usersStatsList;
    //    }
    //    catch (Exception ex)
    //    {
    //        // רשום שגיאה אם יש
    //        throw (ex);
    //    }
    //    finally
    //    {
    //        if (con != null)
    //        {
    //            // סגור את החיבור
    //            con.Close();
    //        }
    //    }
    //}

    ////--------------------------------------------------------------------------------------------------
    //// This method inserts a new user to the users table 
    ////--------------------------------------------------------------------------------------------------
    //public int UpdateUserIsActive(int id, bool isActive)
    //{

    //    SqlConnection con;
    //    SqlCommand cmd;

    //    try
    //    {
    //        con = connect("myProjDB"); // create the connection
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }

    //    Dictionary<string, object> paramDic = new Dictionary<string, object>();
    //    paramDic.Add("@userID", id);
    //    paramDic.Add("@isActive", isActive);


    //    cmd = CreateCommandWithStoredProcedureGeneral("SP_UpdateUserIsActive", con, paramDic);          // create the command

    //    try
    //    {
    //        int numEffected = cmd.ExecuteNonQuery(); // execute the command
    //        return numEffected;
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }

    //    finally
    //    {
    //        if (con != null)
    //        {
    //            // close the db connection
    //            con.Close();
    //        }
    //    }

    //}
    ////**** GAMES TABLE ****

    ////---------------------------------------------------------------------------------
    //// This method get the games table 
    ////---------------------------------------------------------------------------------
    //public List<Game> ReadAllGames()
    //{

    //    SqlConnection con;
    //    SqlCommand cmd;

    //    try
    //    {
    //        con = connect("myProjDB"); // create the connection
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }

    //    List<Game> games = new List<Game>();

    //    cmd = CreateCommandWithStoredProcedureGeneral("GetAllGames", con, null);

    //    try
    //    {

    //        SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

    //        while (dataReader.Read())
    //        {
    //            Game g = new Game();
    //            g.AppID = Convert.ToInt32(dataReader["AppID"]);
    //            g.Name = dataReader["Name"].ToString();
    //            g.ReleaseDate = Convert.ToDateTime(dataReader["Release_date"]);
    //            g.Price = Convert.ToDouble(dataReader["Price"]);
    //            g.Description = dataReader["Description"].ToString();
    //            g.HeaderImage = dataReader["Header_image"].ToString();
    //            g.Website = dataReader["Website"].ToString();
    //            g.Windows = Convert.ToInt32(dataReader["Windows"]) == 1;
    //            g.Mac = Convert.ToInt32(dataReader["Mac"]) == 1;
    //            g.Linux = Convert.ToInt32(dataReader["Linux"]) == 1;
    //            g.ScoreRank = Convert.ToInt32(dataReader["Score_rank"]);
    //            g.Recommendations = dataReader["Recommendations"].ToString();
    //            g.Publisher = dataReader["Developers"].ToString();
    //            g.NumberOfPurchases = Convert.ToInt32(dataReader["numberOfPurchases"]);
    //            games.Add(g);
    //        }
    //        return games;
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }
    //    finally
    //    {
    //        if (con != null)
    //        {
    //            // close the db connection
    //            con.Close();
    //        }
    //    }


    //}

    ////---------------------------------------------------------------------------------
    //// This method get the games that NOT LINKED to user  
    ////---------------------------------------------------------------------------------
    //public List<Game> ReadGamesNotLinkedToUser(int id)
    //{

    //    SqlConnection con;
    //    SqlCommand cmd;

    //    try
    //    {
    //        con = connect("myProjDB"); // create the connection
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }

    //    List<Game> games = new List<Game>();
    //    Dictionary<string, object> paramDic = new Dictionary<string, object>();
    //    paramDic.Add("@userID", id);

    //    cmd = CreateCommandWithStoredProcedureGeneral("GetGamesNotLinkedToUser", con, paramDic);

    //    try
    //    {

    //        SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

    //        while (dataReader.Read())
    //        {
    //            Game g = new Game();
    //            g.AppID = Convert.ToInt32(dataReader["AppID"]);
    //            g.Name = dataReader["Name"].ToString();
    //            g.ReleaseDate = Convert.ToDateTime(dataReader["Release_date"]);
    //            g.Price = Convert.ToDouble(dataReader["Price"]);
    //            g.Description = dataReader["Description"].ToString();
    //            g.HeaderImage = dataReader["Header_image"].ToString();
    //            g.Website = dataReader["Website"].ToString();
    //            g.Windows = Convert.ToInt32(dataReader["Windows"]) == 1;
    //            g.Mac = Convert.ToInt32(dataReader["Mac"]) == 1;
    //            g.Linux = Convert.ToInt32(dataReader["Linux"]) == 1;
    //            g.ScoreRank = Convert.ToInt32(dataReader["Score_rank"]);
    //            g.Recommendations = dataReader["Recommendations"].ToString();
    //            g.Publisher = dataReader["Developers"].ToString();
    //            g.NumberOfPurchases = Convert.ToInt32(dataReader["numberOfPurchases"]);
    //            games.Add(g);
    //        }
    //        return games;
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }
    //    finally
    //    {
    //        if (con != null)
    //        {
    //            // close the db connection
    //            con.Close();
    //        }
    //    }


    //}

    ////---------------------------------------------------------------------------------
    //// This method get the games by user ID  
    ////---------------------------------------------------------------------------------
    //public List<Game> ReadGamesByUserID(int id)
    //{

    //    SqlConnection con;
    //    SqlCommand cmd;

    //    try
    //    {
    //        con = connect("myProjDB"); // create the connection
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }

    //    List<Game> games = new List<Game>();
    //    Dictionary<string, object> paramDic = new Dictionary<string, object>();
    //    paramDic.Add("@userID", id);

    //    cmd = CreateCommandWithStoredProcedureGeneral("SP_GetGamesByUserId", con, paramDic);

    //    try
    //    {

    //        SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

    //        while (dataReader.Read())
    //        {
    //            Game g = new Game();
    //            g.AppID = Convert.ToInt32(dataReader["AppID"]);
    //            g.Name = dataReader["Name"].ToString();
    //            g.ReleaseDate = Convert.ToDateTime(dataReader["Release_date"]);
    //            g.Price = Convert.ToDouble(dataReader["Price"]);
    //            g.Description = dataReader["Description"].ToString();
    //            g.HeaderImage = dataReader["Header_image"].ToString();
    //            g.Website = dataReader["Website"].ToString();
    //            g.Windows = Convert.ToInt32(dataReader["Windows"]) == 1;
    //            g.Mac = Convert.ToInt32(dataReader["Mac"]) == 1;
    //            g.Linux = Convert.ToInt32(dataReader["Linux"]) == 1;
    //            g.ScoreRank = Convert.ToInt32(dataReader["Score_rank"]);
    //            g.Recommendations = dataReader["Recommendations"].ToString();
    //            g.Publisher = dataReader["Developers"].ToString();
    //            g.NumberOfPurchases = Convert.ToInt32(dataReader["numberOfPurchases"]);
    //            games.Add(g);
    //        }
    //        return games;
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }
    //    finally
    //    {
    //        if (con != null)
    //        {
    //            // close the db connection
    //            con.Close();
    //        }
    //    }


    //}

    ////---------------------------------------------------------------------------------
    //// This method get the games by min price  
    ////---------------------------------------------------------------------------------
    //public List<Game> ReadGameByMinPrice(int id, double price)
    //{

    //    SqlConnection con;
    //    SqlCommand cmd;

    //    try
    //    {
    //        con = connect("myProjDB"); // create the connection
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }

    //    List<Game> games = new List<Game>();
    //    Dictionary<string, object> paramDic = new Dictionary<string, object>();
    //    paramDic.Add("@UserID", id);
    //    paramDic.Add("@Price", price);

    //    cmd = CreateCommandWithStoredProcedureGeneral("SP_GetGamesByMinPrice", con, paramDic);

    //    try
    //    {

    //        SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

    //        while (dataReader.Read())
    //        {
    //            Game g = new Game();
    //            g.AppID = Convert.ToInt32(dataReader["AppID"]);
    //            g.Name = dataReader["Name"].ToString();
    //            g.ReleaseDate = Convert.ToDateTime(dataReader["Release_date"]);
    //            g.Price = Convert.ToDouble(dataReader["Price"]);
    //            g.Description = dataReader["Description"].ToString();
    //            g.HeaderImage = dataReader["Header_image"].ToString();
    //            g.Website = dataReader["Website"].ToString();
    //            g.Windows = Convert.ToInt32(dataReader["Windows"]) == 1;
    //            g.Mac = Convert.ToInt32(dataReader["Mac"]) == 1;
    //            g.Linux = Convert.ToInt32(dataReader["Linux"]) == 1;
    //            g.ScoreRank = Convert.ToInt32(dataReader["Score_rank"]);
    //            g.Recommendations = dataReader["Recommendations"].ToString();
    //            g.Publisher = dataReader["Developers"].ToString();
    //            g.NumberOfPurchases = Convert.ToInt32(dataReader["numberOfPurchases"]);
    //            games.Add(g);
    //        }
    //        return games;
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }
    //    finally
    //    {
    //        if (con != null)
    //        {
    //            // close the db connection
    //            con.Close();
    //        }
    //    }


    //}

    ////---------------------------------------------------------------------------------
    //// This method get the games by min rank score  
    ////---------------------------------------------------------------------------------
    //public List<Game> ReadGameByMinRank(int id, int rank)
    //{

    //    SqlConnection con;
    //    SqlCommand cmd;

    //    try
    //    {
    //        con = connect("myProjDB"); // create the connection
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }

    //    List<Game> games = new List<Game>();
    //    Dictionary<string, object> paramDic = new Dictionary<string, object>();
    //    paramDic.Add("@UserID", id);
    //    paramDic.Add("@RankScore", rank);

    //    cmd = CreateCommandWithStoredProcedureGeneral("SP_GetGamesByMinRank", con, paramDic);

    //    try
    //    {

    //        SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

    //        while (dataReader.Read())
    //        {
    //            Game g = new Game();
    //            g.AppID = Convert.ToInt32(dataReader["AppID"]);
    //            g.Name = dataReader["Name"].ToString();
    //            g.ReleaseDate = Convert.ToDateTime(dataReader["Release_date"]);
    //            g.Price = Convert.ToDouble(dataReader["Price"]);
    //            g.Description = dataReader["Description"].ToString();
    //            g.HeaderImage = dataReader["Header_image"].ToString();
    //            g.Website = dataReader["Website"].ToString();
    //            g.Windows = Convert.ToInt32(dataReader["Windows"]) == 1;
    //            g.Mac = Convert.ToInt32(dataReader["Mac"]) == 1;
    //            g.Linux = Convert.ToInt32(dataReader["Linux"]) == 1;
    //            g.ScoreRank = Convert.ToInt32(dataReader["Score_rank"]);
    //            g.Recommendations = dataReader["Recommendations"].ToString();
    //            g.Publisher = dataReader["Developers"].ToString();
    //            g.NumberOfPurchases = Convert.ToInt32(dataReader["numberOfPurchases"]);
    //            games.Add(g);
    //        }
    //        return games;
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }
    //    finally
    //    {
    //        if (con != null)
    //        {
    //            // close the db connection
    //            con.Close();
    //        }
    //    }


    //}

    ////---------------------------------------------------------------------------------
    //// This method get the games statictics
    ////---------------------------------------------------------------------------------
    //public List<Dictionary<string, object>> GetGamesWithStats()
    //{
    //    SqlConnection con;
    //    SqlCommand cmd;

    //    try
    //    {
    //        con = connect("myProjDB"); // יצירת חיבור
    //    }
    //    catch (Exception ex)
    //    {
    //        // רשום שגיאה אם יש
    //        throw (ex);
    //    }

    //    List<Dictionary<string, object>> gameStatsList = new List<Dictionary<string, object>>();

    //    cmd = CreateCommandWithStoredProcedureGeneral("GetGamesWithStats", con, null);

    //    try
    //    {
    //        SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

    //        while (dataReader.Read())
    //        {
    //            // יצירת אובייקט דינמי (Ad-Hoc Object) לכל שורה ב-DataReader
    //            var gameStats = new Dictionary<string, object>();
    //            gameStats.Add("AppID", Convert.ToInt32(dataReader["GameID"]));
    //            gameStats.Add("Name", dataReader["Title"].ToString());
    //            gameStats.Add("NumberOfDownloads", Convert.ToInt32(dataReader["NumberOfDownloads"]));
    //            gameStats.Add("TotalRevenue", Convert.ToDouble(dataReader["TotalAmountPaid"]));

    //            gameStatsList.Add(gameStats);
    //        }

    //        return gameStatsList;
    //    }
    //    catch (Exception ex)
    //    {
    //        // רשום שגיאה אם יש
    //        throw (ex);
    //    }
    //    finally
    //    {
    //        if (con != null)
    //        {
    //            // סגור את החיבור
    //            con.Close();
    //        }
    //    }
    //}

    ////**** USER GAME CONNECTION TABLE ****

    ////--------------------------------------------------------------------------------------------------
    //// This method inserts a new user-game connection to the users-games table 
    ////--------------------------------------------------------------------------------------------------
    //public int Insert(int id, int appID)
    //{

    //    SqlConnection con;
    //    SqlCommand cmd;

    //    try
    //    {
    //        con = connect("myProjDB"); // create the connection
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }

    //    Dictionary<string, object> paramDic = new Dictionary<string, object>();
    //    paramDic.Add("@userID", id);
    //    paramDic.Add("@gameID", appID);


    //    cmd = CreateCommandWithStoredProcedureGeneral("SP_addGameToMyGames", con, paramDic);          // create the command

    //    try
    //    {
    //        int numEffected = cmd.ExecuteNonQuery(); // execute the command
    //        return numEffected;
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }

    //    finally
    //    {
    //        if (con != null)
    //        {
    //            // close the db connection
    //            con.Close();
    //        }
    //    }

    //}

    ////--------------------------------------------------------------------------------------------------
    //// This method removes a new user-game connection from the users-games table 
    ////--------------------------------------------------------------------------------------------------
    //public int Remove(int id, int appID)
    //{

    //    SqlConnection con;
    //    SqlCommand cmd;

    //    try
    //    {
    //        con = connect("myProjDB"); // create the connection
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }

    //    Dictionary<string, object> paramDic = new Dictionary<string, object>();
    //    paramDic.Add("@userID", id);
    //    paramDic.Add("@gameID", appID);


    //    cmd = CreateCommandWithStoredProcedureGeneral("SP_RemoveGameFromMyGames", con, paramDic);          // create the command

    //    try
    //    {
    //        int numEffected = cmd.ExecuteNonQuery(); // execute the command
    //        return numEffected;
    //    }
    //    catch (Exception ex)
    //    {
    //        // write to log
    //        throw (ex);
    //    }

    //    finally
    //    {
    //        if (con != null)
    //        {
    //            // close the db connection
    //            con.Close();
    //        }
    //    }

    //}


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

