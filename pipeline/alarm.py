"""9.1: after the weekly data run, list the data warnings in the run's summary and fail if any needs a person
(a source past its review date, or an official page that's gone). A failed scheduled run emails the repo owner."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from pipeline.validate import needs_action

MANIFEST = Path(__file__).resolve().parent.parent / "web" / "public" / "data" / "manifest.json"


def main(manifest: Path = MANIFEST) -> int:
    warns = json.loads(manifest.read_text())["warnings"]
    act = needs_action(warns)
    lines = ["## Data check", "", "**Needs a person:**" if act else "Nothing needs a person this week.", ""]
    lines += [f"- {w}" for w in act]
    lines += ["", "**Other warnings (known, no action this week):**", ""] + [f"- {w}" for w in warns if w not in act]
    report = "\n".join(lines) + "\n"
    print(report)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as f:
            f.write(report)
    return 1 if act else 0


if __name__ == "__main__":
    sys.exit(main())
