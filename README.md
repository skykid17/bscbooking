### Installation

Go into backend folder:
```
mkdir backend && cd backend
npm init -y
npm install express mysql2 cors bcryptjs jsonwebtoken dotenv uuid
npm install --save-dev nodemon
```

Go back to base folder:
```
cd ..
npx create-react-app frontend
cd frontend
npm install axios react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```