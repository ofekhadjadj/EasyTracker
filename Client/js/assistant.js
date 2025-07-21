let assistantData = null;
let teamMonitoringData = null;
let isLoading = false;
let justOpenedMenu = false;

// קבועים עבור שימור שיחה
const CHAT_HISTORY_KEY = "assistant_chat_history";
const MAX_CHAT_HISTORY = 10;

// פונקציות עזר לעיבוד נתונים מדויק
function calculateProjectSummaries(data) {
  if (!data || !data.Sessions) return {};

  const summaries = {};

  data.Sessions.forEach((session) => {
    const projectId = session.ProjectID;
    const projectName = session.ProjectName;

    if (!summaries[projectId]) {
      summaries[projectId] = {
        projectName: projectName,
        totalHours: 0,
        totalMinutes: 0,
        totalRevenue: 0,
        sessionCount: 0,
        clientName: session.ClientCompanyName,
        hourlyRate: session.SessionHourlyRate || session.ProjectHourlyRate || 0,
      };
    }

    // חישוב שעות מדויק
    const hours = session.SessionDurationHours || 0;
    summaries[projectId].totalHours += hours;
    summaries[projectId].totalRevenue += hours * session.SessionHourlyRate;
    summaries[projectId].sessionCount++;
  });

  // המרה לפורמט שעות:דקות
  Object.keys(summaries).forEach((projectId) => {
    const totalHoursDecimal = summaries[projectId].totalHours;
    const hours = Math.floor(totalHoursDecimal);
    const minutes = Math.round((totalHoursDecimal - hours) * 60);

    summaries[projectId].formattedTime = `${hours}:${minutes
      .toString()
      .padStart(2, "0")}`;
    summaries[projectId].totalHours = hours;
    summaries[projectId].totalMinutes = minutes;
  });

  return summaries;
}

function calculateClientSummaries(data) {
  if (!data || !data.Sessions) return {};

  const summaries = {};

  data.Sessions.forEach((session) => {
    const clientId = session.ClientID;
    const clientName = session.ClientCompanyName;

    if (!summaries[clientId]) {
      summaries[clientId] = {
        clientName: clientName,
        totalHours: 0,
        totalRevenue: 0,
        projectCount: new Set(),
        sessionCount: 0,
      };
    }

    const hours = session.SessionDurationHours || 0;
    summaries[clientId].totalHours += hours;
    summaries[clientId].totalRevenue += hours * session.SessionHourlyRate;
    summaries[clientId].projectCount.add(session.ProjectID);
    summaries[clientId].sessionCount++;
  });

  // המרה לפורמט שעות:דקות ומספר פרויקטים
  Object.keys(summaries).forEach((clientId) => {
    const totalHoursDecimal = summaries[clientId].totalHours;
    const hours = Math.floor(totalHoursDecimal);
    const minutes = Math.round((totalHoursDecimal - hours) * 60);

    summaries[clientId].formattedTime = `${hours}:${minutes
      .toString()
      .padStart(2, "0")}`;
    summaries[clientId].projectCount = summaries[clientId].projectCount.size;
  });

  return summaries;
}

function calculateTeamSummaries(data) {
  if (!data || !data.Sessions) return {};

  const teamStats = {};

  data.Sessions.forEach((session) => {
    const projectId = session.ProjectID;
    const teamNames = session.ProjectTeamNames || "";
    const teamCount = session.ProjectTeamCount || 0;

    if (!teamStats[projectId]) {
      teamStats[projectId] = {
        projectName: session.ProjectName,
        clientName: session.ClientCompanyName,
        teamCount: teamCount,
        teamNames: teamNames,
        totalHours: 0,
        sessionCount: 0,
      };
    }

    const hours = session.SessionDurationHours || 0;
    teamStats[projectId].totalHours += hours;
    teamStats[projectId].sessionCount++;
  });

  // המרה לפורמט שעות:דקות
  Object.keys(teamStats).forEach((projectId) => {
    const totalHoursDecimal = teamStats[projectId].totalHours;
    const hours = Math.floor(totalHoursDecimal);
    const minutes = Math.round((totalHoursDecimal - hours) * 60);

    teamStats[projectId].formattedTime = `${hours}:${minutes
      .toString()
      .padStart(2, "0")}`;
  });

  return teamStats;
}

function calculateTaskSummaries(data) {
  if (!data || !data.Sessions) return {};

  const taskStats = {};

  data.Sessions.forEach((session) => {
    const projectId = session.ProjectID;

    if (!taskStats[projectId]) {
      // ניסיון למצוא נתוני משימות בשדות שונים
      const totalTasks =
        session.TaskCount ||
        session.TotalTasks ||
        session.ProjectTaskCount ||
        0;
      const completedTasks =
        session.TaskDoneCount ||
        session.CompletedTasks ||
        session.ProjectCompletedTasks ||
        0;

      taskStats[projectId] = {
        projectName: session.ProjectName,
        clientName: session.ClientCompanyName || session.CompanyName,
        totalTasks: totalTasks,
        completedTasks: completedTasks,
        pendingTasks: totalTasks - completedTasks,
        completionRate:
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      };
    }
  });

  // אם לא מצאנו נתוני משימות ב-Sessions, ננסה למצוא במקורות אחרים
  if (
    Object.keys(taskStats).length === 0 ||
    Object.values(taskStats).every((stat) => stat.totalTasks === 0)
  ) {
    // ננסה לבנות מנתוני הפרויקטים
    if (data.Projects && Array.isArray(data.Projects)) {
      data.Projects.forEach((project) => {
        const totalTasks = project.TaskCount || project.TotalTasks || 0;
        const completedTasks =
          project.TaskDoneCount || project.CompletedTasks || 0;

        if (totalTasks > 0) {
          taskStats[project.ProjectID] = {
            projectName: project.ProjectName,
            clientName:
              project.ClientCompanyName || project.CompanyName || "לא ידוע",
            totalTasks: totalTasks,
            completedTasks: completedTasks,
            pendingTasks: totalTasks - completedTasks,
            completionRate: Math.round((completedTasks / totalTasks) * 100),
          };
        }
      });
    }
  }

  return taskStats;
}

// פונקציות חדשות לעיבוד נתוני ניטור הצוות
function calculateTeamMemberStats(teamData) {
  if (!teamData || !Array.isArray(teamData)) return {};

  const memberStats = {};

  teamData.forEach((taskItem) => {
    const memberId = taskItem.UserID;
    const memberName = taskItem.FullName;
    const memberEmail = taskItem.Email;

    if (!memberStats[memberId]) {
      memberStats[memberId] = {
        memberName: memberName,
        memberEmail: memberEmail,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        projects: new Set(),
        projectDetails: [],
        tasks: [],
      };
    }

    // הוספת המשימה
    memberStats[memberId].totalTasks += 1;
    if (taskItem.IsDone) {
      memberStats[memberId].completedTasks += 1;
    } else {
      memberStats[memberId].pendingTasks += 1;
      if (taskItem.IsOverdue) {
        memberStats[memberId].overdueTasks += 1;
      }
    }

    memberStats[memberId].projects.add(taskItem.ProjectID);

    // הוספת פרטי המשימה
    memberStats[memberId].tasks.push({
      taskId: taskItem.TaskID,
      description: taskItem.Description,
      dueDate: taskItem.DueDate,
      isDone: taskItem.IsDone,
      isOverdue: taskItem.IsOverdue,
      projectId: taskItem.ProjectID,
      projectName: taskItem.ProjectName,
    });
  });

  // חישוב נתונים נוספים לכל איש צוות
  Object.keys(memberStats).forEach((memberId) => {
    const member = memberStats[memberId];
    member.projectCount = member.projects.size;
    member.completionRate =
      member.totalTasks > 0
        ? Math.round((member.completedTasks / member.totalTasks) * 100)
        : 0;

    // חישוב פרטי פרויקטים
    const projectMap = {};
    member.tasks.forEach((task) => {
      if (!projectMap[task.projectId]) {
        projectMap[task.projectId] = {
          projectId: task.projectId,
          projectName: task.projectName,
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          overdueTasks: 0,
        };
      }
      projectMap[task.projectId].totalTasks += 1;
      if (task.isDone) {
        projectMap[task.projectId].completedTasks += 1;
      } else {
        projectMap[task.projectId].pendingTasks += 1;
        if (task.isOverdue) {
          projectMap[task.projectId].overdueTasks += 1;
        }
      }
    });

    member.projectDetails = Object.values(projectMap).map((proj) => ({
      ...proj,
      completionRate:
        proj.totalTasks > 0
          ? Math.round((proj.completedTasks / proj.totalTasks) * 100)
          : 0,
    }));
  });

  return memberStats;
}

function calculateProjectTeamStats(teamData) {
  if (!teamData || !Array.isArray(teamData)) return {};

  const projectStats = {};

  teamData.forEach((taskItem) => {
    const projectId = taskItem.ProjectID;

    if (!projectStats[projectId]) {
      projectStats[projectId] = {
        projectName: taskItem.ProjectName,
        clientName: taskItem.ClientName,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        teamMembers: new Set(),
        memberDetails: [],
        tasks: [],
      };
    }

    // הוספת המשימה
    projectStats[projectId].totalTasks += 1;
    if (taskItem.IsDone) {
      projectStats[projectId].completedTasks += 1;
    } else {
      projectStats[projectId].pendingTasks += 1;
      if (taskItem.IsOverdue) {
        projectStats[projectId].overdueTasks += 1;
      }
    }

    projectStats[projectId].teamMembers.add(taskItem.UserID);

    // הוספת פרטי המשימה
    projectStats[projectId].tasks.push({
      taskId: taskItem.TaskID,
      description: taskItem.Description,
      dueDate: taskItem.DueDate,
      isDone: taskItem.IsDone,
      isOverdue: taskItem.IsOverdue,
      userId: taskItem.UserID,
      userFullName: taskItem.FullName,
      userEmail: taskItem.Email,
    });
  });

  // חישוב נתונים נוספים לכל פרויקט
  Object.keys(projectStats).forEach((projectId) => {
    const project = projectStats[projectId];
    project.teamMemberCount = project.teamMembers.size;
    project.completionRate =
      project.totalTasks > 0
        ? Math.round((project.completedTasks / project.totalTasks) * 100)
        : 0;

    // חישוב פרטי אנשי צוות בפרויקט
    const memberMap = {};
    project.tasks.forEach((task) => {
      if (!memberMap[task.userId]) {
        memberMap[task.userId] = {
          memberId: task.userId,
          memberName: task.userFullName,
          memberEmail: task.userEmail,
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          overdueTasks: 0,
        };
      }
      memberMap[task.userId].totalTasks += 1;
      if (task.isDone) {
        memberMap[task.userId].completedTasks += 1;
      } else {
        memberMap[task.userId].pendingTasks += 1;
        if (task.isOverdue) {
          memberMap[task.userId].overdueTasks += 1;
        }
      }
    });

    project.memberDetails = Object.values(memberMap).map((member) => ({
      ...member,
      completionRate:
        member.totalTasks > 0
          ? Math.round((member.completedTasks / member.totalTasks) * 100)
          : 0,
    }));
  });

  return projectStats;
}

function calculateTeamOverallStats(teamData) {
  if (!teamData || !Array.isArray(teamData)) return {};

  let totalTasks = teamData.length;
  let totalCompletedTasks = 0;
  let totalOverdueTasks = 0;
  const uniqueMembers = new Set();
  const uniqueProjects = new Set();

  teamData.forEach((taskItem) => {
    if (taskItem.IsDone) {
      totalCompletedTasks += 1;
    }
    if (taskItem.IsOverdue) {
      totalOverdueTasks += 1;
    }
    uniqueMembers.add(taskItem.UserID);
    uniqueProjects.add(taskItem.ProjectID);
  });

  return {
    totalTasks,
    totalCompletedTasks,
    totalPendingTasks: totalTasks - totalCompletedTasks,
    totalOverdueTasks,
    overallCompletionRate:
      totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 0,
    totalTeamMembers: uniqueMembers.size,
    totalProjectsWithTeam: uniqueProjects.size,
  };
}

