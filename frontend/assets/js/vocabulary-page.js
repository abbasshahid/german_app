import { api } from "./api.js";
import { mountShell } from "./components/layout.js";
import { ensureAuthenticated } from "./session.js";
import { formatDate, formatNumber } from "./ui.js";

const session = await ensureAuthenticated();

mountShell({
  sidebarTarget: "#app-sidebar",
  topbarTarget: "#app-topbar",
  user: session.user,
  activeNav: "vocabulary",
  topbar: {
    eyebrow: "The Digital Atelier",
    title: "Vocabulary Lexicon",
    tabs: [
      { label: "Reading Mode", href: "/library", active: false },
      { label: "Audio", href: "/library", active: false },
      { label: "Review", href: "/flashcards", active: true }
    ],
    searchPlaceholder: "Search lexicon..."
  }
});

const state = {
  search: "",
  sort: "newest"
};

const tableBody = document.querySelector("#vocab-table-body");
const searchInput = document.querySelector("[data-shell-search]");

async function loadVocabulary() {
  const payload = await api.get("/api/vocabulary", {
    search: state.search,
    sort: state.sort
  });

  document.querySelector("#total-saved").textContent = formatNumber(payload.stats.totalSaved);
  document.querySelector("#due-now").textContent = formatNumber(payload.stats.dueNow);
  document.querySelector("#mastered").textContent = formatNumber(payload.stats.mastered);
  document.querySelector("#table-count").textContent = `Showing ${payload.items.length} of ${payload.pagination.total} saved words`;

  tableBody.innerHTML = payload.items
    .map(
      (item) => `
        <tr class="vocab-table-row hover:bg-surface-container-low/60">
          <td data-label="Word" class="px-6 py-5">
            <div class="flex flex-col">
              <span class="text-lg font-bold text-primary">${item.lemma}</span>
              <span class="font-label text-xs uppercase tracking-[0.14em] text-outline">${item.partOfSpeech}</span>
            </div>
          </td>
          <td data-label="Meaning" class="px-6 py-5 text-on-surface-variant">${item.translation}</td>
          <td data-label="Level" class="px-6 py-5 text-center"><span class="rounded-full bg-surface-container-high px-3 py-1 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-primary">${item.level}</span></td>
          <td data-label="Date Added" class="px-6 py-5 text-right font-label text-sm text-outline">${formatDate(item.createdAt)}</td>
        </tr>
      `
    )
    .join("");
}

searchInput?.addEventListener("input", (event) => {
  state.search = event.target.value.trim();
  loadVocabulary();
});

document.querySelectorAll("[data-sort]").forEach((button) => {
  button.addEventListener("click", () => {
    state.sort = button.dataset.sort;
    document.querySelectorAll("[data-sort]").forEach((element) => element.classList.remove("chip-active"));
    button.classList.add("chip-active");
    loadVocabulary();
  });
});

loadVocabulary();
