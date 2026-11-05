"""Builds examples/seed.json: fictional sample data for a person named Alex Rivera.
Run from the repo root:  python3 scripts/build_example_seed.py"""
import json, pathlib

def L(label, url): return {"label": label, "url": url}

LD = {
 "name": "ALEX RIVERA", "title": "LEARNING & ENABLEMENT LEADER",
 "contact": "Chicago, IL / Open to remote / alex@example.com",
 "summary": "Learning and enablement leader with 11 years across healthcare, SaaS, and retail. Builds onboarding, manager development, and the people systems behind them, and measures whether behavior actually changed.",
 "sections": [
  {"type": "experience", "heading": "EXPERIENCE", "entries": [
   {"company": "NORTHWIND HEALTH", "note": "Series C", "dates": "Mar 2023 – Present",
    "roles": [{"title": "Head of Learning & Enablement"}],
    "bullets": ["Built the learning function from zero for a 600-person company, starting with a manager foundations program for every people leader.",
                "Launched the first LMS and connected it to the HRIS so enrollments, completions and org changes stay in sync without manual work.",
                "Cut new-hire ramp time by 25% with a role-based onboarding journey and 30/60/90 check-ins."]},
   {"company": "LEDGERLINE", "note": "", "dates": "Jun 2019 – Feb 2023",
    "roles": [{"title": "Senior Instructional Designer", "dates": "Jan 2021 – Feb 2023", "bullets": ["Designed sales and customer-education programs used by 4,000 customers across three product lines."]},
              {"title": "Instructional Designer", "dates": "Jun 2019 – Dec 2020", "bullets": ["Produced eLearning, video and job aids for support and success teams."]}],
    "bullets": []},
   {"company": "BRIGHTCART", "note": "", "dates": "Aug 2015 – May 2019",
    "roles": [{"title": "Training Specialist"}],
    "bullets": ["Delivered store-manager training across 40 locations and rebuilt the new-hire program around on-the-floor practice."]}]},
  {"type": "groups", "heading": "CAPABILITIES", "groups": [
   {"label": "Learning & Enablement", "text": "Learning Strategy / Instructional Design / Manager Development / Onboarding / Facilitation / Measurement"},
   {"label": "Systems", "text": "LMS Administration / HRIS Integrations / xAPI / Reporting"}]},
  {"type": "lines", "heading": "EDUCATION", "lines": [{"bold": "State University", "text": "B.A., Communication"}]}]}

CD = {
 "name": "ALEX RIVERA", "title": "CREATIVE DIRECTOR",
 "contact": "Chicago, IL / Open to remote / alex@example.com", "summary": "",
 "sections": [
  {"type": "experience", "heading": "EXPERIENCE", "entries": [
   {"company": "RIVERA STUDIO", "note": "", "dates": "Jan 2022 – Present",
    "roles": [{"title": "Founder & Creative Director"}],
    "bullets": ["Run an independent studio delivering brand identity, campaign and motion work for music and apparel clients."],
    "clientsHeading": "SELECTED CLIENT WORK",
    "clients": [{"name": "Example Records", "desc": "independent label", "bullets": ["Built the label's visual identity and release-artwork system."]}]},
   {"company": "NORTHWIND HEALTH", "note": "", "dates": "Mar 2023 – Present",
    "roles": [{"title": "Head of Learning & Enablement"}],
    "bullets": ["Lead in-house creative production for internal campaigns, leadership video and event branding."]}]},
  {"type": "groups", "heading": "CAPABILITIES", "groups": [
   {"label": "Direction & Design", "text": "Creative Direction / Art Direction / Brand Identity / Campaigns"},
   {"label": "Tools", "text": "Figma / After Effects / Premiere Pro / Midjourney"}]}]}

