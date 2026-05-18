# Lecture Atlas

A polished static web platform for publishing interactive university math notes. Lecture Atlas presents course material as a bilingual academic archive with rendered mathematical notation, searchable note metadata, clean routes, dark mode, and an in-browser Library editing experience.

## Features

- Static HTML, CSS, and JavaScript: no build step required
- Dynamic note loading from Markdown files listed in `notes/manifest.json`
- KaTeX rendering for inline and display mathematics
- Search across note metadata and loaded note bodies
- Bilingual layout support with LTR and RTL notes
- Dedicated Library page for distraction-free note viewing and local editing
- Light/dark theme toggle with local preference storage
- Local note editing preview with changes saved in `localStorage`
- Clean note URLs through small redirect pages under each note folder
- Responsive layout with sidebar navigation, mobile menu, and scroll progress

## Project Structure

```text
.
├── assets/
│   └── sbu-logo.svg
├── css/
│   └── styles.css
├── js/
│   └── main.js
├── notes/
│   ├── manifest.json
│   ├── analysis/
│   ├── calculus/
│   └── linear-algebra/
└── index.html
```

## Getting Started

Because the app fetches local Markdown and JSON files, run it through the included local web server instead of opening `index.html` directly.

```bash
npm run dev
```

Then open the same base path used by GitHub Pages:

```text
http://127.0.0.1:4173/lecture-atlas/
```

This mirrors the deployed repository URL shape:

```text
https://rick-btw.github.io/lecture-atlas/
```

No dependency installation is needed; the script only uses Node's built-in HTTP server APIs.

If you prefer Python for a quick root-only check, this still works, but it does not mirror the GitHub Pages subpath:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Adding a New Note

1. Create a Markdown file inside `notes/`, for example:

   ```text
   notes/analysis/compactness.md
   ```

2. Add front matter at the top of the note:

   ```markdown
   ---
   title: Compactness
   course: Mathematical Analysis
   lecture: Lecture 9
   lecturer: Prof. Daniel Hart
   language: en
   dir: ltr
   ---
   ```

3. Register the note in `notes/manifest.json`:

   ```json
   {
     "id": "analysis-compactness",
     "course": "Mathematical Analysis",
     "lecture": "Lecture 9",
     "title": "Compactness",
     "lecturer": "Prof. Daniel Hart",
     "semester": "Spring 2026",
     "language": "en",
     "dir": "ltr",
     "path": "notes/analysis/compactness.md",
     "route": "/notes/analysis/compactness",
     "tags": ["analysis", "compactness", "metric spaces"],
     "summary": "A study note covering compactness, finite subcovers, and sequential compactness."
   }
   ```

4. For a clean route, create an `index.html` file at the route path that redirects back to the app, following the existing note route pages.

## Markdown Blocks

Lecture Atlas supports standard headings, paragraphs, lists, fenced code blocks, links, inline code, bold text, and KaTeX math delimiters.

It also supports academic callout blocks:

```markdown
::: theorem
Every continuous function on a compact set is uniformly continuous.
:::
```

Supported block types include `theorem`, `definition`, `lemma`, `corollary`, `example`, `exercise`, `proof`, `warning`, and `important`.

## Deployment

This project can be deployed as a static site with GitHub Pages.

1. Push the repository to GitHub.
2. Open the repository settings.
3. Go to **Pages**.
4. Set the source to the main branch and the repository root.
5. Save and wait for GitHub Pages to publish the site.

The app detects its base path at runtime, so both local root previews and GitHub Pages subpath deployments are supported. The `.nojekyll` file is required so GitHub Pages serves Markdown notes directly instead of converting them into HTML.

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Markdown notes
- KaTeX for math rendering
- Google Fonts: Inter, Vazirmatn, and Crimson Pro

## Author

Created by Amirali Saket as an academic archive interface for mathematical lecture notes.
