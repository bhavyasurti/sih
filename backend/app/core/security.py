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
            # Prepare project ID fallback
            project_id = settings.firebase_project_id or settings.google_cloud_project
            
            # 1. Environment-based explicit initialization
            if settings.firebase_client_email and settings.firebase_private_key:
                # Fix escaped newlines in private key
                private_key = settings.firebase_private_key.replace("\\n", "\n")
                
                cred_dict = {
                    "type": "service_account",
                    "project_id": project_id,
                    "private_key": private_key,
                    "client_email": settings.firebase_client_email,
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred, options={"projectId": project_id} if project_id else None)
                logger.info("Firebase Admin initialized with environment credentials.")
                return

            # 2. Local service account JSON path fallback
            if settings.firebase_service_account_path:
                cred_path = Path(settings.firebase_service_account_path)
                if cred_path.exists():
                    cred = credentials.Certificate(str(cred_path))
                    firebase_admin.initialize_app(cred, options={"projectId": project_id} if project_id else None)
                    logger.info("Firebase Admin initialized with provided service account file.")
                    return
                else:
                    logger.error(f"Service account file not found at {cred_path}.")

            # 3. Legacy JSON string fallback
            if settings.firebase_credentials:
                cred_dict = json.loads(settings.firebase_credentials)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred, options={"projectId": project_id} if project_id else None)
                logger.info("Firebase Admin initialized with provided credentials JSON.")
                return

            # 4. Strict default init with explicitly required project_id
            if project_id:
                firebase_admin.initialize_app(options={"projectId": project_id})
                logger.info(f"Firebase Admin initialized with default credentials and project ID {project_id}.")
            else:
                logger.error("No Firebase configuration provided and no GOOGLE_CLOUD_PROJECT found. Default initialization is likely to fail in production.")
                firebase_admin.initialize_app()
                
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin: {e}")

# Call init_firebase when this module is imported
init_firebase()
