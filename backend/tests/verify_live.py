import requests

BASE = 'http://127.0.0.1:8000'

# 1. Health
r = requests.get(f'{BASE}/api/health')
print('1. Health check:', r.status_code, r.json())
assert r.status_code == 200

# 2. Training unknown & mappings
r_unk = requests.get(f'{BASE}/api/training/unknown')
print('2. Training unknown count:', len(r_unk.json()), r_unk.status_code)
assert r_unk.status_code == 200

r_map = requests.get(f'{BASE}/api/training/mappings')
print('3. Training mappings count:', len(r_map.json()), r_map.status_code)
assert r_map.status_code == 200

# 4. Cisco Test
cisco_cfg = """hostname LIVE-RTR-01
version 15.2
ip ssh version 1
line vty 0 4
 transport input telnet
ip http server
service timestamps log datetime msec
ntp server 10.20.30.40
"""
r_up = requests.post(f'{BASE}/api/audits/upload', files={'file': ('live_rtr_01.cfg', cisco_cfg.encode('utf-8'), 'text/plain')})
audit_id = r_up.json()['audit_id']
requests.post(f'{BASE}/api/audits/{audit_id}/analyze', json={'ai_enabled': False})
r_comp = requests.post(f'{BASE}/api/audits/{audit_id}/compliance', json={'framework': 'CIS'})
print('4. Cisco Compliance score:', r_comp.json().get('score'))
r_rep = requests.get(f'{BASE}/api/audits/{audit_id}/report')
assert r_rep.status_code == 200
assert r_rep.content.startswith(b'%PDF-')
print('   Cisco PDF generated successfully, bytes:', len(r_rep.content))

# 5. Fortinet Test
forti_cfg = """config system global
set hostname FGT-CORE-01
set ssh-version 1
set admintimeout 0
end
"""
r_up_f = requests.post(f'{BASE}/api/audits/upload', files={'file': ('live_fgt_01.cfg', forti_cfg.encode('utf-8'), 'text/plain')})
audit_id_f = r_up_f.json()['audit_id']
requests.post(f'{BASE}/api/audits/{audit_id_f}/analyze', json={'ai_enabled': False})
r_comp_f = requests.post(f'{BASE}/api/audits/{audit_id_f}/compliance', json={'framework': 'CIS'})
print('5. Fortinet Compliance score:', r_comp_f.json().get('score'))
r_rep_f = requests.get(f'{BASE}/api/audits/{audit_id_f}/report')
assert r_rep_f.status_code == 200
assert r_rep_f.content.startswith(b'%PDF-')
print('   Fortinet PDF generated successfully, bytes:', len(r_rep_f.content))

# 6. Palo Alto Test
pan_cfg = """set deviceconfig system hostname PA-FW-01
set deviceconfig system service disable-telnet no
set deviceconfig system service disable-http no
set deviceconfig system ssh version 1
"""
r_up_p = requests.post(f'{BASE}/api/audits/upload', files={'file': ('live_pan_01.cfg', pan_cfg.encode('utf-8'), 'text/plain')})
audit_id_p = r_up_p.json()['audit_id']
requests.post(f'{BASE}/api/audits/{audit_id_p}/analyze', json={'ai_enabled': False})
r_comp_p = requests.post(f'{BASE}/api/audits/{audit_id_p}/compliance', json={'framework': 'CIS'})
print('6. Palo Alto Compliance score:', r_comp_p.json().get('score'))
r_rep_p = requests.get(f'{BASE}/api/audits/{audit_id_p}/report')
assert r_rep_p.status_code == 200
assert r_rep_p.content.startswith(b'%PDF-')
print('   Palo Alto PDF generated successfully, bytes:', len(r_rep_p.content))

print('ALL LIVE MULTI-VENDOR CHECKS PASSED!')
