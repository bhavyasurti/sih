from sqlalchemy import text

from app.core.database import Base, engine
from app.db import models  # noqa: F401


def _ensure_finding_columns() -> None:
    with engine.begin() as connection:
        result = connection.execute(text("PRAGMA table_info(findings)"))
        columns = [row[1] for row in result]
        if "framework" not in columns:
            connection.execute(text("ALTER TABLE findings ADD COLUMN framework VARCHAR(50) DEFAULT 'CIS'"))
        if "expected" not in columns:
            connection.execute(text("ALTER TABLE findings ADD COLUMN expected TEXT"))
        if "actual" not in columns:
            connection.execute(text("ALTER TABLE findings ADD COLUMN actual TEXT"))
        if "evidence" not in columns:
            connection.execute(text("ALTER TABLE findings ADD COLUMN evidence TEXT"))
        if "remediation" not in columns:
            connection.execute(text("ALTER TABLE findings ADD COLUMN remediation TEXT"))


def _ensure_learned_mapping_columns() -> None:
    with engine.begin() as connection:
        result = connection.execute(text("PRAGMA table_info(learned_mappings)"))
        columns = [row[1] for row in result]
        if "command_pattern" not in columns:
            connection.execute(text("ALTER TABLE learned_mappings ADD COLUMN command_pattern VARCHAR(500) DEFAULT ''"))
        if "normalized_parameter" not in columns:
            connection.execute(text("ALTER TABLE learned_mappings ADD COLUMN normalized_parameter VARCHAR(150) DEFAULT ''"))
        if "value_type" not in columns:
            connection.execute(text("ALTER TABLE learned_mappings ADD COLUMN value_type VARCHAR(50) DEFAULT 'string'"))
        if "description" not in columns:
            connection.execute(text("ALTER TABLE learned_mappings ADD COLUMN description TEXT DEFAULT ''"))
        if "confidence" not in columns:
            connection.execute(text("ALTER TABLE learned_mappings ADD COLUMN confidence FLOAT DEFAULT 1.0"))
        if "enabled" not in columns:
            connection.execute(text("ALTER TABLE learned_mappings ADD COLUMN enabled BOOLEAN DEFAULT 1"))
        if "updated_at" not in columns:
            connection.execute(text("ALTER TABLE learned_mappings ADD COLUMN updated_at DATETIME"))

        # Back-fill compatibility fields on older schemas
        if "raw_command" not in columns:
            connection.execute(text("ALTER TABLE learned_mappings ADD COLUMN raw_command VARCHAR(500) DEFAULT ''"))
        if "normalized_control" not in columns:
            connection.execute(text("ALTER TABLE learned_mappings ADD COLUMN normalized_control VARCHAR(150) DEFAULT ''"))

        connection.execute(text("UPDATE learned_mappings SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL"))
        connection.execute(text("UPDATE learned_mappings SET command_pattern = raw_command WHERE command_pattern IS NULL OR command_pattern = ''"))
        connection.execute(text("UPDATE learned_mappings SET normalized_parameter = normalized_control WHERE normalized_parameter IS NULL OR normalized_parameter = ''"))
        connection.execute(text("UPDATE learned_mappings SET value_type = 'string' WHERE value_type IS NULL OR value_type = ''"))
        connection.execute(text("UPDATE learned_mappings SET description = '' WHERE description IS NULL"))
        connection.execute(text("UPDATE learned_mappings SET confidence = 1.0 WHERE confidence IS NULL"))
        connection.execute(text("UPDATE learned_mappings SET enabled = 1 WHERE enabled IS NULL"))
        
        # Disable polluted mappings with normalized_parameter = 'unknown'
        # These were created during testing and should not be active in production
        connection.execute(text("UPDATE learned_mappings SET enabled = 0 WHERE normalized_parameter = 'unknown'"))


def _ensure_unknown_command_columns() -> None:
    with engine.begin() as connection:
        result = connection.execute(text("PRAGMA table_info(unknown_commands)"))
        columns = [row[1] for row in result]
        resolved_column_added = "resolved" not in columns
        if "audit_id" not in columns:
            connection.execute(text("ALTER TABLE unknown_commands ADD COLUMN audit_id INTEGER DEFAULT 0"))
        if "device_id" not in columns:
            connection.execute(text("ALTER TABLE unknown_commands ADD COLUMN device_id INTEGER"))
        if "vendor" not in columns:
            connection.execute(text("ALTER TABLE unknown_commands ADD COLUMN vendor VARCHAR(100) DEFAULT 'unknown'"))
        if "command" not in columns:
            connection.execute(text("ALTER TABLE unknown_commands ADD COLUMN command VARCHAR(500) DEFAULT ''"))
        if "line_number" not in columns:
            connection.execute(text("ALTER TABLE unknown_commands ADD COLUMN line_number INTEGER"))
        if "ai_suggestion" not in columns:
            connection.execute(text("ALTER TABLE unknown_commands ADD COLUMN ai_suggestion TEXT"))
        if resolved_column_added:
            connection.execute(text("ALTER TABLE unknown_commands ADD COLUMN resolved BOOLEAN DEFAULT 0"))
        if "resolved_by_mapping_id" not in columns:
            connection.execute(text("ALTER TABLE unknown_commands ADD COLUMN resolved_by_mapping_id INTEGER"))
        if "resolved_at" not in columns:
            connection.execute(text("ALTER TABLE unknown_commands ADD COLUMN resolved_at DATETIME"))
        if "created_at" not in columns:
            connection.execute(text("ALTER TABLE unknown_commands ADD COLUMN created_at DATETIME"))

        connection.execute(text("UPDATE unknown_commands SET created_at = datetime('now') WHERE created_at IS NULL"))
        connection.execute(text("UPDATE unknown_commands SET resolved = 0 WHERE resolved IS NULL"))
        if resolved_column_added:
            connection.execute(text("""
                UPDATE unknown_commands
                SET
                    resolved = 1,
                    resolved_at = COALESCE(resolved_at, datetime('now')),
                    resolved_by_mapping_id = COALESCE(
                        resolved_by_mapping_id,
                        (
                            SELECT learned_mappings.id
                            FROM learned_mappings
                            WHERE COALESCE(learned_mappings.enabled, 1) = 1
                              AND COALESCE(NULLIF(learned_mappings.command_pattern, ''), learned_mappings.raw_command, '') != ''
                              AND instr(
                                  lower(unknown_commands.command),
                                  lower(COALESCE(NULLIF(learned_mappings.command_pattern, ''), learned_mappings.raw_command, ''))
                              ) > 0
                            ORDER BY learned_mappings.id ASC
                            LIMIT 1
                        )
                    )
                WHERE COALESCE(resolved, 0) = 0
                  AND EXISTS (
                      SELECT 1
                      FROM learned_mappings
                      WHERE COALESCE(learned_mappings.enabled, 1) = 1
                        AND COALESCE(NULLIF(learned_mappings.command_pattern, ''), learned_mappings.raw_command, '') != ''
                        AND instr(
                            lower(unknown_commands.command),
                            lower(COALESCE(NULLIF(learned_mappings.command_pattern, ''), learned_mappings.raw_command, ''))
                        ) > 0
                  )
            """))


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_finding_columns()
    _ensure_learned_mapping_columns()
    _ensure_unknown_command_columns()
