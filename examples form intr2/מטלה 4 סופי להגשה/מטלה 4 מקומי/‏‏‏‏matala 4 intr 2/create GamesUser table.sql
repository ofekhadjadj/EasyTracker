CREATE TABLE [GamesUser2025] (
    [id] smallint IDENTITY (1, 1) NOT NULL ,
	[AppID] INT NOT NULL,
	[UserID] smallint NOT NULL,
	PRIMARY KEY (UserID, [AppID]),       -- ����� ����� ������
    FOREIGN KEY (UserID) REFERENCES UsersTable2025([id]) ON DELETE CASCADE, -- ��� ����� �������
    FOREIGN KEY ([AppID]) REFERENCES GamesTable2025([AppID]) ON DELETE CASCADE  -- ����������������
);

select * from [GamesUser2025]
select * from GamesTable2025



UPDATE GamesTable2025
    SET numberOfPurchases = 0
    WHERE AppID�=�22670;

	TRUNCATE TABLE [GamesUser2025];
	drop table GamesUser2025