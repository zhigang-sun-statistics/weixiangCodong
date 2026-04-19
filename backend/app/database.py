from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import get_settings

engine = create_engine(
    get_settings().database_url,
    connect_args={"check_same_thread": False},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _create_fts(engine_):
    """Create FTS5 virtual table and sync triggers. No-op if FTS5 unavailable."""
    with engine_.connect() as conn:
        try:
            conn.execute(text(
                "CREATE VIRTUAL TABLE IF NOT EXISTS tasks_fts "
                "USING fts5(title, description, content=tasks, content_rowid=id)"
            ))
            conn.execute(text(
                "CREATE TRIGGER IF NOT EXISTS tasks_fts_insert AFTER INSERT ON tasks BEGIN"
                " INSERT INTO tasks_fts(rowid, title, description)"
                " VALUES (new.id, new.title, new.description); END"
            ))
            conn.execute(text(
                "CREATE TRIGGER IF NOT EXISTS tasks_fts_update AFTER UPDATE ON tasks BEGIN"
                " DELETE FROM tasks_fts WHERE rowid = old.id;"
                " INSERT INTO tasks_fts(rowid, title, description)"
                " VALUES (new.id, new.title, new.description); END"
            ))
            conn.execute(text(
                "CREATE TRIGGER IF NOT EXISTS tasks_fts_delete AFTER DELETE ON tasks BEGIN"
                " DELETE FROM tasks_fts WHERE rowid = old.id; END"
            ))
            conn.commit()
        except Exception:
            # FTS5 not available — search will use ILIKE fallback
            conn.rollback()


def init_db():
    Base.metadata.create_all(bind=engine)
    _create_fts(engine)
