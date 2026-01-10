import requests
import json
import time

# Test login API
login_url = 'http://localhost:8000/api/v1/accounts/login/'
login_data = {
    'email': 'admin@SikaRemit.com',
    'password': 'admin123'
}

print("Testing admin login...")
response = requests.post(login_url, json=login_data)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print("Login successful!")
    print(f"User role: {data['user']['role']}")
    print(f"Access token: {data['access'][:20]}...")
    access_token = data['access']
else:
    print(f"Login failed: {response.text}")
    exit(1)

time.sleep(2)  # Wait to avoid rate limiting

# Test customer registration
register_url = 'http://localhost:8000/api/v1/accounts/register/'
register_data = {
    'email': 'testcustomer2@example.com',
    'password': 'testpass123',
    'password2': 'testpass123',
    'first_name': 'Test2',
    'last_name': 'Customer',
    'phone': '+1234567891',
    'user_type': 3
}

print("\nTesting customer registration...")
response = requests.post(register_url, json=register_data)
print(f"Status: {response.status_code}")
if response.status_code == 201:
    data = response.json()
    print("Registration successful!")
    print(f"Access token: {data['access'][:20]}...")
else:
    print(f"Registration failed: {response.text}")

time.sleep(2)  # Wait to avoid rate limiting

# Test login with the new customer
print("\nTesting new customer login...")
response = requests.post(login_url, json={'email': 'testcustomer2@example.com', 'password': 'testpass123'})
print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print("Customer login successful!")
    print(f"User role: {data['user']['role']}")
else:
    print(f"Customer login failed: {response.text}")

time.sleep(2)  # Wait to avoid rate limiting

# Test token refresh
refresh_url = 'http://localhost:8000/api/v1/accounts/refresh/'
if 'access_token' in locals():
    print("\nTesting token refresh...")
    response = requests.post(refresh_url, json={'refresh': data.get('refresh')})
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Token refresh successful!")
    else:
        print(f"Token refresh failed: {response.text}")

time.sleep(2)  # Wait to avoid rate limiting

# Test logout
logout_url = 'http://localhost:8000/api/v1/accounts/logout/'
print("\nTesting logout...")
headers = {'Authorization': f'Bearer {access_token}'}
response = requests.post(logout_url, headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    print("Logout successful!")
else:
    print(f"Logout failed: {response.text}")
