
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;


app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://spend-wise-vert-beta.vercel.app",
      "https://spend-wise-git-main-kanak-sharmas-projects-bce16fa1.vercel.app",
      "https://spend-wise-bn4mxrsdm-kanak-sharmas-projects-bce16fa1.vercel.app",
    ],
  })
);


app.use(express.json());
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from your .env file.");
}

// Register a new user
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||

    typeof password !== "string" ||
    password.length < 8
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid name and email. Password must be at least 8 characters.",
    });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(normalizedEmail);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = bcrypt.hashSync(password, 12);

    const createUser = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO users (name, email, password_hash)
        VALUES (?, ?, ?)
      `).run(name.trim(), normalizedEmail, passwordHash);

      const userId = Number(result.lastInsertRowid);

      const account = db.prepare(`
        INSERT INTO accounts (user_id, name, type, balance)
        VALUES (?, 'Main Account', 'cash', 0)
      `).run(userId);

      return { userId, accountId: Number(account.lastInsertRowid) };
    });

    const { userId, accountId } = createUser();

    const token = jwt.sign(
      { userId },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        account_id: accountId,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed.",
    });
  }
});

// Log in an existing user
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }

  try {
    const user = db.prepare(`
      SELECT id, name, email, password_hash
      FROM users
      WHERE email = ?
    `).get(email.trim().toLowerCase());

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const account = db.prepare(`
      SELECT id FROM accounts
      WHERE user_id = ?
      ORDER BY id
      LIMIT 1
    `).get(user.id);

    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        account_id: account ? account.id : null,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
});

// Middleware to verify login tokens
function authenticateToken(req, res, next) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      message: "Please log in to continue.",
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (!Number.isInteger(payload.userId)) {
      throw new Error("Invalid token payload.");
    }

    req.userId = payload.userId;
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Your session is invalid or expired. Please log in again.",
    });
  }
}

app.post("/api/transactions", authenticateToken, (req, res) => {
  const {
    account_id,
    type,
    category,
    amount,
    description = "",
    transaction_date = new Date().toISOString().slice(0, 10),
  } = req.body;

  const user_id = req.userId;
  if (
    !user_id ||
    !account_id ||
    !["income", "expense"].includes(type) ||
    !category ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Please provide user_id, account_id, type (income/expense), category, and a positive amount.",
    });
  }

  try {
    const account = db
      .prepare(
        "SELECT id FROM accounts WHERE id = ? AND user_id = ?"
      )
      .get(account_id, user_id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found for this user.",
      });
    }

    const result = db
      .prepare(`
        INSERT INTO transactions
        (user_id, account_id, type, category, amount,
         description, transaction_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        user_id,
        account_id,
        type,
        category,
        amount,
        description,
        transaction_date
      );
db.prepare(`
      UPDATE accounts
      SET balance = balance + ?
      WHERE id = ? AND user_id = ?
    `).run(
      type === "income" ? amount : -amount,
      account_id,
      user_id
    );
    const transaction = db
      .prepare("SELECT * FROM transactions WHERE id = ?")
      .get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: "Transaction added successfully!",
      data: transaction,
    });
  } catch (error) {
    console.error("Transaction error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not add transaction.",
    });
  }
});

app.get("/api/transactions", (req, res) => {

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  let userId;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.userId;
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }
  try {
    const transactions = db
      .prepare(`
        SELECT *
        FROM transactions
        WHERE user_id = ?
        ORDER BY transaction_date DESC, id DESC
      `)
      .all(userId);

    return res.json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("Fetch transactions error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not fetch transactions.",
    });
  }
});

app.put("/api/transactions/:id", authenticateToken, (req, res) => {

  const transactionId = Number(req.params.id);
  const userId = req.userId;
  const { type, category, amount, description, transaction_date } = req.body;

  if (
    !Number.isInteger(transactionId) ||
    transactionId <= 0 ||
    !Number.isInteger(userId) ||
    userId <= 0 ||
    !["income", "expense"].includes(type) ||
    typeof category !== "string" ||
    !category.trim() ||
    !Number.isFinite(Number(amount)) ||
    Number(amount) <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide valid transaction details.",
    });
  }

  try {
    const updateTransaction = db.transaction(() => {
      const old = db.prepare(`
        SELECT * FROM transactions WHERE id = ? AND user_id = ?
      `).get(transactionId, userId);

      if (!old) return false;

      const newAmount = Number(amount);

      const account = db.prepare(`
        SELECT id FROM accounts WHERE id = ? AND user_id = ?
      `).get(old.account_id, userId);

      if (!account) throw new Error("Account not found.");

      const oldEffect = old.type === "income" ? old.amount : -old.amount;
      const newEffect = type === "income" ? newAmount : -newAmount;

      db.prepare(`
        UPDATE accounts
        SET balance = balance - ? + ?
        WHERE id = ? AND user_id = ?
      `).run(oldEffect, newEffect, old.account_id, userId);

      db.prepare(`
        UPDATE transactions
        SET type = ?, category = ?, amount = ?,
            description = ?, transaction_date = ?
        WHERE id = ? AND user_id = ?
      `).run(
        type,
        category.trim(),
        newAmount,
        description || "",
        transaction_date || old.transaction_date,
        transactionId,
        userId
      );

      return true;
    });

    if (!updateTransaction()) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    return res.json({
      success: true,
      message: "Transaction updated successfully.",
    });
  } catch (error) {
    console.error("Update transaction error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not update transaction.",
    });
  }
});



app.delete("/api/transactions/:id", authenticateToken, (req, res) => {
  const transactionId = Number(req.params.id);
  const userId = req.userId;

  // Validate the transaction ID and user ID.
  if (
    !Number.isInteger(transactionId) ||
    transactionId <= 0 ||
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid transaction ID and user_id.",
    });
  }

  try {
    // Run the balance update and deletion as one database transaction.
    const deleteTransaction = db.transaction(() => {
      // Find the transaction belonging to this user.
      const transaction = db
        .prepare(`
          SELECT id, account_id, type, amount
          FROM transactions
          WHERE id = ? AND user_id = ?
        `)
        .get(transactionId, userId);

      if (!transaction) {
        return false;
      }

      // Reverse the transaction's effect on the account balance.
      const balanceChange =
        transaction.type === "income"
          ? -transaction.amount
          : transaction.amount;

      db.prepare(`
        UPDATE accounts
        SET balance = balance + ?
        WHERE id = ? AND user_id = ?
      `).run(
        balanceChange,
        transaction.account_id,
        userId
      );

      // Delete only the transaction owned by this user.
      db.prepare(`
        DELETE FROM transactions
        WHERE id = ? AND user_id = ?
      `).run(transactionId, userId);

      return true;
    });

    const deleted = deleteTransaction();

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found for this user.",
      });
    }

    return res.json({
      success: true,
      message: "Transaction deleted successfully!",
    });
  } catch (error) {
    console.error("Delete transaction error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not delete transaction.",
    });
  }
});



app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "SpendWise API is working." });
});
// TEMPORARY: Check whether the existing account exists
app.get("/api/check-demo-account", (req, res) => {
  try {
    const user = db.prepare(
      "SELECT id, email FROM users WHERE email = ?"
    ).get("test@spendwise.local");

    res.json({
      accountExists: Boolean(user),
      email: user ? user.email : null
    });
  } catch (error) {
    res.status(500).json({ message: "Database check failed." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;
