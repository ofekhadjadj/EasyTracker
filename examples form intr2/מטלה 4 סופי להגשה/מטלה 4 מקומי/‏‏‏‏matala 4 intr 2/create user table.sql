CREATE TABLE [UsersTable2025] (
    [id] smallint IDENTITY (1, 1) NOT NULL PRIMARY KEY,
	[Email] NVARCHAR(255) NOT NULL UNIQUE,
	[Password] NVARCHAR(255) NOT NULL,
    [Name] NVARCHAR(255) NOT NULL,
	[CreatedAt] DATETIME DEFAULT GETDATE()
);

drop table [UsersTable2025]

select * from UsersTable2025

INSERT INTO [UsersTable2025](Email,Password,Name)
values('ofek.haghag2@gmail.com','1234556','Offek Moshe Hadjadj')


TRUNCATE TABLE [UsersTable2025];
