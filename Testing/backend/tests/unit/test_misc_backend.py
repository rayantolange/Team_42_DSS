"""
Small, cheap-to-write tests for a couple of trivial backend pieces that
had zero coverage: the root health-check endpoint and the get_db
dependency generator (mocked — this must never touch a real DB session
factory in a unit test).
"""
from unittest.mock import patch, MagicMock

import pytest

import app.core.dependencies as dependencies_module


def test_root_health_check(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "message": "College DSS API is running.",
    }


def test_get_db_yields_session_and_closes_it_afterward():
    with patch.object(dependencies_module, "SessionLocal") as mock_session_local:
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        gen = dependencies_module.get_db()
        db = next(gen)

        assert db is mock_db
        mock_db.close.assert_not_called()

        # Exhausting the generator triggers the `finally: db.close()`
        with pytest.raises(StopIteration):
            next(gen)

        mock_db.close.assert_called_once()
