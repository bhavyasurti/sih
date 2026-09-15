with open("tests/test_training_phase5.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("stored_2 = asyncio.run(list_unknown_commands(db=db))", "stored_2 = asyncio.run(list_unknown_commands(db=db, current_user=User(id=1, name='test', email='test@test.com', password_hash='hash')))")

with open("tests/test_training_phase5.py", "w", encoding="utf-8") as f:
    f.write(content)
