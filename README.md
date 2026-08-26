# Economic Intelligence & Forecasting Platform

## Project Overview
A full-stack predictive analytics dashboard utilizing Machine Learning to forecast macroeconomic indicators, specifically focusing on Real Estate (VNQ) and Inflation (TIP) trends. 

## Technical Architecture
* **Frontend:** Next.js, Tailwind CSS, Recharts, Lucide React
* **Backend:** FastAPI, Python, SQLAlchemy ORM
* **Machine Learning:** Scikit-Learn (Linear Regression), pandas, yfinance
* **Security & Auth:** JWT Authentication, passlib, bcrypt (v3.2.2 for passlib compatibility)
* **Testing:** Pytest, httpx

## Live Production Demo
* **Frontend Dashboard (Vercel):** [https://economic-intelligence-platform.vercel.app](https://economic-intelligence-platform.vercel.app)
* **Backend API Docs (Render):** [https://economic-intelligence-platform.onrender.com/docs](https://economic-intelligence-platform.onrender.com/docs)
> **Note:** The backend is hosted on a free-tier Render instance. It may enter a sleep state after a period of inactivity. Upon the first request, the server might take 1-2 minutes to spin up.

## Local Installation & Testing
1. **Backend Setup:**
   * Navigate to the `backend` directory.
   * Activate your virtual environment: `source venv/bin/activate` (Mac/Linux) or `venv\Scripts\activate` (Windows).
   * Install dependencies: `pip install -r requirements.txt` (Crucial: requires `bcrypt==3.2.2` to prevent `passlib` internal server errors).
   * Start the API server: `uvicorn main:app --reload`.
   * *Note:* To run automated security tests, execute `pytest` in the terminal.

2. **Frontend Setup:**
   * Navigate to the `frontend` directory.
   * Install node modules: `npm install`.
   * Launch the dashboard: `npm run dev`.
   * Access the application at `http://localhost:3000`.

## Cloud Deployment Strategy (CI/CD Integrated)
This platform is architected for a decoupled, scalable cloud environment:
* **Database Layer:** Built with SQLAlchemy, the system uses SQLite for local development but is production-ready. To scale, swap the `SQLALCHEMY_DATABASE_URL` in `main.py` with a PostgreSQL connection string (e.g., Supabase or Neon).
* **API / Backend:** The FastAPI application is deployed on **Render** with optimized CORS middleware allowing secure communication with the frontend.
* **Client / Frontend:** The Next.js application is deployed on **Vercel**, fully integrating CI/CD pipelines directly from the GitHub repository.