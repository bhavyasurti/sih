from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
    pool_pre_ping=True if not settings.database_url.startswith("sqlite") else False,
    echo=False,
)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


_db_initialized = False


def get_db():
    global _db_initialized
    if not _db_initialized:
        from app.db.init_db import init_db
        init_db()
        _db_initialized = True
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

