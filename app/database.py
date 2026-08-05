# app/database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# Detect if we're using PostgreSQL with PgBouncer/Neon Pooler
connect_args = {}
if DATABASE_URL.startswith("postgresql"):
    # Disables prepared statements (required for PgBouncer / Neon transaction pooling)
    connect_args["prepare_threshold"] = None

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Automatically re-connects stale idle connections
    pool_recycle=300,    # Prevents closed connection errors on Render/Neon
    connect_args={"connect_timeout": 30},
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()