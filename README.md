## Setup Instructions

1. Clone the repository

2. Configure backend environment variables:
   ```bash
   cp backend/.env.example backend/.env
   ```

3. Update values in `backend/.env` with your real credentials.

4. Configure frontend environment variables:
   ```bash
   cp frontend/.env.example frontend/.env
   ```

5. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

6. Run the app.

Backend (terminal 1):
```bash
cd backend
npx nodemon
```

Frontend (terminal 2):
```bash
cd frontend
npm run dev
```
