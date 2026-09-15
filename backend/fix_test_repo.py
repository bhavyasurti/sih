with open("tests/test_training_phase5.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("repository = AuditRepository(db)", "repository = AuditRepository(db, user_id=1)")

with open("tests/test_training_phase5.py", "w", encoding="utf-8") as f:
    f.write(content)
