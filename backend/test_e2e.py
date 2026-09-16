import requests
import json
import os
import sys

# Production Vercel URL
base_url = 'https://sih-rho-lime.vercel.app/api'

# Read Firebase API Key from frontend/.env
FIREBASE_API_KEY = "AIzaSyBID9AP01WNUhnis-qKQHMDTGUi94wSt-k"

print('Logging in via Firebase REST API...')
auth_url = f'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}'
res = requests.post(auth_url, json={
    'email': 'test@example.com',
    'password': 'password',
    'returnSecureToken': True
})

if not res.ok:
    # If the user doesn't exist, let's try to sign up
    print("Login failed, attempting sign up...")
    signup_url = f'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={FIREBASE_API_KEY}'
    res = requests.post(signup_url, json={
        'email': 'test@example.com',
        'password': 'password',
        'returnSecureToken': True
    })
    
if not res.ok:
    print(f"Auth failed: {res.text}")
    sys.exit(1)

token = res.json().get('idToken')
headers = {'Authorization': f'Bearer {token}'}

print('Syncing user with backend...')
res = requests.post(f'{base_url}/auth/sync', headers=headers)
if not res.ok:
    print(f"Sync failed: {res.text}")
    sys.exit(1)

print('Uploading config...')
config_content = '''system {
    host-name TEST-JUNIPER;
    services {
        ssh {
            root-login deny;
            protocol-version v2;
        }
        telnet;
    }
}
'''
files = {'file': ('test.cfg', config_content, 'text/plain')}
res = requests.post(f'{base_url}/audits/upload', files=files, headers=headers)
if not res.ok:
    print(f"Upload failed: {res.text}")
    sys.exit(1)

audit_id = res.json()['audit_id']

print(f'Analyzing audit {audit_id}...')
res = requests.post(f'{base_url}/audits/{audit_id}/analyze', json={'ai_enabled': True, 'framework': 'CIS'}, headers=headers)
if not res.ok:
    print(f"Analysis failed: {res.text}")
    sys.exit(1)

print(f'Evaluating compliance for {audit_id}...')
res = requests.post(f'{base_url}/audits/{audit_id}/compliance', json={'framework': 'CIS'}, headers=headers)
if not res.ok:
    print(f"Compliance failed: {res.text}")
    sys.exit(1)

score1 = res.json()['score']
findings = res.json()['findings']
print(f'Initial Score: {score1}, Total Findings: {len(findings)}')

failed_finding = next((f for f in findings if f['status'] == 'FAIL'), None)

if failed_finding:
    print(f'Found failing control: {failed_finding["control_id"]}')
    
    print('Reviewing with AI...')
    res = requests.post(f'{base_url}/ai/review-finding', json={
        'finding': failed_finding,
        'vendor': 'juniper'
    }, headers=headers)
    if not res.ok:
        print(f"AI review failed: {res.text}")
        sys.exit(1)
        
    ai_review = res.json()
    print(f'AI Review raw response: {ai_review}')
    proposed_fix = ai_review.get('proposed_solution', 'N/A')
    print(f'Proposed fix: {proposed_fix}')
    
    print('Generating PDF report...')
    res = requests.get(f'{base_url}/audits/{audit_id}/report', headers=headers)
    if res.ok and len(res.content) > 1000:
        print(f'PDF report generated successfully: {len(res.content)} bytes')
    else:
        print(f"PDF report generation failed: status {res.status_code}")
else:
    print('No failing findings to fix.')

print('Done')
