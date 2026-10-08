CREATE TABLE players (name TEXT PRIMARY KEY, distance_cm INTEGER NOT NULL CHECK(distance_cm > 0), updated_at TEXT NOT NULL);
CREATE TABLE history (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, previous_cm INTEGER, distance_cm INTEGER NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX history_name ON history(name, id DESC);
CREATE TRIGGER first_record AFTER INSERT ON players BEGIN
 INSERT INTO history(name, previous_cm, distance_cm, updated_at) VALUES(NEW.name, NULL, NEW.distance_cm, NEW.updated_at);
END;
CREATE TRIGGER improved_record AFTER UPDATE ON players WHEN NEW.distance_cm > OLD.distance_cm BEGIN
 INSERT INTO history(name, previous_cm, distance_cm, updated_at) VALUES(NEW.name, OLD.distance_cm, NEW.distance_cm, NEW.updated_at);
END;
