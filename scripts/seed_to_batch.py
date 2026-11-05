"""Export generic document-store batch manifests (50 writes each).
Usage: python3 scripts/seed_to_batch.py examples/seed.json out/
The host importer must read file_path bytes and translate writes to its own API.
No writes are executed here. Use an empty destination: set replaces documents.
"""
import json, pathlib, sys
src, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
seed = json.loads(src.read_text(encoding="utf-8"))
writes = []
for coll, docs in seed.items():
    for doc_id, data in docs.items():
        f = out / "docs" / coll / (doc_id + ".json")
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        writes.append({"op": "set", "collection": coll, "doc_id": doc_id, "file_path": str(f.resolve())})
for i in range(0, len(writes), 50):
    (out / f"batch-{i // 50 + 1}.json").write_text(json.dumps(writes[i:i + 50], indent=1), encoding="utf-8")
print(len(writes), "writes in", (len(writes) + 49) // 50, "batch file(s) under", out)