function calculateOverallStats(data) {
  if (!data || !data.Sessions) return {};

  let totalHours = 0;
  let totalRevenue = 0;
  let totalTasks = 0;
  let totalCompletedTasks = 0;
  const uniqueProjects = new Set();
  const allTeamMembers = new Set();
  const projectsForTasks = new Set();

  data.Sessions.forEach((session) => {
    const hours = session.SessionDurationHours || 0;
    totalHours += hours;
    totalRevenue += hours * session.SessionHourlyRate;
    uniqueProjects.add(session.ProjectID);

    // חישוב משימות (רק פעם אחת לכל פרויקט)
    if (!projectsForTasks.has(session.ProjectID)) {
      totalTasks += session.TaskCount || 0;
      totalCompletedTasks += session.TaskDoneCount || 0;
      projectsForTasks.add(session.ProjectID);
    }

    // איסוף אנשי צוות
    if (session.ProjectTeamNames) {
      const teamNames = session.ProjectTeamNames.split(", ");
      teamNames.forEach((name) => allTeamMembers.add(name.trim()));
    }
  });

  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  // חישוב מספר לקוחות נכון
  const correctClientCount = calculateCorrectClientCount(data);

  return {
    totalHours: hours,
    totalMinutes: minutes,
    formattedTime: `${hours}:${minutes.toString().padStart(2, "0")}`,
    totalRevenue: Math.round(totalRevenue),
    totalSessions: data.Sessions.length,
    uniqueProjects: uniqueProjects.size,
    uniqueClients: correctClientCount,
    totalTasks,
    totalCompletedTasks,
    totalPendingTasks: totalTasks - totalCompletedTasks,
    overallTaskCompletionRate:
      totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 0,
    totalTeamMembers: allTeamMembers.size,
    teamMembersList: Array.from(allTeamMembers).join(", "),
  };
}

function filterSessionsByDateRange(sessions, daysBack = null) {
  if (!daysBack) return sessions;

  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setDate(now.getDate() - daysBack);

  return sessions.filter((session) => {
    const sessionDate = new Date(session.SessionStartDate);
    return sessionDate >= cutoffDate;
  });
}

function formatDurationFromHours(hours) {
  if (hours < 1) {
    // אם פחות משעה, נציג דקות ושניות
    const totalSeconds = Math.round(hours * 3600);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return seconds > 0
        ? `${minutes} דקות ו-${seconds} שניות`
        : `${minutes} דקות`;
    } else {
      return `${seconds} שניות`;
    }
  } else {
    // אם שעה או יותר, נציג שעות ודקות
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours % 1) * 60);

    if (wholeHours > 0 && minutes > 0) {
      return `${wholeHours} שעות ו-${minutes} דקות`;
    } else if (wholeHours > 0) {
      return `${wholeHours} שעות`;
    } else {
      return `${minutes} דקות`;
    }
  }
}

function calculateLastSessionData(data) {
  if (!data || !data.Sessions) return {};

  const lastSessionsByProject = {};

  data.Sessions.forEach((session) => {
    const projectId = session.ProjectID;
    const sessionDate = new Date(session.SessionStartDate);

    if (
      !lastSessionsByProject[projectId] ||
      sessionDate > new Date(lastSessionsByProject[projectId].lastSessionDate)
    ) {
      lastSessionsByProject[projectId] = {
        projectName: session.ProjectName,
        clientName: session.ClientCompanyName,
        lastSessionDate: session.SessionStartDate,
        lastSessionFormatted: sessionDate.toLocaleDateString("he-IL"),
        lastSessionDuration: session.SessionDurationHours,
        lastSessionFormattedDuration: formatDurationFromHours(
          session.SessionDurationHours
        ),
        daysSinceLastSession: Math.max(
          1,
          Math.floor((new Date() - sessionDate) / (1000 * 60 * 60 * 24))
        ),
      };
    }
  });

  return lastSessionsByProject;
}

