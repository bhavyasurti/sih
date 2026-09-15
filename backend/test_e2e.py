import requests
import json
import os

base_url = 'http://localhost:8000/api'

print('Logging in...')
res = requests.post(f'{base_url}/auth/login', json={'email': 'test@example.com', 'password': 'password'})
token = res.json().get('access_token')
headers = {'Authorization': f'Bearer {token}'}

print('Uploading config...')
config_content = '''router ospf 1
no network 0.0.0.0 255.255.255.255 area 0
ip name-server 8.8.8.8
'''
files = {'file': ('test.cfg', config_content, 'text/plain')}
res = requests.post(f'{base_url}/audits/upload', files=files, headers=headers)
audit_id = res.json()['audit_id']

print(f'Analyzing audit {audit_id}...')
res = requests.post(f'{base_url}/audits/{audit_id}/analyze', json={'ai_enabled': True, 'framework': 'CIS'}, headers=headers)

print(f'Evaluating compliance for {audit_id}...')
res = requests.post(f'{base_url}/audits/{audit_id}/compliance', json={'framework': 'CIS'}, headers=headers)
score1 = res.json()['score']
findings = res.json()['findings']
print(f'Initial Score: {score1}, Total Findings: {len(findings)}')

failed_finding = next((f for f in findings if f['status'] == 'FAIL'), None)

if failed_finding:
    print(f'Found failing control: {failed_finding["control_id"]}')
    
    print('Reviewing with AI...')
    res = requests.post(f'{base_url}/ai/review-finding', json={
        'finding': failed_finding,
        'vendor': 'cisco'
    }, headers=headers)
    ai_review = res.json()
    proposed_fix = ai_review['proposed_solution']
    print(f'Proposed fix: {proposed_fix}')
    
    print('Applying remediation...')
    res = requests.post(f'{base_url}/audits/{audit_id}/apply-remediation', json={
        'finding': failed_finding["control_id"],
        'proposed_solution': proposed_fix,
        'control_title': failed_finding["title"]
    }, headers=headers)
    
    score2 = res.json()['new_score']
    print(f'New Score: {score2}')
    print(f'Resulting Status: {res.json()["resulting_audit_status"]}')
    
    print('Checking approval history...')
    res = requests.get(f'{base_url}/audits/approvals/history', headers=headers)
    history = res.json()
    print(f'History length: {len(history)}')
    if len(history) > 0:
        print(f'Latest history item: {history[0]}')
else:
    print('No failing findings to fix.')

print('Done')
