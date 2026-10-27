
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const dbPath = path.resolve(
  __dirname,
  "..",
  process.env.DB_PATH || "./data/spendwise.db"
);

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
console.log("Using database:", dbPath);
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'cash'
      CHECK (type IN ('cash', 'bank', 'credit')),
    balance REAL NOT NULL DEFAULT 0
      CHECK (balance >= 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE,

    UNIQUE (user_id, id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    type TEXT NOT NULL
      CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL DEFAULT '',
    transaction_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE,

    FOREIGN KEY (user_id, account_id)
      REFERENCES accounts(user_id, id)
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_user_date
    ON transactions(user_id, transaction_date);

  CREATE INDEX IF NOT EXISTS idx_transactions_account
    ON transactions(account_id);
`);

console.log("Using database:", dbPath);
console.log("SpendWise database is ready.");

module.exports = db;