function findAbsoluteLastSession(data) {
  if (!data || !data.Sessions || data.Sessions.length === 0) return null;

  let lastSession = null;
  let lastSessionDate = null;

  console.log("מחפש סשן אחרון מתוך", data.Sessions.length, "סשנים");

  data.Sessions.forEach((session, index) => {
    const sessionDate = new Date(session.SessionStartDate);

    // Debug: הדפסת פרטי הסשן
    if (index < 5) {
      // הדפסת 5 ראשונים לדוגמה
      console.log(
        `סשן ${index}: ${session.ProjectName} - ${session.SessionStartDate} - ${sessionDate}`
      );
    }

    if (!lastSessionDate || sessionDate > lastSessionDate) {
      console.log(
        `סשן חדש אחרון נמצא: ${session.ProjectName} - ${sessionDate}`
      );
      lastSessionDate = sessionDate;
      lastSession = {
        projectName: session.ProjectName,
        clientName: session.ClientCompanyName,
        sessionStartDate: session.SessionStartDate,
        sessionDate: sessionDate,
        sessionFormatted: sessionDate.toLocaleDateString("he-IL"),
        sessionStartTime: sessionDate.toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        sessionEndTime: session.SessionEndDate
          ? new Date(session.SessionEndDate).toLocaleTimeString("he-IL", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "לא זמין",
        sessionStartDate: session.SessionStartDate,
        sessionEndDate: session.SessionEndDate || "לא זמין",
        sessionDuration: session.SessionDurationHours,
        sessionFormattedDuration: formatDurationFromHours(
          session.SessionDurationHours
        ),
        daysSinceSession: Math.max(
          1,
          Math.floor((new Date() - sessionDate) / (1000 * 60 * 60 * 24))
        ),
        projectId: session.ProjectID,
        sessionId: session.SessionID || session.ID,
      };
    }
  });

  console.log("הסשן האחרון שנמצא:", lastSession);
  return lastSession;
}

function calculateSessionExtremes(data) {
  if (!data || !data.Sessions) return {};

  const sessionExtremes = {};

  data.Sessions.forEach((session) => {
    const projectId = session.ProjectID;
    const sessionDuration = session.SessionDurationHours;
    const sessionDate = new Date(session.SessionStartDate);

    if (!sessionExtremes[projectId]) {
      sessionExtremes[projectId] = {
        projectName: session.ProjectName,
        clientName: session.ClientCompanyName,
        longestSession: {
          duration: sessionDuration,
          date: sessionDate.toLocaleDateString("he-IL"),
          formattedDuration: formatDurationFromHours(sessionDuration),
        },
        shortestSession: {
          duration: sessionDuration,
          date: sessionDate.toLocaleDateString("he-IL"),
          formattedDuration: formatDurationFromHours(sessionDuration),
        },
      };
    } else {
      // בדיקה לסשן הכי ארוך
      if (
        sessionDuration > sessionExtremes[projectId].longestSession.duration
      ) {
        sessionExtremes[projectId].longestSession = {
          duration: sessionDuration,
          date: sessionDate.toLocaleDateString("he-IL"),
          formattedDuration: formatDurationFromHours(sessionDuration),
        };
      }

      // בדיקה לסשן הכי קצר
      if (
        sessionDuration < sessionExtremes[projectId].shortestSession.duration
      ) {
        sessionExtremes[projectId].shortestSession = {
          duration: sessionDuration,
          date: sessionDate.toLocaleDateString("he-IL"),
          formattedDuration: formatDurationFromHours(sessionDuration),
        };
      }
    }
  });

  return sessionExtremes;
}

function calculateRecentActivity(data, daysBack = 30) {
  if (!data || !data.Sessions) return {};

  const recentSessions = filterSessionsByDateRange(data.Sessions, daysBack);
  const activityByProject = {};

  recentSessions.forEach((session) => {
    const projectId = session.ProjectID;
    const sessionDate = new Date(session.SessionStartDate);

    if (!activityByProject[projectId]) {
      activityByProject[projectId] = {
        projectName: session.ProjectName,
        clientName: session.ClientCompanyName,
        sessionCount: 0,
        totalHours: 0,
        sessions: [],
      };
    }

    activityByProject[projectId].sessionCount++;
    activityByProject[projectId].totalHours += session.SessionDurationHours;
    activityByProject[projectId].sessions.push({
      date: sessionDate.toLocaleDateString("he-IL"),
      duration: formatDurationFromHours(session.SessionDurationHours),
      daysAgo: Math.floor((new Date() - sessionDate) / (1000 * 60 * 60 * 24)),
    });
  });

  // מיון הסשנים לפי תאריך
  Object.keys(activityByProject).forEach((projectId) => {
    activityByProject[projectId].sessions.sort((a, b) => a.daysAgo - b.daysAgo);
    const totalHours = activityByProject[projectId].totalHours;
    activityByProject[projectId].formattedTotalHours = `${Math.floor(
      totalHours
    )}:${Math.round((totalHours % 1) * 60)
      .toString()
      .padStart(2, "0")}`;
  });

  return activityByProject;
}

function calculateDetailedSessionsByProject(data) {
  if (!data || !data.Sessions) return {};

  const sessionsByProject = {};

  data.Sessions.forEach((session) => {
    const projectId = session.ProjectID;
    const sessionStartDate = new Date(session.SessionStartDate);
    const sessionEndDate = session.SessionEndDate
      ? new Date(session.SessionEndDate)
      : null;

    if (!sessionsByProject[projectId]) {
      sessionsByProject[projectId] = {
        projectName: session.ProjectName,
        clientName: session.ClientCompanyName,
        sessions: [],
      };
    }

    // פורמטינג זמנים מדויק
    const startTime = sessionStartDate.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const endTime = sessionEndDate
      ? sessionEndDate.toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "לא זמין";

    const sessionDate = sessionStartDate.toLocaleDateString("he-IL");

    // הוספת מידע על מי ביצע את הסשן
    const performedByName = `${session.SessionPerformedByFirstName || ""} ${
      session.SessionPerformedByLastName || ""
    }`.trim();

    sessionsByProject[projectId].sessions.push({
      sessionId: session.SessionID || session.ID,
      date: sessionDate,
      startTime: startTime,
      endTime: endTime,
      startDateTime: session.SessionStartDate,
      endDateTime: session.SessionEndDate || "לא זמין",
      duration: formatDurationFromHours(session.SessionDurationHours),
      durationHours: session.SessionDurationHours,
      daysAgo: Math.floor(
        (new Date() - sessionStartDate) / (1000 * 60 * 60 * 24)
      ),
      // פרטי מבצע הסשן
      performedBy: performedByName || "לא ידוע",
      performedByUserId: session.SessionPerformedByUserID,
      performedByEmail: session.SessionPerformedByEmail || "לא ידוע",
      isMySession: session.IsMySession === 1,
      isSessionPerformedByCurrentUser:
        session.IsSessionPerformedByCurrentUser === 1,
      // פרטי תגית הסשן
      labelName:
        session.LabelIsArchived === true || session.LabelIsArchived === 1
          ? "ללא תגית"
          : session.LabelName || "ללא תגית",
      labelColor:
        session.LabelIsArchived === true || session.LabelIsArchived === 1
          ? "#e0e0e0"
          : session.LabelColor || "#e0e0e0",
      labelId:
        session.LabelIsArchived === true || session.LabelIsArchived === 1
          ? null
          : session.LabelID || null,
    });
  });

  // מיון הסשנים לפי תאריך (החדשים ראשונים)
  Object.keys(sessionsByProject).forEach((projectId) => {
    sessionsByProject[projectId].sessions.sort((a, b) => a.daysAgo - b.daysAgo);

    // סימון הסשן האחרון
    if (sessionsByProject[projectId].sessions.length > 0) {
      sessionsByProject[projectId].lastSession =
        sessionsByProject[projectId].sessions[0];
    }
  });

  return sessionsByProject;
}

function calculateTeamPerformanceByProject(data) {
  if (!data || !data.Sessions) return {};

  const teamPerformanceByProject = {};

  data.Sessions.forEach((session) => {
    const projectId = session.ProjectID;
    const projectName = session.ProjectName;
    const clientName = session.ClientCompanyName;

    // זיהוי מבצע הסשן
    const performedByName = `${session.SessionPerformedByFirstName || ""} ${
      session.SessionPerformedByLastName || ""
    }`.trim();
    const performedByUserId = session.SessionPerformedByUserID;
    const performedByEmail = session.SessionPerformedByEmail || "לא ידוע";

    if (!performedByName) return; // דלג על סשנים ללא מבצע מזוהה

    if (!teamPerformanceByProject[projectId]) {
      teamPerformanceByProject[projectId] = {
        projectName: projectName,
        clientName: clientName,
        teamMembers: {},
      };
    }

    if (!teamPerformanceByProject[projectId].teamMembers[performedByUserId]) {
      teamPerformanceByProject[projectId].teamMembers[performedByUserId] = {
        name: performedByName,
        email: performedByEmail,
        sessionCount: 0,
        totalHours: 0,
        totalRevenue: 0,
        sessions: [],
      };
    }

    const member =
      teamPerformanceByProject[projectId].teamMembers[performedByUserId];
    member.sessionCount++;
    member.totalHours += session.SessionDurationHours || 0;
    member.totalRevenue +=
      (session.SessionDurationHours || 0) * (session.SessionHourlyRate || 0);

    // הוספת פרטי הסשן
    member.sessions.push({
      date: new Date(session.SessionStartDate).toLocaleDateString("he-IL"),
      duration: formatDurationFromHours(session.SessionDurationHours),
      startTime: new Date(session.SessionStartDate).toLocaleTimeString(
        "he-IL",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      ),
      endTime: session.SessionEndDate
        ? new Date(session.SessionEndDate).toLocaleTimeString("he-IL", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "לא זמין",
    });
  });

  // עיבוד נתונים נוספים
  Object.keys(teamPerformanceByProject).forEach((projectId) => {
    const project = teamPerformanceByProject[projectId];

    // המרה לפורמט שעות:דקות עבור כל חבר צוות
    Object.keys(project.teamMembers).forEach((userId) => {
      const member = project.teamMembers[userId];
      const totalHoursDecimal = member.totalHours;
      const hours = Math.floor(totalHoursDecimal);
      const minutes = Math.round((totalHoursDecimal - hours) * 60);
      member.formattedTime = `${hours}:${minutes.toString().padStart(2, "0")}`;

      // מיון הסשנים לפי תאריך
      member.sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    // חישוב סטטיסטיקות כלליות לפרויקט
    const membersArray = Object.values(project.teamMembers);
    project.totalSessions = membersArray.reduce(
      (sum, member) => sum + member.sessionCount,
      0
    );
    project.totalHours = membersArray.reduce(
      (sum, member) => sum + member.totalHours,
      0
    );
    project.totalRevenue = membersArray.reduce(
      (sum, member) => sum + member.totalRevenue,
      0
    );
    project.teamMemberCount = membersArray.length;
  });

  return teamPerformanceByProject;
}

function calculateLabelUsageByProject(data) {
  if (!data || !data.Sessions) return {};

  const labelUsageByProject = {};

  data.Sessions.forEach((session) => {
    const projectId = session.ProjectID;
    const projectName = session.ProjectName;
    const clientName = session.ClientCompanyName;

    // זיהוי תגית הסשן
    const labelName = session.LabelName || "ללא תגית";
    const labelColor = session.LabelColor || "#e0e0e0";
    const labelId = session.LabelID;
    const labelIsArchived =
      session.LabelIsArchived === true || session.LabelIsArchived === 1;

    if (!labelUsageByProject[projectId]) {
      labelUsageByProject[projectId] = {
        projectName: projectName,
        clientName: clientName,
        labels: {},
        totalSessionsWithLabels: 0,
        totalSessions: 0,
      };
    }

    labelUsageByProject[projectId].totalSessions++;

    // אם התגית נמחקה (archived), לא נכלול אותה בחישובים
    if (labelIsArchived) {
      // נחשיב את הסשן כ"ללא תגית" אם התגית נמחקה
      const noLabelKey = "ללא תגית";
      if (!labelUsageByProject[projectId].labels[noLabelKey]) {
        labelUsageByProject[projectId].labels[noLabelKey] = {
          labelName: noLabelKey,
          labelColor: "#e0e0e0",
          labelId: null,
          usageCount: 0,
          sessions: [],
        };
      }

      labelUsageByProject[projectId].labels[noLabelKey].usageCount++;
      labelUsageByProject[projectId].labels[noLabelKey].sessions.push({
        date: new Date(session.SessionStartDate).toLocaleDateString("he-IL"),
        duration: formatDurationFromHours(session.SessionDurationHours),
        description: session.Description || "ללא תיאור",
      });

      return; // דלג על שאר העיבוד לסשן זה
    }

    if (!labelUsageByProject[projectId].labels[labelName]) {
      labelUsageByProject[projectId].labels[labelName] = {
        labelName: labelName,
        labelColor: labelColor,
        labelId: labelId,
        usageCount: 0,
        sessions: [],
      };
    }

    labelUsageByProject[projectId].labels[labelName].usageCount++;
    labelUsageByProject[projectId].labels[labelName].sessions.push({
      date: new Date(session.SessionStartDate).toLocaleDateString("he-IL"),
      duration: formatDurationFromHours(session.SessionDurationHours),
      description: session.Description || "ללא תיאור",
    });

    // אם יש תגית (לא "ללא תגית")
    if (labelName !== "ללא תגית") {
      labelUsageByProject[projectId].totalSessionsWithLabels++;
    }
  });

  // עיבוד נתונים נוספים
  Object.keys(labelUsageByProject).forEach((projectId) => {
    const project = labelUsageByProject[projectId];

    // מיון התגיות לפי כמות השימוש
    const sortedLabels = Object.values(project.labels).sort(
      (a, b) => b.usageCount - a.usageCount
    );

    project.sortedLabels = sortedLabels;
    project.mostUsedLabel = sortedLabels.length > 0 ? sortedLabels[0] : null;
    project.labelUsagePercentage =
      project.totalSessions > 0
        ? Math.round(
            (project.totalSessionsWithLabels / project.totalSessions) * 100
          )
        : 0;
  });

  return labelUsageByProject;
}

function calculateCorrectClientCount(data) {
  if (!data || !data.Sessions) return 0;

  // שליפת לקוחות רק מפרויקטים שהמשתמש הוא מנהל שלהם או הבעלים שלהם
  const myClients = new Set();
  const projectsIManagedOrOwn = new Set();

  data.Sessions.forEach((session) => {
    // אם זה הסשן שלי או אני מנהל הפרויקט, זה פרויקט שלי
    if (session.IsMySession === 1 || session.Role === "ProjectManager") {
      projectsIManagedOrOwn.add(session.ProjectID);
    }
  });

  // רק עבור פרויקטים שאני מנהל או בעלים שלהם, ספור את הלקוחות
  data.Sessions.forEach((session) => {
    if (projectsIManagedOrOwn.has(session.ProjectID)) {
      myClients.add(session.ClientID);
    }
  });

  return myClients.size;
}

function prepareChartData(processedData) {
  // הכנת נתונים לגרפי עמודות - שעות לפי פרויקט
  const projectHoursChart = {
    labels: Object.values(processedData.projectSummaries).map((p) =>
      p.projectName.length > 15
        ? p.projectName.substring(0, 15) + "..."
        : p.projectName
    ),
    data: Object.values(processedData.projectSummaries).map((p) =>
      parseFloat(p.totalHours)
    ),
    backgroundColor: [
      "#4a90e2",
      "#7b68ee",
      "#50c878",
      "#ff6b6b",
      "#ffa500",
      "#ff69b4",
      "#20b2aa",
    ],
  };

  // הכנת נתונים לגרף עוגה - התפלגות הכנסות
  const revenueChart = {
    labels: Object.values(processedData.projectSummaries).map(
      (p) => p.projectName
    ),
    data: Object.values(processedData.projectSummaries).map((p) =>
      Math.round(p.totalRevenue)
    ),
    backgroundColor: [
      "#ff6384",
      "#36a2eb",
      "#ffce56",
      "#4bc0c0",
      "#9966ff",
      "#ff9f40",
    ],
  };

  return { projectHoursChart, revenueChart };
}

function createProcessedDataSummary(data) {
  const projectSummaries = calculateProjectSummaries(data);
  const clientSummaries = calculateClientSummaries(data);
  const teamSummaries = calculateTeamSummaries(data);
  const taskSummaries = calculateTaskSummaries(data);
  const lastSessionData = calculateLastSessionData(data);
  const absoluteLastSession = findAbsoluteLastSession(data);
  const recentActivity = calculateRecentActivity(data);
  const sessionExtremes = calculateSessionExtremes(data);
  const overallStats = calculateOverallStats(data);
  const detailedSessionsByProject = calculateDetailedSessionsByProject(data);
  const teamPerformanceByProject = calculateTeamPerformanceByProject(data);
  const labelUsageByProject = calculateLabelUsageByProject(data);

  // עיבוד נתוני ניטור הצוות (אם קיימים)
  let teamMemberStats = {};
  let projectTeamStats = {};
  let teamOverallStats = {};

  if (
    typeof teamMonitoringData !== "undefined" &&
    teamMonitoringData &&
    Array.isArray(teamMonitoringData) &&
    teamMonitoringData.length > 0
  ) {
    try {
      teamMemberStats = calculateTeamMemberStats(teamMonitoringData);
      projectTeamStats = calculateProjectTeamStats(teamMonitoringData);
      teamOverallStats = calculateTeamOverallStats(teamMonitoringData);
    } catch (error) {
      console.error("שגיאה בעיבוד נתוני הצוות:", error);
      teamMemberStats = {};
      projectTeamStats = {};
      teamOverallStats = {};
    }
  }

  // הוספת נתונים לתקופות שונות
  const thisWeekData = {
    Sessions: filterSessionsByDateRange(data.Sessions, 7),
    Projects: data.Projects,
    Clients: data.Clients,
  };
  const thisMonthData = {
    Sessions: filterSessionsByDateRange(data.Sessions, 30),
    Projects: data.Projects,
    Clients: data.Clients,
  };

  const thisWeekStats = calculateOverallStats(thisWeekData);
  const thisMonthStats = calculateOverallStats(thisMonthData);

  const processedSummary = {
    overallStats,
    thisWeekStats,
    thisMonthStats,
    projectSummaries,
    clientSummaries,
    teamSummaries,
    taskSummaries,
    lastSessionData,
    absoluteLastSession,
    recentActivity,
    sessionExtremes,
    detailedSessionsByProject,
    teamPerformanceByProject,
    labelUsageByProject,

    // נתוני ניטור הצוות החדשים
    teamMemberStats,
    projectTeamStats,
    teamOverallStats,

    rawData: data, // שמירה של הנתונים הגולמיים למקרה הצורך
    rawTeamData: teamMonitoringData, // נתוני הצוות הגולמיים
  };

  // הוספת נתוני גרפים
  processedSummary.chartData = prepareChartData(processedSummary);

  return processedSummary;
}

function getCurrentUser() {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// פונקציות לניהול היסטוריית שיחה
function saveChatMessage(role, message) {
  try {
    let history = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || "[]");

    // הוספת הודעה חדשה
    history.push({
      role: role, // "user" או "assistant"
      message: message,
      timestamp: new Date().toISOString(),
    });

    // שמירה על 10 ההודעות האחרונות בלבד
    if (history.length > MAX_CHAT_HISTORY * 2) {
      // x2 כי יש גם שאלות וגם תשובות
      history = history.slice(-MAX_CHAT_HISTORY * 2);
    }

    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("שגיאה בשמירת היסטוריית שיחה:", error);
  }
}

function getChatHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || "[]");

    // הכנת טקסט היסטוריה עבור הפרומפט
    if (history.length === 0) {
      return "אין היסטוריית שיחה קודמת.";
    }

    let historyText = "";
    history.forEach((item, index) => {
      const roleText = item.role === "user" ? "שאלה" : "תשובה";
      historyText += `${roleText} ${Math.floor(index / 2) + 1}: ${
        item.message
      }\n\n`;
    });

    return historyText.trim();
  } catch (error) {
    console.error("שגיאה בקריאת היסטוריית שיחה:", error);
    return "שגיאה בטעינת היסטוריית שיחה.";
  }
}

function loadChatHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(CHAT_HISTORY_KEY) || "[]");

    // טעינת ההיסטוריה לממשק המשתמש
    history.forEach((item) => {
      addMessageToUI(item.role, item.message);
    });

    if (history.length > 0) {
      scrollToBottom();
    }
  } catch (error) {
    console.error("שגיאה בטעינת היסטוריית שיחה:", error);
  }
}

function clearChatHistory() {
  try {
    // בדיקה שאין כבר פופאפ פתוח
    if ($.fancybox.getInstance()) {
      console.log("פופאפ כבר פתוח, מתעלם מהקליק");
      return;
    }

    const popupHtml = `
      <div style="max-width: 400px; text-align: center; font-family: Assistant; padding: 20px;">
        <h3>ניקוי היסטוריית שיחה</h3>
        <p>האם אתה בטוח שברצונך לנקות את כל היסטוריית השיחה? 🤔</p>
        <div style="margin-top: 20px; display: flex; justify-content: center; gap: 10px;">
          <button class="gradient-button" id="confirmClearHistoryBtn" style="background: linear-gradient(135deg, #d50000, #ff4e50); color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; box-shadow: 0 2px 5px rgba(255, 78, 80, 0.3);">כן, נקה</button>
          <button class="gradient-button" onclick="$.fancybox.close()">ביטול</button>
        </div>
      </div>
    `;

    $.fancybox.open({
      src: popupHtml,
      type: "html",
      smallBtn: false,
      afterShow: function () {
        // הוספת event listener רק לאחר שהפופאפ נפתח
        $("#confirmClearHistoryBtn")
          .off("click")
          .on("click", function () {
            const button = $(this);
            if (button.data("clearing")) {
              return false;
            }
            button.data("clearing", true);

            localStorage.removeItem(CHAT_HISTORY_KEY);
            $("#chat-messages").empty();
            updateWelcomeMessage();
            $.fancybox.close();

            setTimeout(() => {
              button.data("clearing", false);
            }, 1000);
          });
      },
      beforeClose: function () {
        // ניקוי event listeners
        $("#confirmClearHistoryBtn").off("click");
      },
    });
  } catch (error) {
    console.error("שגיאה בניקוי היסטוריית שיחה:", error);
  }
}

