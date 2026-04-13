import { api } from "./api.js";
import { mountShell } from "./components/layout.js";
import { renderStoryCard } from "./components/story-card.js";
import { ensureAuthenticated } from "./session.js";
import { formatNumber } from "./ui.js";

const session = await ensureAuthenticated();

mountShell({
  sidebarTarget: "#app-sidebar",
  topbarTarget: "#app-topbar",
  user: session.user,
  activeNav: "dashboard",
  topbar: {
    eyebrow: "The Digital Atelier",
    title: "Dashboard",
    tabs: [
      { label: "Reading Mode", href: "/library", active: false },
      { label: "Audio", href: "/library", active: false },
      { label: "Review", href: "/flashcards", active: true }
    ],
    searchPlaceholder: "Search the archive..."
  }
});

const data = await api.get("/api/dashboard");

document.querySelector("#hero-greeting").textContent = data.greeting;
document.querySelector("#hero-focus").textContent = `Today's focus is ${data.focusTopic}.`;
document.querySelector("#stat-streak").textContent = `${data.stats.activeStreakDays} days`;
document.querySelector("#stat-words").textContent = formatNumber(data.stats.wordsSaved);
document.querySelector("#stat-mastered").textContent = formatNumber(data.stats.wordsMastered);
document.querySelector("#milestone-title").textContent = data.nextMilestone.title;
document.querySelector("#milestone-description").textContent = data.nextMilestone.description;

const chartTarget = document.querySelector("#weekly-chart");
const maxMinutes = Math.max(...data.weeklyActivity.map((entry) => entry.minutesStudied), 1);

chartTarget.innerHTML = data.weeklyActivity
  .map(
    (entry) => `
      <div class="flex flex-1 flex-col items-center gap-2">
        <div class="flex h-28 w-full items-end">
          <div class="w-full bg-secondary" style="height:${Math.max(12, (entry.minutesStudied / maxMinutes) * 100)}%"></div>
        </div>
        <span class="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-outline">${entry.date.slice(5)}</span>
      </div>
    `
  )
  .join("");

document.querySelector("#recommended-grid").innerHTML = data.recommendedStories.map(renderStoryCard).join("");
