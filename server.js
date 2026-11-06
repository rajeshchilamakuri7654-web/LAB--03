const express = require("express");
const { all, get, initializeDatabase, run } = require("./database");

const app = express();
const port = Number(process.env.PORT) || 3000;
const sortableColumns = {
  id: "id",
  title: "title",
  author: "author",
  price: "price"
};

app.use(express.json());

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function sendBadRequest(res, message) {
  return res.status(400).json({ message });
}

function validateBookBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "A JSON object is required";
  }
  if (typeof body.title !== "string" || body.title.trim() === "") {
    return "Title is required";
  }
  if (typeof body.author !== "string" || body.author.trim() === "") {
    return "Author is required";
  }
  if (body.price === undefined || body.price === null || body.price === "") {
    return "Price is required";
  }
  if (typeof body.price !== "number" || !Number.isFinite(body.price)) {
    return "Price must be a number";
  }
  if (body.price < 0) {
    return "Price must not be negative";
  }

  return null;
}

function parseNonNegativeNumber(value, parameterName) {
  if (typeof value !== "string" || value.trim() === "") {
    return { error: `${parameterName} must be a non-negative number` };
  }

  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return { error: `${parameterName} must be a non-negative number` };
  }

  return { value: number };
}

function parseIntegerParameter(value, parameterName, minimum) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return { error: `${parameterName} must be an integer of at least ${minimum}` };
  }

  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum) {
    return { error: `${parameterName} must be an integer of at least ${minimum}` };
  }

  return { value: number };
}

function parseBookId(value) {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

app.get(
  "/books",
  asyncHandler(async (req, res) => {
    const {
      search_q: searchQuery,
      order_by: orderByQuery,
      order: orderQuery,
      limit: limitQuery,
      offset: offsetQuery,
      min_price: minPriceQuery,
      max_price: maxPriceQuery
    } = req.query;

    if (searchQuery !== undefined && typeof searchQuery !== "string") {
      return sendBadRequest(res, "search_q must be a string");
    }

    const orderBy = orderByQuery === undefined ? "id" : orderByQuery;
    if (typeof orderBy !== "string" || !Object.hasOwn(sortableColumns, orderBy)) {
      return sendBadRequest(
        res,
        "order_by must be one of: id, title, author, price"
      );
    }

    const order = orderQuery === undefined ? "ASC" : orderQuery;
    if (typeof order !== "string" || !["ASC", "DESC"].includes(order.toUpperCase())) {
      return sendBadRequest(res, "order must be ASC or DESC");
    }
    const sortDirection = order.toUpperCase();

    const limitResult =
      limitQuery === undefined
        ? { value: 10 }
        : parseIntegerParameter(limitQuery, "limit", 1);
    if (limitResult.error) {
      return sendBadRequest(res, limitResult.error);
    }

    const offsetResult =
      offsetQuery === undefined
        ? { value: 0 }
        : parseIntegerParameter(offsetQuery, "offset", 0);
    if (offsetResult.error) {
      return sendBadRequest(res, offsetResult.error);
    }

    const parameters = [];
    const conditions = [];

    if (searchQuery !== undefined) {
      conditions.push("title LIKE ?");
      parameters.push(`%${searchQuery}%`);
    }

    let minPrice;
    if (minPriceQuery !== undefined) {
      const result = parseNonNegativeNumber(minPriceQuery, "min_price");
      if (result.error) {
        return sendBadRequest(res, result.error);
      }
      minPrice = result.value;
      conditions.push("price >= ?");
      parameters.push(minPrice);
    }

    if (maxPriceQuery !== undefined) {
      const result = parseNonNegativeNumber(maxPriceQuery, "max_price");
      if (result.error) {
        return sendBadRequest(res, result.error);
      }
      if (minPrice !== undefined && result.value < minPrice) {
        return sendBadRequest(res, "max_price must be greater than or equal to min_price");
      }
      conditions.push("price <= ?");
      parameters.push(result.value);
    }

    parameters.push(limitResult.value, offsetResult.value);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const books = await all(
      `SELECT id, title, author, price
       FROM books
       ${whereClause}
       ORDER BY ${sortableColumns[orderBy]} ${sortDirection}
       LIMIT ? OFFSET ?`,
      parameters
    );

    return res.status(200).json({ message: "Books retrieved successfully", data: books });
  })
);

app.get(
  "/books/:id",
  asyncHandler(async (req, res) => {
    const id = parseBookId(req.params.id);
    if (id === null) {
      return sendBadRequest(res, "ID must be a positive integer");
    }

    const book = await get(
      "SELECT id, title, author, price FROM books WHERE id = ?",
      [id]
    );
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    return res.status(200).json({ message: "Book retrieved successfully", data: book });
  })
);

app.post(
  "/books",
  asyncHandler(async (req, res) => {
    const validationError = validateBookBody(req.body);
    if (validationError) {
      return sendBadRequest(res, validationError);
    }

    const result = await run(
      "INSERT INTO books (title, author, price) VALUES (?, ?, ?)",
      [req.body.title.trim(), req.body.author.trim(), req.body.price]
    );
    const book = await get(
      "SELECT id, title, author, price FROM books WHERE id = ?",
      [result.lastID]
    );

    return res
      .status(201)
      .json({ message: "Book created successfully", data: book });
  })
);

app.put(
  "/books/:id",
  asyncHandler(async (req, res) => {
    const id = parseBookId(req.params.id);
    if (id === null) {
      return sendBadRequest(res, "ID must be a positive integer");
    }

    const validationError = validateBookBody(req.body);
    if (validationError) {
      return sendBadRequest(res, validationError);
    }

    const existingBook = await get("SELECT id FROM books WHERE id = ?", [id]);
    if (!existingBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    await run(
      "UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?",
      [req.body.title.trim(), req.body.author.trim(), req.body.price, id]
    );
    const updatedBook = await get(
      "SELECT id, title, author, price FROM books WHERE id = ?",
      [id]
    );

    return res
      .status(200)
      .json({ message: "Book updated successfully", data: updatedBook });
  })
);

app.delete(
  "/books/:id",
  asyncHandler(async (req, res) => {
    const id = parseBookId(req.params.id);
    if (id === null) {
      return sendBadRequest(res, "ID must be a positive integer");
    }

    const result = await run("DELETE FROM books WHERE id = ?", [id]);
    if (result.changes === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    return res.status(200).json({ message: "Book deleted successfully", data: { id } });
  })
);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Invalid JSON request body" });
  }

  console.error("Request failed:", error);
  return res.status(500).json({ message: "Internal server error" });
});

async function startServer() {
  await initializeDatabase();
  app.listen(port, "0.0.0.0", () => {
    console.log(`Books API is running at http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start the Books API:", error);
    process.exitCode = 1;
  });
}

module.exports = app;
