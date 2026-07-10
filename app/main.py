# app/main.py

from fastapi import FastAPI

from app.routers import auth, decision , document, outcome


app = FastAPI(
    title="College Decision Support System",
    description="API for managing departmental decisions, strategies, and outcomes.",
    version="0.1.0",
)


# -------------------------------------------------------
# ROUTERS
# -------------------------------------------------------

app.include_router(auth.router)
app.include_router(decision.router)
app.include_router(document.router)
app.include_router(outcome.router)

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