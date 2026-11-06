# Postman Testing Guide

Start the application from the `lab-03` folder with `npm start` or `npm run dev`. The examples below use `http://localhost:3000`. If you change the server port, update the base URL.

For JSON request bodies, select **Body → raw → JSON** in Postman. The expected responses below show the relevant shape; generated IDs and returned book data depend on the current database contents.

| # | Request | Expected status | Expected response |
|---|---|---:|---|
| 1 | `GET /books` | 200 | `{"message":"Books retrieved successfully","data":[...]}`; includes up to 10 books by default. |
| 2 | `GET /books?search_q=python` | 200 | Same list response; `data` contains titles with `python` (the seeded Python title matches). |
| 3 | `GET /books?order_by=price&order=DESC` | 200 | Same list response; rows are sorted by price descending. |
| 4 | `GET /books?limit=5&offset=0` | 200 | Same list response; at most five rows are returned. |
| 5 | `GET /books?min_price=100&max_price=500` | 200 | Same list response; only prices in the inclusive range are returned. |
| 6 | `GET /books/:id` (replace `:id` with an existing ID, such as `1`) | 200 | `{"message":"Book retrieved successfully","data":{"id":1,"title":"...","author":"...","price":...}}` |
| 7 | `POST /books` with the valid body below | 201 | `{"message":"Book created successfully","data":{"id":...,"title":"Postman Guide","author":"Test Author","price":250}}` |
| 8 | `POST /books` with `{"author":"Test Author","price":250}` | 400 | `{"message":"Title is required"}` |
| 9 | `POST /books` with `{"title":"Postman Guide","price":250}` | 400 | `{"message":"Author is required"}` |
| 10 | `POST /books` with `{"title":"Postman Guide","author":"Test Author","price":"not-a-number"}` | 400 | `{"message":"Price must be a number"}` |
| 11 | `PUT /books/:id` (replace with an existing ID) and the valid body below | 200 | `{"message":"Book updated successfully","data":{"id":...,"title":"Updated Postman Guide","author":"Test Author","price":275}}` |
| 12 | `PUT /books/:id` (existing ID) with `{"title":"","author":"Test Author","price":275}` | 400 | `{"message":"Title is required"}` |
| 13 | `DELETE /books/:id` (replace with an existing ID) | 200 | `{"message":"Book deleted successfully","data":{"id":...}}` |
| 14 | `GET /books/99999` | 404 | `{"message":"Book not found"}` (assuming that ID is absent). |
| 15 | `GET /invalid-route` | 404 | `{"message":"Route not found"}` |

## Request bodies

Valid POST body:

```json
{
  "title": "Postman Guide",
  "author": "Test Author",
  "price": 250
}
```

Valid PUT body:

```json
{
  "title": "Updated Postman Guide",
  "author": "Test Author",
  "price": 275
}
```

The assignment's shorthand `/books/` for the one-book requests means a book ID is required in the actual URL: use `/books/1` for one book, not a trailing slash by itself.

## Extra validation checks

These are optional but useful checks:

- `GET /books?order_by=DROP%20TABLE` → 400, invalid sort column.
- `GET /books?order=SIDEWAYS` → 400, order must be ASC or DESC.
- `GET /books?limit=0` → 400, limit must be at least 1.
- `GET /books?min_price=500&max_price=100` → 400, max must not be below min.
- POST with a negative price → 400, `{"message":"Price must not be negative"}`.
- `PUT /books/99999` with a valid body → 404, `{"message":"Book not found"}`.

## Taking screenshots

In Postman, keep the request URL, request parameters or body, response status, and response JSON visible. Capture separate images for a list request, a query/filter request, a successful write, a validation error, and a 404. Save the images in this project's `screenshots/` directory and use clear names such as `get-books.png` and `post-invalid-price.png`.
