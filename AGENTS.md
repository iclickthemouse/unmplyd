# Keeping an unmplyd HQ up to date

Read this if you're an AI agent (Claude, or anything else with write access to the artifact's database) asked to keep someone's job-search HQ current.

## When to write

Update the HQ before you finish any conversation in which the person:

- applies to a role, hears back, or changes an application's status
- makes a new résumé, cover letter, portfolio page or LinkedIn draft, or decides an old one is retired
- commits to a next step ("follow up Friday", "prep for the panel")

If nothing on that list happened, don't write anything.

## How to write

- **Read first.** Get the current doc before you change it, and use `update` (merge) instead of `set` so you don't wipe fields you didn't touch.
- **Never delete.** When a résumé or letter is replaced, set the old doc's `status` to `"older"` and add the new one. History is the point.
- **Dates** are `YYYY-MM-DD`. `applications.last` is the date of the last real contact, not today's date by default.
- **Statuses** for applications are exactly: `Lead`, `Drafted`, `Applied`, `In review`, `Interview`, `Offer`, `Closed`.
- **Tracks** must match a `tracks[].id` in the page's config, or `"Both"`.
- **Links** must be `https://`. The page refuses to render anything else.
- **Résumé edits** go to `resumes/<id>` as the whole `data` object, and first save the previous `data` to `resumes/<id>/versions/<new id>` with a `note` saying what changed and why.
- **Don't invent anything.** No metrics, titles, dates or employers the person hasn't given you. If the config has `retiredClaims`, none of those phrases may appear anywhere.
- **Keep it short.** `note` and `next` are one line each. `flags[]` are things to fix before sending, phrased as instructions ("Add reel link").

## IDs

Use short, readable, stable IDs: `a-<company>` for applications, `l-<company>` for letters, `r-<track>-<yyyymm>` for résumés, `t-<n>` for to-dos. Stable IDs let the next agent find what you wrote.

## Field reference

See the *Data model* section of [README.md](README.md). `examples/seed.json` has a complete example of every collection.

## If you can't write

If you don't have access to the artifact's database in this session, say so, and leave a dated note wherever the person keeps their job-search files, so the next session can catch up.
