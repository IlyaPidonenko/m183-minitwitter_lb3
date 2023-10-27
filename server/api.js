const { initializeDatabase, queryDB, insertDB } = require("./database");
const { body } = require("express-validator");
const bcrypt = require("bcrypt");
const pino = require("pino")();
const jwt = require("jsonwebtoken");
const sqlString = require("sqlstring");
const AesEncryption = require("aes-encryption");
const aes = new AesEncryption();
aes.setSecretKey(
  process.env.SECRET ||
    "11122233344455566677788822244455555555555555555231231321313aaaff"
);

let db;

const authMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).json({ error: "No authorization header." });
  }
  const [prefix, token] = authorization.split(" ");
  if (prefix !== "Bearer") {
    return res.status(401).json({ error: "Invalid authorization prefix." });
  }
  const tokenValidation = jwt.verify(token, jwtSecret);
  if (!tokenValidation?.data) {
    return res.status(401).json({ error: "Invalid token." });
  }
  next();
};

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
  app.get("/api/feed", authMiddleware, getFeed);
  app.post(
    "/api/feed",
    authMiddleware,
    body("username").escape().notEmpty().withMessage("username is required."),
    body("timestamp").escape().notEmpty().withMessage("timestamp is required."),
    body("text").escape().notEmpty().withMessage("text is required."),
    postTweet
  );
};

const getFeed = async (req, res) => {
  const query = "SELECT * FROM tweets ORDER BY id DESC;";
  const tweets = await queryDB(db, query);

  res.json(tweets);
};

function containsInjection(str) {
  const htmlAndSqlPattern = /<[^>]*>|(\bSELECT|INSERT|UPDATE|DELETE|FROM|WHERE|DROP|ALTER|CREATE|TABLE|script)\b/i;
  return htmlAndSqlPattern.test(str);
}

const postTweet = async (req, res) => {
  const { username, timestamp, text } = req.body;

  if (containsInjection(text) === true) {
    res.json({ status: "ok" });
  } else {
    try {
      const encryptedText = aes.encrypt(text);
      const query = `INSERT INTO tweets (username, timestamp, text) VALUES ('${username}', '${timestamp}', '${encryptedText}')`;
      await queryDB(db, query);
      res.json({ status: "ok" });
    } catch (error) {
      pino.error("Error posting tweet:", error.message);
      res.status(500).json({ error: "Internal Server Error." });
    }
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  const user = await queryDB(db, query);

  if (user.length === 1) {
    const username = user[0].username;

    const jwtSecret = "supersecret";
    const token = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        data: username,
      },
      jwtSecret
    );
    res.json({ token });
  } else {
    res.status(401).json({ error: "The password or the username are false" });
  }
};

module.exports = { initializeAPI };
