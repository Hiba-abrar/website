# TechFest 2026 — Plain HTML/CSS/JS

No build step, no dependencies. Two pages:

- **`index.html`** — the homepage: logo, hero, the total-interest orbit
  counter, and the "Are you interested?" Yes/No prompt.
- **`interest.html`** — where "I'm Interested" leads. Shows the
  university leaderboard, the industry-partner leaderboard (toggle
  between the two with the tabs), the Register/PDF call-to-action, and
  the sign-up form.

Ready to deploy straight to GitHub Pages.

## Deploy to GitHub Pages

1. Create a new GitHub repo (or use an existing one) and push these files
   to it:
   ```bash
   git init
   git add .
   git commit -m "TechFest 2026 site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. On GitHub, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`.
4. Choose the `main` branch and `/ (root)` folder, then **Save**.
5. GitHub gives you a URL shortly after, usually:
   `https://<your-username>.github.io/<your-repo>/`

No build command, no `dist` folder — GitHub Pages serves these files
directly.

## Run it locally first (optional)

Any static file server works, e.g.:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Where to edit things

Everything you'll actually want to change lives in **`config.js`** —
one file, loaded by both pages:

```js
const CONFIG = {
  interestedCount: 530,        // homepage orbit counter total
  interestGoal: 1000,          // only affects how full that ring looks

  techfestWebsiteURL: "...",           // "Not Interested" → this link
  competitionsRegisterURL: "...",      // "Register for Competitions" → this link
  techfestPDF: "assets/techfest-2026-guide.pdf",

  universityData: [
    { name: "NUST", city: "Islamabad", interested: 92, goal: 100 },
    // ...one row per university, in any order — the page sorts and ranks them
  ],

  industryData: [
    { name: "Software & IT Services", interested: 120 },
    // ...one row per industry track
  ],
};
```

All the `interested` numbers in `universityData` and `industryData` are
**placeholders** — swap in real counts as they come in. Add or remove
rows freely; the leaderboard on `interest.html` re-ranks automatically
and the University dropdown in the form is generated from the same list.

| What | File |
|---|---|
| All numbers, lists, and links | `config.js` (the one place to edit) |
| Homepage structure/copy | `index.html` |
| Interest page structure/copy (leaderboard, CTA, form) | `interest.html` |
| Homepage behavior (orbit counter, "Not Interested" modal) | `script.js` |
| Interest page behavior (leaderboard render, tabs, form) | `interest.js` |
| Colors, fonts, spacing, animations | `style.css` (custom properties at the top) |
| Backend integration points (currently mocked) | `fetchInterestedCount()` in `script.js`, `submitInterestForm()` in `interest.js` |

### Add the real PDF

Drop the file at:
```
assets/techfest-2026-guide.pdf
```
`CONFIG.techfestPDF` already points there — no code change needed.
(Delete `assets/PUT_PDF_HERE.txt` once the real PDF is in.)

### Connect a real backend later

`fetchInterestedCount()` (in `script.js`) and `submitInterestForm()` (in
`interest.js`) are mocks — each has a commented-out `fetch(...)` example
showing exactly what to swap in. Nothing else needs to change.

## Notes

- The logo is rendered with no background box — just the mark itself
  (`assets/techfest-logo.png`, transparent PNG).
- Same visual language throughout: deep space background, blue → purple
  gradient headline, thin corner brackets, and donut-ring progress
  indicators on every leaderboard card.
- The leaderboard rings and counters animate in as they scroll into
  view; numbers count up from 0 the first time each card appears.
- Animations respect `prefers-reduced-motion`.
- Modals and the tab toggle are keyboard accessible; modals trap focus,
  close on Escape, and restore focus to the triggering control on close.
