import pytest
import os

os.environ["DATABASE_URL"] = "sqlite://"

from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

import app.database as db_module
from app.database import Base, get_db
from app.main import app

# StaticPool ensures all connections share the same in-memory database
_test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestSession = sessionmaker(autocommit=False, autoflush=False, bind=_test_engine)

# Patch at import time
db_module.engine = _test_engine
db_module.SessionLocal = _TestSession

# FTS5 triggers cause "database disk image is malformed" with StaticPool
# in-memory SQLite. Search tests fall back to ILIKE which is fine for tests.


@pytest.fixture(autouse=True)
def setup_tables():
    Base.metadata.create_all(bind=_test_engine)
    yield
    Base.metadata.drop_all(bind=_test_engine)


@pytest.fixture
def db():
    session = _TestSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def sample_task(client):
    resp = client.post("/api/tasks", json={"title": "Test Task", "priority": "high", "tags": ["work"]})
    assert resp.status_code == 201
    return resp.json()


@pytest.fixture
def multiple_tasks(client):
    tasks = []
    for i in range(15):
        resp = client.post("/api/tasks", json={
            "title": f"Task {i}",
            "status": ["pending", "in_progress", "completed"][i % 3],
            "priority": ["low", "medium", "high"][i % 3],
            "tags": ["work"] if i % 2 == 0 else ["life"],
        })
        tasks.append(resp.json())
    return tasks
