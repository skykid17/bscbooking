### Installation

Go into backend folder:
```
mkdir backend && cd backend
npm init -y
npm install express mysql2 cors bcryptjs jsonwebtoken dotenv uuid
npm install --save-dev nodemon
node /scripts/initDB.js
```

Go back to base folder:
```
cd ..
npx create-react-app frontend
cd frontend
npm install axios react-router-dom tailwindcss @tailwindcss/vite react-toastify @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/react-fontawesome
```