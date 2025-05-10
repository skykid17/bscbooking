# BSC Room Booking Web Application

A full-stack web application for booking rooms at BSC with user/admin roles, recurring booking options, calendar views, and secure login.

---

## 📦 Tech Stack

- **Frontend:** React, Tailwind CSS, React Router DOM, Axios, Toastify
- **Backend:** Node.js (Express), PostgreSQL
- **Authentication:** JWT with role-based access (user/admin)

---

## ⚙️ Installation Guide

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd bsc-room-booking
````

---

### 2. Backend Setup

```bash
mkdir backend && cd backend
npm init -y
npm install express mysql2 cors bcryptjs jsonwebtoken dotenv uuid
npm install --save-dev nodemon
```

#### 📁 Create a DB Connection Pool

For the app_password below, login to bsc_digital_gmail, go to https://myaccount.google.com/apppasswords to create an app password.

Create a `backend/.env`:

```
PORT=<your_server_port>
DB_HOST=localhost
DB_USER=<your_db_username>
DB_PASSWORD=<your_password>
DB_NAME=bsc_booking

JWT_SECRET=<your_secret>
TOKEN_EXPIRE=1d

EMAIL_SERVICE=gmail
EMAIL_USER=<bsc_digital_gmail>
EMAIL_PASSWORD=<app_password>
```

#### 🛠️ Initialize the Database

Ensure MySQL is running locally and then run:

```bash
node /scripts/initDB.js
```

---

### 3. Frontend Setup

From the root folder:

```bash
npx create-react-app frontend
cd frontend
npm install axios react-router-dom tailwindcss @tailwindcss/vite react-toastify @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/react-fontawesome
```

Create a frontend .env
```
VITE_API_URL=http://localhost:5000/api
```

Ensure vite.config.js has following code
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
})

```

Ensure tailwind.config.js has following code
```js
/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }
```

### 4. Running the Application

* **Backend:**

```bash
cd backend
npm run dev
```

* **Frontend:**

```bash
cd frontend
npm start
```

---

## 🧪 Test Accounts

### User

* **Username:** `user`
* **Password:** `user`
* **Role:** `user`

### Admin

* **Username:** `admin`
* **Password:** `admin`
* **Role:** `admin`

---

## 📁 Folder Structure

```
bscbooking/
├── backend/
│   ├── db.js
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   └── scripts/initDB.js
├── frontend/
│   └── [React App]
├── .env
├── README.md
```

## 📬 Contact

For questions or support, reach out to the developer team.