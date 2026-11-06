# Debugging Exercises

These exercises explain how to recognize and fix common backend development problems. They are documentation only: do not introduce these errors into the working application.

## 1. EADDRINUSE — port already in use

**Symptom:** Starting the server prints an error like `listen EADDRINUSE: address already in use :::3000`.

**How to investigate:**

1. Check whether another terminal already has this API running.
2. On Windows, inspect the process using the port with `netstat -ano | findstr :3000`.
3. Match the PID shown by `netstat` with `Get-Process -Id <PID>` before taking action.

**How to fix:** Stop the server you started in its original terminal, or select a different port by setting `PORT` before starting the app. Do not terminate an unknown process. For example, in PowerShell:

```powershell
$env:PORT = "3001"
npm start
```

## 2. Wrong import path

**Symptom:** Node.js reports `Cannot find module './database'` or a similar `MODULE_NOT_FOUND` error.

**How to investigate:** Read the require/import statement and compare its relative path and spelling with the actual file location. Relative paths are resolved from the importing file, not from the terminal's current directory.

**How to fix:** Correct the relative path and filename case/spelling. In this project, `server.js` and `database.js` are in the same folder, so `require("./database")` is the appropriate relative import.

## 3. SQLite error: no such table

**Symptom:** A query fails with `SQLITE_ERROR: no such table: books`.

**How to investigate:**

1. Confirm the application opened the intended `books.db` file. This project resolves it relative to `database.js`.
2. Check that the database initialization ran and that the table name matches the SQL query.
3. Confirm `CREATE TABLE IF NOT EXISTS books ...` completed before route queries ran.

**How to fix:** Initialize the schema against the intended database before serving requests. This project awaits `initializeDatabase()` before calling `app.listen()`. Avoid creating a separate empty database from a different working directory.

## 4. Missing `await` in asynchronous database operations

**Symptom:** A route returns before a database query finishes, sends an incomplete result, or reports an unhandled rejection.

**How to investigate:** Trace the database function call and check whether the route waits for its Promise. Compare the order of the insert, follow-up select, and response.

**How to fix:** Await each dependent database operation inside an `async` handler. For example:

```js
const result = await run(
  "INSERT INTO books (title, author, price) VALUES (?, ?, ?)",
  [title, author, price]
);
const book = await get("SELECT * FROM books WHERE id = ?", [result.lastID]);
res.status(201).json({ message: "Book created successfully", data: book });
```

The route wrapper forwards rejected Promises to the centralized error handler, which reports unexpected errors as JSON HTTP 500 responses.