function exportChatHistory() {
  try {
    // קביעת כל ההודעות הנוכחיות במסך
    const chatMessages = $("#chat-messages .message");

    if (chatMessages.length === 0) {
      alert("אין שיחה לייצוא 📝");
      return;
    }

    // הכנת טקסט לייצוא
    let exportText = "# היסטוריית שיחה - Easy Tracker העוזר האישי\n\n";
    const user = getCurrentUser();
    exportText += `משתמש: ${user?.firstName || "לא ידוע"} ${
      user?.lastName || ""
    }\n`;
    exportText += `תאריך ייצוא: ${new Date().toLocaleDateString("he-IL")}\n\n`;
    exportText += "---\n\n";

    let conversationNum = 1;
    let currentQuestion = "";

    chatMessages.each(function (index) {
      const messageDiv = $(this);
      const isUser = messageDiv.hasClass("user");
      const messageText = messageDiv.text().trim();

      if (isUser) {
        // זו שאלה של המשתמש
        currentQuestion = messageText;
      } else {
        // זו תשובה של העוזר
        if (currentQuestion) {
          exportText += `## שיחה ${conversationNum}\n\n`;
          exportText += `**שאלה:** ${currentQuestion}\n\n`;
          exportText += `**תשובה:** ${messageText}\n\n`;
          exportText += `*תאריך:* ${new Date().toLocaleDateString(
            "he-IL"
          )}\n\n`;
          exportText += "---\n\n";
          conversationNum++;
          currentQuestion = ""; // איפוס לשיחה הבאה
        }
      }
    });

    // הורדת הקובץ
    const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `Easy_Tracker_Chat_History_${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    addMessage("assistant", "השיחה הנוכחית יוצאה בהצלחה! 📁✨");
  } catch (error) {
    console.error("שגיאה בייצוא השיחה:", error);
    addMessage(
      "assistant",
      "אופס! נתקלתי בבעיה בייצוא השיחה. נסה שוב בעוד רגע 😅"
    );
  }
}

$(document).ready(function () {
  initializeAssistant();
  setupEventListeners();
  loadUserProfile();
});

function testChart() {
  // בדיקת יצירת גרף פשוט לוודא שChart.js עובד
  if (typeof Chart !== "undefined") {
    const testCanvas = document.createElement("canvas");
    testCanvas.id = "test-chart";
    testCanvas.style.display = "none";
    document.body.appendChild(testCanvas);

    try {
      new Chart(testCanvas, {
        type: "bar",
        data: {
          labels: ["Test"],
          datasets: [
            {
              label: "Test Data",
              data: [1],
              backgroundColor: ["#4a90e2"],
            },
          ],
        },
        options: { responsive: false },
      });
      console.log("✅ Chart.js עובד! הבדיקה עברה בהצלחה");
      document.body.removeChild(testCanvas);
      return true;
    } catch (error) {
      console.error("❌ Chart.js לא עובד:", error);
      document.body.removeChild(testCanvas);
      return false;
    }
  }
  return false;
}

// פונקציה גלובלית לבדיקת גרפים
window.testChartFunction = function () {
  // בדיקת נתוני צוות
  let teamDataStatus = "❌ אין נתוני צוות";
  if (
    teamMonitoringData &&
    Array.isArray(teamMonitoringData) &&
    teamMonitoringData.length > 0
  ) {
    teamDataStatus = `✅ ${teamMonitoringData.length} רשומות צוות`;
  }

  const testHtml = `
    <div style="border: 2px solid #4a90e2; padding: 15px; margin: 10px 0; border-radius: 8px;">
      <h4>🧪 בדיקת מערכת העוזר</h4>
      <p><strong>Chart.js Status:</strong> ${
        typeof Chart !== "undefined" ? "✅ זמין" : "❌ לא זמין"
      }</p>
      <p><strong>נתוני צוות:</strong> ${teamDataStatus}</p>
      <p><strong>נתוני עבודה:</strong> ${
        assistantData ? "✅ זמינים" : "❌ לא זמינים"
      }</p>
      
      <h5>גרף עמודות לדוגמה:</h5>
      <div class="chart-placeholder" data-type="bar" data-labels="בדיקה א,בדיקה ב,בדיקה ג" data-values="10,20,15" data-colors="#4a90e2,#7b68ee,#50c878"></div>
      
      <h5>גרף עוגה לדוגמה:</h5>
      <div class="chart-placeholder" data-type="pie" data-labels="חלק א,חלק ב" data-values="60,40" data-colors="#ff6384,#36a2eb"></div>
      
      <p style="font-size: 0.9em; color: #666;">📏 הגרפים מוגבלים ל-500px רוחב ו-350px גובה</p>
      
      <h5>בדיקת נתוני משימות:</h5>
      ${(() => {
        if (!assistantData) return "<p>❌ אין נתונים כלל</p>";

        const processedData = createProcessedDataSummary(assistantData);
        const taskSummariesCount = Object.keys(
          processedData.taskSummaries || {}
        ).length;
        const taskSummariesHasTasks = Object.values(
          processedData.taskSummaries || {}
        ).some((task) => task.totalTasks > 0);
        const teamDataHasTasks =
          processedData.teamOverallStats &&
          processedData.teamOverallStats.totalTasks > 0;

        return `
          <p><strong>API ראשי - משימות:</strong> ${taskSummariesCount} פרויקטים, ${
          taskSummariesHasTasks ? "יש נתונים" : "אין נתונים"
        }</p>
          <p><strong>API צוות - משימות:</strong> ${
            teamDataHasTasks
              ? `${processedData.teamOverallStats.totalTasks} משימות`
              : "אין נתונים"
          }</p>
          ${
            !taskSummariesHasTasks && !teamDataHasTasks
              ? '<p style="color: red;">⚠️ אין נתוני משימות בכלל! בדוק שהשרת רץ ושיש הרשאות.</p>'
              : ""
          }
        `;
      })()}
      
      <h5>שאלות לדוגמה שתוכל לשאול:</h5>
      <ul style="text-align: right; direction: rtl;">
        <li>כמה משימות יש בכל פרויקט?</li>
        <li>מי איש הצוות עם הכי הרבה משימות שהושלמו?</li>
        <li>איזה פרויקט צריך יותר תשומת לב?</li>
        <li>תן לי השוואה בין ביצועי אנשי הצוות</li>
        <li>הצג לי גרף של משימות לפי איש צוות</li>
        <li>איזה משימות יש ליעל כהן?</li>
        <li>מי יש לו הכי הרבה משימות באיחור?</li>
        <li>כמה אני מרוויח לשעה בפרויקט מערכת ניהול משימות?</li>
        <li>מה התעריף השעתי שלי?</li>
        <li>כמה פרויקטים יש לי?</li>
        <li>מה ההכנסה שלי השבוע?</li>
      </ul>
    </div>
  `;

  addMessage("assistant", testHtml);
};

function initializeAssistant() {
  // בדיקה שChart.js נטען
  if (typeof Chart === "undefined") {
    console.error("Chart.js לא נטען! הגרפים לא יעבדו.");
  } else {
    console.log("Chart.js נטען בהצלחה! גרפים זמינים.");
    // בדיקת יצירת גרף פשוט
    setTimeout(() => {
      const chartWorks = testChart();
      console.log("תוצאת בדיקת גרף:", chartWorks ? "עובד" : "לא עובד");
    }, 1000);
  }

  const user = getCurrentUser();
  if (!user || !user.id) {
    window.location.href = "login.html";
    return;
  }
  loadAssistantData(user.id);
}

function setupEventListeners() {
  // שליחת שאלה
  $("#send-button").click(sendMessage);
  $("#chat-input").keypress(function (e) {
    if (e.which === 13 && !isLoading) {
      sendMessage();
    }
  });

  // הוספת כפתורי פעולות היסטוריה
  $(".stats-title").append(`
    <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
      <button id="clear-history-btn" style="
        background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
      " onclick="clearChatHistory()">
        🗑️ נקה היסטוריה
      </button>
      <button id="export-history-btn" style="
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
      " onclick="exportChatHistory()">
        📥 ייצא שיחה
      </button>
    </div>
  `);
}

function loadUserProfile() {
  const user = getCurrentUser();
  $("#menu-prof-name").text(user?.firstName || "משתמש");
  $(".avatar-img").attr("src", user?.image || "./images/def/user-def.png");
}

function loadTeamMonitoringData(userId) {
  return new Promise((resolve, reject) => {
    // וידוא ש-userId קיים
    if (!userId) {
      console.warn("אין מזהה משתמש לטעינת נתוני צוות");
      teamMonitoringData = [];
      resolve([]);
      return;
    }

    ajaxCall(
      "GET",
      apiConfig.createApiUrl("Reports/GetTeamMonitoringData", {
        managerUserID: userId,
      }),
      "",
      function (response) {
        try {
          // בדיקה שהתשובה תקינה
          if (response && Array.isArray(response)) {
            teamMonitoringData = response;
            console.log(
              "נתוני ניטור הצוות נטענו בהצלחה:",
              response.length,
              "רשומות"
            );
          } else {
            console.warn("תשובה לא תקינה מ-API נתוני הצוות:", response);
            teamMonitoringData = [];
          }
          resolve(teamMonitoringData);
        } catch (error) {
          console.error("שגיאה בעיבוד נתוני הצוות:", error);
          teamMonitoringData = [];
          resolve([]);
        }
      },
      function (error) {
        console.warn("שגיאה בטעינת נתוני ניטור הצוות:", error);
        teamMonitoringData = [];
        resolve([]); // ממשיכים גם אם יש שגיאה
      }
    );
  });
}

function loadAssistantData(userId) {
  showLoading(true);

  // טעינת שני ה-APIs במקביל
  const assistantDataPromise = new Promise((resolve, reject) => {
    ajaxCall(
      "GET",
      apiConfig.createApiUrl("Reports/GetFullAssistantData", {
        userId: userId,
      }),
      "",
      function (response) {
        // עיבוד הנתונים מהשרת
        const processedData = {
          Projects: [],
          Clients: [],
          Sessions: response,
        };

        // איסוף פרויקטים ייחודיים
        const uniqueProjects = new Map();
        const uniqueClients = new Map();

        response.forEach((session) => {
          // הוספת פרויקט אם עוד לא קיים
          if (!uniqueProjects.has(session.ProjectID)) {
            uniqueProjects.set(session.ProjectID, {
              ProjectID: session.ProjectID,
              ProjectName: session.ProjectName,
              ProjectDescription: session.ProjectDescription,
              ProjectHourlyRate: session.ProjectHourlyRate,
              ProjectImage: session.ProjectImage,
              ProjectIsArchived: session.ProjectIsArchived,
              ProjectIsDone: session.ProjectIsDone,
              DurationGoal: session.DurationGoal,
              ClientID: session.ClientID,
            });
          }

          // הוספת לקוח אם עוד לא קיים
          if (!uniqueClients.has(session.ClientID)) {
            uniqueClients.set(session.ClientID, {
              ClientID: session.ClientID,
              CompanyName: session.CompanyName,
              ContactPerson: session.ContactPerson,
              ClientEmail: session.ClientEmail,
              ContactPersonPhone: session.ContactPersonPhone,
              OfficePhone: session.OfficePhone,
              ClientImage: session.ClientImage,
              ClientIsArchived: session.ClientIsArchived,
            });
          }
        });

        processedData.Projects = Array.from(uniqueProjects.values());
        processedData.Clients = Array.from(uniqueClients.values());

        assistantData = processedData;
        resolve(processedData);
      },
      function (error) {
        reject(error);
      }
    );
  });

  const teamDataPromise = loadTeamMonitoringData(userId);

  // חיכה לשני ה-APIs
  Promise.all([assistantDataPromise, teamDataPromise])
    .then(([assistantResult, teamResult]) => {
      hideLoading();
      enableChat();

      // טעינת היסטוריית השיחה לאחר טעינת הנתונים
      loadChatHistory();

      // אם אין היסטוריית שיחה, נציג הודעת ברוכים הבאים
      const history = JSON.parse(
        localStorage.getItem(CHAT_HISTORY_KEY) || "[]"
      );
      if (history.length === 0) {
        updateWelcomeMessage();
      }
    })
    .catch((error) => {
      console.error("שגיאה בטעינת נתונים:", error);
      hideLoading();
      addMessage(
        "assistant",
        "אופס! נתקלתי בבעיה בטעינת הנתונים שלך. אנא נסה לרענן את הדף. 😔"
      );
    });
}

function enableChat() {
  $("#chat-input").prop("disabled", false);
  $("#send-button").prop("disabled", false);
  $("#chat-input").focus();
}

function updateWelcomeMessage() {
  $(".message.assistant").last().remove();

  const welcomeMsg = `שלום! 👋 אני העוזר האישי שלך ונתוניך נטענו בהצלחה! 🎉
<br><br>
💡 **שאלות נפוצות:**
<div class="faq-buttons">
  <div class="faq-row">
    <button class="faq-btn" onclick="sendFAQQuestion('כמה שעות עבדתי השבוע?')">⏰ כמה שעות עבדתי השבוע?</button>
    <button class="faq-btn" onclick="sendFAQQuestion('כמה הרווחתי החודש?')">💰 כמה הרווחתי החודש?</button>
    <button class="faq-btn" onclick="sendFAQQuestion('איזה פרויקט הכי רווחי החודש?')">🏆 איזה פרויקט הכי רווחי החודש?</button>
  </div>
  <div class="faq-row">
    <button class="faq-btn" onclick="sendFAQQuestion('כמה סשנים ביצעתי החודש?')">📊 כמה סשנים ביצעתי החודש?</button>
    <button class="faq-btn" onclick="sendFAQQuestion('מה היה היום הכי עמוס שלי החודש?')">🔥 מה היה היום הכי עמוס שלי החודש?</button>
    <button class="faq-btn" onclick="sendFAQQuestion('כמה משימות פתוחות יש לי עכשיו?')">✅ כמה משימות פתוחות יש לי עכשיו?</button>
  </div>
</div>
🤖 **או שאל אותי כל שאלה אחרת על הנתונים שלך!**`;

  addMessage("assistant", welcomeMsg);
}

function sendMessage() {
  if (isLoading) return;
  const message = $("#chat-input").val().trim();
  if (!message) return;

  addMessage("user", message);
  $("#chat-input").val("");
  sendToGemini(message);
}

function sendToGemini(userQuestion) {
  if (!assistantData) {
    addMessage(
      "assistant",
      "עדיין לא סיימתי לטעון את הנתונים שלך. אנא המתן רגע... ⏳"
    );
    return;
  }
  isLoading = true;
  showTypingIndicator();

  // קבלת נתוני המשתמש המחובר
  const user = getCurrentUser();
  const userId = user?.id || "לא ידוע";
  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`
    : "משתמש לא מזוהה";

  // קבלת היסטוריית השיחה
  const chatHistory = getChatHistory();

  // עיבוד הנתונים לסיכומים מדויקים
  let processedData;
  try {
    processedData = createProcessedDataSummary(assistantData);
  } catch (error) {
    console.error("שגיאה בעיבוד הנתונים:", error);
    hideTypingIndicator();
    isLoading = false;
    addMessage(
      "assistant",
      "מצטער, נתקלתי בבעיה בעיבוד הנתונים. אנא נסה שוב. 😔"
    );
    return;
  }

  // בדיקה מיוחדת לשאלות על משימות
  const taskQuestionKeywords = [
    "משימות",
    "משימה",
    "task",
    "tasks",
    "מטלות",
    "מטלה",
  ];
  const isTaskQuestion = taskQuestionKeywords.some((keyword) =>
    userQuestion.toLowerCase().includes(keyword.toLowerCase())
  );

  if (isTaskQuestion) {
    const hasTaskData =
      (processedData.taskSummaries &&
        Object.values(processedData.taskSummaries).some(
          (task) => task.totalTasks > 0
        )) ||
      (processedData.teamOverallStats &&
        processedData.teamOverallStats.totalTasks > 0);

    if (!hasTaskData) {
      hideTypingIndicator();
      isLoading = false;
      addMessage(
        "assistant",
        `מצטער, אין לי נתוני משימות זמינים כרגע. 😔\n\n🔧 **כדי לקבל נתוני משימות:**\n• וודא שהשרת רץ על ${apiConfig.baseUrl.replace(
          "/api",
          ""
        )}\n• וודא שיש לך הרשאות לגשת לנתוני הצוות\n• בדוק בקונסול (F12) אם יש שגיאות\n\n💡 **בינתיים אני יכול לעזור עם:**\n• שאלות על פרויקטים ולקוחות\n• הכנסות ושעות עבודה\n• ניתוח ביצועים\n• יצירת גרפים וטבלאות`
      );
      return;
    }
  }

  // בניית הפרומפט המשופר עם נתונים מעובדים
  const prompt = `
פרטי המשתמש:
מזהה: ${userId}
שם: ${userName}

היסטוריית שיחה קודמת:
${chatHistory}

=== סיכומים מדויקים של הנתונים ===

📊 סטטיסטיקות כלליות (כל הזמנים):
• סה"כ שעות עבודה: ${processedData.overallStats.formattedTime}
• סה"כ הכנסה: ₪${processedData.overallStats.totalRevenue.toLocaleString()}
• מספר סשנים: ${processedData.overallStats.totalSessions}
• מספר פרויקטים: ${processedData.overallStats.uniqueProjects}
• מספר לקוחות: ${processedData.overallStats.uniqueClients}
• משימות: ${processedData.overallStats.totalTasks} סה"כ (${
    processedData.overallStats.totalCompletedTasks
  } הושלמו, ${processedData.overallStats.totalPendingTasks} בתהליך, ${
    processedData.overallStats.overallTaskCompletionRate
  }% הושלמו)
• אנשי צוות: ${processedData.overallStats.totalTeamMembers} (${
    processedData.overallStats.teamMembersList
  })

📅 השבוע האחרון (7 ימים):
• שעות עבודה: ${processedData.thisWeekStats.formattedTime}
• הכנסה: ₪${processedData.thisWeekStats.totalRevenue.toLocaleString()}
• סשנים: ${processedData.thisWeekStats.totalSessions}

📆 החודש האחרון (30 ימים):
• שעות עבודה: ${processedData.thisMonthStats.formattedTime}
• הכנסה: ₪${processedData.thisMonthStats.totalRevenue.toLocaleString()}
• סשנים: ${processedData.thisMonthStats.totalSessions}

🎯 סיכום לפי פרויקטים:
${Object.entries(processedData.projectSummaries)
  .map(
    ([id, data]) =>
      `• "${data.projectName}" (לקוח: ${data.clientName}): ${
        data.formattedTime
      } שעות, תעריף שעתי: ₪${data.hourlyRate}, סה"כ הכנסה: ₪${Math.round(
        data.totalRevenue
      ).toLocaleString()}, ${data.sessionCount} סשנים`
  )
  .join("\n")}

👥 סיכום לפי לקוחות:
${Object.entries(processedData.clientSummaries)
  .map(
    ([id, data]) =>
      `• "${data.clientName}": ${data.formattedTime} שעות, ₪${Math.round(
        data.totalRevenue
      ).toLocaleString()}, ${data.projectCount} פרויקטים, ${
        data.sessionCount
      } סשנים`
  )
  .join("\n")}

👨‍💼 סיכום אנשי צוות לפי פרויקטים:
${Object.entries(processedData.teamSummaries)
  .map(
    ([id, data]) =>
      `• פרויקט "${data.projectName}": ${data.teamCount} אנשי צוות (${
        data.teamNames || "לא צוין"
      }), ${data.formattedTime} שעות עבודה`
  )
  .join("\n")}

✅ סיכום משימות לפי פרויקטים:
${(() => {
  const taskEntries = Object.entries(processedData.taskSummaries);
  if (
    taskEntries.length === 0 ||
    taskEntries.every(([id, data]) => data.totalTasks === 0)
  ) {
    return "• אין נתוני משימות זמינים מה-API הראשי. נתוני המשימות מגיעים מ-API הצוות החדש (ראה למטה)";
  }
  return taskEntries
    .map(
      ([id, data]) =>
        `• פרויקט "${data.projectName}": ${data.totalTasks} משימות סה"כ, ${data.completedTasks} הושלמו, ${data.pendingTasks} בתהליך (${data.completionRate}% הושלמו)`
    )
    .join("\n");
})()}

