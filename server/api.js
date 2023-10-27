const { initializeDatabase, queryDB, insertDB } = require("./database");
const { body } = require("express-validator");
const bcrypt = require("bcrypt");
const pino = require("pino")();

let db;

const initializeAPI = async (app) => {
  db = await initializeDatabase();
  app.get("/api/feed", getFeed);
  app.post("/api/feed", postTweet);
  app.post(
    "/api/login",
    body("username")
      .notEmpty()
      .withMessage("Username is required.")
      .isEmail()
      .withMessage("Invalid email format.")
      .escape(),
    body("password")
      .isLength({ min: 10, max: 64 })
      .withMessage("Password must be between 10 to 64 characters.")
      .escape(),
    login
  );
};

const getFeed = async (req, res) => {
  const query = req.query.q;
  const tweets = await queryDB(db, query);
  res.json(tweets);
};

const postTweet = (req, res) => {
  insertDB(db, req.body.query);
  res.json({ status: "ok" });
};

const login = async (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username = '${username}'`;
  const user = await queryDB(db, query);
  
  if (user.length === 1) {
    const dbHash = user[0].password; 
    bcrypt.compare(password, dbHash, function(err, result) {
      if (result) {
        pino.info(`Successful login attempt for user: ${username}`);
        res.json(user[0]);
      } else {
        pino.error(`Failed login attempt for user: ${username}`);
        res.json(null);
      }
    });
  } else {
    res.json(null);
  }
};

module.exports = { initializeAPI };
