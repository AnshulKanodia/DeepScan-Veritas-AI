import os
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Use writable /tmp directory on Vercel/AWS Lambda serverless environments
    tmp_dir = tempfile.gettempdir().replace("\\", "/")
    DATABASE_URL = f"sqlite:///{tmp_dir}/deepscan_history.db"

# Handle PostgreSQL URLs from Neon/Supabase (postgres:// -> postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

try:
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True
    )
except Exception as e:
    # Fallback to in-memory SQLite if filesystem is completely locked
    print(f"[!] Warning: Failed to initialize file SQLite, falling back to in-memory: {e}")
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
