const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "database1",
});

db.connect((error) => {
  if (error) {
    console.error("Error connecting to MySQL database: " + error);
  } else {
    console.log("Connected to MySQL database");
  }
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;

  db.query("SELECT username FROM users", (err, results) => {
    if (err) throw err;
    if (results.some((user) => user.username === username)) return;
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.query(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashedPassword],
      (err, _) => {
        if (err) {
          console.error("Error registering user: " + err.stack);
          res.status(500).send("Error registering user");
          return;
        }
        res.status(200).send("Registration successful");
      }
    );
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT id, username, password FROM users WHERE username = ?",
    [username],
    (err, results) => {
      if (err) {
        console.error("Error querying user: " + err.stack);
        res.status(500).send("Error querying user");
        return;
      }

      if (results.length > 0) {
        const user = results[0];
        if (bcrypt.compareSync(password, user.password)) {
          res.status(200).send("Login successful");
        } else {
          res.status(401).send("Invalid password");
        }
      } else {
        res.status(404).send("User not found");
      }
    }
  );
});

app.get("/items", (req, res) => {
  db.query("SELECT * FROM items", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.post("/items", (req, res) => {
  const { name, description } = req.body;
  db.query(
    "INSERT INTO items (name, description) VALUES (?, ?)",
    [name, description],
    (err, _) => {
      if (err) throw err;
      res.json({ message: "Item added successfully" });
    }
  );
});

app.put("/items/:id", (req, res) => {
  const { name, description } = req.body;
  const { id } = req.params;
  db.query(
    "UPDATE items SET name = ?, description = ? WHERE id = ?",
    [name, description, id],
    (err, _) => {
      if (err) throw err;
      res.json({ message: "Item updated successfully" });
    }
  );
});

app.delete("/items/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM items WHERE id = ?", [id], (err, _) => {
    if (err) throw err;
    res.json({ message: "Item deleted successfully" });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
