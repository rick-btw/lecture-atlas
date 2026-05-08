const root = document.documentElement;
const header = document.querySelector("[data-header]");
const progress = document.querySelector("#scrollProgress");
const sidebar = document.querySelector("[data-sidebar]");
const mobileBackdrop = document.querySelector("[data-mobile-backdrop]");
const searchModal = document.querySelector("[data-search-modal]");
const searchInput = document.querySelector("#searchInput");
const searchResults = document.querySelector("[data-search-results]");
const noteSystem = document.querySelector("[data-note-system]");
const noteList = document.querySelector("[data-note-list]");
const dynamicNote = document.querySelector("[data-dynamic-note]");
const noteContent = document.querySelector("[data-note-content]");
const notePreview = document.querySelector("[data-note-preview]");
const noteEditor = document.querySelector("[data-note-editor]");
const editorShell = document.querySelector("[data-editor-shell]");
const editToggle = document.querySelector("[data-edit-toggle]");
const fullscreenToggle = document.querySelector("[data-fullscreen-toggle]");
const saveNoteButton = document.querySelector("[data-save-note]");
const resetNoteButton = document.querySelector("[data-reset-note]");
const noteRouteLink = document.querySelector("[data-note-route]");
const appBasePath = getAppBasePath();

const staticArchiveItems = [
  {
    title: "Differential Equations",
    meta: "MATH 252 · Spring 2026 · Dr. Omar Lee",
    href: "#courses",
    terms: "differential equations ode integrating factor laplace stability"
  },
  {
    title: "Probability",
    meta: "STAT 210 · Spring 2026 · Dr. Nima Amini",
    href: "#probability-preview",
    terms: "probability random variables expectation bayes distributions"
  }
];

const state = {
  manifest: [],
  noteBodies: new Map(),
  searchIndex: [...staticArchiveItems],
  activeNote: null,
  activeSource: "",
  editMode: false
};

const storageKeys = {
  theme: "lecture-atlas-theme",
  oldTheme: "lecture-theme",
  route: "lecture-atlas-pending-route",
  oldRoute: "lecture-pending-route",
  notePrefix: "lecture-atlas-note:",
  oldNotePrefix: "lecture-note:"
};

function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem(storageKeys.theme, theme);
}

function initTheme() {
  const saved = localStorage.getItem(storageKeys.theme) || localStorage.getItem(storageKeys.oldTheme);
  const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  setTheme(saved || preferred);
}

function updateScrollState() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const value = max > 0 ? (window.scrollY / max) * 100 : 0;
  const archive = document.querySelector("#archive");
  if (progress) progress.style.width = `${value}%`;
  if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  if (sidebar && archive) {
    sidebar.classList.toggle("is-visible", window.scrollY + 140 > archive.offsetTop);
  }
}

function openSidebar() {
  if (!sidebar || !mobileBackdrop) return;
  sidebar.classList.add("is-open");
  mobileBackdrop.classList.add("is-open");
}

function closeSidebar() {
  if (!sidebar || !mobileBackdrop) return;
  sidebar.classList.remove("is-open");
  mobileBackdrop.classList.remove("is-open");
}

function openSearch() {
  if (!searchModal || !searchInput || !searchResults) return;
  searchModal.classList.add("is-open");
  searchModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  renderSkeletons();
  setTimeout(() => {
    renderResults(searchInput.value);
    searchInput.focus();
  }, 180);
}

