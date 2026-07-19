import requests

login_res = requests.post("http://127.0.0.1:8000/api/v1/auth/login", data={"username": "admin@pommastore.in", "password": "Admin@2026!"})
print("Login status:", login_res.status_code)
token = login_res.json().get("access_token")

stats_res = requests.get("http://127.0.0.1:8000/api/v1/dashboard/stats", headers={"Authorization": f"Bearer {token}"})
print("Stats status:", stats_res.status_code)
if stats_res.status_code != 200:
    print("Stats error:", stats_res.text)
else:
    print("Stats fetched successfully!")
