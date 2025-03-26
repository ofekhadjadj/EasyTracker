CREATE TABLE [GamesTable2025] (
    [id] smallint IDENTITY (1, 1) NOT NULL ,
	[AppID] INT PRIMARY KEY,
    [Name] NVARCHAR(255) NOT NULL,
    [Release_date] DATE,
    [Price] DECIMAL(10, 2),
    [Description] NVARCHAR(MAX),
    [Full_audio_languages] NVARCHAR(MAX),
    [Header_image] NVARCHAR(2083),
    [Website] NVARCHAR(2083),
    [Windows] NVARCHAR(10),
    [Mac] NVARCHAR(10),
    [Linux] NVARCHAR(10),
    [Score_rank] INT,
    [Recommendations] NVARCHAR(MAX),
    [Developers] NVARCHAR(255),
    [Categories] NVARCHAR(MAX),
    [Genres] NVARCHAR(MAX),
    [Tags] NVARCHAR(MAX),
    [Screenshots] NVARCHAR(MAX)
);




INSERT INTO [GamesTable2025] (
    [AppID], 
    [Name], 
    [Release_date], 
    [Price], 
    [Description], 
    [Full_audio_languages], 
    [Header_image], 
    [Website], 
    [Windows], 
    [Mac], 
    [Linux], 
    [Score_rank], 
    [Recommendations], 
    [Developers], 
    [Categories], 
    [Genres], 
    [Tags], 
    [Screenshots]
)
VALUES (
    20253400, 
    'GalGASFGSFGactic Bowling', 
    '2008-10-21', 
    19.99, 
    'Galactic Bowling is an exaggerated and stylized bowling game with an intergalactic twist. Players will engage in fast-paced single and multi-player competition while being submerged in a unique new universe filled with over-the-top humor, wild characters, unique levels, and addictive game play.', 
    '[English]', 
    'https://cdn.akamai.steamstatic.com/steam/apps/20200/header.jpg?t=1640121033', 
    'http://www.galacticbowling.net', 
    'TRUE', 
    'FALSE', 
    'FALSE', 
    11, 
    NULL, 
    'Perpetual FX Creative', 
    'Single-player,Multi-player,Steam Achievements,Partial Controller Support', 
    'Casual,Indie,Sports', 
    'Indie,Casual,Sports,Bowling', 
    'https://cdn.akamai.steamstatic.com/steam/apps/20200/0000005994.1920x1080.jpg?t=1640121033,https://cdn.akamai.steamstatic.com/steam/apps/20200/0000005993.1920x1080.jpg?t=1640121033'
);


select * from GamesTable2025


ALTER TABLE [GamesTable2025]
ADD [numberOfPurchases] INT NOT NULL DEFAULT 0;



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
-- Create date: <05.1.25>
-- Description:	<Add game to gamestable>
-- =============================================
CREATE PROCEDURE [InsertNewGame2025]
    @AppID INT,
    @Name NVARCHAR(255),
    @Release_date DATE,
    @Price DECIMAL(10, 2),
    @Description NVARCHAR(MAX),
    @Header_image NVARCHAR(2083),
    @Website NVARCHAR(2083),
    @Windows NVARCHAR(10),
    @Mac NVARCHAR(10),
    @Linux NVARCHAR(10),
    @Score_rank INT,
    @Recommendations NVARCHAR(MAX),
    @Developers NVARCHAR(255)
AS
BEGIN
    -- הוספת המשחק החדש
    INSERT INTO [GamesTable2025] (
        [AppID],
        [Name],
        [Release_date],
        [Price],
        [Description],
        [Header_image],
        [Website],
        [Windows],
        [Mac],
        [Linux],
        [Score_rank],
        [Recommendations],
        [Developers],
        [numberOfPurchases]
    )
    VALUES (
        @AppID,
        @Name,
        @Release_date,
        @Price,
        @Description,
        @Header_image,
        @Website,
        @Windows,
        @Mac,
        @Linux,
        @Score_rank,
        @Recommendations,
        @Developers,
        0 
    );
END;




EXEC [InsertNewGame2025]
    @AppID = 240255301,
    @Name = N'arye game',
    @Release_date = '2025-01-10',
    @Price = 49.99,
    @Description = N'This is an exciting new intergalactic adventure game!',
    @Header_image = N'https://example.com/galactic_adventures.jpg',
    @Website = N'https://galacticadventures.com',
    @Windows = N'TRUE',
    @Mac = N'TRUE',
    @Linux = N'FALSE',
    @Score_rank = 15,
    @Recommendations = N'Recommended by 500 players',
    @Developers = N'Galactic Studios'




	

	DROP PROCEDURE [InsertNewGame2025];
	TRUNCATE TABLE [GamesTable2025];

	ALTER TABLE GamesTable2025
DROP COLUMN [Full_audio_languages], [Categories],[Genres],[Tags],[Screenshots] ;


[Full_audio_languages], 
    [Header_image], 
    [Website], 
    [Windows], 
    [Mac], 
    [Linux], 
    [Score_rank], 
    [Recommendations], 
    [Developers], 
    [Categories], 
    [Genres], 
    [Tags], 
    [Screenshots]