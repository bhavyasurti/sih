import re

with open("tests/test_reporting_phase6.py", "r", encoding="utf-8") as f:
    content = f.read()

override_code = """
from app.db.models import User
from app.api.routes.auth import get_current_user

def override_get_current_user():
    return User(id=1, name="Test User", email="test@example.com")

app.dependency_overrides[get_current_user] = override_get_current_user
"""

if "override_get_current_user" not in content:
    content = content.replace("client = TestClient(app)", override_code + "\nclient = TestClient(app)")

with open("tests/test_reporting_phase6.py", "w", encoding="utf-8") as f:
    f.write(content)
