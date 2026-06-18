import { api } from "./api.js";
import { mountShell } from "./components/layout.js";
import { ensureAuthenticated } from "./session.js";
import { escapeHtml, formatDate, setBusy, showToast } from "./ui.js";

const session = await ensureAuthenticated();

if (session.user.role !== "admin") {
  window.location.href = "/dashboard";
}

mountShell({
  sidebarTarget: "#app-sidebar",
  topbarTarget: "#app-topbar",
  user: session.user,
  activeNav: "admin",
  topbar: {
    eyebrow: "The Digital Atelier",
    title: "Content Studio",
    tabs: [
      { label: "Create", href: "/admin", active: true },
      { label: "Library", href: "/library", active: false },
      { label: "Review", href: "/flashcards", active: false }
    ]
  }
});

const form = document.querySelector("#admin-story-form");
const chaptersRoot = document.querySelector("#chapters-root");
const uploadsRoot = document.querySelector("#recent-uploads");
const previewRoot = document.querySelector("#payload-preview");
const titleInput = document.querySelector("#story-title");
const slugInput = document.querySelector("#story-slug");
const addChapterButton = document.querySelector("#add-chapter");
const submitButton = form.querySelector("button[type='submit']");
const dictionaryImportForm = document.querySelector("#admin-dictionary-import-form");
const dictionaryDatasetSelect = document.querySelector("#dictionary-dataset-file");
const dictionaryImportFeedbackRoot = document.querySelector("#dictionary-import-feedback");
const dictionaryImportHistoryRoot = document.querySelector("#dictionary-import-history");
const refreshDictionaryFilesButton = document.querySelector("#refresh-dictionary-files");
const dictionaryImportButton = dictionaryImportForm.querySelector("button[type='submit']");

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createChapterCard(chapter = {}) {
  const wrapper = document.createElement("section");
  wrapper.className = "rounded-[1.5rem] bg-surface-container-low p-5 shadow-editorial";
  wrapper.innerHTML = `
    <div class="mb-4 flex items-center justify-between gap-4">
      <div>
        <p class="font-label text-[10px] font-bold uppercase tracking-[0.24em] text-outline">Chapter</p>
        <h3 class="mt-1 text-2xl font-bold text-primary">Structured Content Block</h3>
      </div>
      <button type="button" data-remove-chapter class="rounded-full bg-error-container px-4 py-2 font-label text-xs font-bold uppercase tracking-[0.18em] text-error">Remove</button>
    </div>
    <div class="grid gap-5 lg:grid-cols-[10rem_minmax(0,1fr)]">
      <label class="block">
        <span class="mb-2 block font-label text-[10px] font-bold uppercase tracking-[0.18em] text-outline">Chapter #</span>
        <input class="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 font-label text-sm focus:ring-1 focus:ring-primary" name="chapterNumber" type="number" min="1" value="${chapter.chapterNumber ?? chaptersRoot.children.length + 1}" required />
      </label>
      <label class="block">
        <span class="mb-2 block font-label text-[10px] font-bold uppercase tracking-[0.18em] text-outline">Chapter Title</span>
        <input class="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 text-lg focus:ring-1 focus:ring-primary" name="chapterTitle" type="text" value="${escapeHtml(chapter.title ?? "")}" placeholder="Kapitel Eins" required />
      </label>
    </div>
    <label class="mt-5 block">
      <span class="mb-2 block font-label text-[10px] font-bold uppercase tracking-[0.18em] text-outline">Optional Image URL</span>
      <input class="w-full rounded-xl border-none bg-surface-container-lowest px-4 py-3 font-label text-sm focus:ring-1 focus:ring-primary" name="chapterImageUrl" type="url" value="${escapeHtml(chapter.imageUrl ?? "")}" placeholder="https://..." />
    </label>
    <label class="mt-5 block">
      <span class="mb-2 block font-label text-[10px] font-bold uppercase tracking-[0.18em] text-outline">HTML Content</span>
      <textarea class="min-h-[220px] w-full rounded-[1.25rem] border-none bg-surface-container-lowest px-4 py-4 font-mono text-sm leading-7 focus:ring-1 focus:ring-primary" name="chapterContentHtml" required placeholder="<p>Write your story here...</p>">${escapeHtml(chapter.contentHtml ?? "<p></p>")}</textarea>
    </label>
  `;

  wrapper.querySelector("[data-remove-chapter]").addEventListener("click", () => {
    if (chaptersRoot.children.length === 1) {
      showToast("At least one chapter is required.", "error");
      return;
    }

    wrapper.remove();
    refreshPreview();
  });

  wrapper.querySelectorAll("input, textarea").forEach((element) => {
    element.addEventListener("input", refreshPreview);
  });

  return wrapper;
}

