"""Write one JSON Schema covering every file the site reads (docs/specs/10-data-contract.md).

    python -m pipeline.export_schema

`npm run gen:types` in web/ turns it into web/src/lib/data/types.ts. CI fails if the committed copy differs
from a fresh export.
"""
from __future__ import annotations

import json
from pathlib import Path

from pydantic import RootModel
from pydantic.json_schema import models_json_schema

from .schemas import ContactsBundle, Manifest, Place, RulesBundle, Sectors

TARGET = Path(__file__).resolve().parent.parent / "web" / "src" / "lib" / "data" / "schema.json"


class PlacesFile(RootModel[list[Place]]):
    pass


FILES = {
    "rules": RulesBundle,
    "contacts": ContactsBundle,
    "places": PlacesFile,
    "sectors": Sectors,
    "manifest": Manifest,
}


def schema() -> dict:
    """A single schema with shared $defs, so the TypeScript generator emits each type once."""
    refs, top = models_json_schema([(m, "serialization") for m in FILES.values()], by_alias=True)
    return {
        "title": "DataFiles",
        "type": "object",
        "properties": {name: refs[(m, "serialization")] for name, m in FILES.items()},
        "required": list(FILES),
        "additionalProperties": False,
        "$defs": top["$defs"],
    }


def main() -> None:
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(json.dumps(schema(), indent=1, ensure_ascii=False) + "\n")
    print(f"wrote {TARGET.relative_to(TARGET.parents[4])}")


if __name__ == "__main__":
    main()
