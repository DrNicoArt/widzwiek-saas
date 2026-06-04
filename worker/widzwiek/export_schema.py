"""Generuje JSON Schema kontraktu CaptionDocument do contracts/.

Uruchom z katalogu worker/:  python -m widzwiek.export_schema
"""
from __future__ import annotations

import json
import os

from .contracts import CaptionDocument

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "contracts", "caption_document.schema.json")


def main() -> None:
    schema = CaptionDocument.model_json_schema()
    schema["$schema"] = "https://json-schema.org/draft/2020-12/schema"
    schema["title"] = "CaptionDocument"
    path = os.path.abspath(OUT)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(schema, f, ensure_ascii=False, indent=2)
    print(f"Zapisano schema: {path}")


if __name__ == "__main__":
    main()
