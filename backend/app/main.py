from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.ai import router as ai_router
from app.api.routes.audits import router as audits_router
from app.api.routes.health import router as health_router
from app.api.routes.training import router as training_router
from app.core.config import get_settings
from app.db.init_db import init_db

settings = get_settings()

app = FastAPI(
    title="NetSecure AI",
    version=settings.app_version,
    description="AI-Driven Multi-Vendor Network Security Compliance Auditor",
)

origins = [
    origin.strip()
    for origin in settings.allowed_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(ai_router)
app.include_router(audits_router)
app.include_router(training_router)


@app.on_event("startup")
def startup_event():
    init_db()


@app.get("/")
async def root():
    return {"message": "NetSecure AI API is running"}
