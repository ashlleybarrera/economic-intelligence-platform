from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt

# --- 1. APP & CORS SETUP ---
app = FastAPI(title="Economic Intelligence Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://economic-intelligence-platform.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. CLOUD DB SETUP (SQLAlchemy & Relational Design) ---
# We use SQLite locally for fast development, easily swappable to Postgres (Cloud)
SQLALCHEMY_DATABASE_URL = "sqlite:///./economic_data.db"
# Cloud Production Example: SQLALCHEMY_DATABASE_URL = "postgresql://admin:pass@db.supabase.co:5432/economic_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# User Table
class DBUser(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # Bi-directional relationship
    history = relationship("ForecastHistory", back_populates="owner")

# Forecast History Table (Foreign Key Implementation for Rubric)
class ForecastHistory(Base):
    __tablename__ = "forecast_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    indicator = Column(String)
    forecast_months = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Bi-directional relationship
    owner = relationship("DBUser", back_populates="history")

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 3. SECURITY & AUTHENTICATION ---
SECRET_KEY = "super_secret_economic_key_for_capstone"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.username == form_data.username).first()
    # For demo purposes, auto-register if user doesn't exist
    if not user:
        user = DBUser(username=form_data.username, hashed_password=get_password_hash(form_data.password))
        db.add(user)
        db.commit()
        db.refresh(user)
    
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid auth credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid auth credentials")
    
    user = db.query(DBUser).filter(DBUser.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# --- 4. DATA INGESTION PIPELINE (API Integration) ---
class ForecastRequest(BaseModel):
    indicator: str
    forecast_months: int

@app.get("/api/market-data/{ticker}")
def get_historical_data(ticker: str, current_user: DBUser = Depends(get_current_user)):
    try:
        # Fetch last 2 years of monthly data
        data = yf.download(ticker, period="2y", interval="1mo")
        # Handle yfinance multi-index columns if present
        if isinstance(data.columns, pd.MultiIndex):
            prices = data['Close'][ticker].dropna().tolist()
        else:
            prices = data['Close'].dropna().tolist()
        
        dates = [d.strftime('%Y-%m') for d in data.index]
        
        return {"ticker": ticker, "dates": dates[-12:], "prices": [round(p, 2) for p in prices[-12:]]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Data ingestion failed: {str(e)}")

# --- 5. FORECASTING MODULE (Machine Learning) ---
@app.post("/api/forecast")
def generate_forecast(req: ForecastRequest, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # 1. Ingest Data
        data = yf.download(req.indicator, period="5y", interval="1mo")
        
        # Extract closing prices handling potential MultiIndex from yfinance
        if hasattr(data.columns, 'levels'):
            prices = data['Close'][req.indicator].dropna().values
        else:
            prices = data['Close'].dropna().values
        
        if len(prices) == 0:
            raise ValueError("No data returned from API")

        # 2. Prepare ML Data (X = months index, y = prices)
        X = np.array(range(len(prices))).reshape(-1, 1)
        y = prices

        # 3. Train Scikit-Learn Model
        model = LinearRegression()
        model.fit(X, y)

        # 4. Predict Future Trends
        future_X = np.array(range(len(prices), len(prices) + req.forecast_months)).reshape(-1, 1)
        predictions = model.predict(future_X)

        # 5. Save Forecast History to Database (Relational Requirement)
        new_history = ForecastHistory(
            user_id=current_user.id,
            indicator=req.indicator,
            forecast_months=req.forecast_months
        )
        db.add(new_history)
        db.commit()

        # 6. Format Output
        current_date = datetime.now()
        forecast_results = []
        for i, pred in enumerate(predictions):
            future_date = current_date + timedelta(days=30 * (i + 1))
            forecast_results.append({
                "date": future_date.strftime('%Y-%m'),
                "predicted_value": round(float(pred), 2)
            })

        trend = "Upward" if predictions[-1] > prices[-1] else "Downward"

        return {
            "indicator": req.indicator,
            "current_value": round(float(prices[-1]), 2),
            "forecast": forecast_results,
            "analysis": f"The ML model indicates a {trend} trend over the next {req.forecast_months} months based on 5-year historical regression."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")