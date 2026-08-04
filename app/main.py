# app/main.py

from fastapi import FastAPI

from app.routers import auth, decision , document, outcome, strategy, department, admin, constraints, dashboard
from app.routers.chat_router import router as chat_router

from fastapi.middleware.cors import CORSMiddleware

import os
import sentry_sdk
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="College Decision Support System",
    description="API for managing departmental decisions, strategies, and outcomes.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://team-42-dss.vercel.app"],
    allow_origin_regex=r"https://team-42-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------
# ROUTERS
# -------------------------------------------------------

app.include_router(auth.router)
app.include_router(decision.router)
app.include_router(document.router)
app.include_router(outcome.router)
app.include_router(strategy.router)
app.include_router(department.router)
app.include_router(admin.router)
app.include_router(constraints.router)
app.include_router(chat_router)
app.include_router(dashboard.router)


# -------------------------------------------------------
# ROOT / HEALTH CHECK
# -------------------------------------------------------

@app.get("/", tags=["Health"])
def root():
    """
    Basic health check endpoint.
    Confirms the API is running.
    """
    return {"status": "ok", "message": "College DSS API is running."}


sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    # Percentage of requests to trace for performance monitoring (1.0 = 100%).
    # Fine to keep at 1.0 for a demo — traffic is low and you want full visibility.
    traces_sample_rate=1.0,
    environment=os.getenv("ENVIRONMENT", "development"),
)