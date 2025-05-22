using System;
using System.Collections.Generic;
namespace EasyTracker.BL
{
    public class ChatMessage
    {
        int messageID;
        int senderUserID;
        int? receiverUserID;
        int projectID;
        string messageText;
        DateTime sentAt;
        string? senderName;

        public ChatMessage() { }

        public ChatMessage(int messageID, int senderUserID, int? receiverUserID, int projectID, string messageText, DateTime sentAt, string? senderName)
        {
            MessageID = messageID;
            SenderUserID = senderUserID;
            ReceiverUserID = receiverUserID;
            ProjectID = projectID;
            MessageText = messageText;
            SentAt = sentAt;
            SenderName = senderName;
        }

        public int MessageID { get => messageID; set => messageID = value; }
        public int SenderUserID { get => senderUserID; set => senderUserID = value; }
        public int? ReceiverUserID { get => receiverUserID; set => receiverUserID = value; }
        public int ProjectID { get => projectID; set => projectID = value; }
        public string MessageText { get => messageText; set => messageText = value; }
        public DateTime SentAt { get => sentAt; set => sentAt = value; }
        public string? SenderName { get => senderName; set => senderName = value; }

        public int InsertChatMessage(ChatMessage message)
        {
            DBservices dbs = new DBservices();
            return dbs.InsertChatMessage(message);

        }

        public List<ChatMessage> GetPrivateChat(int userID1, int userID2, int projectID)
        {
            DBservices dbs = new DBservices();
            return dbs.GetPrivateChat(userID1, userID2, projectID);
        }

        public List<ChatMessage> GetGroupChat(int projectID)
        {
            DBservices dbs = new DBservices();
            return dbs.GetGroupChat(projectID);
        }





    }

    // DTOs
    public class UnreadPrivate
    {
        public int OtherUserID { get; set; }
        public int UnreadCount { get; set; }
    }

    public class UnreadStatus
    {
        public int GroupUnreadCount { get; set; }
        public List<UnreadPrivate> Private { get; set; }
    }

}