function closeSearch() {
  if (!searchModal) return;
  searchModal.classList.remove("is-open");
  searchModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function renderSkeletons() {
  if (!searchResults) return;
  searchResults.innerHTML = `
    <div class="skeleton"></div>
    <div class="skeleton"></div>
    <div class="skeleton"></div>
  `;
}

function renderResults(query = "") {
  if (!searchResults) return;
  const normalized = normalizeSearch(query);
  const matches = state.searchIndex.filter((item) => {
    const haystack = normalizeSearch(`${item.title} ${item.meta} ${item.terms}`);
    return !normalized || haystack.includes(normalized);
  });

  if (!matches.length) {
    searchResults.innerHTML = `<p class="search-result">No notes found. Try "uniform convergence", "eigenvalues", or "انتگرال".</p>`;
    return;
  }

  searchResults.innerHTML = matches
    .map((item) => `
      <a class="search-result" href="${item.href}" data-note-link="${item.id || ""}">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.meta)}</span>
      </a>
    `)
    .join("");
}

function setReaderDirection(direction) {
  document.querySelectorAll("[data-dir-set]").forEach((button) => {
    button.classList.toggle("active", button.dataset.dirSet === direction);
  });

  const note = state.manifest.find((item) => direction === "rtl" ? item.dir === "rtl" : item.dir !== "rtl");
  if (note) navigateToNote(note.id, true);
}

function initRevealAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

function renderMath(target = document.body) {
  if (!window.renderMathInElement || !target) return;

  renderMathInElement(target, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\[", right: "\\]", display: true },
      { left: "\\(", right: "\\)", display: false },
      { left: "$", right: "$", display: false }
    ],
    throwOnError: false
  });
}

async function initNotes() {
  if (!noteSystem) return;

  try {
    const response = await fetch(assetUrl("notes/manifest.json"));
    if (!response.ok) throw new Error(`Manifest request failed: ${response.status}`);
    state.manifest = await response.json();
    renderNoteList();
    rewriteStaticNoteLinks();
    state.searchIndex = [...noteItemsForSearch(), ...staticArchiveItems];
    renderResults(searchInput?.value || "");
    await loadInitialNote();
    hydrateSearchIndex();
  } catch (error) {
    noteList.innerHTML = `<p class="note-status">Unable to load note manifest.</p>`;
    if (noteContent) {
      noteContent.innerHTML = `<div class="academic-box warning"><strong>Warning.</strong> The dynamic notes could not be loaded from the notes folder.</div>`;
    }
  }
}

function noteItemsForSearch() {
  return state.manifest.map((note) => ({
    id: note.id,
    title: note.title,
    meta: `${note.course} · ${note.lecture} · ${note.lecturer}`,
    href: routeUrl(note.route),
    terms: `${note.tags.join(" ")} ${note.summary}`
  }));
}

async function hydrateSearchIndex() {
  await Promise.all(state.manifest.map(async (note) => {
    const source = await getNoteSource(note);
    const withoutFrontMatter = stripFrontMatter(source).body;
    const existing = state.searchIndex.find((item) => item.id === note.id);
    if (existing) existing.terms = `${existing.terms} ${withoutFrontMatter}`;
  }));
}

function renderNoteList() {
  if (!noteList) return;
  noteList.innerHTML = state.manifest.map((note) => `
    <a class="note-list-item" href="${routeUrl(note.route)}" data-note-link="${note.id}" dir="${note.dir}" lang="${note.language}">
      <span>${escapeHtml(note.course)}</span>
      <strong>${escapeHtml(note.title)}</strong>
      <small>${escapeHtml(note.lecture)} · ${escapeHtml(note.semester)}</small>
    </a>
  `).join("");
}

function rewriteStaticNoteLinks() {
  document.querySelectorAll("[data-note-link]").forEach((link) => {
    const note = state.manifest.find((item) => item.id === link.dataset.noteLink);
    if (note) link.setAttribute("href", routeUrl(note.route));
  });
}

async function loadInitialNote() {
  const pendingRoute = sessionStorage.getItem(storageKeys.route) || sessionStorage.getItem(storageKeys.oldRoute);
  if (pendingRoute) {
    sessionStorage.removeItem(storageKeys.route);
    sessionStorage.removeItem(storageKeys.oldRoute);
    history.replaceState({}, "", pendingRoute);
  }

  const route = routeFromPath(decodeURIComponent(window.location.pathname));
  const hashId = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("note");
  const routed = state.manifest.find((note) => normalizeRoute(note.route) === route);
  const byHash = state.manifest.find((note) => note.id === hashId);
  await loadNote((routed || byHash || state.manifest[0])?.id, false);
}

async function navigateToNote(id, pushRoute = true) {
  const note = state.manifest.find((item) => item.id === id);
  if (!note) return;
  if (pushRoute && routeFromPath(window.location.pathname) !== normalizeRoute(note.route)) {
    history.pushState({ noteId: note.id }, "", routeUrl(note.route));
  }
  await loadNote(note.id, true);
}

