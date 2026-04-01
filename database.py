import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Use /tmp/ for serverless writable access on Vercel
import os

db_path = os.path.join("/tmp", "leaves_v2.db")
if not os.environ.get("VERCEL"):
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(BASE_DIR, "leaves_v2.db")

# Fallback to Supabase URL if deployed to Vercel without env vars set
SUPABASE_URL = "postgresql://postgres:Varshaa1326%23@db.hodaapyjlfhngnrqyioh.supabase.co:5432/postgres"

# Use DATABASE_URL, fallback to Supabase on Vercel, or SQLite locally
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL")
if not SQLALCHEMY_DATABASE_URL:
    if os.environ.get("VERCEL"):
        SQLALCHEMY_DATABASE_URL = SUPABASE_URL
    else:
        SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

# Supabase / PostgreSQL doesn't use the check_same_thread argument
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # Handle older Heroku/Supabase postgres:// urls
    if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
