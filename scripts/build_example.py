"""Build the example data (a made-up person, Alex Rivera) and embed it in index.html.

    python3 scripts/build_example.py

Writes examples/example-backup.json (a backup you can import with "Import backup")
and replaces the <script id="unmplyd-example"> block in index.html with the same data."""
import copy, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent

def role(title, bullets, dates=""): return {"title": title, "dates": dates, "bullets": bullets}
def entry(company, dates, roles, note=""): return {"company": company, "note": note, "dates": dates, "roles": roles, "bullets": []}

OPS = {
    "name": "ALEX RIVERA",
    "title": "OPERATIONS MANAGER",
    "contact": "Chicago, IL · alex@example.com · (555) 010-0199 · alexrivera.example",
    "summary": "Operations manager with nine years running teams, budgets and day-to-day delivery in healthcare, logistics and retail. Known for fixing slow, error-prone processes and making the fix stick.",
    "sections": [
        {"type": "experience", "heading": "EXPERIENCE", "entries": [
            entry("Meridian Clinics", "Mar 2022 – Present", [role("Operations Manager", [
                "Run day-to-day operations for 12 outpatient clinics with 140 staff and an $18M annual budget.",
                "Cut average patient wait time from 34 to 19 minutes by redesigning check-in and scheduling.",
                "Rolled out a new scheduling system across all 12 sites in five months, on budget.",
                "Hired and coached six clinic leads; four have since been promoted."])], note="12 locations"),
            entry("Northstar Supply", "Jun 2018 – Feb 2022", [
                role("Operations Supervisor", ["Supervised three shifts and 60 warehouse staff; raised on-time shipments from 91% to 98%.",
                                               "Reduced picking errors by 40% with clearer slotting and a daily five-minute huddle."], "Jan 2020 – Feb 2022"),
                role("Operations Coordinator", ["Built the inventory reports leadership used for weekly planning."], "Jun 2018 – Dec 2019")]),
            entry("Corner Market Co.", "Aug 2015 – May 2018", [role("Assistant Store Manager", [
                "Managed scheduling, ordering and training for a 35-person store with $6M in annual sales."])])]},
        {"type": "groups", "heading": "CAPABILITIES", "groups": [
            {"label": "Operations", "text": "Process improvement / Budgeting / Scheduling / Vendor management / KPIs"},
            {"label": "Tools", "text": "Excel / Tableau / SQL basics / Asana"}]},
        {"type": "lines", "heading": "EDUCATION", "lines": [
            {"bold": "State University", "text": "B.S., Business Administration"},
            {"bold": "Lean Six Sigma Green Belt", "text": "2021"}]}]}

PM = copy.deepcopy(OPS)
PM["name"] = "Alex Rivera"
PM["title"] = "Program & Project Manager"
PM["summary"] = "Program and project manager with nine years of operations experience. I plan and run multi-site rollouts, keep budgets and timelines honest, and get busy teams to adopt new ways of working."
PM["sections"][0]["entries"][0]["roles"][0]["bullets"] = [
    "Led the rollout of a new scheduling system across 12 clinics in five months, on budget.",
    "Run day-to-day operations for 12 outpatient clinics with 140 staff and an $18M annual budget.",
    "Cut average patient wait time from 34 to 19 minutes by redesigning check-in and scheduling."]
PM["sections"][1]["groups"] = [{"label": "Program management", "text": "Rollout planning / Budgets / Risk tracking / Stakeholder updates / Change management"},
                               {"label": "Tools", "text": "Asana / Excel / Tableau / SQL basics"}]

SUPPLY = copy.deepcopy(OPS)
SUPPLY["title"] = "OPERATIONS MANAGER · SUPPLY CHAIN"
SUPPLY["summary"] = "Operations manager who raised on-time shipments from 91% to 98% across three warehouse shifts, now running 12 clinics. Strongest where many people, shifts and handoffs have to work as one."

OLD = copy.deepcopy(OPS)
OLD["summary"] = "Experienced operations professional with a background in healthcare, logistics and retail."
OLD["sections"][0]["entries"][0]["roles"][0]["bullets"] = OLD["sections"][0]["entries"][0]["roles"][0]["bullets"][:2]
OLD["sections"][2]["lines"] = OLD["sections"][2]["lines"][:1]

OPS_V1 = copy.deepcopy(OPS); OPS_V1["sections"][2]["lines"] = OPS_V1["sections"][2]["lines"][:1]
OPS_V2 = copy.deepcopy(OPS); OPS_V2["sections"][0]["entries"][0]["roles"][0]["bullets"] = OPS_V2["sections"][0]["entries"][0]["roles"][0]["bullets"][:3]

def ts(day, hour=10): return f"2026-{day}T{hour:02d}:00:00.000Z"

# Designs use unmplyd's standard options. The PM résumé shows the "Corpo slop" preset.
UNMPLYD = {"preset": "unmplyd", "font": "mono", "accent": "#003FCC", "nameCase": "upper", "nameAlign": "center", "nameSpacing": "wide", "nameBar": True,
           "headings": "numbered", "bullets": "square", "summaryBar": True, "companyCaps": True, "skills": "stacked"}
CORPO = {"preset": "corpo", "font": "serif", "accent": "#000000", "nameCase": "asis", "nameAlign": "center", "nameSpacing": "normal", "nameBar": False,
         "headings": "rule", "bullets": "round", "summaryBar": False, "companyCaps": False, "skills": "inline"}
def design(base, **kw): d = dict(base); d.update(kw); return d

data = {
    "app": "unmplyd", "version": 2, "openId": "r-ops", "example": True, "lastExport": None,
    "resumes": [
        {"id": "r-ops", "title": "Operations", "target": "Operations manager roles", "status": "current", "notes": "My main résumé.", "design": design(UNMPLYD), "data": OPS, "savedAt": ts("11-02"), "created": ts("09-20")},
        {"id": "r-pm", "title": "Project management", "target": "Program & project manager roles", "status": "current", "notes": "Leads with rollouts and delivery. Plain Times New Roman for conservative companies.", "design": design(CORPO), "data": PM, "savedAt": ts("10-25"), "created": ts("10-25")},
        {"id": "r-supply", "title": "Operations · Supply chain", "target": "Warehouse and supply chain roles", "status": "draft", "notes": "Copied from Operations. Still tailoring.", "design": design(UNMPLYD, accent="#1D6B45", preset="custom"), "data": SUPPLY, "savedAt": ts("11-04"), "created": ts("11-03")},
        {"id": "r-old", "title": "Operations (summer 2026)", "target": "Operations manager roles", "status": "older", "notes": "Replaced by Operations in October.", "design": design(UNMPLYD, accent="#141414", preset="custom"), "data": OLD, "savedAt": ts("07-14"), "created": ts("06-30")}],
    "versions": [
        {"id": "v-1", "resumeId": "r-ops", "data": OPS_V1, "at": ts("10-15", 9), "note": "Before adding the certification"},
        {"id": "v-2", "resumeId": "r-ops", "data": OPS_V2, "at": ts("11-01", 16), "note": "Before adding the coaching bullet"}]
}

out = ROOT / "examples" / "example-backup.json"
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
html = ROOT / "index.html"
s = html.read_text()
blob = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
s2, n = re.subn(r'(<script type="application/json" id="unmplyd-example">)[\s\S]*?(</script>)', lambda m: m.group(1) + blob + m.group(2), s)
if n != 1: raise SystemExit("example block not found in index.html")
html.write_text(s2)
print("wrote", out.relative_to(ROOT), "and embedded it in index.html")