function formatBytes(value) {
  if (!value) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** exponent;

  return `${size.toFixed(size >= 100 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function setDictionaryImportFeedback(message, tone = "neutral") {
  const toneClass =
    tone === "success"
      ? "text-secondary"
      : tone === "error"
        ? "text-error"
        : "text-on-surface-variant";

  dictionaryImportFeedbackRoot.innerHTML = `<div class="${toneClass}">${escapeHtml(message)}</div>`;
}

function collectPayload() {
  const formData = new FormData(form);
  const chapters = Array.from(chaptersRoot.children).map((chapterElement) => ({
    chapterNumber: Number(chapterElement.querySelector("[name='chapterNumber']").value),
    title: chapterElement.querySelector("[name='chapterTitle']").value.trim(),
    imageUrl: chapterElement.querySelector("[name='chapterImageUrl']").value.trim() || undefined,
    contentHtml: chapterElement.querySelector("[name='chapterContentHtml']").value.trim()
  }));

  return {
    slug: slugInput.value.trim(),
    title: formData.get("title")?.toString().trim(),
    subtitle: formData.get("subtitle")?.toString().trim() || undefined,
    excerpt: formData.get("excerpt")?.toString().trim(),
    contentType: formData.get("contentType")?.toString(),
    level: formData.get("level")?.toString(),
    genre: formData.get("genre")?.toString().trim(),
    minutes: Number(formData.get("minutes")),
    wordCount: Number(formData.get("wordCount")),
    coverImageUrl: formData.get("coverImageUrl")?.toString().trim() || undefined,
    audioText: formData.get("audioText")?.toString().trim() || undefined,
    audioUrl: formData.get("audioUrl")?.toString().trim() || undefined,
    isFeatured: formData.get("isFeatured") === "on",
    chapters
  };
}

function refreshPreview() {
  const payload = collectPayload();
  previewRoot.textContent = JSON.stringify(payload, null, 2);
}

function renderUploadHistory(items) {
  if (!items.length) {
    uploadsRoot.innerHTML = `
      <div class="empty-state rounded-[1.5rem] bg-surface-container-low p-6 text-center">
        <p class="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-outline">No uploads yet</p>
        <p class="mt-3 text-on-surface-variant">Created stories, essays, letters, and dialogues will appear here.</p>
      </div>
    `;
    return;
  }

  uploadsRoot.innerHTML = items
    .map((item) => {
      const payload = JSON.parse(item.payload_json);
      return `
        <article class="rounded-[1.5rem] bg-surface-container-low p-5 shadow-editorial">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-outline">${escapeHtml(payload.contentType)}</p>
              <h3 class="mt-2 text-2xl font-bold text-primary">${escapeHtml(payload.title)}</h3>
              <p class="mt-2 text-on-surface-variant">${escapeHtml(payload.excerpt)}</p>
            </div>
            <span class="rounded-full bg-surface-container-high px-3 py-1 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-primary">${escapeHtml(payload.level)}</span>
          </div>
          <div class="mt-4 flex flex-wrap gap-3 font-label text-xs uppercase tracking-[0.18em] text-outline">
            <span>${escapeHtml(payload.slug)}</span>
            <span>${payload.chapters.length} chapter(s)</span>
            <span>${formatDate(item.created_at)}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderDictionaryFileOptions(items) {
  if (!items.length) {
    dictionaryDatasetSelect.innerHTML = `
      <option value="">No dataset files found in backend/data/imports</option>
    `;
    dictionaryDatasetSelect.disabled = true;
    dictionaryImportButton.disabled = true;
    return;
  }

  dictionaryDatasetSelect.disabled = false;
  dictionaryImportButton.disabled = false;
  dictionaryDatasetSelect.innerHTML = items
    .map(
      (item) => `
        <option value="${escapeHtml(item.fileName)}">
          ${escapeHtml(item.fileName)} (${formatBytes(item.sizeBytes)})
        </option>
      `
    )
    .join("");
}

function setDictionaryImportDisabled(disabled) {
  dictionaryDatasetSelect.disabled = disabled;
  dictionaryImportButton.disabled = disabled;
  refreshDictionaryFilesButton.disabled = disabled;
}

function renderDictionaryImportHistory(items) {
  if (!items.length) {
    dictionaryImportHistoryRoot.innerHTML = `
      <div class="empty-state rounded-[1.5rem] bg-surface-container-low p-6 text-center">
        <p class="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-outline">No imports yet</p>
        <p class="mt-3 text-on-surface-variant">Run your first Kaikki import to populate the click-to-translate dictionary.</p>
      </div>
    `;
    return;
  }

  dictionaryImportHistoryRoot.innerHTML = items
    .map((item) => {
      const statusTone =
        item.status === "completed" ? "bg-secondary-container text-secondary" : item.status === "failed" ? "bg-error-container text-error" : "bg-surface-container-high text-primary";

      return `
        <article class="rounded-[1.5rem] bg-surface-container-low p-5 shadow-editorial">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-outline">${escapeHtml(item.source_name)}</p>
              <h3 class="mt-2 text-xl font-bold text-primary">${escapeHtml(item.file_name)}</h3>
            </div>
            <span class="rounded-full px-3 py-1 font-label text-[10px] font-bold uppercase tracking-[0.18em] ${statusTone}">${escapeHtml(item.status)}</span>
          </div>
          <div class="mt-4 grid gap-3 font-label text-xs uppercase tracking-[0.18em] text-outline sm:grid-cols-2">
            <span>${Number(item.imported_entries)} new</span>
            <span>${Number(item.updated_entries)} refreshed</span>
            <span>${Number(item.imported_forms)} forms</span>
            <span>${Number(item.audio_assets_upserted)} audio</span>
          </div>
          <div class="mt-4 flex flex-wrap gap-3 font-label text-xs uppercase tracking-[0.18em] text-outline">
            <span>${Number(item.processed_rows)} processed</span>
            <span>${Number(item.skipped_rows)} skipped</span>
            <span>${formatDate(item.created_at)}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadUploads() {
  const response = await api.get("/api/admin/uploads");
  renderUploadHistory(response.items);
}

async function loadDictionaryFiles() {
  const response = await api.get("/api/admin/dictionary/files");

  if (response.disabled) {
    setDictionaryImportDisabled(true);
    dictionaryDatasetSelect.innerHTML = `<option value="">Runtime imports disabled on Vercel</option>`;
    setDictionaryImportFeedback(response.message, "neutral");
    return;
  }

  setDictionaryImportDisabled(false);
  renderDictionaryFileOptions(response.items);

  if (!response.items.length) {
    setDictionaryImportFeedback("Download a Kaikki German .jsonl or .jsonl.gz file into backend/data/imports, then refresh the list.");
    return;
  }

  const newestFile = response.items[0];
  setDictionaryImportFeedback(`Ready to import ${newestFile.fileName}.`);
}

async function loadDictionaryImports() {
  const response = await api.get("/api/admin/dictionary/imports");
  renderDictionaryImportHistory(response.items);
}

titleInput.addEventListener("input", () => {
  if (!slugInput.dataset.manual) {
    slugInput.value = slugify(titleInput.value);
  }
  refreshPreview();
});

slugInput.addEventListener("input", () => {
  slugInput.dataset.manual = slugInput.value.trim() ? "true" : "";
  refreshPreview();
});

form.querySelectorAll("input, select, textarea").forEach((element) => {
  if (element.closest("#chapters-root")) {
    return;
  }

  element.addEventListener("input", refreshPreview);
});

addChapterButton.addEventListener("click", () => {
  chaptersRoot.append(createChapterCard());
  refreshPreview();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = collectPayload();

  setBusy(submitButton, true, "Publishing...");

  try {
    const response = await api.post("/api/admin/stories", payload);
    showToast(`Published ${response.title}.`, "success");
    form.reset();
    slugInput.dataset.manual = "";
    chaptersRoot.innerHTML = "";
    chaptersRoot.append(createChapterCard());
    await loadUploads();
    refreshPreview();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setBusy(submitButton, false);
  }
});

refreshDictionaryFilesButton.addEventListener("click", async () => {
  setBusy(refreshDictionaryFilesButton, true, "Refreshing...");

  try {
    await loadDictionaryFiles();
    showToast("Dataset file list refreshed.", "success");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setBusy(refreshDictionaryFilesButton, false);
  }
});

dictionaryImportForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(dictionaryImportForm);
  const payload = {
    fileName: formData.get("fileName")?.toString().trim(),
    defaultLevel: formData.get("defaultLevel")?.toString(),
    maxEntries: formData.get("maxEntries")?.toString().trim() ? Number(formData.get("maxEntries")) : undefined
  };

  setBusy(dictionaryImportButton, true, "Importing... this can take a while");
  setDictionaryImportFeedback("Import started. The request will finish after the dataset has been streamed into SQLite.");

  try {
    const response = await api.post("/api/admin/dictionary/imports", payload);
    setDictionaryImportFeedback(
      `Import completed: ${response.importedEntries} new entries, ${response.updatedEntries} refreshed, ${response.importedForms} forms, ${response.audioAssetsUpserted} audio assets.`,
      "success"
    );
    showToast("Dictionary import completed.", "success");
    await loadDictionaryImports();
  } catch (error) {
    setDictionaryImportFeedback(error.message, "error");
    showToast(error.message, "error");
  } finally {
    setBusy(dictionaryImportButton, false);
  }
});

chaptersRoot.append(
  createChapterCard({
    chapterNumber: 1,
    title: "Kapitel Eins",
    contentHtml: "<p>Write the first paragraph here...</p>"
  })
);

await loadUploads();
await loadDictionaryFiles();
await loadDictionaryImports();
refreshPreview();
