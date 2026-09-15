from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth as firebase_auth
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.db.models import User
# Ensure firebase is initialized
import app.core.security

security = HTTPBearer()

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(db: Session = Depends(get_db), creds: HTTPAuthorizationCredentials = Depends(security)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = creds.credentials
    try:
        # Verify the Firebase ID token (tolerate 60s of clock skew)
        decoded_token = firebase_auth.verify_id_token(token, clock_skew_seconds=60)
        firebase_uid = decoded_token.get("uid")
        if not firebase_uid:
            raise credentials_exception
    except Exception as e:
        raise credentials_exception
        
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in local database. Please login/sync first.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user
