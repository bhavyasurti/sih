import requests

res = requests.post("http://127.0.0.1:5173/api/auth/login", data={
    "username": "user_8733@example.com",
    "password": "Password123"
})
print("Login via proxy:", res.status_code, res.text)
