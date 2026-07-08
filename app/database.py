from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import get_settings

settings = get_settings()

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_database_schema() -> None:
    """Add missing auth columns and tables to an existing database schema."""
    inspector = inspect(engine)

    if not inspector.has_table("users"):
        Base.metadata.create_all(bind=engine)
        return

    user_columns = {column["name"] for column in inspector.get_columns("users")}
    with engine.begin() as connection:
        if "email_verified" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD email_verified BIT NOT NULL CONSTRAINT DF_users_email_verified DEFAULT 0"))
        if "refresh_token_hash" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD refresh_token_hash NVARCHAR(255) NULL"))
        if "last_login" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD last_login DATETIME NULL"))
        if "failed_login_attempts" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD failed_login_attempts INT NOT NULL CONSTRAINT DF_users_failed_login_attempts DEFAULT 0"))
        if "locked_until" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD locked_until DATETIME NULL"))
        if "remember_me" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD remember_me BIT NOT NULL CONSTRAINT DF_users_remember_me DEFAULT 0"))

    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
