using SteamApp.BL;

namespace EasyTracker.BL
{
    public class Label
    {
        int labelID;
        string? labelName;
        string? labelColor;
        int? userID;
        bool? isArchived;

        public Label() { }

        public Label(int labelID, string labelName, string labelColor, int userID, bool isArchived)
        {
            LabelID = labelID;
            LabelName = labelName;
            LabelColor = labelColor;
            UserID = userID;
            IsArchived = isArchived;
        }

        public int LabelID { get => labelID; set => labelID = value; }
        public string? LabelName { get => labelName; set => labelName = value; }
        public string? LabelColor { get => labelColor; set => labelColor = value; }
        public int? UserID { get => userID; set => userID = value; }
        public bool? IsArchived { get => isArchived; set => isArchived = value; }


        public int InsertNewLabel()
        {
            DBservices dbs = new DBservices();
            return dbs.InsertNewLabel(this);
        }

        public int DeleteLabel(int LabelID)
        {
            DBservices dbs = new DBservices();
            return dbs.DeleteLabel(LabelID);
        }

        public List<Label> GetAllLabelsByUserID(int userID)
        {
            DBservices dbs = new DBservices();
            return dbs.GetAllLabelsByUserID(userID);
        }
        
        public List<Label> Get6ToplLabelsByUserID(int userID)
        {
            DBservices dbs = new DBservices();
            return dbs.Get6ToplLabelsByUserID(userID);
        }

        public int UpdateLabel(Label label)
        {
            DBservices dbs = new DBservices();
            return dbs.UpdateLabel(label);
        }
    }

}
