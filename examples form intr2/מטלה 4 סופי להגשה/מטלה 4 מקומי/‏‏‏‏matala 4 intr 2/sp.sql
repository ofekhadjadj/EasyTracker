-- sp for add game to my games 
-- ================================================
-- Template generated from Template Explorer using:
-- Create Procedure (New Menu).SQL
--
-- Use the Specify Values for Template Parameters 
-- command (Ctrl-Shift-M) to fill in the parameter 
-- values below.
--
-- This block of comments will not be included in
-- the definition of the procedure.
-- ================================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<ofek and arye>
-- Create date: <11.1.25>
-- Description:	<sp for add game to my games >
-- =============================================
CREATE PROCEDURE SP_addGameToMyGames 
	@userID smallint,
	@gameID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	-- SET NOCOUNT ON;

    -- Insert statements for procedure here
	 INSERT INTO [GamesUser2025] (
        [AppID],
        [UserID])
		values(@gameID,@userID)

	 UPDATE GamesTable2025
	 SET numberOfPurchases = numberOfPurchases+1
	 WHERE AppID=@gameID

END
GO


exec SP_addGameToMyGames 1,12140
exec SP_addGameToMyGames 2,12140
exec SP_addGameToMyGames 1,22670



-- sp for remove game from my games 
-- ================================================
-- Template generated from Template Explorer using:
-- Create Procedure (New Menu).SQL
--
-- Use the Specify Values for Template Parameters 
-- command (Ctrl-Shift-M) to fill in the parameter 
-- values below.
--
-- This block of comments will not be included in
-- the definition of the procedure.
-- ================================================
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<ofek and arye>
-- Create date: <11.1.25>
-- Description:	<sp for remove game form my games  >
-- =============================================
ALTER PROCEDURE SP_RemoveGameFromMyGames 
	@userID smallint,
	@gameID int
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	-- SET NOCOUNT ON;

    -- Insert statements for procedure here
	 UPDATE GamesTable2025
	 SET numberOfPurchases = numberOfPurchases-1
	 FROM GamesTable2025 G inner join GamesUser2025 GU ON G.AppID = GU.AppID
	 WHERE G.AppID=@gameID and GU.UserID=@userID

	 DELETE FROM GamesUser2025
	 WHERE UserID=@userID AND AppID=@gameID

END
GO


exec SP_RemoveGameFromMyGames 1,12140
























-- sp for add new user
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<ofek and arye>
-- Create date: <11.1.25>
-- Description:	<sp for add new user >
-- =============================================
ALTER PROCEDURE SP_addNewUser 
    @Email NVARCHAR(255) ,
	@Password NVARCHAR(255) ,
    @Name NVARCHAR(255)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	-- SET NOCOUNT ON;

    -- Insert statements for procedure here
	INSERT INTO [UsersTable2025](Email,Password,Name)
	values(@Email,@Password,@Name)

END
GO

exec SP_addNewUser  'admin@admin.com ','ADMIN1234','Admin'
select * from UsersTable2025













-- sp for get user
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<ofek and arye>
-- Create date: <12.1.25>
-- Description:	<sp for get user >
-- =============================================
CREATE PROCEDURE SP_GetUser 
    @Email NVARCHAR(255) ,
	@Password NVARCHAR(255)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	-- SET NOCOUNT ON;

    -- Insert statements for procedure here
	select *
	from userstable2025
	where Email=@Email and Password=@Password

END
GO


select * from userstable2025









-- sp for get all games
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<ofek and arye>
-- Create date: <13.1.25>
-- Description:	<sp for get all games >
-- =============================================
CREATE PROCEDURE GetAllGames
AS
BEGIN
    SELECT * FROM GamesTable2025;       
END;
GO

exec GetAllGames





-- sp for get all users
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<ofek and arye>
-- Create date: <13.1.25>
-- Description:	<sp for get all users >
-- =============================================
CREATE PROCEDURE GetAllUsers
AS
BEGIN
    SELECT * FROM UsersTable2025;       
END;
GO


exec GetAllUsers






-- sp for get all games not linked to user
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<ofek and arye>
-- Create date: <14.1.25>
-- Description:	<sp for get all games not linked to user >
-- =============================================
ALTER PROCEDURE GetGamesNotLinkedToUser
	@UserID INT
AS
BEGIN
    SELECT *
	FROM GamesTable2025 G LEFT JOIN GamesUser2025 GU
	ON G.AppID = GU.AppID AND GU.UserID = @UserID
	WHERE GU.AppID IS NULL;      
END;
GO

exec GetGamesNotLinkedToUser 2




