# SpendWise - Personal Finance Tracker

SpendWise is a web application that helps users manage their income and expenses in one place. It provides a dashboard, visual charts, and PDF report export to help users understand their spending.

## Features

- User Registration and Login
- Secure Password Hashing
- JWT-Based Authentication
- Add, Edit, and Delete Transactions
- Track Income and Expenses
- Dashboard with Financial Summary
- Visual Reports and Charts
- Export Reports as PDF

## Technologies Used

**Frontend**
- React
- Vite
- CSS
- Recharts
- jsPDF

**Backend**
- Node.js
- Express.js
- SQLite
- better-sqlite3
- JWT
- bcryptjs

## Project Structure

```text
SpendWise/
├── client/             # React frontend
├── src/
│   ├── app.js          # Backend server and APIs
│   ├── db.js           # Database configuration
│   ├── seed.js         # Seed data
│   └── fix-balance.js  # Balance utility
├── package.json
├── package-lock.json
└── README.md
```

## How to Run the Project

### Prerequisites
- Node.js
- npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/kanak0106/SpendWise.git
cd SpendWise
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Start the Backend

```bash
node src/app.js
```

### 4. Open a Second Terminal and Install Frontend Dependencies

```bash
cd C:\Users\LENOVO\Documents\spendwise\client
npm install
```

### 5. Start the Frontend

```bash
npm.cmd run dev
```

Open the local URL displayed in the terminal.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in a user |
| GET | `/api/transactions` | Get transactions |
| POST | `/api/transactions` | Add a transaction |
| PUT | `/api/transactions/:id` | Update a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |

Transaction APIs require authentication.

## Security

- Passwords are hashed before storage.
- JWT tokens are used for authentication.
- Users can access only their own transactions.
- Local database files and environment files are excluded from Git.

## Future Improvements

- Monthly budgets and spending alerts
- Advanced financial analytics
- Automated testing
- Cloud deployment

## Author

Developed as a personal finance tracking project using React, Node.js, Express.js, and SQLite.
