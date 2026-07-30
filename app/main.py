# app/main.py

from fastapi import FastAPI

from app.routers import auth, decision , document, outcome, strategy, department, admin, constraints, dashboard
from app.routers.chat_router import router as chat_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="College Decision Support System",
    description="API for managing departmental decisions, strategies, and outcomes.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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