const sqlite3 = require("sqlite3").verbose();
const pino = require("pino")();
const bcrypt = require("bcrypt");

console.log(bcrypt.hashSync("123456", 0))

const tweetsTableExists =
  "SELECT name FROM sqlite_master WHERE type='table' AND name='tweets'";
const createTweetsTable = `CREATE TABLE tweets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  timestamp TEXT,
  text TEXT
)`;
const usersTableExists =
  "SELECT name FROM sqlite_master WHERE type='table' AND name='users'";
const createUsersTable = `CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  password TEXT
)`;
const seedUsersTable = `INSERT INTO users (username, password) VALUES
  ('switzerchees', '${bcrypt.hashSync('123456', 10)}'),
  ('john', '${bcrypt.hashSync('123456', 10)}'),
  ('jane', '${bcrypt.hashSync('123456', 10)}')
`;


const initializeDatabase = async () => {
  const db = new sqlite3.Database("./minitwitter.db");
  db.serialize(() => {
    db.get(tweetsTableExists, [], async (err, row) => {
      if (err) {
        pino.error(`Error checking tweets table: ${err.message}`);
        return console.error(err.message);
      }
      if (!row) {
        pino.info("Creating tweets table.");
        await db.run(createTweetsTable);
      }
    });
    db.get(usersTableExists, [], async (err, row) => {
      if (err) {
        pino.error(`Error checking users table: ${err.message}`);
        return console.error(err.message);
      }
      if (!row) {
        pino.info("Creating users table.");
        db.run(createUsersTable, [], async (err) => {
          if (err) {
            pino.error(`Error creating users table: ${err.message}`);
            return console.error(err.message);
          }
          pino.info("Seeding users table.");
          db.run(seedUsersTable);
        });
      }
    });
  });

  return db;
};

const insertDB = (db, query) => {
  return new Promise((resolve, reject) => {
    db.run(query, [], (err, rows) => {
      if (err) {
        pino.error(`Error inserting into the database: ${err.message}`);
        return reject(err);
      }
      pino.info("Insert operation successful.");
      resolve(rows);
    });
  });
};

const queryDB = (db, query) => {
  return new Promise((resolve, reject) => {
    db.all(query, [], (err, rows) => {
      if (err) {
        pino.error(`Error querying the database: ${err.message}`);
        return reject(err);
      }
      pino.info("Query operation successful.");
      resolve(rows);
    });
  });
};

module.exports = { initializeDatabase, queryDB, insertDB };
