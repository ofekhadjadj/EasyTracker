# Firebase Chat Setup Instructions

## 🔧 שלבי ההתקנה

### 1. יצירת פרויקט Firebase

1. היכנס ל-[Firebase Console](https://console.firebase.google.com/)
2. לחץ "Create a project" או "Add project"
3. הזן שם לפרויקט (למשל: easy-tracker-chat)
4. השאר את Google Analytics מופעל (אופציונלי)
5. לחץ "Create project"

### 2. הוספת Web App

1. בדף הבית של הפרויקט, לחץ על האיקון `</>`
2. הזן שם לאפליקציה (למשל: easy-tracker-web)
3. **אל תסמן** "Set up Firebase Hosting"
4. לחץ "Register app"
5. העתק את קוד ה-`firebaseConfig`
6. הכנס את הקוד ל-`js/firebase-config.js`

### 3. הגדרת Firestore Database

1. במנו הצד, לחץ "Firestore Database"
2. לחץ "Create database"
3. בחר **"Start in test mode"** (נשנה מאוחר יותר)
4. בחר מיקום גיאוגרפי (עדיף Europe או US)
5. לחץ "Done"

### 4. הגדרת חוקי האבטחה

העתק את החוקים הבאים ל-Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to messages collection
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }

    // You can add more specific rules based on your needs:
    // match /messages/{messageId} {
    //   allow read, write: if request.auth != null &&
    //     (resource.data.senderUserID == request.auth.uid ||
    //      resource.data.receiverUserID == request.auth.uid ||
    //      resource.data.receiverUserID == null); // Group messages
    // }
  }
}
```

### 5. עדכון הקוד

1. פתח את הקובץ `js/firebase-config.js`
2. החלף את הערכים עם הקוד שהעתקת מ-Firebase Console:

```javascript
export const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789",
};
```

## 📊 מבנה הנתונים ב-Firestore

### קולקציה: `messages`

כל מסמך מכיל את השדות הבאים:

```javascript
{
  senderUserID: 123,           // מספר ID של השולח
  receiverUserID: 456,         // מספר ID של הנמען (null לצ'אט קבוצתי)
  projectID: 789,              // מספר ID של הפרויקט
  senderName: "יוסי כהן",      // שם השולח
  messageText: "שלום עולם!",   // תוכן ההודעה
  sentAt: timestamp            // זמן שליחה (Firestore timestamp)
}
```

## 🚀 איך זה עובד?

### שליחת הודעות

- המשתמש מקליד הודעה ולוחץ "שלח"
- הנתונים נשלחים ל-Firestore באמצעות `addDoc()`
- שדה `sentAt` מקבל `serverTimestamp()` לעקביות

### קבלת הודעות בזמן אמת

- כל צ'אט מקבל מאזין `onSnapshot()`
- כשנוספת הודעה חדשה, המאזין מתעדכן אוטומטית
- ההודעות מוצגות מיד בממשק המשתמש

### סינון הודעות

- **צ'אט קבוצתי**: `receiverUserID == null` + `projectID`
- **צ'אט פרטי**: כל הודעה שנשלחה בין שני המשתמשים

## ⚡ שיפורים נוספים (אופציונלי)

### 1. אימות משתמשים

אם תרצה לוסיף אימות Firebase:

```javascript
import { getAuth, signInAnonymously } from "firebase/auth";
```

### 2. הודעות לא נקראות

הוסף שדה `read: false` לכל הודעה ועדכן אותו כשהמשתמש קורא.

### 3. עלות נמוכה

- הגבל את מספר ההודעות בשאילתה: `.limit(50)`
- השתמש ב-pagination למידע ישן

## 🔒 אבטחה

### הגדרות בטיחות חשובות:

1. **אל תשתמש ב-Test Mode בייצור!**
2. הגדר חוקי אבטחה מתקדמים
3. הגבל גישה לפי משתמש ופרויקט
4. עקב אחר השימוש במסד הנתונים

### דוגמה לחוקי אבטחה מתקדמים:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{messageId} {
      allow read: if request.auth != null &&
        (resource.data.senderUserID == request.auth.uid ||
         resource.data.receiverUserID == request.auth.uid ||
         resource.data.receiverUserID == null);

      allow create: if request.auth != null &&
        request.auth.uid == resource.data.senderUserID;

      allow update, delete: if false; // לא לאפשר עריכה או מחיקה
    }
  }
}
```

## 🧪 בדיקת הפעילות

1. פתח את `chat.html` בדפדפן
2. פתח את Developer Tools (F12)
3. בחר צ'אט קבוצתי או פרטי
4. שלח הודעה
5. בדוק שההודעה מופיעה מיד
6. פתח טאב נוסף - האם ההודעה מופיעה גם שם?

## 🐛 פתרון בעיות

### שגיאות נפוצות:

1. **CORS Error**: ודא שהאתר רץ על שרת HTTP (לא file://)
2. **Permission Denied**: בדוק את חוקי האבטחה ב-Firestore
3. **Missing Configuration**: ודא שמילאת את כל השדות ב-`firebase-config.js`
4. **Import Error**: ודא שאתה משתמש ב-`type="module"` בקובץ HTML

### לוגים מועילים:

פתח את הקונסול ובדוק הודעות מהמערכת:

- "Message sent successfully" = הודעה נשלחה
- "Error sending message" = שגיאה בשליחה
- "Error listening to messages" = שגיאה בקבלת הודעות

---

**הצלחה! 🎉 עכשיו יש לך צ'אט בזמן אמת עם Firebase!**
