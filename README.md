# BSC Room Booking Web Application

A full-stack web application for booking rooms at BSC with user/admin roles, recurring booking options, calendar views, and secure login.

---

## 📦 Tech Stack

- **Frontend:** React, Tailwind CSS, React Router DOM, Axios, Toastify
- **Backend:** Node.js (Express), MySQL
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

Create a `backend/.env`:

```
PORT=<your_server_port>
DB_HOST=localhost
DB_USER=<your_db_username>
DB_PASSWORD=<your_password>
DB_NAME=bsc_booking

JWT_SECRET=<your_secret>
TOKEN_EXPIRE=1d
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
REACT_APP_API_URL=http://localhost:3000/api
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