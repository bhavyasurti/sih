import json
from pathlib import Path
import firebase_admin
from firebase_admin import credentials
from app.core.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

def init_firebase():
    if not firebase_admin._apps:
        try:
            if settings.firebase_service_account_path:
                cred_path = Path(settings.firebase_service_account_path)
                if cred_path.exists():
                    cred = credentials.Certificate(str(cred_path))
                    firebase_admin.initialize_app(cred)
                    logger.info("Firebase Admin initialized with provided service account file.")
                else:
                    logger.error(f"Service account file not found at {cred_path}, falling back to default initialization.")
                    firebase_admin.initialize_app()
            elif settings.firebase_credentials:
                # If credentials are provided as a JSON string in the environment
                cred_dict = json.loads(settings.firebase_credentials)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin initialized with provided credentials JSON.")
            else:
                # Default initialization (relies on GOOGLE_APPLICATION_CREDENTIALS or default service account)
                firebase_admin.initialize_app()
                logger.info("Firebase Admin initialized with default credentials.")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin: {e}")

# Call init_firebase when this module is imported
init_firebase()