async function loadNote(id, shouldScroll = false) {
  const note = state.manifest.find((item) => item.id === id);
  if (!note || !dynamicNote || !noteContent) return;

  state.activeNote = note;
  state.editMode = false;
  setEditorVisibility(false);

  let source;
  try {
    source = await getNoteSource(note);
  } catch (error) {
    updateActiveNoteChrome(note);
    noteContent.innerHTML = `
      <div class="academic-box warning">
        <strong>Warning.</strong>
        This note could not be loaded. Check that the Markdown file exists under the deployed site path.
      </div>
    `;
    return;
  }

  const savedSource = localStorage.getItem(noteStorageKey(note)) || localStorage.getItem(oldNoteStorageKey(note));
  state.activeSource = savedSource || source;
  renderActiveNote(state.activeSource);
  updateActiveNoteChrome(note);

  if (shouldScroll) {
    document.querySelector("#reader")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function getNoteSource(note) {
  if (state.noteBodies.has(note.id)) return state.noteBodies.get(note.id);
  const response = await fetch(assetUrl(note.path));
  if (!response.ok) throw new Error(`Note request failed: ${response.status}`);
  const source = await response.text();
  if (/^\s*<!doctype html/i.test(source) || /^\s*<html[\s>]/i.test(source)) {
    throw new Error("Expected Markdown but received HTML.");
  }
  state.noteBodies.set(note.id, source);
  return source;
}

function updateActiveNoteChrome(note) {
  document.querySelector("[data-note-title]").textContent = note.title;
  document.querySelector("[data-note-meta]").textContent = `${note.course} · ${note.lecture} · ${note.lecturer}`;
  document.querySelector("[data-note-summary]").textContent = note.summary;
  dynamicNote.setAttribute("dir", note.dir);
  dynamicNote.setAttribute("lang", note.language);
  dynamicNote.classList.toggle("persian-note", note.dir === "rtl");
  noteRouteLink.href = routeUrl(note.route);
  noteRouteLink.dataset.noteLink = note.id;
  document.querySelectorAll("[data-note-link]").forEach((link) => {
    link.classList.toggle("active", link.dataset.noteLink === note.id);
  });
  document.querySelectorAll("[data-dir-set]").forEach((button) => {
    button.classList.toggle("active", note.dir === "rtl" ? button.dataset.dirSet === "rtl" : button.dataset.dirSet === "ltr");
  });
  document.title = `${note.title} · Lecture Atlas`;
}

function renderActiveNote(source) {
  const { body } = stripFrontMatter(source);
  noteContent.innerHTML = renderMarkdown(body);
  renderMath(noteContent);

  if (noteEditor) noteEditor.value = source;
  if (notePreview) {
    notePreview.innerHTML = renderMarkdown(body);
    renderMath(notePreview);
  }
}

function setEditorVisibility(isVisible) {
  state.editMode = isVisible;
  if (!editorShell || !noteContent || !editToggle) return;
  editorShell.hidden = !isVisible;
  noteContent.hidden = isVisible;
  saveNoteButton.hidden = !isVisible;
  resetNoteButton.hidden = !isVisible;
  editToggle.textContent = isVisible ? "View Note" : "Edit Note";

  if (isVisible) {
    updatePreviewFromEditor();
    requestAnimationFrame(() => {
      editorShell.scrollIntoView({ behavior: "smooth", block: "start" });
      noteEditor?.focus({ preventScroll: true });
    });
  }
}

async function toggleNoteFullscreen() {
  if (!dynamicNote || !fullscreenToggle) return;

  if (document.fullscreenElement === dynamicNote) {
    await document.exitFullscreen();
    return;
  }

  if (document.fullscreenElement) {
    await document.exitFullscreen();
  }

  try {
    await dynamicNote.requestFullscreen();
  } catch (error) {
    setNoteFullscreen(!dynamicNote.classList.contains("is-fullscreen"));
  }
}

function setNoteFullscreen(isFullscreen) {
  if (!dynamicNote || !fullscreenToggle) return;
  dynamicNote.classList.toggle("is-fullscreen", isFullscreen);
  document.body.classList.toggle("note-focus-active", isFullscreen);
  fullscreenToggle.textContent = isFullscreen ? "Exit Fullscreen" : "Fullscreen";
  fullscreenToggle.classList.toggle("active", isFullscreen);
}

function syncFullscreenState() {
  setNoteFullscreen(document.fullscreenElement === dynamicNote);
}

function updatePreviewFromEditor() {
  if (!state.activeNote || !noteEditor || !notePreview) return;
  const { body } = stripFrontMatter(noteEditor.value);
  notePreview.innerHTML = renderMarkdown(body);
  renderMath(notePreview);
}

function saveActiveNote() {
  if (!state.activeNote || !noteEditor) return;
  localStorage.setItem(noteStorageKey(state.activeNote), noteEditor.value);
  state.activeSource = noteEditor.value;
  renderActiveNote(state.activeSource);
  setEditorVisibility(false);
}

async function resetActiveNote() {
  if (!state.activeNote) return;
  localStorage.removeItem(noteStorageKey(state.activeNote));
  state.activeSource = await getNoteSource(state.activeNote);
  renderActiveNote(state.activeSource);
}

function noteStorageKey(note) {
  return `${storageKeys.notePrefix}${note.id}`;
}

function oldNoteStorageKey(note) {
  return `${storageKeys.oldNotePrefix}${note.id}`;
}

function stripFrontMatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?/);
  return {
    frontMatter: match?.[1] || "",
    body: match ? source.slice(match[0].length) : source
  };
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      html += `<pre><code class="${lang ? `language-${escapeHtml(lang)}` : ""}">${escapeHtml(code.join("\n"))}</code></pre>`;
      continue;
    }

    if (trimmed === "$$") {
      const math = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== "$$") {
        math.push(lines[index]);
        index += 1;
      }
      index += 1;
      html += `<div class="equation-block">$$\n${escapeHtml(math.join("\n"))}\n$$</div>`;
      continue;
    }

    if (trimmed.startsWith(":::")) {
      const type = trimmed.replace(/^:::\s*/, "").trim().toLowerCase() || "important";
      const block = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== ":::") {
        block.push(lines[index]);
        index += 1;
      }
      index += 1;
      html += `<div class="academic-box ${blockClass(type)}"><strong>${blockLabel(type)}.</strong><div class="academic-box-body">${renderMarkdown(block.join("\n"))}</div></div>`;
      continue;
    }

    if (/^#{1,4}\s+/.test(trimmed)) {
      const level = Math.min(trimmed.match(/^#+/)[0].length + 1, 4);
      const text = trimmed.replace(/^#{1,4}\s+/, "");
      const id = slugify(text);
      html += `<h${level} id="${id}">${renderInline(text)}</h${level}>`;
      index += 1;
      continue;
    }

    if (/^-\s+/.test(trimmed)) {
      const items = [];
      while (index < lines.length && /^-\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^-\s+/, ""));
        index += 1;
      }
      html += `<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`;
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,4}\s+|```|:::|\$\$|- )/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    html += `<p>${renderInline(paragraph.join(" "))}</p>`;
  }

  return html;
}

function renderInline(text) {
  let output = escapeHtml(text);
  output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
  output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return output;
}

function blockClass(type) {
  const normalized = type.split(/\s+/)[0];
  const allowed = ["theorem", "definition", "lemma", "corollary", "example", "exercise", "proof", "warning", "important"];
  return allowed.includes(normalized) ? normalized : "important";
}

function blockLabel(type) {
  const labels = {
    theorem: "Theorem",
    definition: "Definition",
    lemma: "Lemma",
    corollary: "Corollary",
    example: "Example",
    exercise: "Exercise",
    proof: "Proof",
    warning: "Warning",
    important: "Important"
  };

  const faLabels = {
    theorem: "قضیه",
    definition: "تعریف",
    lemma: "لم",
    corollary: "نتیجه",
    example: "مثال",
    exercise: "تمرین",
    proof: "اثبات",
    warning: "هشدار",
    important: "نکته مهم"
  };

  const key = blockClass(type);
  return state.activeNote?.dir === "rtl" ? faLabels[key] : labels[key];
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\\\(|\\\)|\$|[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function normalizeSearch(value) {
  return value.toLowerCase().replace(/ي/g, "ی").replace(/ك/g, "ک").trim();
}

function getAppBasePath() {
  const script = document.querySelector('script[src$="js/main.js"]');
  const source = script?.getAttribute("src") || "js/main.js";
  const scriptUrl = new URL(source, window.location.href);
  return scriptUrl.pathname.replace(/js\/main\.js$/, "");
}

function assetUrl(path) {
  return new URL(path.replace(/^\/+/, ""), `${window.location.origin}${appBasePath}`).toString();
}

function routeUrl(route) {
  const base = appBasePath.replace(/\/$/, "");
  const cleanRoute = route.startsWith("/") ? route : `/${route}`;
  return `${base}${cleanRoute}`;
}

function routeFromPath(pathname) {
  const normalizedPath = normalizeRoute(pathname);
  const base = normalizeRoute(appBasePath);
  if (base && base !== "/" && normalizedPath.startsWith(`${base}/`)) {
    return normalizeRoute(normalizedPath.slice(base.length));
  }
  if (base && base !== "/" && normalizedPath === base) return "/";
  return normalizedPath;
}

function normalizeRoute(route) {
  return route.length > 1 ? route.replace(/\/+$/, "") : route;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.addEventListener("click", (event) => {
  const searchOpen = event.target.closest("[data-search-open]");
  const searchClose = event.target.closest("[data-search-close]");
  const mobileOpen = event.target.closest("[data-mobile-open]");
  const sidebarToggle = event.target.closest("[data-sidebar-toggle]");
  const themeToggle = event.target.closest("[data-theme-toggle]");
  const recentSearch = event.target.closest(".recent-searches button");
  const searchResult = event.target.closest(".search-result");
  const noteLink = event.target.closest("[data-note-link]");

  if (searchOpen) openSearch();
  if (searchClose || (searchModal && event.target === searchModal)) closeSearch();
  if (mobileOpen) openSidebar();
  if (mobileBackdrop && event.target === mobileBackdrop) closeSidebar();
  if (sidebarToggle && sidebar) sidebar.classList.toggle("is-collapsed");
  if (themeToggle) setTheme(root.dataset.theme === "dark" ? "light" : "dark");

  if (recentSearch) {
    if (!searchInput) return;
    searchInput.value = recentSearch.textContent.trim();
    renderResults(searchInput.value);
  }

  if (noteLink?.dataset.noteLink) {
    event.preventDefault();
    closeSearch();
    closeSidebar();
    navigateToNote(noteLink.dataset.noteLink, true);
  } else if (searchResult?.tagName === "A") {
    closeSearch();
  }

  const sidebarLink = event.target.closest(".sidebar a");
  if (sidebarLink) closeSidebar();

  if (event.target.closest("[data-edit-toggle]")) {
    setEditorVisibility(!state.editMode);
  }

  if (event.target.closest("[data-fullscreen-toggle]")) toggleNoteFullscreen();
  if (event.target.closest("[data-save-note]")) saveActiveNote();
  if (event.target.closest("[data-reset-note]")) resetActiveNote();
});

document.addEventListener("keydown", (event) => {
  const isSearchShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
  if (isSearchShortcut) {
    event.preventDefault();
    openSearch();
  }

  if (event.key === "Escape") {
    closeSearch();
    closeSidebar();
    if (dynamicNote?.classList.contains("is-fullscreen") && !document.fullscreenElement) {
      setNoteFullscreen(false);
    }
  }
});

document.querySelectorAll("[data-dir-set]").forEach((button) => {
  button.addEventListener("click", () => setReaderDirection(button.dataset.dirSet));
});

searchInput?.addEventListener("input", () => renderResults(searchInput.value));
noteEditor?.addEventListener("input", updatePreviewFromEditor);
document.addEventListener("fullscreenchange", syncFullscreenState);
window.addEventListener("popstate", () => loadInitialNote());
window.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("resize", updateScrollState);
window.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initRevealAnimations();
  updateScrollState();
  initNotes();
  renderResults();
});

window.addEventListener("load", () => renderMath());