${(() => {
  try {
    if (
      processedData.teamOverallStats &&
      typeof processedData.teamOverallStats === "object" &&
      Object.keys(processedData.teamOverallStats).length > 0
    ) {
      const teamStats = processedData.teamOverallStats;
      let teamSection = `👥 נתוני ניטור הצוות (מפורט):
• סה"כ אנשי צוות: ${teamStats.totalTeamMembers || 0}
• פרויקטים עם צוות: ${teamStats.totalProjectsWithTeam || 0}
• סה"כ משימות צוות: ${teamStats.totalTasks || 0}
• משימות שהושלמו: ${teamStats.totalCompletedTasks || 0} (${
        teamStats.overallCompletionRate || 0
      }%)
• משימות בתהליך: ${teamStats.totalPendingTasks || 0}
• משימות באיחור: ${teamStats.totalOverdueTasks || 0}

`;

      // הוספת פירוט אנשי צוות אם קיים
      if (
        processedData.teamMemberStats &&
        Object.keys(processedData.teamMemberStats).length > 0
      ) {
        teamSection += `📊 פירוט ביצועי אנשי הצוות:
`;
        const sortedMembers = Object.entries(
          processedData.teamMemberStats
        ).sort(
          ([, a], [, b]) => (b.completedTasks || 0) - (a.completedTasks || 0)
        );

        sortedMembers.forEach(([memberId, stats]) => {
          teamSection += `• ${stats.memberName || "לא ידוע"} (${
            stats.memberEmail || "לא ידוע"
          }): ${stats.totalTasks || 0} משימות סה"כ, ${
            stats.completedTasks || 0
          } הושלמו (${stats.completionRate || 0}%), ${
            stats.pendingTasks || 0
          } בתהליך, ${stats.overdueTasks || 0} באיחור, עובד על ${
            stats.projectCount || 0
          } פרויקטים\n`;

          // הוספת פירוט משימות אישיות
          if (stats.tasks && stats.tasks.length > 0) {
            teamSection += `  משימות מפורטות:\n`;
            stats.tasks.forEach((task) => {
              const status = task.isDone
                ? "✅ הושלמה"
                : task.isOverdue
                ? "⚠️ באיחור"
                : "⏳ בתהליך";
              const dueDate = new Date(task.dueDate).toLocaleDateString(
                "he-IL"
              );
              teamSection += `  - ${task.description} (${task.projectName}) - ${status} - יעד: ${dueDate}\n`;
            });
          }
          teamSection += `\n`;
        });
        teamSection += `\n`;
      }

      // הוספת פירוט צוות לפי פרויקט אם קיים
      if (
        processedData.projectTeamStats &&
        Object.keys(processedData.projectTeamStats).length > 0
      ) {
        teamSection += `🎯 פירוט צוות לפי פרויקט:
`;
        Object.entries(processedData.projectTeamStats).forEach(
          ([projectId, teamInfo]) => {
            teamSection += `• פרויקט "${teamInfo.projectName || "לא ידוע"}": ${
              teamInfo.teamMemberCount || 0
            } אנשי צוות, ${teamInfo.totalTasks || 0} משימות (${
              teamInfo.completionRate || 0
            }% הושלמו, ${teamInfo.overdueTasks || 0} באיחור)\n`;

            if (
              teamInfo.memberDetails &&
              Array.isArray(teamInfo.memberDetails)
            ) {
              teamInfo.memberDetails.forEach((member) => {
                teamSection += `  - ${member.memberName || "לא ידוע"}: ${
                  member.totalTasks || 0
                } משימות (${member.completedTasks || 0} הושלמו, ${
                  member.pendingTasks || 0
                } בתהליך, ${member.overdueTasks || 0} באיחור)\n`;
              });
            }
            teamSection += `\n`;
          }
        );
      }

      return teamSection;
    }
    return "";
  } catch (error) {
    console.error("שגיאה ביצירת מידע על הצוות:", error);
    return "";
  }
})()}

