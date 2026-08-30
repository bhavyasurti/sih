from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class AIProvider(ABC):
    @abstractmethod
    def normalize_configuration(self, config_text: str, vendor: str, deterministic: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def interpret_unknown_command(self, vendor: str, command: str, context: str = "") -> dict[str, Any]:
        raise NotImplementedError
