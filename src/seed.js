
const db = require("./db");

const createUser = db.prepare(`
  INSERT OR IGNORE INTO users (name, email, password_hash)
  VALUES (?, ?, ?)
`);

createUser.run(
  "Test User",
  "test@spendwise.local",
  "demo-password-hash"
);

const user = db
  .prepare("SELECT id FROM users WHERE email = ?")
  .get("test@spendwise.local");

const createAccount = db.prepare(`
  INSERT INTO accounts (user_id, name, type, balance)
  SELECT ?, 'My Wallet', 'cash', 0
  WHERE NOT EXISTS (
    SELECT 1 FROM accounts
    WHERE user_id = ? AND name = 'My Wallet'
  )
`);

createAccount.run(user.id, user.id);

const account = db
  .prepare(`
    SELECT id FROM accounts
    WHERE user_id = ? AND name = 'My Wallet'
  `)
  .get(user.id);

console.log("Test data ready!");
console.log("User ID:", user.id);
console.log("Account ID:", account.id);

db.close();