-- sp for get the user's games
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<ofek and arye>
-- Create date: <12.1.25>
-- Description:	<sp for get the user's games >
-- =============================================
CREATE PROCEDURE SP_GetGamesByUserId
    @userID smallint
	
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	-- SET NOCOUNT ON;

    -- Insert statements for procedure here
	select	G.AppID,
			G.Name, 
			G.Release_date, 
			G.Price, 
			G.Description, 
			G.Header_image, 
			G.Website, 
			G.Windows, 
			G.Mac, 
			G.Linux, 
			G.Score_rank, 
			G.Recommendations, 
			G.Developers,
			G.numberOfPurchases
	FROM GamesTable2025 G inner join GamesUser2025 GU ON G.AppID = GU.AppID
	WHERE GU.UserID=@userID

END
GO

exec SP_GetGamesByUserId 4







-- sp for get games by minimum price
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<ofek and arye>
-- Create date: <12.1.25>
-- Description:	<sp for get games by minimum price >
-- =============================================
CREATE PROCEDURE SP_GetGamesByMinPrice
	@UserID INT,
    @Price DECIMAL(10, 2)
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	-- SET NOCOUNT ON;

    -- Insert statements for procedure here
	SELECT *
	FROM GamesTable2025 G LEFT JOIN GamesUser2025 GU
	ON G.AppID = GU.AppID AND GU.UserID = @UserID
	WHERE GU.AppID IS NOT NULL and Price >= @Price; 

END
GO

exec SP_GetGamesByMinPrice 40







-- sp for get games by minimum rank
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<ofek and arye>
-- Create date: <12.1.25>
-- Description:	<sp for get games by minimum rank >
-- =============================================
CREATE PROCEDURE SP_GetGamesByMinRank
	@UserID INT,
	@RankScore INT
AS
BEGIN
    SELECT *
	FROM GamesTable2025 G LEFT JOIN GamesUser2025 GU
	ON G.AppID = GU.AppID AND GU.UserID = @UserID
	WHERE GU.AppID IS NOT NULL and Score_rank >= @RankScore;      
END;
GO

exec SP_GetGamesByMinRank 1000






ALTER TABLE UsersTable2025
ADD isActive BIT DEFAULT 1 NOT NULL;


select * from UsersTable2025



-- sp for update user is active
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<ofek and arye>
-- Create date: <19.1.25>
-- Description:	<sp for update user is active >
-- =============================================
CREATE PROCEDURE SP_UpdateUserIsActive
	@UserID INT,
	@isActive BIT
AS
BEGIN
    UPDATE UsersTable2025
	SET isActive = @isActive
	WHERE id = @UserID   
END;
GO

exec SP_UpdateUserIsActive 1,1


-- sp 
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<ofek and arye>
-- Create date: <19.1.25>
-- Description:	<SP which returns all users with 
				--the following information per each user: 
				--id, username, number of games they bought, 
				--the amount of money the user spent on the games, 
				--and the isActive field. >
-- =============================================
CREATE PROCEDURE GetUsersWithGameStats
AS
BEGIN
    SELECT 
        U.id AS UserID,
        U.Name AS UserName,
        COUNT(GU.AppID) AS NumberOfGamesBought,
        ISNULL(SUM(G.Price), 0) AS TotalAmountSpent,
        U.isActive
    FROM 
        UsersTable2025 U
    LEFT JOIN 
        GamesUser2025 GU ON U.id = GU.UserID
    LEFT JOIN 
        GamesTable2025 G ON GU.AppID = G.AppID
    GROUP BY 
        U.id, U.Name, U.isActive
    ORDER BY 
        U.Name; -- למיין לפי שם המשתמש
END;

exec GetUsersWithGameStats


-- sp 
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		<ofek and arye>
-- Create date: <19.1.25>
-- Description:	<SP which returns all games with the following fields: 
				--id, title, number of downloads and total amount users paid for this game.
-- =============================================
ALTER PROCEDURE GetGamesWithStats
AS
BEGIN
    SELECT 
        G.AppID AS GameID,
        G.Name AS Title,
        COUNT(GU.UserID) AS NumberOfDownloads,
        ISNULL(SUM(CASE WHEN GU.UserID IS NOT NULL THEN G.Price ELSE 0 END), 0) AS TotalAmountPaid
    FROM 
        GamesTable2025 G
    LEFT JOIN 
        GamesUser2025 GU ON G.AppID = GU.AppID
    GROUP BY 
        G.AppID, G.Name
    ORDER BY 
        G.AppID;
END;

exec GetGamesWithStats




select g.AppID, g.Name, g.Price, gu.UserID
FROM 
        GamesTable2025 G
    LEFT JOIN 
        GamesUser2025 GU ON G.AppID = GU.AppID
    GROUP BY 
        G.AppID, G.Name
