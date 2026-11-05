"""Turn a seed file into ArtifactData batch writes (max 50 per batch) for loading data
into a published Claude artifact.

  python3 scripts/seed_to_batch.py examples/seed.json out/

Writes out/docs/<collection>/<id>.json plus out/batch-1.json, batch-2.json, ... Each
batch file is the `writes` array for one ArtifactData call (action "batch"), using
`file_path` entries so large documents never pass through a chat."""
import json, pathlib, sys
src, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
seed = json.loads(src.read_text())
writes = []
for coll, docs in seed.items():
    for doc_id, data in docs.items():
        f = out / "docs" / coll / (doc_id + ".json")
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(json.dumps(data, ensure_ascii=False))
        writes.append({"op": "set", "collection": coll, "doc_id": doc_id, "file_path": str(f.resolve())})
for i in range(0, len(writes), 50):
    (out / f"batch-{i // 50 + 1}.json").write_text(json.dumps(writes[i:i + 50], indent=1))
print(len(writes), "writes in", (len(writes) + 49) // 50, "batch file(s) under", out)
