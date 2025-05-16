using SteamApp.BL;

namespace EasyTracker.BL
{
    public class Client
    {
        private int clientID;
        private string companyName;
        private string? contactPerson;
        private string? email;
        private string? contactPersonPhone;
        private string? officePhone;
        private int userID;
        private bool isArchived;
        private string? image;

        public Client() { }

        public Client(int clientID, string companyName, string? contactPerson, string? email, string? contactPersonPhone, string? officePhone, int userID, bool isArchived, string? image)
        {
            ClientID = clientID;
            CompanyName = companyName;
            ContactPerson = contactPerson;
            Email = email;
            ContactPersonPhone = contactPersonPhone;
            OfficePhone = officePhone;
            UserID = userID;
            IsArchived = isArchived;
            Image = image;
        }

        public int ClientID { get => clientID; set => clientID = value; }
        public string CompanyName { get => companyName; set => companyName = value; }
        public string? ContactPerson { get => contactPerson; set => contactPerson = value; }
        public string? Email { get => email; set => email = value; }
        public string? ContactPersonPhone { get => contactPersonPhone; set => contactPersonPhone = value; }
        public string? OfficePhone { get => officePhone; set => officePhone = value; }
        public int UserID { get => userID; set => userID = value; }
        public bool IsArchived { get => isArchived; set => isArchived = value; }
        public string? Image { get => image; set => image = value; }


        public List<Client> GetAllClientsByUserID(int userID)
        {
            DBservices dbs = new DBservices();
            return dbs.GetAllClientsByUserID(userID);
        }

        public int AddClient(Client client)
        {
            DBservices dbs = new DBservices();
            return dbs.InsertNewClient(client);
        }

        public int UpdateClient(Client client)
        {
            DBservices dbs = new DBservices();
            return dbs.UpdateClient(client);
        }

        public int ArchiveClient(int clientID)
        {
            DBservices dbs = new DBservices();
            return dbs.ArchiveClient(clientID);
        }








    }
}
