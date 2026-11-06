# Lab 3: REST API, Query Parameters, Validation & Debugging

**Course:** Backend Development Fundamentals  
**Year / Term:** II – Term II  
**Faculty:** Chintakrindi Sai Siva Teja  
**Student:** Chilamakuri Rajesh  
**Registration number:** 252U1R1061  
**Section:** CSE (CORE) – 2A  
**College:** Aurora Deemed to be University

## Technologies used

- Node.js and Express.js
- SQLite and `sqlite3`
- Postman for manual API testing
- Nodemon for development

## Installation

Install Node.js 20.17.0 or newer and npm, open a terminal in this `lab-03` folder, and run:

```powershell
npm install
```

The install creates `node_modules/`, which is excluded by `.gitignore`.

## Run the application

Start the API normally:

```powershell
npm start
```

Start with automatic restarts during development:

```powershell
npm run dev
```

The server listens on `http://localhost:3000` by default. To use a different port, set the `PORT` environment variable before starting the process. On first startup, the application creates `books.db`, creates the `books` table, and inserts sample rows if the table is empty. Restarting the server does not duplicate the sample rows.

## Render deployment

The root-level `render.yaml` defines a free Render web service. In the Render Dashboard, create a **Blueprint** from the `main` branch of this repository and apply the `lab-03-books-api` service. Render deploys it automatically and provides the public service URL. The build compiles `sqlite3` from source so its native module matches Render's Linux runtime. The service uses Render's `PORT` setting and listens on `0.0.0.0`.

The free service uses an ephemeral filesystem. SQLite data created while the service is running can be lost after a restart or redeploy; the committed sample database is included in each deployment. Use a paid service with a persistent disk if database changes must survive deployments.

## Database structure

The SQLite database file is `books.db`. Its `books` table has the following columns:

| Column | Type | Rule |
|---|---|---|
| `id` | INTEGER | Primary key, auto-increment |
| `title` | TEXT | Not null |
| `author` | TEXT | Not null |
| `price` | REAL | Not null |

Database operations that accept values use `?` placeholders. User input is never joined into SQL values. Sort column names and sort direction are checked against allowlists before they are used in a query.

## API endpoints

All responses use JSON. A successful response contains a `message` and, where applicable, a `data` value.

| Method | Endpoint | Purpose | Success status |
|---|---|---|---|
| GET | `/books` | List books; supports filters and pagination | 200 |
| GET | `/books/:id` | Retrieve one book | 200 |
| POST | `/books` | Create a book | 201 |
| PUT | `/books/:id` | Replace a book's title, author, and price | 200 |
| DELETE | `/books/:id` | Delete a book | 200 |

Example request body for POST and PUT:

```json
{
  "title": "Learning Node.js",
  "author": "Shelley Powers",
  "price": 380
}
```

Example success response:

```json
{
  "message": "Book created successfully",
  "data": {
    "id": 6,
    "title": "Learning Node.js",
    "author": "Shelley Powers",
    "price": 380
  }
}
```

## Query parameters for GET `/books`

| Parameter | Meaning | Default / permitted values |
|---|---|---|
| `search_q` | Partial, case-insensitive title search using SQLite `LIKE` | Optional |
| `order_by` | Sort column | `id`, `title`, `author`, or `price`; default `id` |
| `order` | Sort direction | `ASC` or `DESC`; default `ASC` |
| `limit` | Maximum number of returned rows | Default `10`; positive integer |
| `offset` | Number of matching rows to skip | Default `0`; non-negative integer |
| `min_price` | Include prices greater than or equal to this value | Optional non-negative number |
| `max_price` | Include prices less than or equal to this value | Optional non-negative number |

Examples:

```text
GET /books?search_q=python
GET /books?order_by=price&order=DESC
GET /books?limit=5&offset=0
GET /books?min_price=100&max_price=500
```

When both price parameters are supplied, `min_price` must not exceed `max_price`. Invalid query values return HTTP 400 with a JSON `message`.

## Validation rules

- POST and PUT require a non-empty `title`, a non-empty `author`, and a numeric, non-negative `price`.
- Price must be a JSON number (for example, `380`), not a quoted string.
- IDs must be positive integers.
- `order_by` and `order` are separately allowlisted.
- Invalid input returns HTTP 400. A valid ID for a missing book returns HTTP 404.

Example error:

```json
{
  "message": "Title is required"
}
```

## HTTP status codes

| Code | Meaning in this API |
|---|---|
| 200 | GET, PUT, or DELETE succeeded |
| 201 | Book created |
| 400 | Invalid ID, body, JSON, or query parameter |
| 404 | Book or route not found |
| 500 | Unexpected internal error |

## Postman testing

Keep the server running, create a Postman request, and use `http://localhost:3000` as the base URL. For POST and PUT select **Body → raw → JSON** and set `Content-Type: application/json`. The complete test list, example request bodies, and expected status/messages are in [POSTMAN_TESTING.md](./POSTMAN_TESTING.md).

## Debugging exercises

Read [debugging-exercises/README.md](./debugging-exercises/README.md) for steps to diagnose and fix EADDRINUSE, a wrong import path, a missing SQLite table, and missing `await` in database calls. The exercises describe safe fixes and do not intentionally break this application.

## Screenshots

Save Postman evidence in the `screenshots/` folder. Suggested captures:

1. `GET /books` showing the sample data and status 200.
2. A filtered/sorted request showing the query parameters and status 200.
3. A successful POST or PUT response.
4. A validation failure showing status 400 and its JSON message.
5. A missing-book request showing status 404.

Screenshots are intentionally left for the student to capture in Postman; no screenshots have been fabricated.

## Problems faced / implementation considerations

SQLite's `sqlite3` interface is callback-based, so its `run`, `get`, and `all` operations are wrapped in Promises to make the route handlers readable with `async`/`await`. SQL values use placeholders; sort identifiers require allowlists because SQL parameters cannot represent column names. The database initializer checks whether the table is empty before inserting examples, so restarts preserve data without repeating the seed rows.

## Conclusion

This lab implements a small SQLite-backed REST API with CRUD operations, safe query filtering and sorting, input validation, consistent JSON errors, and a documented Postman and debugging workflow.
