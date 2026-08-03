"""
Shared pytest fixtures for backend tests.

Uses a separate test database (a Neon branch, or any Postgres with
pgvector installed) so tests never touch real data. Set TEST_DATABASE_URL
in your environment (or a .env.test file) before running.
"""

from dotenv import load_dotenv
load_dotenv(".env.test")

import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

import app.models
from app.models.base import Base
from app.main import app
from app.core.dependencies import get_db
from app.models.user import User
from app.models.department import Department
from app.models.enums import UserRoleEnum


TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

if not TEST_DATABASE_URL:
    raise RuntimeError(
        "TEST_DATABASE_URL is not set. Point it at a separate test "
        "database (e.g. a Neon branch) — never your real database."
    )

# Safety guard: prevent obvious production database usage
unsafe_keywords = [
    "prod",
    "production",
    "main",
    "primary",
]

if any(keyword in TEST_DATABASE_URL.lower() for keyword in unsafe_keywords):
    raise RuntimeError(
        "Refusing to run tests: TEST_DATABASE_URL appears to point "
        "to a production database."
    )


engine = create_engine(
    TEST_DATABASE_URL,
    pool_pre_ping=True,
)

TestSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """
    Creates all tables once per test session.

    IMPORTANT:
    - Does NOT drop tables after tests.
    - Prevents accidental database destruction.
    - Test database cleanup must be done manually.
    """
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture()
def db_session():
    """
    A DB session wrapped in a transaction that's rolled back after
    each test — so tests never leak state into one another.
    """
    connection = engine.connect()
    transaction = connection.begin()

    session = TestSessionLocal(bind=connection)

    yield session

    # cleanup data only, never schema
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    """
    FastAPI TestClient with the real DB dependency swapped for our
    transactional test session.
    """

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    yield TestClient(app)

    app.dependency_overrides.clear()


@pytest.fixture()
def test_department(db_session):
    dept = Department(
        department_name="Computer Science",
        department_type="Academic",
    )

    db_session.add(dept)
    db_session.commit()
    db_session.refresh(dept)

    return dept


def make_user(db_session, department_id, role, email_suffix):
    """
    Helper — not a fixture itself, called by role-specific fixtures below.
    """

    user = User(
        department_id=department_id,
        full_name=f"Test {role.value.title()}",
        email=f"{role.value}.{email_suffix}@test.edu",
        role=role,
        password_hash="not-a-real-hash",
        is_verified=True,
        is_active=True,
    )

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    return user


@pytest.fixture()
def faculty_user(db_session, test_department):
    return make_user(
        db_session,
        test_department.department_id,
        UserRoleEnum.faculty,
        "a",
    )


@pytest.fixture()
def staff_user(db_session, test_department):
    return make_user(
        db_session,
        test_department.department_id,
        UserRoleEnum.staff,
        "b",
    )


@pytest.fixture()
def admin_user(db_session, test_department):
    return make_user(
        db_session,
        test_department.department_id,
        UserRoleEnum.admin,
        "c",
    )


@pytest.fixture()
def other_department(db_session):
    dept = Department(
        department_name="Business",
        department_type="Academic",
    )

    db_session.add(dept)
    db_session.commit()
    db_session.refresh(dept)

    return dept


@pytest.fixture()
def other_dept_faculty_user(db_session, other_department):
    return make_user(
        db_session,
        other_department.department_id,
        UserRoleEnum.faculty,
        "d",
    )