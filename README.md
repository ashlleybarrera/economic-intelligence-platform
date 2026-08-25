# Economic Intelligence & Forecasting Platform

## Project Overview
A full-stack predictive analytics dashboard utilizing Machine Learning to forecast macroeconomic indicators, specifically focusing on Real Estate (VNQ) and Inflation (TIP) trends. 

## Technical Architecture
* **Frontend:** Next.js, Tailwind CSS, Recharts
* **Backend:** FastAPI, Python, SQLAlchemy ORM
* **Machine Learning:** Scikit-Learn (Linear Regression), pandas, yfinance
* **Security & Auth:** JWT Authentication, passlib (bcrypt) password hashing
* **Testing:** Pytest, httpx

## Local Installation & Testing
1. **Backend Setup:**
   * Navigate to the `backend` directory.
   * Activate your virtual environment: `source venv/bin/activate` (Mac/Linux) or `venv\Scripts\activate` (Windows).
   * Install dependencies: `pip install fastapi uvicorn sqlalchemy passlib bcrypt python-jose yfinance scikit-learn pandas pytest httpx`.
   * Start the API server: `python -m uvicorn main:app --reload`.
   * *Note:* To run automated security tests, execute `pytest` in the terminal.

2. **Frontend Setup:**
   * Navigate to the `frontend` directory.
   * Install node modules: `npm install`.
   * Launch the dashboard: `npm run dev`.
   * Access the application at `http://localhost:3000`.

## Cloud Deployment Strategy (CI/CD Ready)
This platform is architected for a decoupled, scalable cloud environment:
* **Database Layer:** Built with SQLAlchemy, the system uses SQLite for local development but is production-ready. To deploy to the cloud, simply swap the `SQLALCHEMY_DATABASE_URL` in `main.py` with a PostgreSQL connection string (e.g., Supabase or Neon).
* **API / Backend:** The FastAPI application is container-ready and optimized for deployment on platforms like Render or Railway. 
* **Client / Frontend:** The Next.js application is fully compatible with Vercel for automated CI/CD deployments directly from a GitHub repository.