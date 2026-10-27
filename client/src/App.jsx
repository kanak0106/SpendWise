
import { useEffect, useState } from "react";
const API_BASE_URL = "https://spendwise-vi3c.onrender.com/api";
import "./App.css";
import { jsPDF } from "jspdf";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,  BarChart,
  Bar, XAxis, YAxis, CartesianGrid, } from "recharts";
function App() {
  const [transactions, setTransactions] = useState([]);
  const [token, setToken] = useState(
  () => sessionStorage.getItem("spendwise_token") || ""
);

const [currentUser, setCurrentUser] = useState(() => {
  try {
    return JSON.parse(sessionStorage.getItem("spendwise_user") || "null");
  } catch {
    return null;
  }
});

const [authMode, setAuthMode] = useState("login");
const [authName, setAuthName] = useState("");
const [authEmail, setAuthEmail] = useState("");
const [authPassword, setAuthPassword] = useState("");
const [authError, setAuthError] = useState("");

const handleAuthSubmit = async (event) => {
  event.preventDefault();
  setAuthError("");

  const endpoint =
    authMode === "register"
      ? "/api/auth/register"
      : "/api/auth/login";

  const body =
    authMode === "register"
      ? {
          name: authName,
          email: authEmail,
          password: authPassword,
        }
      : {
          email: authEmail,
          password: authPassword,
        };

  try {
    const response = await fetch(
      `https://spendwise-vi3c.onrender.com${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      setAuthError(result.message || "Authentication failed.");
      return;
    }

    sessionStorage.setItem("spendwise_token", result.token);
    sessionStorage.setItem(
      "spendwise_user",
      JSON.stringify(result.user)
    );

    setToken(result.token);
    setCurrentUser(result.user);
    setAuthPassword("");
    setTransactions([]);
  } catch (error) {
    setAuthError("Could not connect to the server.");
  }
};

const handleLogout = () => {
  sessionStorage.removeItem("spendwise_token");
  sessionStorage.removeItem("spendwise_user");

  setToken("");
  setCurrentUser(null);
  setTransactions([]);
  setActivePage("Dashboard");
};

const exportPdf = () => {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text("SpendWise Financial Report", 14, 20);

  doc.setFontSize(11);
  doc.text(`Name: ${currentUser?.name || "User"}`, 14, 32);
  doc.text(
    `Generated: ${new Date().toLocaleDateString()}`,
    14,
    40
  );

  doc.setFontSize(12);
  doc.text(`Total Income: Rs. ${reportIncome.toFixed(2)}`, 14, 54);
  doc.text(`Total Expenses: Rs. ${reportExpenses.toFixed(2)}`, 14, 62);
  doc.text(
    `Net Savings: Rs. ${(reportIncome - reportExpenses).toFixed(2)}`,
    14,
    70
  );

  let y = 84;

  doc.setFontSize(10);
  doc.text("Date", 14, y);
  doc.text("Type", 42, y);
  doc.text("Category", 65, y);
  doc.text("Amount", 105, y);
  doc.text("Description", 135, y);

  y += 8;

  filteredTransactions.forEach((item) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }

    doc.text(String(item.transaction_date || ""), 14, y);
    doc.text(String(item.type || ""), 42, y);
    doc.text(String(item.category || "").slice(0, 16), 65, y);
    doc.text(Number(item.amount).toFixed(2), 105, y);
    doc.text(String(item.description || "").slice(0, 25), 135, y);

    y += 7;
  });

  doc.save("SpendWise-Report.pdf");
};


 const [activePage, setActivePage] = useState("Dashboard");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
const [dateFilter, setDateFilter] = useState("all");
const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");


  
useEffect(() => {
  if (!token) {
    setTransactions([]);
    return;
  }
fetch(`${API_BASE_URL}/transactions`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
    .then(async (response) => {
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Could not load transactions."
        );
      }

      return result;
    })
    .then((result) => {
      if (result.success) {
        setTransactions(result.data);
      }
    })
    .catch((error) => {
      console.error("Could not load transactions:", error);
      setTransactions([]);
    });
}, [token]);
 []

  
  const handleDeleteTransaction = async (transactionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) {
      return;
    }

    try {
     const response = await fetch(
  `${API_BASE_URL}/transactions/${transactionId}?user_id=1`,
  {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "Could not delete transaction.");
        return;
      }

      setTransactions((currentTransactions) =>
        currentTransactions.filter(
          (item) => item.id !== transactionId
        )
      );

      alert("Transaction deleted successfully!");
    } catch (error) {
      console.error("Delete transaction error:", error);
      alert("Could not connect to the server.");
    }
  };


  const handleEditTransaction = async (item) => {
    const category = window.prompt("Enter category:", item.category);
    if (category === null || !category.trim()) return;

    const amountText = window.prompt("Enter amount:", item.amount);
    if (amountText === null) return;

    const amount = Number(amountText);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Please enter a valid positive amount.");
      return;
    }

    const description = window.prompt(
      "Enter description:",
      item.description || ""
    );
    if (description === null) return;

    const type = window.prompt(
      'Enter type: "income" or "expense"',
      item.type
    );
    if (type === null) return;

    if (!["income", "expense"].includes(type.trim().toLowerCase())) {
      alert('Type must be "income" or "expense".');
      return;
    }

    const transaction_date = window.prompt(
      "Enter date (YYYY-MM-DD):",
      item.transaction_date
    );
    if (transaction_date === null) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/transactions/${item.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            
            category: category.trim(),
            amount,
            description,
            type: type.trim().toLowerCase(),
            transaction_date,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "Could not update transaction.");
        return;
      }

     const refreshed = await fetch(
  `${API_BASE_URL}/transactions?user_id=1`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
const data = await refreshed.json();

      if (data.success) setTransactions(data.data);

      alert("Transaction updated successfully!");
    } catch (error) {
      console.error("Edit transaction error:", error);
      alert("Could not connect to the server.");
    }
  };


  const filteredTransactions = transactions.filter((item) => {
    const date = item.transaction_date;

    if (dateFilter === "custom") {
      return (
        (!startDate || date >= startDate) &&
        (!endDate || date <= endDate)
      );
    }

    if (dateFilter === "all") return true;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = new Date(year, month, now.getDate());

    const transactionDate = new Date(`${date}T00:00:00`);

    if (dateFilter === "day") {
      return date === [
        year,
        String(month + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
      ].join("-");
    }

    if (dateFilter === "month") {
      return (
        transactionDate.getFullYear() === year &&
        transactionDate.getMonth() === month
      );
    }

    if (dateFilter === "quarter") {
      return (
        transactionDate.getFullYear() === year &&
        Math.floor(transactionDate.getMonth() / 3) ===
          Math.floor(month / 3)
      );
    }

    if (dateFilter === "year") {
      return transactionDate.getFullYear() === year;
    }

    return true;
  });

  const reportIncome = filteredTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const reportExpenses = filteredTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);


  const income = filteredTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const expenses = filteredTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

const comparisonData = [
  { name: "Income", amount: income },
  { name: "Expenses", amount: expenses },
];

const expenseData = Object.values(
  filteredTransactions
    .filter((item) => item.type === "expense")
    .reduce((result, item) => {
      result[item.category] = result[item.category] || {
        name: item.category,
        value: 0,
      };
      result[item.category].value += Number(item.amount);
      return result;
    }, {})
);

  function addTransaction(event) {
    event.preventDefault();

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }


fetch(`${API_BASE_URL}/transactions`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    account_id: currentUser.account_id,
    type,
    category,
    amount: Number(amount),
    description,
    transaction_date: new Date().toISOString().slice(0, 10),
  }),
})


      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || "Could not save transaction");
        }
        return result;
      })
      
.then(() => {
  return fetch(`${API_BASE_URL}/transactions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
})


      .then((response) => response.json())
      .then((result) => {
        if (result.success) {
          setTransactions(result.data);
          setAmount("");
          setDescription("");
          alert("Transaction saved successfully!");
        }
      })
      .catch((error) => {
        console.error("Save error:", error);
        alert("Could not save transaction. Please check that your backend is running.");
      });
  }

if (!token || !currentUser) {
  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleAuthSubmit}>
        <h1>SpendWise</h1>
        <p>Manage your money smarter.</p>

        <h2>
          {authMode === "register"
            ? "Create your account"
            : "Welcome back"}
        </h2>

        {authMode === "register" && (
          <label>
            Full Name
            <input
              type="text"
              value={authName}
              onChange={(e) => setAuthName(e.target.value)}
              required
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>

        {authError && (
          <p className="auth-error" role="alert">
            {authError}
          </p>
        )}

        <button type="submit">
          {authMode === "register" ? "Create Account" : "Login"}
        </button>

        <p>
          {authMode === "register"
            ? "Already have an account?"
            : "Don't have an account?"}
        </p>

        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setAuthMode(
              authMode === "register" ? "login" : "register"
            );
            setAuthError("");
          }}
        >
          {authMode === "register"
            ? "Login instead"
            : "Register here"}
        </button>
      </form>
    </div>
  );
}

  return (
    <div className="app">
    
<aside className="sidebar">
  <h2 className="sidebar-logo">SpendWise</h2>
  <p className="sidebar-subtitle">Personal Finance</p>

  <nav className="sidebar-nav">
    <button
      type="button"
      className={`nav-item ${activePage === "Dashboard" ? "active" : ""}`}
      onClick={() => setActivePage("Dashboard")}
    >
      Dashboard
    </button>

    <button
      type="button"
      className={`nav-item ${activePage === "Transactions" ? "active" : ""}`}
      onClick={() => setActivePage("Transactions")}
    >
      Transactions
    </button>

    <button
      type="button"
      className={`nav-item ${activePage === "Reports" ? "active" : ""}`}
      onClick={() => setActivePage("Reports")}
    >
      Reports
    </button>
  
  </nav>

  <button
    type="button"
    className="nav-item logout-button"
    onClick={handleLogout}
  >
    Logout
  </button>
</aside>


    
<main className="main-content">
  {activePage === "Dashboard" && (
    <>
      <header>
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your financial overview.</p>
      </header>
      
<section className="summary-cards">
  <div className="summary-card balance-card">
    <div className="summary-card-top">
      <div>
        <p>Total Balance</p>
        <h2>₹{(income - expenses).toLocaleString("en-IN")}</h2>
      </div>
      <div className="summary-icon balance-icon">₹</div>
    </div>
    <span className="summary-note">Your available balance</span>
  </div>

  <div className="summary-card income-card">
    <div className="summary-card-top">
      <div>
        <p>Total Income</p>
        <h2>₹{income.toLocaleString("en-IN")}</h2>
      </div>
      <div className="summary-icon income-icon">↗</div>
    </div>
    <span className="summary-note">Money received</span>
  </div>

  <div className="summary-card expense-card">
    <div className="summary-card-top">
      <div>
        <p>Total Expenses</p>
        <h2>₹{expenses.toLocaleString("en-IN")}</h2>
      </div>
      <div className="summary-icon expense-icon">↘</div>
    </div>
    <span className="summary-note">Money spent</span>
  </div>
</section>


        <section className="dashboard-grid">
  
<div className="panel">
  <h2>Recent Transactions</h2>

  <div className="transactions-list">
    {filteredTransactions.length === 0 ? (
      <p>No transactions found.</p>
    ) : (
      filteredTransactions
        .slice()
        .reverse()
        .slice(0, 10)
        .map((item) => (
          <div className="transaction" key={item.id}>
            <div>
              <strong>{item.category}</strong>
              <p>{item.description || item.transaction_date}</p>
            </div>

            <strong>
              {item.type === "income" ? "+" : "-"}₹
              {Number(item.amount).toLocaleString("en-IN")}
            </strong>

            <div className="transaction-actions">
              <button
                type="button"
                onClick={() => handleEditTransaction(item)}
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => handleDeleteTransaction(item.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))
    )}
  </div>
</div>
<div className="date-filters">
  <label>
    Period:
    <select
      value={dateFilter}
      onChange={(e) => setDateFilter(e.target.value)}
    >
      <option value="all">All time</option>
      <option value="day">Today</option>
      <option value="month">This month</option>
      <option value="quarter">This quarter</option>
      <option value="year">This year</option>
      <option value="custom">Custom range</option>
    </select>
  </label>

  {dateFilter === "custom" && (
    <>
      <label>
        From:
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </label>

      <label>
        To:
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </label>
    </>
  )}
</div>

            
          <div className="panel">
            <h2>Expenses by Category</h2>

            {expenseData.length === 0 ? (
              <p>No expenses to display yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={expenseData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label
                  >
                    {expenseData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={["#4f46e5", "#16a34a", "#f59e0b", "#ef4444", "#0ea5e9"][index % 5]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>           <div className="panel">
            <h2>Income vs. Expenses</h2>

            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Legend />
                <Bar
                  dataKey="amount"
                  name="Amount (₹)"
                  fill="#4f46e5"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>


</section>
    </>
  )}

  {activePage === "Transactions" && (
    <section className="panel">
      <h1>Transactions</h1>
      <p>View and manage your income and expenses.</p>

<form
  className="transaction-form"
  onSubmit={async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(
  `${API_BASE_URL}/transactions`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
          body: JSON.stringify({
            account_id: currentUser.account_id,
            type,
            category,
            amount: Number(amount),
            description,
            transaction_date: new Date().toISOString().slice(0, 10),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not save transaction.");
      }

    const refreshed = await fetch(
  `${API_BASE_URL}/transactions`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

      const data = await refreshed.json();

      if (!refreshed.ok || !data.success) {
        throw new Error(data.message || "Could not refresh transactions.");
      }

      setTransactions(data.data);
      setAmount("");
      setDescription("");
      alert("Transaction added successfully!");
    } catch (error) {
      console.error("Add transaction error:", error);
      alert(error.message || "Could not save transaction.");
    }
  }}
>
  <h2>Add Transaction</h2>

  <label>
    Type
    <select value={type} onChange={(event) => setType(event.target.value)}>
      <option value="income">Income</option>
      <option value="expense">Expense</option>
    </select>
  </label>

  <label>
    Category
    <select
      value={category}
      onChange={(event) => setCategory(event.target.value)}
    >
      <option value="Salary">Salary</option>
      <option value="Food">Food</option>
      <option value="Transport">Transport</option>
      <option value="Shopping">Shopping</option>
      <option value="Bills">Bills</option>
      <option value="Health">Health</option>
      <option value="Education">Education</option>
      <option value="Other">Other</option>
    </select>
  </label>

  <label>
    Amount (₹)
    <input
      type="number"
      min="0.01"
      step="0.01"
      value={amount}
      onChange={(event) => setAmount(event.target.value)}
      required
    />
  </label>

  <label>
    Description
    <input
      type="text"
      value={description}
      onChange={(event) => setDescription(event.target.value)}
      placeholder="e.g. Monthly salary or lunch"
    />
  </label>

  <button type="submit">Save Transaction</button>
</form>


      {filteredTransactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        filteredTransactions.slice().reverse().map((item) => (
          <div className="transaction" key={item.id}>
            <div>
              <strong>{item.category}</strong>
              <p>{item.description || item.transaction_date}</p>
            </div>

            <strong>
              {item.type === "income" ? "+" : "-"}₹
              {Number(item.amount).toLocaleString("en-IN")}
            </strong>

            <div className="transaction-actions">
              <button type="button" onClick={() => handleEditTransaction(item)}>
                Edit
              </button>
              <button type="button" onClick={() => handleDeleteTransaction(item.id)}>
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </section>
  )}

  {activePage === "Reports" && (
    <section className="panel">
      <h1>Reports</h1>
      <p>Financial summary for the selected period.</p>

      <h3>Total Income: ₹{reportIncome.toLocaleString("en-IN")}</h3>
      <h3>Total Expenses: ₹{reportExpenses.toLocaleString("en-IN")}</h3>
      <h3>Net Savings: ₹{(reportIncome - reportExpenses).toLocaleString("en-IN")}</h3>

      <p>Use the Dashboard date filter to change the reporting period.</p>
 
<button type="button" onClick={exportPdf}>
  Download PDF Report
</button>

    </section>
  )}
</main>

    </div>
  );
}
export default App;
