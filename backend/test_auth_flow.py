import requests

print('Testing backend login API...')
url = 'http://127.0.0.1:8000/api/v1/accounts/login/'
data = {'email': 'test@example.com', 'password': 'test123'}

try:
    response = requests.post(url, data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
    print(f'Backend Status: {response.status_code}')
    if response.status_code == 200:
        data = response.json()
        print('✅ Backend login successful!')
        token_preview = data['access'][:50] + '...' if len(data['access']) > 50 else data['access']
        print(f'Access token: {token_preview}')
        print(f'User role: {data["user"]["role"]}')

        print('\nTesting NextAuth session...')
        session_url = 'http://localhost:3000/api/auth/session'
        session_response = requests.get(session_url)
        print(f'NextAuth Status: {session_response.status_code}')

        if session_response.status_code == 200:
            print('✅ NextAuth session endpoint working!')
        else:
            print('⚠️ NextAuth session endpoint issue')

    else:
        print(f'❌ Backend login failed: {response.text}')

except Exception as e:
    print(f'❌ Error: {e}')
