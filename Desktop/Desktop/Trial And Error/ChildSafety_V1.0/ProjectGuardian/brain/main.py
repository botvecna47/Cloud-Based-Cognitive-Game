"""
Project Guardian — FastAPI Brain: /analyze → Hugging Face Inference + Supabase.
"""
from __future__ import annotations

import logging
import os

from dotenv import load_dotenv

load_dotenv()
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from supabase import create_client

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("guardian.brain")

app = FastAPI(title="Project Guardian Brain", version="0.1.0")
security = HTTPBearer(auto_error=False)


class AnalyzeRequest(BaseModel):
    device_id: str
    captured_at: datetime
    window_title: str = ""
    process_name: str = ""
    text: str
    region_hash: str = ""


class AnalyzeResponse(BaseModel):
    sentiment_label: str = ""
    sentiment_score: float = 0.0
    risk_label: str = "unknown"
    risk_score: float = 0.0
    alert: bool = False


def require_bearer(
    creds: HTTPAuthorizationCredentials | None = Depends(security),
) -> None:
    expected = os.getenv("BRAIN_API_KEY", "")
    if not expected:
        raise HTTPException(500, "BRAIN_API_KEY not configured")
    if creds is None or creds.credentials != expected:
        raise HTTPException(401, "Unauthorized")


HF_TOKEN = os.getenv("HF_TOKEN", "")
HF_API = "https://api-inference.huggingface.co/models"
SENTIMENT_MODEL = os.getenv(
    "HF_SENTIMENT_MODEL",
    "cardiffnlp/twitter-roberta-base-sentiment-latest",
)
# Optional second model; if calls fail, we fall back to heuristics
RISK_MODEL = os.getenv("HF_RISK_MODEL", "")


def _hf_headers() -> dict[str, str]:
    h: dict[str, str] = {}
    if HF_TOKEN:
        h["Authorization"] = f"Bearer {HF_TOKEN}"
    return h


async def hf_sentiment(client: httpx.AsyncClient, text: str) -> tuple[str, float]:
    if not text.strip():
        return "neutral", 0.0
    url = f"{HF_API}/{SENTIMENT_MODEL}"
    try:
        r = await client.post(
            url,
            headers=_hf_headers(),
            json={"inputs": text[:2000]},
            timeout=30.0,
        )
        if r.status_code != 200:
            log.warning("HF sentiment HTTP %s: %s", r.status_code, r.text[:200])
            return "neutral", 0.0
        data = r.json()
        # HF returns list of label/score dicts for classification
        if isinstance(data, list) and data and isinstance(data[0], dict):
            best = max(data, key=lambda x: float(x.get("score", 0.0)))
            label = str(best.get("label", "neutral"))
            score = float(best.get("score", 0.0))
            return label, score
        if isinstance(data, dict) and "error" in data:
            log.warning("HF error: %s", data.get("error"))
    except Exception as e:
        log.warning("HF sentiment failed: %s", e)
    return "neutral", 0.0


async def hf_risk(client: httpx.AsyncClient, text: str) -> tuple[str, float]:
    if not RISK_MODEL or not text.strip():
        return _heuristic_risk(text)
    url = f"{HF_API}/{RISK_MODEL}"
    try:
        r = await client.post(
            url,
            headers=_hf_headers(),
            json={"inputs": text[:2000]},
            timeout=30.0,
        )
        if r.status_code != 200:
            return _heuristic_risk(text)
        data = r.json()
        if isinstance(data, list) and data and isinstance(data[0], dict):
            best = max(data, key=lambda x: float(x.get("score", 0.0)))
            return str(best.get("label", "low")), float(best.get("score", 0.0))
    except Exception as e:
        log.warning("HF risk failed: %s", e)
    return _heuristic_risk(text)


def _heuristic_risk(text: str) -> tuple[str, float]:
    """Placeholder when no risk model is configured."""
    t = text.lower()
    keywords = ("meet", "secret", "dont tell", "don't tell", "alone", "pics", "picture")
    hits = sum(1 for k in keywords if k in t)
    score = min(1.0, hits * 0.15)
    label = "elevated" if score > 0.3 else "low"
    return label, score


def supabase_insert(row: dict[str, Any]) -> None:
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not key:
        log.warning("Supabase not configured; skipping DB insert")
        return
    sb = create_client(url, key)
    sb.table("events").insert(row).execute()


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    body: AnalyzeRequest,
    _: None = Depends(require_bearer),
) -> AnalyzeResponse:
    async with httpx.AsyncClient() as client:
        s_label, s_score = await hf_sentiment(client, body.text)
        r_label, r_score = await hf_risk(client, body.text)

    alert = r_score > float(os.getenv("RISK_ALERT_THRESHOLD", "0.45")) or (
        s_label.upper() in ("NEGATIVE", "LABEL_0") and s_score > 0.85
    )

    resp = AnalyzeResponse(
        sentiment_label=s_label,
        sentiment_score=s_score,
        risk_label=r_label,
        risk_score=r_score,
        alert=alert,
    )

    snippet = body.text[:2000] if body.text else ""
    row = {
        "device_id": body.device_id,
        "captured_at": body.captured_at.astimezone(timezone.utc).isoformat(),
        "window_title": body.window_title[:500],
        "process_name": body.process_name[:200],
        "text_snippet": snippet,
        "sentiment_score": resp.sentiment_score,
        "sentiment_label": resp.sentiment_label,
        "risk_score": resp.risk_score,
        "risk_label": resp.risk_label,
        "alert": resp.alert,
    }
    try:
        supabase_insert(row)
    except Exception as e:
        log.exception("Supabase insert failed: %s", e)

    return resp
