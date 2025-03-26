select * from UsersTable2025
exec GetUsersWithGameStats

select * from GamesUser2025
select AppID, Name, numberOfPurchases from GamesTable2025



select AppID, numberOfPurchases, Price, Score_rank from GamesTable2025



TRUNCATE TABLE GamesUser2025

UPDATE GamesTable2025
SET numberOfPurchases = 0

