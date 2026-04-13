import { escapeHtml } from "../ui.js";

export function renderStoryCard(story) {
  return `
    <article class="story-card-shell group cursor-pointer" data-story-slug="${escapeHtml(story.slug)}">
      <a href="/read/${encodeURIComponent(story.slug)}" class="block">
        <div class="story-card-media relative overflow-hidden mb-4 bg-surface-container shadow-editorial transition-transform duration-300">
          <img class="w-full h-full object-cover" src="${escapeHtml(story.coverImageUrl || "")}" alt="${escapeHtml(story.title)}" />
          <div class="absolute inset-0 bg-gradient-to-t from-primary/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
            <span class="text-on-primary font-label text-[11px] font-bold tracking-[0.18em] uppercase flex items-center gap-2">Read Now <span class="material-symbols-outlined text-sm">arrow_forward</span></span>
          </div>
          <div class="absolute top-3 left-3 flex gap-2">
            <span class="bg-white/85 backdrop-blur-md px-3 py-1 rounded-full font-label text-[10px] font-extrabold text-primary uppercase tracking-[0.14em]">Level ${escapeHtml(story.level)}</span>
            <span class="bg-tertiary text-white px-3 py-1 rounded-full font-label text-[10px] font-extrabold uppercase tracking-[0.14em]">${escapeHtml(String(story.minutes))} min</span>
          </div>
        </div>
        <h3 class="story-card-title font-headline font-bold text-on-surface mb-2 group-hover:text-tertiary transition-colors">${escapeHtml(story.title)}</h3>
        <p class="story-card-excerpt text-on-surface-variant">${escapeHtml(story.excerpt)}</p>
      </a>
    </article>
  `;
}
