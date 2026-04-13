import { logout } from "../session.js";

function getNavItems(user) {
  const items = [
    { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { key: "library", label: "Library", href: "/library", icon: "auto_stories" },
    { key: "vocabulary", label: "Vocabulary", href: "/vocabulary", icon: "style" },
    { key: "flashcards", label: "Flashcards", href: "/flashcards", icon: "stacked_cards" }
  ];

  if (user.role === "admin") {
    items.push({ key: "admin", label: "Admin", href: "/admin", icon: "edit_square" });
  }

  return items;
}

function renderSidebarContent(user, activeNav, items, { showBrand = true, showLogout = false } = {}) {
  return `
      ${
        showBrand
          ? `
      <div class="mb-12 px-2">
        <h1 class="text-2xl font-bold italic text-[#fff6ea]">The Archivist</h1>
        <p class="font-label text-xs uppercase tracking-[0.25em] text-[#eedfca]/70 mt-2">Digital Atelier</p>
      </div>
      `
          : ""
      }
      <nav class="flex-1 space-y-1">
        ${items
          .map((item) => {
            const isActive = item.key === activeNav;
            return `
              <a href="${item.href}" class="sidebar-nav-link ${isActive ? "is-active font-bold" : ""} flex items-center gap-3 px-4 py-3 rounded-lg transition-colors">
                <span class="material-symbols-outlined">${item.icon}</span>
                <span class="text-base lg:text-lg font-medium">${item.label}</span>
              </a>
            `;
          })
          .join("")}
      </nav>
      <div class="sidebar-profile mt-auto rounded-xl p-4">
        <div class="flex items-center gap-3 mb-4">
          <img class="h-10 w-10 rounded-full object-cover" src="${user.avatarUrl || "https://placehold.co/80x80"}" alt="${user.name}" />
          <div>
            <p class="text-sm font-bold text-[#fff6ea]">${user.name}</p>
            <p class="font-label text-xs uppercase tracking-widest text-[#eedfca]/70">${user.cefrLevel} ${user.role}</p>
          </div>
        </div>
        <a href="/library" class="sidebar-cta block w-full text-center py-3 rounded-lg text-on-primary font-label text-sm font-bold uppercase tracking-widest">Start Daily Lesson</a>
        ${
          showLogout
            ? `
        <button data-sidebar-logout type="button" class="sidebar-secondary-action mt-3 w-full rounded-lg px-4 py-3 font-label text-xs font-bold uppercase tracking-[0.2em] text-[#fff6ea]">
          Sign Out
        </button>
        `
            : ""
        }
      </div>
  `;
}

function renderSidebar(user, activeNav) {
  const items = getNavItems(user);
  const desktopContent = renderSidebarContent(user, activeNav, items);
  const mobileContent = renderSidebarContent(user, activeNav, items, { showBrand: false, showLogout: true });

  return `
    <div class="sidebar-mobile-backdrop lg:hidden" data-mobile-nav-backdrop></div>
    <aside class="sidebar-shell sidebar-mobile-sheet lg:hidden" data-mobile-nav-panel>
      <div class="mb-6 flex items-center justify-between px-1">
        <div>
          <h1 class="text-xl font-bold italic text-[#fff6ea]">The Archivist</h1>
          <p class="font-label text-[10px] uppercase tracking-[0.22em] text-[#eedfca]/70 mt-1">Digital Atelier</p>
        </div>
        <button data-mobile-nav-close class="sidebar-mobile-close flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[#fff6ea]" type="button" aria-label="Close navigation">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      ${mobileContent}
    </aside>
    <aside class="sidebar-shell hidden lg:flex fixed inset-y-0 left-0 w-64 px-4 py-8 flex-col border-r border-transparent">
      ${desktopContent}
    </aside>
  `;
}

function renderTopbar(config, user) {
  const tabLinks = (config.tabs || [])
    .map(
      (tab) => `
        <a href="${tab.href}" class="font-label text-xs font-bold uppercase tracking-[0.2em] ${tab.active ? "text-primary border-b-2 border-primary pb-1" : "text-outline hover:text-primary"}">${tab.label}</a>
      `
    )
    .join("");

  return `
    <header class="topbar-shell sticky top-0 z-40 editorial-panel border-b border-white/60">
      <div class="topbar-core flex items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-8 lg:py-5">
        <div class="flex min-w-0 items-center gap-3 sm:gap-4">
            <button data-sidebar-toggle class="topbar-menu-button flex h-11 w-11 items-center justify-center rounded-full bg-primary text-on-primary lg:hidden" type="button" aria-label="Open navigation">
              <span class="material-symbols-outlined">menu</span>
            </button>
            <div class="min-w-0">
              <p class="hidden font-label text-[10px] uppercase tracking-[0.24em] text-outline lg:block">${config.eyebrow || "The Digital Atelier"}</p>
              <h2 class="truncate text-lg sm:text-xl lg:text-2xl font-bold text-primary">${config.title}</h2>
            </div>
            ${tabLinks ? `<nav class="hidden xl:flex items-center gap-5">${tabLinks}</nav>` : ""}
          </div>
          <div class="flex items-center gap-3">
            ${
              config.searchPlaceholder
                ? `<input data-shell-search class="shell-search hidden w-full rounded-full px-4 py-2.5 font-label text-sm outline-none focus:ring-1 focus:ring-primary lg:block lg:min-w-[14rem] lg:w-64" placeholder="${config.searchPlaceholder}" />`
                : ""
            }
            <button data-logout class="shell-signout hidden rounded-full px-4 py-2.5 font-label text-xs font-bold uppercase tracking-[0.2em] text-on-primary lg:inline-flex">Sign Out</button>
            <img class="topbar-avatar h-10 w-10 rounded-full object-cover ring-1 ring-white/60" src="${user.avatarUrl || "https://placehold.co/80x80"}" alt="${user.name}" />
          </div>
      </div>
    </header>
  `;
}

export function mountShell({ sidebarTarget, topbarTarget, user, activeNav, topbar }) {
  document.querySelector(sidebarTarget).innerHTML = renderSidebar(user, activeNav);
  document.querySelector(topbarTarget).innerHTML = renderTopbar(topbar, user);

  const logoutButtons = document.querySelectorAll("[data-logout], [data-sidebar-logout]");
  const mobileNavPanel = document.querySelector("[data-mobile-nav-panel]");
  const mobileNavBackdrop = document.querySelector("[data-mobile-nav-backdrop]");
  const sidebarToggle = document.querySelector("[data-sidebar-toggle]");
  const sidebarClose = document.querySelector("[data-mobile-nav-close]");
  const desktopNavMedia = window.matchMedia("(min-width: 1024px)");

  function openMobileNav() {
    mobileNavPanel?.classList.add("is-open");
    mobileNavBackdrop?.classList.add("is-open");
    document.body.classList.add("mobile-nav-open");
  }

  function closeMobileNav() {
    mobileNavPanel?.classList.remove("is-open");
    mobileNavBackdrop?.classList.remove("is-open");
    document.body.classList.remove("mobile-nav-open");
  }

  logoutButtons.forEach((button) => {
    button.addEventListener("click", () => {
      logout();
    });
  });

  sidebarToggle?.addEventListener("click", openMobileNav);
  sidebarClose?.addEventListener("click", closeMobileNav);
  mobileNavBackdrop?.addEventListener("click", closeMobileNav);
  mobileNavPanel?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileNav);
  });
  desktopNavMedia.addEventListener("change", (event) => {
    if (event.matches) {
      closeMobileNav();
    }
  });
}
