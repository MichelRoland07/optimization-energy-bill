"""
Simple API test script
"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("="*50)
print("Testing Energy Optimization API")
print("="*50)

# Test 1: Root endpoint
print("\n1. Testing root endpoint...")
response = requests.get(f"{BASE_URL}/")
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Test 2: Login
print("\n2. Testing login...")
login_data = {
    "username": "admin",
    "password": "admin123"
}
response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
print(f"Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    token = data["access_token"]
    print(f"✓ Login successful!")
    print(f"Token: {token[:50]}...")
    print(f"User: {data['user']['username']}")

    # Test 3: Protected endpoint
    print("\n3. Testing protected endpoint /api/auth/me...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print(f"✓ Protected endpoint works!")
        print(f"User data: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"✗ Error: {response.json()}")
else:
    print(f"✗ Login failed: {response.json()}")

print("\n" + "="*50)
print("Tests completed!")
print("="*50)
