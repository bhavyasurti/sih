with open("tests/test_training_phase5.py", "r", encoding="utf-8") as f:
    content = f.read()

# Fix 1: extract_value('boolean', 'yes') should be True, not False if it's 'yes'
content = content.replace("assert engine.extract_value('boolean', 'yes') is False", "assert engine.extract_value('boolean', 'yes') is True")
content = content.replace("assert engine.extract_value('boolean', 'no') is True", "assert engine.extract_value('boolean', 'no') is False")

# Fix 2: stored = asyncio.run(list_unknown_commands(db=db)) -> stored = asyncio.run(list_unknown_commands(db=db, current_user=User(id=1, name="test", email="t@t.com", password_hash="h")))
content = content.replace("stored = asyncio.run(list_unknown_commands(db=db))", "stored = asyncio.run(list_unknown_commands(db=db, current_user=User(id=1, name='test', email='test@test.com', password_hash='hash')))")

with open("tests/test_training_phase5.py", "w", encoding="utf-8") as f:
    f.write(content)