🔥 הסשן האחרון בכלל (בכל הפרויקטים):
${
  processedData.absoluteLastSession
    ? `• פרויקט "${processedData.absoluteLastSession.projectName}" ב-${processedData.absoluteLastSession.sessionFormatted} התחלה: ${processedData.absoluteLastSession.sessionStartTime}, סיום: ${processedData.absoluteLastSession.sessionEndTime} (לפני ${processedData.absoluteLastSession.daysSinceSession} ימים), משך ${processedData.absoluteLastSession.sessionFormattedDuration}`
    : "• אין נתוני סשנים"
}

📅 סשן אחרון לכל פרויקט:
${Object.entries(processedData.lastSessionData)
  .map(
    ([id, data]) =>
      `• פרויקט "${data.projectName}": סשן אחרון ${data.lastSessionFormatted} (לפני ${data.daysSinceLastSession} ימים), משך ${data.lastSessionFormattedDuration}`
  )
  .join("\n")}

📝 פירוט סשנים מפורט לפי פרויקט (עם שעות התחלה וסיום):
${Object.entries(processedData.detailedSessionsByProject)
  .map(([projectId, projectData]) => {
    const recentSessions = projectData.sessions.slice(0, 5); // הצגת 5 הסשנים האחרונים
    let projectInfo = `• **פרויקט "${projectData.projectName}"** (לקוח: ${projectData.clientName}):\n`;

    if (projectData.lastSession) {
      projectInfo += `  ← הסשן האחרון: ${projectData.lastSession.date} התחלה: ${projectData.lastSession.startTime}, סיום: ${projectData.lastSession.endTime}, משך: ${projectData.lastSession.duration}, בוצע על ידי: ${projectData.lastSession.performedBy}, תגית: ${projectData.lastSession.labelName}\n`;
    }

    if (recentSessions.length > 1) {
      projectInfo += `  ← הסשנים האחרונים:\n`;
      recentSessions.forEach((session, index) => {
        if (index > 0) {
          // דלג על האחרון שכבר הצגנו
          projectInfo += `    - ${session.date} התחלה: ${session.startTime}, סיום: ${session.endTime}, משך: ${session.duration}, בוצע על ידי: ${session.performedBy}, תגית: ${session.labelName}\n`;
        }
      });
    }

    // הוספת הסשן הראשון (הישן ביותר)
    if (projectData.sessions.length > 0) {
      const firstSession =
        projectData.sessions[projectData.sessions.length - 1]; // האחרון במיון = הראשון בזמן
      projectInfo += `  ← הסשן הראשון (הישן ביותר): ${firstSession.date} התחלה: ${firstSession.startTime}, סיום: ${firstSession.endTime}, משך: ${firstSession.duration}, בוצע על ידי: ${firstSession.performedBy}, תגית: ${firstSession.labelName}\n`;
      projectInfo += `  ← סה"כ ${projectData.sessions.length} סשנים בפרויקט זה\n`;
    }

    return projectInfo;
  })
  .join("\n")}

👥 ביצועי אנשי צוות לפי פרויקט (מפורט):
${Object.entries(processedData.teamPerformanceByProject)
  .map(([projectId, projectData]) => {
    let projectInfo = `• **פרויקט "${projectData.projectName}"** (לקוח: ${projectData.clientName}):\n`;
    projectInfo += `  ← סה"כ ${projectData.totalSessions} סשנים, ${Math.floor(
      projectData.totalHours
    )}:${Math.round((projectData.totalHours % 1) * 60)
      .toString()
      .padStart(2, "0")} שעות, ₪${Math.round(
      projectData.totalRevenue
    ).toLocaleString()} הכנסה\n`;
    projectInfo += `  ← אנשי צוות (${projectData.teamMemberCount}):\n`;

    // מיון חברי הצוות לפי מספר סשנים
    const sortedMembers = Object.values(projectData.teamMembers).sort(
      (a, b) => b.sessionCount - a.sessionCount
    );

    sortedMembers.forEach((member) => {
      projectInfo += `    - ${member.name} (${member.email}): ${
        member.sessionCount
      } סשנים, ${member.formattedTime} שעות, ₪${Math.round(
        member.totalRevenue
      ).toLocaleString()} הכנסה\n`;
    });

    return projectInfo;
  })
  .join("\n")}

🏷️ שימוש בתגיות לפי פרויקט:
${Object.entries(processedData.labelUsageByProject)
  .map(([projectId, projectData]) => {
    let projectInfo = `• **פרויקט "${projectData.projectName}"** (לקוח: ${projectData.clientName}):\n`;
    projectInfo += `  ← סה"כ ${projectData.totalSessions} סשנים, ${projectData.totalSessionsWithLabels} עם תגיות (${projectData.labelUsagePercentage}%)\n`;

    if (projectData.sortedLabels.length > 0) {
      projectInfo += `  ← תגיות בשימוש:\n`;
      projectData.sortedLabels.forEach((label) => {
        const percentage = Math.round(
          (label.usageCount / projectData.totalSessions) * 100
        );
        projectInfo += `    - "${label.labelName}": ${label.usageCount} פעמים (${percentage}%)\n`;
      });

      if (projectData.mostUsedLabel) {
        projectInfo += `  ← התגית הכי פופולרית: "${projectData.mostUsedLabel.labelName}" (${projectData.mostUsedLabel.usageCount} פעמים)\n`;
      }
    } else {
      projectInfo += `  ← אין תגיות בשימוש בפרויקט זה\n`;
    }

    return projectInfo;
  })
  .join("\n")}

🕐 פעילות אחרונה (30 ימים אחרונים):
${Object.entries(processedData.recentActivity)
  .map(
    ([id, data]) =>
      `• פרויקט "${data.projectName}": ${data.sessionCount} סשנים, סה"כ ${
        data.formattedTotalHours
      } שעות. הסשנים האחרונים: ${data.sessions
        .slice(0, 3)
        .map((s) => `${s.date} (${s.duration})`)
        .join(", ")}`
  )
  .join("\n")}

⏱️ הסשנים הארוכים והקצרים לכל פרויקט:
${Object.entries(processedData.sessionExtremes)
  .map(
    ([id, data]) =>
      `• פרויקט "${data.projectName}": הסשן הכי ארוך ${data.longestSession.formattedDuration} (${data.longestSession.date}), הסשן הכי קצר ${data.shortestSession.formattedDuration} (${data.shortestSession.date})`
  )
  .join("\n")}

🔍 **מידע נוסף על אנשי צוות:**
הנתונים כוללים מידע על מי ביצע כל סשן:
• SessionPerformedByFirstName/LastName - שם מי שביצע את הסשן
• SessionPerformedByEmail - אימייל של מי שביצע
• IsSessionPerformedByCurrentUser - האם המשתמש הנוכחי ביצע את הסשן

עבור שאלות על ביצועי צוות - קבץ סשנים לפי שם מלא של איש הצוות וחשב סה"כ שעות/הכנסה.

=== השאלה ===
${userQuestion}

=== הוראות תשובה ===
ענה בעברית בצורה ברורה ותמציתית. השתמש באימוג'ים כדי להפוך את התשובה לידידותית יותר.

**חשוב - תמציתיות:**
• אם השאלה מבקשת **מספר בלבד** (כמה פרויקטים, כמה תגיות, כמה לקוחות) - תן רק את המספר ואימוג'י. ללא פירוט נוסף!
• אם השאלה מבקשת **מידע כללי** (איזה פרויקט, מתי, כמה זמן) - תן תשובה קצרה ומדויקת בלבד
• **פירוט נוסף רק אם נשאל במפורש:** "תפרט", "הרחב", "איזה", "רשימה", "פירוט"
• **דוגמאות לתשובות קצרות:**
  - "כמה פרויקטים יש לי?" → "יש לך 8 פרויקטים 📂"
  - "כמה תגיות יש לי?" → "יש לך 12 תגיות 🏷️"
  - "כמה הרווחתי החודש?" → "הרווחת ₪15,240 החודש 💰"
  - "מתי עבדתי בפעם האחרונה?" → "עבדת בפעם האחרונה ב-15.12.2024 ב-14:30 🕐"

**הוראות מיוחדות:**
• אם נשאלת על "הסשן האחרון" או "מתי עבדתי בפעם האחרונה" - השתמש בנתונים מ"🔥 הסשן האחרון בכלל" שכולל תאריך ושעות התחלה וסיום מדויקים
• אם נשאלת על סשן אחרון של פרויקט ספציפי - השתמש בנתונים מ"📝 פירוט סשנים מפורט לפי פרויקט" שכולל שעות התחלה וסיום מדויקות
• **הסשן הראשון/הישן ביותר:** אם נשאלת על "הסשן הראשון" או "הסשן הישן ביותר" בפרויקט - חפש במידע "הסשן הראשון (הישן ביותר)" ב"📝 פירוט סשנים מפורט לפי פרויקט"
• **הבנת הקשר של שאלות המשך:** אם המשתמש שואל שאלה ללא ציון שם פרויקט (כמו "מתי היה הסשן הראשון בפרויקט הזה?") - השתמש בהיסטוריית השיחה כדי לזהות איזה פרויקט הוזכר בשאלה הקודמת והתייחס אליו
• **חשוב לגבי זמנים:** תמיד ציין גם שעת התחלה וגם שעת הסיום כאשר זמינים - למשל: "התחלת ב-7:00 וסיימת ב-9:54"
• אם נשאלת "מתי התחיל הסשן" או "מתי הסתיים הסשן" - השתמש בשדות startTime ו-endTime מ"📝 פירוט סשנים מפורט"
• עבור שאלות על צוות ומשימות - השתמש בעיקר בנתונים מ"👥 נתוני ניטור הצוות (מפורט)"
• כאשר נשאלת "מי איש הצוות עם הכי הרבה משימות" - השתמש ברשימה הממוינת ב"📊 פירוט ביצועי אנשי הצוות"
• עבור שאלות על משימות בפרויקט ספציפי - השתמש בעיקר ב"🎯 פירוט צוות לפי פרויקט" (נתונים מדויקים יותר)
• כאשר נשאלת על פרויקט ספציפי לפי שם (כמו "מערכת CRM") - חפש אותו ב"📝 פירוט סשנים מפורט לפי פרויקט" ותן מידע מדויק על הסשנים שלו
• **זיהוי הקשר אוטומטי:** אם שאלה מתחילה ב"מתי", "כמה", "איזה", "איך", "ומתי", "וכמה", "ואיזה", "ואיך" ללא ציון פרויקט ספציפי - בדוק בהיסטוריית השיחה איזה פרויקט הוזכר לאחרונה והתייחס אליו
• **שאלות קצרות עם חיבור:** אם שאלה מתחילה ב"ו" + מילת שאלה (כמו "ומתי הסשן הראשון?") - זה המשך לשאלה קודמת על אותו פרויקט

• **לשאלות על אנשי צוות וביצועיהם:** השתמש בעיקר ב"👥 ביצועי אנשי צוות לפי פרויקט (מפורט)" - שם תמצא בדיוק כמה סשנים ביצע כל איש צוות בכל פרויקט
• **מי ביצע איזה סשן:** השתמש בשדה "בוצע על ידי" ב"📝 פירוט סשנים מפורט לפי פרויקט" לזיהוי מבצע כל סשן ספציפי
• **לטבלאות צוות:** הצג שם, מספר סשנים, שעות והכנסה מ"👥 ביצועי אנשי צוות לפי פרויקט"
• **כשנשאלת "כמה סשנים ביצע כל אחד":** חפש בפרויקט הספציפי ב"👥 ביצועי אנשי צוות לפי פרויקט" ותן תשובה מדויקת לכל איש צוות

• **לשאלות על תגיות (Labels):** השתמש ב"🏷️ שימוש בתגיות לפי פרויקט" למידע על איזה תגיות נעשה שימוש ובכמה פעמים
• **"באיזה תגיות השתמשתי בפרויקט הזה?"** - חפש בפרויקט הספציפי ברשימת התגיות והצג את כל התגיות עם מספר השימושים
• **"איזו תגית הכי פופולרית בפרויקט?"** - השתמש ב"התגית הכי פופולרית" מנתוני התגיות
• **"כמה פעמים השתמשתי בתגית X?"** - חפש את התגית הספציפית ברשימת התגיות של הפרויקט
• **תגיות בסשנים ספציפיים:** השתמש בשדה "תגית" ב"📝 פירוט סשנים מפורט לפי פרויקט" לזיהוי איזו תגית שויכה לכל סשן ספציפי
• **חשוב לגבי תגיות מחוקות:** תגיות שנמחקו (LabelIsArchived=true) מוצגות כ"ללא תגית" - זה נכון ומכוון, כדי לא להציג תגיות שכבר לא קיימות במערכת

