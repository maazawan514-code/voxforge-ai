from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import get_settings
import logging

logger = logging.getLogger(__name__)

settings = get_settings()

logger.info("=" * 60)
logger.info(f"DATABASE_URL: {settings.DATABASE_URL}")
logger.info("=" * 60)

engine = create_engine(settings.DATABASE_URL)

logger.info(f"ENGINE DIALECT: {engine.dialect.name}")
logger.info(f"ENGINE DRIVER: {engine.dialect.driver}")

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def ensure_database_schema() -> None:
    """Ensure database schema exists and add any missing auth columns."""

    logger.info("Starting database schema check...")

    inspector = inspect(engine)

    if not inspector.has_table("users"):
        logger.info("Users table not found. Creating database schema...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema created successfully.")
        return

    user_columns = {column["name"] for column in inspector.get_columns("users")}

    with engine.begin() as connection:

        if "email_verified" not in user_columns:
            logger.info("Adding column: email_verified")
            connection.execute(text(
                "ALTER TABLE users ADD email_verified BIT NOT NULL CONSTRAINT DF_users_email_verified DEFAULT 0"
            ))

        if "refresh_token_hash" not in user_columns:
            logger.info("Adding column: refresh_token_hash")
            connection.execute(text(
                "ALTER TABLE users ADD refresh_token_hash NVARCHAR(255) NULL"
            ))

        if "last_login" not in user_columns:
            logger.info("Adding column: last_login")
            connection.execute(text(
                "ALTER TABLE users ADD last_login DATETIME NULL"
            ))

        if "failed_login_attempts" not in user_columns:
            logger.info("Adding column: failed_login_attempts")
            connection.execute(text(
                "ALTER TABLE users ADD failed_login_attempts INT NOT NULL CONSTRAINT DF_users_failed_login_attempts DEFAULT 0"
            ))

        if "locked_until" not in user_columns:
            logger.info("Adding column: locked_until")
            connection.execute(text(
                "ALTER TABLE users ADD locked_until DATETIME NULL"
            ))

        if "remember_me" not in user_columns:
            logger.info("Adding column: remember_me")
            connection.execute(text(
                "ALTER TABLE users ADD remember_me BIT NOT NULL CONSTRAINT DF_users_remember_me DEFAULT 0"
            ))

    Base.metadata.create_all(bind=engine)

    logger.info("Database schema is ready.")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()