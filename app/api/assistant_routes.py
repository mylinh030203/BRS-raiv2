"""Assistant route."""

from __future__ import annotations

from flask import Blueprint, g, jsonify, request

from ..auth import rate_limit
from ..db import get_db
from ..errors import ApiError
from ..services import assistant

assistant_bp = Blueprint("assistant", __name__)


@assistant_bp.get("/assistant/config")
def assistant_config():
    import os
    key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    has_key = bool(key and key != "your_deepseek_api_key_here")
    return jsonify({
        "provider": "deepseek" if has_key else "auker",
        "has_key": has_key,
        "model": os.environ.get("DEEPSEEK_MODEL", "deepseek-chat"),
        "source": "backend_env" if has_key else "default"
    })


@assistant_bp.post("/assistant/prototype-query")
def prototype_query():
    body = request.get_json(silent=True) or {}
    question = str(body.get("question") or "").strip()
    if not question:
        raise ApiError(422, "validation_error", "question is required.")
    role_name = str(body.get("role") or "leadership")
    user = get_db().execute("SELECT * FROM users WHERE role = ?", (role_name,)).fetchone()
    if user is None:
        user = get_db().execute("SELECT * FROM users LIMIT 1").fetchone()
    return jsonify(assistant.query(get_db(), user, question)), 200


@assistant_bp.post("/assistant/query")
def query():
    rate_limit("assistant", g.user["id"])
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise ApiError(400, "bad_request", "Expected a JSON object.")
    question = str(body.get("question") or "").strip()
    if not question:
        raise ApiError(422, "validation_error", "question is required.")
    return jsonify(assistant.query(get_db(), g.user, question)), 201
