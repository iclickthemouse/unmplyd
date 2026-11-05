"""Build anonymous, industry-neutral example data. Run from any directory."""
import copy
import json
import pathlib
AT = "2026-01-15T12:00:00.000Z"
BASE = {
    "name": "YOUR NAME", "title": "YOUR PROFESSIONAL TITLE",
    "contact": "Your location / you@example.com",
    "summary": "Replace this sample with a summary supported by your experience.",
    "sections": [
        {"type": "experience", "heading": "EXPERIENCE", "entries": [
            {"company": "YOUR EMPLOYER", "dates": "Start – End",
             "roles": [{"title": "Your role"}],
             "bullets": ["Describe a responsibility or accomplishment you can support.",
                         "Add a verified result if available; do not invent a metric."]}]},
        {"type": "groups", "heading": "SKILLS", "groups": [
            {"label": "Relevant skills", "text": "Your verified skills"}]},
        {"type": "lines", "heading": "EDUCATION", "lines": [
            {"bold": "Your institution", "text": "Your qualification (if applicable)"}]}]
}
WORKING = copy.deepcopy(BASE)
WORKING["summary"] = "Tailor this working copy to a role using facts from your base résumé."
def material(kind, title, **extra):
    return dict(kind=kind, title=title, track="general", status="draft", date=AT[:10],
                links=[], flags=[], note="Sample placeholder; replace before use.", **extra)
seed = {
    "materials": {
        "r-base": material("resume", "Base résumé", editorId="base", order=1),
        "r-working": material("resume", "Working copy", editorId="tailored", order=2),
        "l-example": material("letter", "Example organization · Target role", text=
            "Sample only. Connect your verified experience to this role.")},
    "applications": {
        "a-example-role": {"company": "Example organization", "role": "Target role",
            "track": "general", "status": "Lead", "applied": "", "last": "",
            "next": "Replace this sample with a role to track.", "order": 1,
            "note": "Sample only · no real application", "link": "", "resumeId": "tailored",
            "jobPosting": "Paste the role description here.", "resumeUrl": "",
            "coverLetter": "Sample only. Replace with your role-specific letter.", "coverLetterUrl": ""}},
    "todos": {"t-setup": {"area": "Setup", "text": "Replace the sample résumé and application.",
                           "done": False, "order": 1, "created": AT[:10]}},
    "resumes": {
        "base": {"title": "Base résumé", "data": BASE, "savedAt": AT},
        "tailored": {"title": "Working copy", "data": WORKING, "savedAt": AT}},
    "resumes/base/versions": {"initial": {"data": BASE, "at": AT, "note": "Sample starter"}},
    "resumes/tailored/versions": {"initial": {"data": WORKING, "at": AT, "note": "Sample starter"}}
}
out = pathlib.Path(__file__).resolve().parent.parent / "examples" / "seed.json"
out.write_text(json.dumps(seed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("wrote", out)
