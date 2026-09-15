with open("tests/test_training_phase5.py", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("from app.services.parsers.fortios_parser import parse_fortios_config", "from app.services.parsers.fortios_parser import parse_fortios_config\nfrom app.db.models import User")

content = content.replace("""    response = asyncio.run(
        analyze_audit(
            audit_id=audit.id,
            options=AnalysisOptions(ai_enabled=False),
            db=db,
        )
    )""", """    response = asyncio.run(
        analyze_audit(
            audit_id=audit.id,
            options=AnalysisOptions(ai_enabled=False),
            db=db,
            current_user=User(id=1, name="test", email="test@test.com", password_hash="hash")
        )
    )""")

content = content.replace("""    response_2 = asyncio.run(
        analyze_audit(
            audit_id=audit.id,
            options=AnalysisOptions(ai_enabled=False),
            db=db,
        )
    )""", """    response_2 = asyncio.run(
        analyze_audit(
            audit_id=audit.id,
            options=AnalysisOptions(ai_enabled=False),
            db=db,
            current_user=User(id=1, name="test", email="test@test.com", password_hash="hash")
        )
    )""")

with open("tests/test_training_phase5.py", "w", encoding="utf-8") as f:
    f.write(content)
