from fastapi import APIRouter

router = APIRouter()


@router.get("/api/health")
@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "NetSecure AI",
    }

