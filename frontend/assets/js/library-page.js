import { api } from "./api.js";
import { mountShell } from "./components/layout.js";
import { renderStoryCard } from "./components/story-card.js";
import { ensureAuthenticated } from "./session.js";

const session = await ensureAuthenticated();

mountShell({
  sidebarTarget: "#app-sidebar",
  topbarTarget: "#app-topbar",
  user: session.user,
  activeNav: "library",
  topbar: {
    eyebrow: "The Digital Atelier",
    title: "Story Library",
    tabs: [
      { label: "Reading Mode", href: "/library", active: true },
      { label: "Audio", href: "/library", active: false },
      { label: "Review", href: "/flashcards", active: false }
    ],
    searchPlaceholder: "Search the archives..."
  }
});

const state = {
  search: "",
  level: "",
  genre: "",
  duration: "",
  page: 1
};

const grid = document.querySelector("#library-grid");
const pagination = document.querySelector("#library-pagination");
const nextPageButton = document.querySelector("#next-page");
const filterButtons = document.querySelectorAll("[data-filter-group]");
const searchInput = document.querySelector("[data-shell-search]");

async function loadStories() {
  const payload = await api.get("/api/stories", {
    search: state.search,
    level: state.level,
    genre: state.genre,
    duration: state.duration,
    page: state.page
  });

  grid.innerHTML = payload.items.map(renderStoryCard).join("");
  pagination.textContent = `Archive Navigation: Page ${payload.pagination.page} of ${payload.pagination.totalPages}`;
  nextPageButton.disabled = payload.pagination.page >= payload.pagination.totalPages;
  nextPageButton.classList.toggle("opacity-50", nextPageButton.disabled);
}

function syncChips() {
  filterButtons.forEach((button) => {
    const group = button.dataset.filterGroup;
    const value = button.dataset.filterValue;
    button.classList.toggle("chip-active", state[group] === value);
  });
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const group = button.dataset.filterGroup;
    const value = button.dataset.filterValue;
    state[group] = state[group] === value ? "" : value;
    state.page = 1;
    syncChips();
    loadStories();
  });
});

searchInput?.addEventListener("input", (event) => {
  state.search = event.target.value.trim();
  state.page = 1;
  loadStories();
});

nextPageButton.addEventListener("click", () => {
  if (nextPageButton.disabled) {
    return;
  }

  state.page += 1;
  loadStories();
});

syncChips();
loadStories();