**מילות מפתח לזיהוי סוג התשובה:**
• **תשובה קצרה (מספר/מידע בסיסי):** "כמה", "מתי", "איזה" (ללא "תפרט")
• **תשובה מפורטת:** "תפרט", "הרחב", "רשימה", "פירוט", "איזה X יש לי", "מה השמות"
• **דוגמאות נוספות:**
  - "כמה שעות עבדתי השבוע?" → "עבדת 32:45 שעות השבוע 🕒"
  - "איזה פרויקט הכי רווחי?" → "הפרויקט הכי רווחי הוא 'מערכת CRM' 🏆"
  - "תפרט לי על הפרויקטים שלי" → [פירוט מלא עם טבלאות]

** חשוב לגבי פורמט התשובה: **
1. **רק לתשובות מפורטות:** אם נשאל פירוט והתשובה כוללת נתונים מספריים או השוואות - השתמש בטבלאות HTML כמו:
   <table>
   <tr><th>פרויקט</th><th>שעות</th><th>הכנסה</th></tr>
   <tr><td>משהו</td><td>10:30</td><td>₪1,500</td></tr>
   </table>

2. **רק לתשובות מפורטות:** אם המידע מתאים להצגה כגרף - השתמש באחת מהשיטות הבאות:

   **שיטה 1 - גרף פשוט (מומלץ):**
   <div class="chart-placeholder" data-type="bar" data-labels="פרויקט א,פרויקט ב,פרויקט ג" data-values="25,19,8" data-colors="#4a90e2,#7b68ee,#50c878"></div>
   
   או לגרף עוגה:
   <div class="chart-placeholder" data-type="pie" data-labels="מערכת ניהול,אפליקציה,אתר" data-values="45,30,25" data-colors="#ff6384,#36a2eb,#ffce56"></div>
   
   או לגרף משימות צוות:
   <div class="chart-placeholder" data-type="bar" data-labels="דן כהן,שרה לוי,מיכל אביב" data-values="15,12,8" data-colors="#4a90e2,#50c878,#ff6b6b"></div>
   
   **שיטה 2 - גרף מלא (אם השיטה הראשונה לא עובדת):**
   
   📊 **דוגמת גרף עמודות פשוט:**
   <div class="chart-container">
   <canvas id="chart_12345"></canvas>
   <script>
   new Chart(document.getElementById('chart_12345'), {
     type: 'bar',
     data: {
       labels: ['פרויקט א', 'פרויקט ב', 'פרויקט ג'],
       datasets: [{
         label: 'שעות עבודה',
         data: [25, 19, 8],
         backgroundColor: ['#4a90e2', '#7b68ee', '#50c878']
       }]
     },
     options: { 
       responsive: true,
       maintainAspectRatio: false,
       plugins: { legend: { position: 'bottom' } }
     }
   });
   </script>
   </div>
   
   🥧 **דוגמת גרף עוגה פשוט:**
   <div class="chart-container">
   <canvas id="chart_67890"></canvas>
   <script>
   new Chart(document.getElementById('chart_67890'), {
     type: 'pie',
     data: {
       labels: ['מערכת ניהול', 'אפליקציה', 'אתר'],
       datasets: [{
         data: [45, 30, 25],
         backgroundColor: ['#ff6384', '#36a2eb', '#ffce56']
       }]
     },
     options: { 
       responsive: true,
       maintainAspectRatio: false,
       plugins: { legend: { position: 'bottom' } }
     }
   });
   </script>
   </div>
   
   ⚠️ **חשוב:** 
   • תמיד החלף את מספר הID (chart_12345) במספר רנדומלי חדש!
   • אל תוסיף width/height לcanvas - יהיה responsive אוטומטית
   • השתמש בדוגמאות הפשוטות האלה בלבד
   • וודא שהסקריפט קצר ופשוט
   
   📝 **אלטרנטיבה:** אם יש בעיה עם גרף, תוכל להשתמש בקריאה לפונקציה:
   <div id="simple-chart-123" class="chart-placeholder" data-type="bar" data-labels="פרויקט א,פרויקט ב" data-values="25,19" data-colors="#4a90e2,#7b68ee"></div>

3. **לתשובות קצרות:** השתמש רק בטקסט פשוט + אימוג'י רלוונטי
4. **לתשובות מפורטות:** פרק לפסקאות קצרות עם שורות ריקות ביניהן
5. השתמש ברשימות עם תבליטים (•) כשמתאים בתשובות מפורטות
6. הוסף כותרות עם אימוג'ים רק בתשובות מפורטות
7. אל תעטוף את התשובה כולה בגרשיים - כתוב אותה ישירות

**עקרון הזהב: תמיד התחל מהתשובה הקצרה ביותר!**
- השאלה "כמה X יש לי?" = מספר + אימוג'י
- השאלה "מתי X?" = תאריך/שעה + אימוג'י  
- השאלה "איזה X הכי Y?" = שם + אימוג'י
- רק אם יש בקשה מפורשת לפירוט - תן טבלאות וגרפים

השתמש בסיכומים המדויקים שלמעלה לחישובים (הם כבר מחושבים נכון!).
אם השאלה אינה קשורה לנתונים, הסבר בנימוס שאתה מספק מענה רק על שאלות הקשורות לפרויקטים, לקוחות, שעות עבודה, הכנסות, משימות, אנשי צוות וסטטיסטיקות מהמערכת.
`.trim();

  console.log("שולח לגמיני עם נתונים מעובדים:", prompt);
  console.log("סיכום מעובד:", processedData);

  // DEBUG: בדיקת חישוב לפרויקט "מערכת ניהול משימות"
  const projectManagementSummary = Object.values(
    processedData.projectSummaries
  ).find((p) => p.projectName === "מערכת ניהול משימות");
  if (projectManagementSummary) {
    console.log("🔍 פרויקט מערכת ניהול משימות:", projectManagementSummary);
  }

  const requestData = JSON.stringify({ prompt: prompt });
  console.log("JSON שנשלח לגמיני:", requestData);

  ajaxCall(
    "POST",
    apiConfig.createApiUrl("Gemini/ask"),
    requestData,
    function (response) {
      console.log("תשובה גולמית מהשרת:", response);
      hideTypingIndicator();
      isLoading = false;
      if (response) {
        try {
          // אם התשובה היא JSON, ננסה לחלץ את הטקסט
          let responseText;
          if (typeof response === "string") {
            try {
              const jsonResponse = JSON.parse(response);
              // חילוץ הטקסט מהמבנה המורכב של התשובה
              responseText =
                jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text ||
                response;
            } catch {
              responseText = response;
            }
          } else {
            responseText =
              response.text || response.message || JSON.stringify(response);
          }

          // ניקוי הטקסט מסימנים מיותרים ושיפור העיצוב
          responseText = responseText
            .replace(/\\n/g, "\n") // החלפת \n בשורות חדשות
            .replace(/\*\*/g, "") // הסרת **
            .replace(/\*/g, "") // הסרת *
            .replace(/\\/g, "") // הסרת \
            .replace(/\{.*?\}/g, "") // הסרת כל מה שבין סוגריים מסולסלות
            .replace(/\[.*?\]/g, "") // הסרת כל מה שבין סוגריים מרובעות
            .replace(/"candidates":.*?"text":/g, "") // הסרת החלק של candidates
            .replace(/"role":"model".*?}/g, "") // הסרת החלק של role:model
            .replace(/"finishReason".*?}/g, "") // הסרת החלק של finishReason
            .replace(/"usageMetadata".*?}/g, "") // הסרת החלק של usageMetadata
            .replace(/"modelVersion".*?}/g, "") // הסרת החלק של modelVersion
            .replace(/"responseId".*?}/g, "") // הסרת החלק של responseId
            .replace(/[{}[\]]/g, "") // הסרת כל הסוגריים הנותרים
            .replace(/,+$/g, "") // הסרת פסיקים בסוף הטקסט
            .replace(/^,+/, "") // הסרת פסיקים בתחילת הטקסט
            .replace(/,+/g, ",") // החלפת פסיקים מרובים בפסיק אחד
            // הסרת גרשיים עוטפים מיותרים
            .replace(/^["'](.*)["']$/s, "$1") // הסרת גרשיים בתחילה ובסוף
            .replace(/^"(.*)"/s, "$1") // הסרת גרשיים כפולים
            .replace(/^'(.*)'$/s, "$1") // הסרת גרשיים בודדים
            .trim();

          // שיפור עיצוב הטקסט לקריאה טובה יותר
          responseText = formatResponseText(responseText);

          if (responseText) {
            addMessage("assistant", responseText);
          } else {
            addMessage(
              "assistant",
              "מצטער, לא הצלחתי להבין את השאלה. תוכל לנסח אותה אחרת? 🤔"
            );
          }
        } catch (error) {
          console.error("שגיאה בעיבוד התשובה:", error);
          addMessage(
            "assistant",
            "מצטער, לא הצלחתי להבין את השאלה. תוכל לנסח אותה אחרת? 🤔"
          );
        }
      } else {
        addMessage(
          "assistant",
          "מצטער, לא הצלחתי להבין את השאלה. תוכל לנסח אותה אחרת? 🤔"
        );
      }
    },
    function (error) {
      console.error("שגיאה בשליחה לגמיני:", error);
      hideTypingIndicator();
      isLoading = false;
      addMessage(
        "assistant",
        "אופס! נתקלתי בבעיה טכנית. אנא נסה שוב בעוד רגע. 😅"
      );
    }
  );
}

function createDataDescription() {
  if (!assistantData) return "אין נתונים זמינים.";

  // שימוש בנתונים המעובדים
  const processedData = createProcessedDataSummary(assistantData);

  let description = "בהשתתפותי יש גישה לנתונים מלאים על העבודה שלך:\n\n";

  // סיכום כללי
  description += `📊 סיכום כללי:\n`;
  description += `- ${processedData.overallStats.uniqueProjects} פרויקטים פעילים\n`;
  description += `- ${processedData.overallStats.uniqueClients} לקוחות\n`;
  description += `- ${processedData.overallStats.totalSessions} סשני עבודה\n`;
  description += `- סה"כ ${processedData.overallStats.formattedTime} שעות עבודה\n`;
  description += `- סה"כ הכנסה: ₪${processedData.overallStats.totalRevenue.toLocaleString()}\n`;
  description += `- ${processedData.overallStats.totalTasks} משימות (${processedData.overallStats.totalCompletedTasks} הושלמו)\n\n`;

  // נתוני צוות (אם קיימים)
  try {
    if (
      processedData.teamOverallStats &&
      typeof processedData.teamOverallStats === "object" &&
      Object.keys(processedData.teamOverallStats).length > 0
    ) {
      const teamStats = processedData.teamOverallStats;
      description += `👥 נתוני ניטור הצוות:\n`;
      description += `- ${teamStats.totalTeamMembers || 0} אנשי צוות פעילים\n`;
      description += `- ${
        teamStats.totalProjectsWithTeam || 0
      } פרויקטים עם צוות\n`;
      description += `- ${teamStats.totalTasks || 0} משימות בצוות\n`;
      description += `- ${teamStats.totalCompletedTasks || 0} משימות הושלמו (${
        teamStats.overallCompletionRate || 0
      }%)\n`;
      description += `- ${teamStats.totalPendingTasks || 0} משימות בתהליך\n\n`;

      // פירוט אנשי צוות עם הכי הרבה משימות
      if (
        processedData.teamMemberStats &&
        Object.keys(processedData.teamMemberStats).length > 0
      ) {
        const topMembers = Object.entries(processedData.teamMemberStats)
          .sort(
            ([, a], [, b]) => (b.completedTasks || 0) - (a.completedTasks || 0)
          )
          .slice(0, 3);

        if (topMembers.length > 0) {
          description += `🏆 אנשי הצוות המובילים:\n`;
          topMembers.forEach(([memberId, stats], index) => {
            description += `${index + 1}. ${stats.memberName || "לא ידוע"} - ${
              stats.completedTasks || 0
            } משימות הושלמו מתוך ${stats.totalTasks || 0}\n`;
          });
          description += `\n`;
        }
      }
    }
  } catch (error) {
    console.error("שגיאה בעיבוד נתוני הצוות ב-createDataDescription:", error);
  }

  // פרויקטים מפורטים
  if (Object.keys(processedData.projectSummaries).length > 0) {
    description += "📁 פרויקטים מפורטים:\n";
    Object.entries(processedData.projectSummaries)
      .sort(([, a], [, b]) => b.totalRevenue - a.totalRevenue)
      .forEach(([projectId, project]) => {
        description += `- "${project.projectName}" של ${project.clientName}: ${
          project.formattedTime
        } שעות, ₪${Math.round(project.totalRevenue).toLocaleString()} הכנסה\n`;
      });
    description += "\n";
  }

  // סיכום משימות לפי פרויקט
  if (Object.keys(processedData.taskSummaries).length > 0) {
    description += "📋 מצב משימות לפי פרויקט:\n";
    Object.entries(processedData.taskSummaries).forEach(
      ([projectId, tasks]) => {
        description += `- "${tasks.projectName}": ${tasks.totalTasks} משימות (${tasks.completedTasks} הושלמו, ${tasks.pendingTasks} בתהליך, ${tasks.completionRate}% השלמה)\n`;
      }
    );
    description += "\n";
  }

  // פירוט צוות לפי פרויקט (אם קיים)
  if (Object.keys(processedData.projectTeamStats).length > 0) {
    description += "👥 צוות לפי פרויקט:\n";
    Object.entries(processedData.projectTeamStats).forEach(
      ([projectId, teamInfo]) => {
        description += `- "${teamInfo.projectName}": ${teamInfo.teamMemberCount} אנשי צוות, ${teamInfo.totalTasks} משימות (${teamInfo.completionRate}% השלמה)\n`;
        teamInfo.memberDetails.forEach((member) => {
          description += `  * ${member.memberName}: ${member.totalTasks} משימות (${member.completedTasks} הושלמו)\n`;
        });
      }
    );
    description += "\n";
  }

  description +=
    "אני יכול לענות על שאלות מפורטות על כל הנתונים האלה, ליצור גרפים, טבלאות ולעשות השוואות מתקדמות!";

  return description;
}

