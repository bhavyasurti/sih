from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from firebase_admin import auth as firebase_auth
import logging

from app.api.deps import get_current_user, get_db, security
from app.db.models import User
from app.schemas.auth import UserResponse

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/sync", response_model=UserResponse)
def sync_user(
    db: Session = Depends(get_db),
    creds: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Syncs a Firebase user with the local database. 
    If the user doesn't exist, they are created.
    """
    token = creds.credentials
    try:
        decoded_token = firebase_auth.verify_id_token(token, clock_skew_seconds=60)
        firebase_uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        name = decoded_token.get("name") or email.split("@")[0] if email else "Unknown User"
        
        if not firebase_uid or not email:
            raise HTTPException(status_code=400, detail="Invalid token payload")
    except Exception as e:
        logger.error(f"Error verifying Firebase token in /sync: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
    
    if not user:
        # User might exist with the same email from the old system
        user = db.query(User).filter(User.email == email).first()
        if user:
            # Link to existing user
            user.firebase_uid = firebase_uid
        else:
            # Create new user
            user = User(
                firebase_uid=firebase_uid,
                email=email,
                name=name,
                password_hash=""
            )
            db.add(user)
            
        try:
            db.commit()
            db.refresh(user)
        except IntegrityError as ie:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Database integrity error during sync: {str(ie)}")
        except Exception as general_e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database error during sync: {str(general_e)}")
            
    return user


@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get current user.
    """
    return current_user
