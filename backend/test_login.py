import requests

# Test login endpoint
url = 'http://127.0.0.1:8000/api/v1/accounts/login/'
data = {
    'username': 'test@example.com',
    'password': 'test123'
}

try:
    response = requests.post(url, data=data)
    print(f'Status Code: {response.status_code}')
    print(f'Response: {response.json()}')
except Exception as e:
    print(f'Error: {e}')
