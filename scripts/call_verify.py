import requests
print('Posting verify-reset-otp...')
r = requests.post('http://127.0.0.1:8000/api/auth/verify-reset-otp', json={'email':'test.user@example.com','otp':'654321'})
print('Status:', r.status_code)
print('Body:', r.text)
