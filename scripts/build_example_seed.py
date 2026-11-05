"""Rebuild an optional placeholder-only v3 workspace backup. Never auto-loaded."""
import json
import pathlib

AT = "2026-11-05T12:00:00.000Z"
TEXT = "YOUR NAME\nYOUR PROFESSIONAL HEADLINE\nyou@example.com\n\nSUMMARY\nReplace with your verified professional summary.\n\nEXPERIENCE\nYOUR EMPLOYER | YOUR ROLE\nStart - End\n- A responsibility you can support.\n- A verified accomplishment.\n\nSKILLS\nYour verified skills"
profile = {"name": "", "email": "", "location": "", "headline": "", "workspaceName": "Example workspace", "writingPreferences": "Direct, concise, and factual.", "tracks": [{"id": "general", "label": "General"}]}
resume = {"id": "resume-example", "title": "Sample base résumé", "track": "general", "text": TEXT, "createdAt": AT, "updatedAt": AT, "versions": [{"id": "version-example", "text": TEXT, "note": "Placeholder starter; replace before use", "at": AT}]}
apps = []
for index, (company, role, status) in enumerate([("Example organization", "Target role", "Drafted"), ("Example company", "Another opportunity", "Applied"), ("Example team", "Next role", "Interview")]):
    apps.append({"id": "application-example-" + str(index), "company": company, "role": role, "status": status, "track": "general", "location": "Remote", "posting": "Sample only. Replace with an actual role description.", "url": "", "salary": "", "deadline": "", "appliedOn": "", "lastContact": "", "nextStep": "Review the role description.", "followUpOn": "", "notes": "Sample only; no real application.", "resumeId": "", "coverLetter": "", "packets": [], "attachments": [], "createdAt": AT, "updatedAt": AT})
state = {"schemaVersion": 3, "profile": profile, "resumes": [resume], "applications": apps, "tasks": [{"id": "task-example", "text": "Replace these sample documents and roles with your own.", "done": False, "dueOn": "", "applicationId": "", "createdAt": AT}], "materials": [], "onboardingComplete": True, "createdAt": AT, "updatedAt": AT}
backup = {"format": "unmplyd-backup", "version": 3, "exportedAt": AT, "state": state, "files": []}
out = pathlib.Path(__file__).resolve().parent.parent / "examples" / "workspace-backup.json"
out.write_text(json.dumps(backup, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("wrote", out)
