"""Write the JSON Schema for every file the site reads (docs/specs/10-data-contract.md).

    python -m pipeline.export_schema

Stage 3 generates TypeScript types from this file, and CI fails if the committed copy differs from a fresh export.
"""
from __future__ import annotations

import json
from pathlib import Path

from pydantic import TypeAdapter

from .schemas import ContactsBundle, Manifest, Place, RulesBundle, Sectors

TARGET = Path(__file__).resolve().parent.parent / "web" / "src" / "lib" / "data" / "schema.json"


def schema() -> dict:
    files = {
        "rules.json": RulesBundle,
        "contacts.json": ContactsBundle,
        "places.json": list[Place],
        "sectors.json": Sectors,
        "manifest.json": Manifest,
    }
    return {name: TypeAdapter(t).json_schema(by_alias=True, mode="serialization") for name, t in files.items()}


def main() -> None:
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(json.dumps(schema(), indent=1, ensure_ascii=False) + "\n")
    print(f"wrote {TARGET.relative_to(TARGET.parents[4])}")


if __name__ == "__main__":
    main()
