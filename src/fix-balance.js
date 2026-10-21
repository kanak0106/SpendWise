
const db = require("./db");

const updateBalance = db.prepare(`
  UPDATE accounts
  SET balance = (
    SELECT COALESCE(
      SUM(
        CASE
          WHEN type = 'income' THEN amount
          ELSE -amount
        END
      ),
      0
    )
    FROM transactions
    WHERE account_id = accounts.id
  )
`);

updateBalance.run();

console.log(
  db.prepare("SELECT id, name, balance FROM accounts").all()
);

db.close();
