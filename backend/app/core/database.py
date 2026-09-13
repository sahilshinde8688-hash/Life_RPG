import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True if not db_url.startswith("sqlite") else False
    )
    # Test connection
    with engine.connect() as conn:
        pass
except Exception as e:
    logger.warning(f"Could not connect to {db_url}: {e}. Falling back to SQLite local database.")
    db_url = "sqlite:///./liferpg.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(db_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
