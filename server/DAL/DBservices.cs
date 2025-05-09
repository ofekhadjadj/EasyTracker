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

    public (List<ClientSummary>, List<ProjectIncomeSummary>) GetClientsAndProjectsSummaryByUserID(int userID)
    {
        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw ex;
        }

        List<ClientSummary> clients = new List<ClientSummary>();
        List<ProjectIncomeSummary> projects = new List<ProjectIncomeSummary>();

        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@UserID", userID);

        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_GetClientsAndProjectsSummaryByUserID", con, paramDic);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader();

            // קריאה לטבלת הלקוחות
            while (dataReader.Read())
            {
                ClientSummary c = new ClientSummary
                {
                    ClientID = Convert.ToInt32(dataReader["ClientID"]),
                    CompanyName = dataReader["CompanyName"].ToString(),
                    ProjectCount = Convert.ToInt32(dataReader["ProjectCount"]),
                    TotalClientIncome = Convert.ToDouble(dataReader["TotalClientIncome"])
                };
                clients.Add(c);
            }

            // מעבר לטבלה השנייה
            if (dataReader.NextResult())
            {
                while (dataReader.Read())
                {
                    ProjectIncomeSummary p = new ProjectIncomeSummary
                    {
                        ProjectID = Convert.ToInt32(dataReader["ProjectID"]),
                        ClientID = Convert.ToInt32(dataReader["ClientID"]),
                        ProjectName = dataReader["ProjectName"].ToString(),
                        ProjectIncome = Convert.ToDouble(dataReader["ProjectIncome"])
                    };
                    projects.Add(p);
                }
            }

            return (clients, projects);
        }
        catch (Exception ex)
        {
            throw ex;
        }
        finally
        {
            if (con != null) con.Close();
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
                item["ProjectID"] = dataReader["ProjectID"] == DBNull.Value ? 0 : Convert.ToInt32(dataReader["ProjectID"]);
                item["ProjectName"] = dataReader["ProjectName"] == DBNull.Value ? null : dataReader["ProjectName"].ToString();
                item["Description"] = dataReader["Description"] == DBNull.Value ? null : dataReader["Description"].ToString();
                item["HourlyRate"] = dataReader["HourlyRate"] == DBNull.Value ? 0f : Convert.ToSingle(dataReader["HourlyRate"]);
                item["Image"] = dataReader["Image"] == DBNull.Value ? null : dataReader["Image"].ToString();
                item["ClientID"] = dataReader["ClientID"] == DBNull.Value ? 0 : Convert.ToInt32(dataReader["ClientID"]);
                item["isArchived"] = dataReader["isArchived"] == DBNull.Value ? false : Convert.ToBoolean(dataReader["isArchived"]);
                item["CreatedByUserID"] = dataReader["CreatedByUserID"] == DBNull.Value ? 0 : Convert.ToInt32(dataReader["CreatedByUserID"]);
                item["isDone"] = dataReader["isDone"] == DBNull.Value ? false : Convert.ToBoolean(dataReader["isDone"]);
                item["CompanyName"] = dataReader["CompanyName"] == DBNull.Value ? null : dataReader["CompanyName"].ToString();
                item["DurationGoal"] = dataReader["DurationGoal"] == DBNull.Value ? 0m : Convert.ToDecimal(dataReader["DurationGoal"]);
                item["Role"] = dataReader["Role"] == DBNull.Value ? null : dataReader["Role"].ToString();
                item["isDisable"] = dataReader["isDisable"] == DBNull.Value ? null : dataReader["isDisable"].ToString();



                result.Add(item);
            }

            if (dataReader.NextResult() && dataReader.Read())
            {
                var stats = new Dictionary<string, object>();
                stats["NotDoneCount"] = dataReader["NotDoneCount"] == DBNull.Value ? 0 : Convert.ToInt32(dataReader["NotDoneCount"]);
                stats["DoneCount"] = dataReader["DoneCount"] == DBNull.Value ? 0 : Convert.ToInt32(dataReader["DoneCount"]);


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
                item["CompanyName"] = dataReader["CompanyName"].ToString();
                item["DurationGoal"] = Convert.ToDecimal(dataReader["DurationGoal"]);
              


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
                item["FullName"] = dataReader["Full name"].ToString();
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
   /*
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
   */

    public Dictionary<string, object> GetThisProject(int ProjectID, int UserID)
    {
        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            throw ex;
        }

        Dictionary<string, object> item = null;
        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@ProjectID", ProjectID);
        paramDic.Add("@UserID", UserID);

        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_GetThisProject", con, paramDic);

        try
        {
            SqlDataReader dataReader = cmd.ExecuteReader(CommandBehavior.CloseConnection);

            if (dataReader.Read())
            {
                item = new Dictionary<string, object>();
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
            }

            return item;
        }
        catch (Exception ex)
        {
            throw ex;
        }
        finally
        {
            if (con != null)
            {
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
        paramDic.Add("@StartDate", Session.StartDate); 
        paramDic.Add("@EndDate", Session.EndDate);
        paramDic.Add("@DurationSeconds", Session.DurationSeconds);
        paramDic.Add("@HourlyRate", Session.HourlyRate);
        paramDic.Add("@Description", Session.Description);
        paramDic.Add("@LabelID", Session.LabelID);
        paramDic.Add("@Status", Session.Status);
       
        

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
    // This method update Client
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

    //--------------------------------------------------------------------------------------------------
    // This method update client IsArchived in clients table 
    //--------------------------------------------------------------------------------------------------
    public int ArchiveClient(int ClientID)
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
        paramDic.Add("@ClientID", ClientID);

        cmd = CreateCommandWithStoredProcedureGeneral("sp_ET_ArchiveClient", con, paramDic);          // create the command

        try
        {
            object result = cmd.ExecuteScalar();  // מחזיר את SELECT מהפרוצדורה
            int rowsAffected = Convert.ToInt32(result);
            return rowsAffected;
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

    //**** TASK TABLE ******** TASK TABLE ******** TASK TABLE ******** TASK TABLE ******** TASK TABLE ******** TASK TABLE ******** TASK TABLE ****

    //--------------------------------------------------------------------------------------------------
    // This method insert new tasks to tasks table 
    //--------------------------------------------------------------------------------------------------
    public List<int> AddMultipleTasksByEmail(string email, int projectID, List<ET_Task> tasks)
    {
        SqlConnection con;
        SqlCommand cmd;
        List<int> insertedTaskIds = new List<int>();

        try
        {
            con = connect("myProjDB"); // create the connection
        }
        catch (Exception ex)
        {
            // write to log
            throw (ex);
        }

        DataTable taskTable = new DataTable();
        taskTable.Columns.Add("Description", typeof(string));
        taskTable.Columns.Add("DueDate", typeof(DateTime));

        foreach (var task in tasks)
        {
            taskTable.Rows.Add(task.Description, task.DueDate);
        }

        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@Email", email);
        paramDic.Add("@ProjectID", projectID);
        paramDic.Add("@Tasks", taskTable);

        cmd = CreateCommandWithStoredProcedureGeneral("ET_AddMultipleTasksByEmail", con, paramDic);
        cmd.Parameters["@Tasks"].SqlDbType = SqlDbType.Structured;
        cmd.Parameters["@Tasks"].TypeName = "ET_TaskTableType";

        try
        {
            using (SqlDataReader reader = cmd.ExecuteReader())
            {
                while (reader.Read())
                {
                    insertedTaskIds.Add(reader.GetInt32(0)); // מוסיף את TaskID לרשימה
                }
            }

            return insertedTaskIds;
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
                con.Close();
            }
        }
    }

    //--------------------------------------------------------------------------------------------------
    // This method get tasks by userID and projectID 
    //--------------------------------------------------------------------------------------------------
    public List<ET_Task> GetTasksByUserAndProject(int userID, int projectID)
    {
        SqlConnection con;
        SqlCommand cmd;
        SqlDataReader reader;

        List<ET_Task> taskList = new List<ET_Task>();

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw ex;
        }

        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@UserID", userID);
        paramDic.Add("@ProjectID", projectID);

        cmd = CreateCommandWithStoredProcedureGeneral("ET_GetTasksByUserAndProject", con, paramDic);

        try
        {
            reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                ET_Task task = new ET_Task();
                task.TaskID = Convert.ToInt32(reader["TaskID"]);
                task.ProjectID = Convert.ToInt32(reader["ProjectID"]);
                task.UserID = Convert.ToInt32(reader["UserID"]);
                task.Description = reader["Description"].ToString();
                task.DueDate = Convert.ToDateTime(reader["DueDate"]);
                task.IsDone = Convert.ToBoolean(reader["IsDone"]);
                task.CompletedAt = reader["CompletedAt"] == DBNull.Value ? null : Convert.ToDateTime(reader["CompletedAt"]);
                task.CreatedAt = Convert.ToDateTime(reader["CreatedAt"]);
                task.IsArchived = Convert.ToBoolean(reader["IsArchived"]);

                taskList.Add(task);
            }

            reader.Close();
            return taskList;
        }
        catch (Exception ex)
        {
            throw ex;
        }
        finally
        {
            if (con != null)
            {
                con.Close();
            }
        }
    }

    //--------------------------------------------------------------------------------------------------
    // This method update tasks in tasks table 
    //--------------------------------------------------------------------------------------------------
    public int UpdateTask(ET_Task task)
    {
        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // יצירת חיבור
        }
        catch (Exception ex)
        {
            throw ex;
        }

        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@TaskID", task.TaskID);
        paramDic.Add("@Description", task.Description);
        paramDic.Add("@DueDate", task.DueDate);
        //paramDic.Add("@IsDone", task.IsDone);

        cmd = CreateCommandWithStoredProcedureGeneral("ET_UpdateTask", con, paramDic);

        try
        {
            int numEffected = cmd.ExecuteNonQuery(); // ביצוע עדכון
            return numEffected;
        }
        catch (Exception ex)
        {
            throw ex;
        }
        finally
        {
            if (con != null)
            {
                con.Close();
            }
        }
    }

    //--------------------------------------------------------------------------------------------------
    // This method update task status in tasks table 
    //--------------------------------------------------------------------------------------------------
    public int UpdateTaskStatus(int taskID, bool isDone)
    {
        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB");
        }
        catch (Exception ex)
        {
            throw ex;
        }

        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@TaskID", taskID);
        paramDic.Add("@IsDone", isDone);

        cmd = CreateCommandWithStoredProcedureGeneral("ET_UpdateTaskStatus", con, paramDic);

        try
        {
            int numEffected = cmd.ExecuteNonQuery();
            return numEffected;
        }
        catch (Exception ex)
        {
            throw ex;
        }
        finally
        {
            if (con != null)
            {
                con.Close();
            }
        }
    }

    //--------------------------------------------------------------------------------------------------
    // This method update task Archive in tasks table 
    //--------------------------------------------------------------------------------------------------
    public int ArchiveTask(int taskID)
    {
        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // יצירת החיבור למסד הנתונים
        }
        catch (Exception ex)
        {
            throw ex;
        }

        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@TaskID", taskID);

        cmd = CreateCommandWithStoredProcedureGeneral("ET_ArchiveTask", con, paramDic); // יצירת הפקודה

        try
        {
            int numEffected = cmd.ExecuteNonQuery(); // ביצוע הפקודה
            return numEffected;
        }
        catch (Exception ex)
        {
            throw ex;
        }
        finally
        {
            if (con != null)
            {
                con.Close();
            }
        }
    }

    //--------------------------------------------------------------------------------------------------
    // This method insert 1 task to tasks table 
    //--------------------------------------------------------------------------------------------------
    public int AddTask(ET_Task task)
    {
        SqlConnection con;
        SqlCommand cmd;

        try
        {
            con = connect("myProjDB"); // יצירת חיבור למסד
        }
        catch (Exception ex)
        {
            throw ex;
        }

        Dictionary<string, object> paramDic = new Dictionary<string, object>();
        paramDic.Add("@UserID", task.UserID);
        paramDic.Add("@ProjectID", task.ProjectID);
        paramDic.Add("@Description", task.Description);
        paramDic.Add("@DueDate", task.DueDate);

        cmd = CreateCommandWithStoredProcedureGeneral("ET_AddTask", con, paramDic);

        try
        {
            object result = cmd.ExecuteScalar(); // החזרת TaskID החדש
            return Convert.ToInt32(result);
        }
        catch (Exception ex)
        {
            throw ex;
        }
        finally
        {
            if (con != null)
            {
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

