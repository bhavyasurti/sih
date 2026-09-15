import requests
import random

email = f"user_{random.randint(1000,9999)}@example.com"
password = "Password123"

print("Registering", email)
res = requests.post("http://127.0.0.1:8000/api/auth/register", json={
    "name": "Test",
    "email": email,
    "password": password
})
print(res.status_code, res.text)

print("Logging in")
res = requests.post("http://127.0.0.1:8000/api/auth/login", data={
    "username": email,
    "password": password
})
print(res.status_code, res.text)

if res.status_code == 200:
    token = res.json()["access_token"]
    print("Testing /me")
    res = requests.get("http://127.0.0.1:8000/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    print(res.status_code, res.text)
