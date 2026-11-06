const path = require("node:path");
const sqlite3 = require("sqlite3").verbose();

const databasePath = path.join(__dirname, "books.db");
const db = new sqlite3.Database(databasePath);

function run(sql, parameters = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, parameters, function (error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, parameters = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, parameters, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

function all(sql, parameters = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, parameters, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

async function initializeDatabase() {
  await run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price REAL NOT NULL
    )
  `);

  const result = await get("SELECT COUNT(*) AS count FROM books");
  if (result.count === 0) {
    const sampleBooks = [
      ["Python Crash Course", "Eric Matthes", 450],
      ["Learning Node.js", "Shelley Powers", 380],
      ["Clean Code", "Robert C. Martin", 520],
      ["The Pragmatic Programmer", "David Thomas and Andrew Hunt", 600],
      ["Eloquent JavaScript", "Marijn Haverbeke", 400]
    ];

    for (const book of sampleBooks) {
      await run(
        "INSERT INTO books (title, author, price) VALUES (?, ?, ?)",
        book
      );
    }
  }
}

module.exports = { all, get, initializeDatabase, run };
