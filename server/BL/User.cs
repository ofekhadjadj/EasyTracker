namespace SteamApp.BL
{
    public class User
    {
        int id;
        string firstName;
        string lastName;
        string email;
        string password;
        string role;
        bool isActive;
        DateTime createdAt;



        static List<User> usersList = new List<User>();

        
        public User(){}

        public User(int id, string firstName, string lastName, string email, string password, string role, bool isActive, DateTime createdAt)
        {
            this.id = id;
            this.firstName = firstName;
            this.lastName = lastName;
            this.email = email;
            this.password = password;
            this.role = role;
            this.isActive = isActive;
            this.createdAt = createdAt;
        }

        public int Id { get => id; set => id = value; }
        public string FirstName { get => firstName; set => firstName = value; }
        public string LastName { get => lastName; set => lastName = value; }
        public string Email { get => email; set => email = value; }
        public string Password { get => password; set => password = value; }
        public string Role { get => role; set => role = value; }
        public bool IsActive { get => isActive; set => isActive = value; }
        public DateTime CreatedAt { get => createdAt; set => createdAt = value; }

       
         public int InsertNewUser()
         {
            DBservices dbs = new DBservices();
            return dbs.InsertNewUser(this);
         }


        public User ReadUserDetails(string Email, string Password)
        {
            DBservices dbs = new DBservices();
            return dbs.ReadUserDetails(Email, Password);
        }




        public int UpdateUserDetails()
        {
            DBservices dbs = new DBservices();
            return dbs.UpdateUserDetails(this);
        }


        public int UpdateUserPassword(int Id, string OldPassword, string NewPassword)
        {
            DBservices dbs = new DBservices();
            return dbs.UpdateUserPassword(Id, OldPassword,NewPassword);
        }



















        //public int UpdateUserIsActive(int id, bool isActive)
        //{
        //    DBservices dbs = new DBservices();
        //    return dbs.UpdateUserIsActive(id, isActive);
        //}

        //public List<Dictionary<string, object>> GetUsersWithGameStats()
        //{
        //    DBservices dbs = new DBservices();
        //    return dbs.GetUsersWithGameStats();
        //}



    }
}