NOW = "2026-01-15T12:00:00.000Z"
materials = {
 "r-ld": {"kind": "resume", "track": "L&D", "title": "L&D résumé", "subtitle": "2-page PDF · ATS-checked", "status": "current", "date": "2026-01-15", "order": 1, "editorId": "ld",
          "primary": L("Portfolio PDF", "https://example.com/resume.pdf"), "links": [], "note": "The version to send for learning roles.", "flags": []},
 "r-cd": {"kind": "resume", "track": "Creative", "title": "Creative Director résumé", "subtitle": "Editable here", "status": "current", "date": "2026-01-12", "order": 2, "editorId": "cd",
          "primary": None, "links": [], "note": "", "flags": ["Add a reel link before sending"]},
 "r-ld-old": {"kind": "resume", "track": "L&D", "title": "L&D résumé v1", "subtitle": "", "status": "older", "date": "2025-11-02", "order": 10, "primary": None, "links": [], "note": "Superseded by the current version.", "flags": []},
 "l-acme": {"kind": "letter", "track": "L&D", "title": "Acme Robotics", "subtitle": "Head of Enablement", "status": "current", "date": "2026-01-14", "primary": L("Open", "https://example.com/letters/acme"), "links": [], "note": "", "flags": []},
 "l-globex": {"kind": "letter", "track": "Creative", "title": "Globex Media", "subtitle": "Associate Creative Director", "status": "needs fix", "date": "2026-01-08", "primary": L("Open", "https://example.com/letters/globex"), "links": [], "note": "", "flags": ["Uses an old portfolio link"]},
 "s-portfolio": {"kind": "site", "track": "Both", "title": "Portfolio site", "subtitle": "example.com", "status": "live", "date": "2026-01-10", "order": 1, "primary": L("Open", "https://example.com"), "links": [], "note": "", "flags": []},
 "s-linkedin": {"kind": "site", "track": "Both", "title": "LinkedIn profile", "subtitle": "", "status": "live", "date": "2026-01-10", "order": 2, "primary": L("Open", "https://www.linkedin.com/"), "links": [], "note": "", "flags": []},
 "li-about": {"kind": "linkedin", "track": "Both", "title": "About", "status": "draft", "date": "2026-01-15", "order": 1, "note": "Short version.", "primary": None, "links": [], "flags": [],
              "text": "I build the learning programs and people systems that help teams do their best work, and I make the creative that gets people to care.\n\nIf that sounds like the kind of person your team is missing, let's talk."},
 "c-resume": {"kind": "chat", "track": "Both", "title": "Résumé rebuild", "subtitle": "Where the current L&D version was written", "status": "", "date": "2026-01-15", "order": 1, "primary": L("Open", "https://claude.ai/"), "links": [], "note": "", "flags": []},
 "v-drive": {"kind": "vault", "track": "Both", "title": "Job search folder", "subtitle": "Originals and exports", "status": "", "date": "", "order": 1, "primary": L("Open", "https://drive.google.com/"), "links": [], "note": "", "flags": []}
}
applications = {
 "a-acme": {"company": "Acme Robotics", "role": "Head of Enablement", "track": "L&D", "status": "Interview", "applied": "2026-01-14", "last": "2026-01-20", "next": "Panel interview Friday", "link": "https://example.com/jobs/acme", "note": "", "order": 1},
 "a-globex": {"company": "Globex Media", "role": "Associate Creative Director", "track": "Creative", "status": "Applied", "applied": "2026-01-09", "last": "2026-01-09", "next": "Follow up next week", "link": "", "note": "", "order": 2},
 "a-initech": {"company": "Initech", "role": "Learning Program Manager", "track": "L&D", "status": "Lead", "applied": "", "last": "2026-01-12", "next": "Reply to the recruiter", "link": "", "note": "Referral from a former colleague", "order": 3},
 "a-umbrella": {"company": "Umbrella Labs", "role": "Enablement Lead", "track": "L&D", "status": "Closed", "applied": "2025-12-01", "last": "2026-01-05", "next": "", "link": "", "note": "Role filled internally", "order": 4}
}
todos = {
 "t-1": {"area": "Leads", "text": "Reply to the Initech recruiter.", "done": False, "order": 1, "link": "", "created": "2026-01-15"},
 "t-2": {"area": "Résumé", "text": "Add a reel link to the Creative Director résumé.", "done": False, "order": 2, "link": "", "created": "2026-01-15"},
 "t-3": {"area": "Prep", "text": "Prepare three stories for the Acme panel.", "done": False, "order": 3, "link": "", "created": "2026-01-15"},
 "t-4": {"area": "Letters", "text": "Fix the portfolio link in the Globex letter.", "done": True, "order": 4, "link": "", "created": "2026-01-10"}
}
seed = {
 "materials": materials, "applications": applications, "todos": todos,
 "resumes": {"ld": {"title": "L&D", "data": LD, "savedAt": NOW}, "cd": {"title": "Creative Director", "data": CD, "savedAt": NOW}},
 "resumes/ld/versions": {"v0": {"data": LD, "at": NOW, "note": "First import"}},
 "resumes/cd/versions": {"v0": {"data": CD, "at": NOW, "note": "First import"}}
}
out = pathlib.Path(__file__).resolve().parent.parent / "examples" / "seed.json"
out.write_text(json.dumps(seed, ensure_ascii=False, indent=1))
print("wrote", out)
