import os
import sys
from pathlib import Path

# Dynamically locate the directory containing the 'app' package
this_file = Path(__file__).resolve()
search_roots = [
    this_file.parent,
    this_file.parent.parent,
    this_file.parent / "backend",
    this_file.parent.parent / "backend",
    Path(os.getcwd()),
    Path(os.getcwd()) / "backend",
    Path("/var/task"),
    Path("/var/task/backend"),
]

for directory in search_roots:
    if directory.exists():
        dir_str = str(directory)
        if (directory / "app" / "main.py").exists():
            if dir_str not in sys.path:
                sys.path.insert(0, dir_str)

from app.main import app  # noqa: E402