function calculateDuration(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end - start;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffHours > 0) {
    return `${diffHours} שעות ו-${diffMinutes} דקות`;
  } else {
    return `${diffMinutes} דקות`;
  }
}

function formatResponseText(text) {
  if (!text) return text;

  // שיפור פיסוק והצגה
  let formattedText = text
    // מוודאים שורות ריקות בין פסקאות
    .replace(/\n\n+/g, "\n\n")
    // מוודאים רווח אחרי נקודות
    .replace(/\.\s*([א-ת])/g, ". $1")
    // שורות חדשות אחרי נקודות בסוף משפט ארוך
    .replace(/\. ([א-ת][^.]{40,})/g, ".\n\n$1")
    // שיפור הצגת טבלאות HTML
    .replace(/<table>/g, '<table class="assistant-table">')
    .replace(/<\/table>/g, "</table>")
    .replace(/<tr>/g, "<tr>")
    .replace(/<\/tr>/g, "</tr>")
    .replace(/<th>/g, "<th>")
    .replace(/<\/th>/g, "</th>")
    .replace(/<td>/g, "<td>")
    .replace(/<\/td>/g, "</td>")
    // שיפור הצגת גרפים Chart.js
    .replace(/<div class="chart-container">/g, '<div class="chart-container">')
    .replace(/<canvas/g, "<canvas")
    .replace(/<\/canvas>/g, "</canvas>")
    .replace(/<script>/g, "<script>")
    .replace(/<\/script>/g, "</script>")
    // הסרת שורות ריקות מיותרות לפני טבלאות וגרפים
    .replace(/(<br\s*\/?>)+\s*<table/gi, "<table")
    .replace(/\n+\s*<table/g, "\n<table")
    .replace(
      /(<br\s*\/?>)+\s*<div class="chart-container"/gi,
      '<div class="chart-container"'
    )
    .replace(
      /\n+\s*<div class="chart-container"/g,
      '\n<div class="chart-container"'
    )
    // שורה חדשה אחרי אימוג'ים עם כותרות (אבל לא לפני טבלאות)
    .replace(
      /(📊|📈|🎯|💰|👥|✅|⚠️|🏆|📋|📅|⭐)\s*([א-ת][^:\n]*:)(?!\s*<table)/g,
      "\n\n$1 $2\n"
    )
    // ניקוי רווחים מיותרים (אבל לא בתוך טגי HTML)
    .replace(/[ \t]+/g, " ")
    .trim();

  return formattedText;
}

function addMessage(sender, text) {
  // שמירת ההודעה ב-localStorage
  saveChatMessage(sender, text);

  // הוספת ההודעה לממשק
  addMessageToUI(sender, text);
}

function createSimpleChart(element) {
  const $element = $(element);
  const type = $element.data("type") || "bar";
  const labels = ($element.data("labels") || "").split(",");
  const values = ($element.data("values") || "")
    .split(",")
    .map((v) => parseFloat(v) || 0);
  const colors = ($element.data("colors") || "#4a90e2").split(",");

  // יצירת canvas חדש
  const canvasId = "simple_chart_" + Math.random().toString(36).substr(2, 9);
  const canvas = $('<canvas id="' + canvasId + '"></canvas>');

  $element.html("").append(canvas).addClass("chart-container");

  try {
    new Chart(document.getElementById(canvasId), {
      type: type,
      data: {
        labels: labels,
        datasets: [
          {
            label: "נתונים",
            data: values,
            backgroundColor: colors,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: labels.length > 1,
            position: "bottom",
          },
        },
        scales:
          type === "bar"
            ? {
                y: {
                  beginAtZero: true,
                  grid: {
                    display: true,
                    color: "rgba(0,0,0,0.1)",
                  },
                },
                x: {
                  grid: {
                    display: false,
                  },
                },
              }
            : {},
      },
    });
    console.log("✅ גרף פשוט נוצר בהצלחה");
  } catch (error) {
    console.error("❌ שגיאה ביצירת גרף פשוט:", error);
    $element.html(
      '<div style="text-align: center; padding: 20px; background: #ffe6e6; border: 1px solid #ffcccc; border-radius: 8px;">❌ שגיאה ביצירת גרף</div>'
    );
  }
}

function executeChartScripts() {
  // ראשית, טיפול בגרפים פשוטים
  $("#chat-messages .chart-placeholder").each(function () {
    createSimpleChart(this);
  });

  // חיפוש כל הסקריפטים שנוספו להודעות ורנדור הגרפים
  console.log("מחפש סקריפטים לגרפים...");

  // ראשית, ננסה למצוא canvas elements ולבדוק אם יש להם ID
  $("#chat-messages canvas").each(function () {
    const canvasId = $(this).attr("id");
    console.log("מצא canvas עם ID:", canvasId);

    if (canvasId && canvasId.startsWith("chart_")) {
      // בדוק אם הגרף כבר קיים
      if (
        window.Chart &&
        window.Chart.getChart &&
        window.Chart.getChart(canvasId)
      ) {
        console.log("הגרף כבר קיים:", canvasId);
        return;
      }

      // חפש את הסקריפט המתאים
      const scriptElement = $(this).parent().find("script");
      if (scriptElement.length > 0) {
        try {
          let scriptContent = scriptElement.html();
          console.log(
            "מצא סקריפט לגרף:",
            scriptContent.substring(0, 100) + "..."
          );

          // ניקוי הסקריפט מקודים HTML
          scriptContent = scriptContent
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");

          console.log("מריץ סקריפט גרף...");

          // בדיקה נוספת שChart.js זמין
          if (typeof Chart === "undefined") {
            console.warn("Chart.js לא זמין, משתמש בהודעת שגיאה");
            $(this).replaceWith(
              '<div style="text-align: center; padding: 20px; background: #f8f9fa; border: 1px solid #ddd; border-radius: 8px;">⚠️ גרף לא זמין - Chart.js לא נטען</div>'
            );
          } else {
            try {
              // הרצת הסקריפט עם טיפול משופר בשגיאות
              console.log("מנסה להריץ סקריפט:", scriptContent);
              eval(scriptContent);
              console.log("הסקריפט הורץ בהצלחה");
            } catch (evalError) {
              console.error("שגיאה ב-eval:", evalError);
              console.error("סקריפט שגוי:", scriptContent);
              $(this).replaceWith(
                '<div style="text-align: center; padding: 20px; background: #ffe6e6; border: 1px solid #ffcccc; border-radius: 8px;">❌ שגיאה בקוד הגרף: ' +
                  evalError.message +
                  "</div>"
              );
            }
          }
        } catch (error) {
          console.error("שגיאה ברנדור גרף:", error);
          console.error("תוכן הסקריפט:", scriptElement.html());
          // החלפת הcanvas בהודעת שגיאה
          $(this).replaceWith(
            '<div style="text-align: center; padding: 20px; background: #ffe6e6; border: 1px solid #ffcccc; border-radius: 8px;">❌ שגיאה בטעינת הגרף</div>'
          );
        }
      }
    }
  });

  // פתרון חלופי - חיפוש כל הסקריפטים
  $("#chat-messages script").each(function () {
    try {
      let scriptContent = $(this).html();

      if (scriptContent.includes("Chart(")) {
        // ניקוי הסקריפט מקודים HTML
        scriptContent = scriptContent
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");

        console.log("מריץ סקריפט גרף (פתרון חלופי)...");
        // הרצת הסקריפט
        eval(scriptContent);
        console.log("הסקריפט הורץ בהצלחה");
      }
    } catch (error) {
      console.error("שגיאה ברנדור גרף:", error);
      console.error("תוכן הסקריפט:", $(this).html());
    }
  });
}

function addMessageToUI(sender, text) {
  const messageClass = sender === "user" ? "message user" : "message assistant";

  // אם זו הודעת עוזר, נאפשר HTML (כולל טבלאות)
  let processedText;
  if (sender === "assistant") {
    // בדיקה אם זו הודעת כפתורי FAQ - אם כן, לא נוסיף BR
    if (text.includes("faq-buttons") || text.includes("faq-row")) {
      processedText = text;
    } else {
      // נחליף רק שורות חדשות שלא בתוך טגי HTML
      processedText = text
        .replace(/\n(?![^<]*>)/g, "<br>")
        // הסרת BR מיותרים לפני טבלאות וגרפים
        .replace(/(<br\s*\/?>)+\s*<table/gi, "<table")
        .replace(/\s*<br\s*\/?>\s*<table/gi, "<table")
        .replace(
          /(<br\s*\/?>)+\s*<div class="chart-container"/gi,
          '<div class="chart-container"'
        )
        .replace(
          /\s*<br\s*\/?>\s*<div class="chart-container"/gi,
          '<div class="chart-container"'
        );
    }
  } else {
    // עבור הודעות משתמש, נמיר הכל לטקסט בטוח
    processedText = text.replace(/\n/g, "<br>");
  }

  const messageHtml = `<div class="${messageClass}">${processedText}</div>`;
  $("#chat-messages").append(messageHtml);

  // אם זו הודעת עוזר וכוללת גרפים, נרנדר אותם
  if (
    sender === "assistant" &&
    (text.includes("chart_") || text.includes("chart-placeholder"))
  ) {
    // בדיקה שChart.js נטען
    if (typeof Chart === "undefined") {
      console.error("Chart.js לא נטען!");
      // נוסיף הודעת שגיאה במקום הגרף
      setTimeout(() => {
        $("#chat-messages .chart-container canvas").each(function () {
          $(this).replaceWith(
            '<div style="text-align: center; padding: 20px; background: #f0f0f0; border-radius: 8px;">⚠️ שגיאה בטעינת הגרף - Chart.js לא זמין</div>'
          );
        });
      }, 100);
    } else {
      setTimeout(() => {
        executeChartScripts();
      }, 200); // זמן יותר ארוך לוודא שהDOM מוכן
    }
  }

  scrollToBottom();
}

function showTypingIndicator() {
  const typingHtml =
    '<div class="message assistant typing-indicator" id="typing">העוזר כותב...</div>';
  $("#chat-messages").append(typingHtml);
  scrollToBottom();
}

function hideTypingIndicator() {
  $("#typing").remove();
}

function scrollToBottom() {
  const chatMessages = $("#chat-messages");
  chatMessages.scrollTop(chatMessages[0].scrollHeight);
}

function showLoading(show) {
  if (show) {
    $("#loading-indicator").show();
  } else {
    $("#loading-indicator").hide();
  }
}

function hideLoading() {
  $("#loading-indicator").hide();
}

// פונקציה לשליחת שאלות נפוצות
function sendFAQQuestion(question) {
  if (isLoading) return;

  // הוספת השאלה לצ'אט כהודעת משתמש
  addMessage("user", question);

  // שליחה לעוזר ישירות ללא הכנסה לתיבת הטקסט
  sendToGemini(question);
}

// הפיכת הפונקציה לגלובלית
window.sendFAQQuestion = sendFAQQuestion;
