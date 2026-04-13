import { api } from "./api.js";
import { playAudio } from "./audio.js";
import { ensureAuthenticated } from "./session.js";
import { setBusy, showToast } from "./ui.js";

const session = await ensureAuthenticated();
const slug = window.location.pathname.split("/").pop();
const chapter = Number(new URLSearchParams(window.location.search).get("chapter") || "1");

const article = document.querySelector("#reader-article");
const content = document.querySelector("#reader-content");
const backLink = document.querySelector("#reader-back");
const backLinkMobile = document.querySelector("#reader-back-mobile");
const storyPlayButton = document.querySelector("#story-play");
const storyReplayButton = document.querySelector("#story-replay");
const storyPlayMobileButton = document.querySelector("#story-play-mobile");
const speedSelect = document.querySelector("#story-speed");
const speedSelectMobile = document.querySelector("#story-speed-mobile");
const progressLabel = document.querySelector("#reading-progress-label");
const progressBar = document.querySelector("#reading-progress-bar");
const saveButton = document.querySelector("#dictionary-save");
const wordAudioButton = document.querySelector("#dictionary-audio");
const dictionaryPanel = document.querySelector("#dictionary-panel");
const dictionaryBackdrop = document.querySelector("#dictionary-backdrop");
const dictionaryCloseButton = document.querySelector("#dictionary-close");
const readerMenuPanel = document.querySelector("#reader-menu-panel");
const readerMenuBackdrop = document.querySelector("#reader-menu-backdrop");
const readerMenuToggle = document.querySelector("#reader-menu-toggle");
const readerMenuCloseButton = document.querySelector("#reader-menu-close");
const dictionaryWord = document.querySelector("#dictionary-word");
const dictionaryPos = document.querySelector("#dictionary-pos");
const dictionaryMeaning = document.querySelector("#dictionary-meaning");
const dictionaryExampleDe = document.querySelector("#dictionary-example-de");
const dictionaryExampleEn = document.querySelector("#dictionary-example-en");
const dictionaryNotes = document.querySelector("#dictionary-notes");
const dictionaryRelated = document.querySelector("#dictionary-related");
const mobileDictionaryMedia = window.matchMedia("(max-width: 1023px)");

let storyPayload = null;
let currentLookup = null;
let activeWordElement = null;
let lastSyncedProgress = 0;

backLink.href = "/library";
if (backLinkMobile) {
  backLinkMobile.href = "/library";
}
document.querySelector("#reader-avatar").src = session.user.avatarUrl || "https://placehold.co/80x80";

function setDictionaryActionsEnabled(enabled) {
  saveButton.disabled = !enabled;
  wordAudioButton.disabled = !enabled;
}

function isMobileDictionaryView() {
  return mobileDictionaryMedia.matches;
}

function openDictionaryPanel() {
  if (!isMobileDictionaryView()) {
    return;
  }

  dictionaryPanel.classList.add("is-open");
  dictionaryBackdrop.classList.add("is-open");
  document.body.classList.add("dictionary-modal-open");
}

function closeDictionaryPanel() {
  dictionaryPanel.classList.remove("is-open");
  dictionaryBackdrop.classList.remove("is-open");
  document.body.classList.remove("dictionary-modal-open");
}

function openReaderMenu() {
  if (!isMobileDictionaryView()) {
    return;
  }

  readerMenuPanel.classList.add("is-open");
  readerMenuBackdrop.classList.add("is-open");
  document.body.classList.add("reader-menu-open");
}

function closeReaderMenu() {
  readerMenuPanel.classList.remove("is-open");
  readerMenuBackdrop.classList.remove("is-open");
  document.body.classList.remove("reader-menu-open");
}

function getPlaybackRate() {
  if (isMobileDictionaryView() && speedSelectMobile) {
    return Number(speedSelectMobile.value);
  }

  return Number(speedSelect.value);
}

function syncPlaybackSpeed(source) {
  const value = source.value;

  if (source !== speedSelect) {
    speedSelect.value = value;
  }

  if (speedSelectMobile && source !== speedSelectMobile) {
    speedSelectMobile.value = value;
  }
}

function openGoogleMeaningSearch(word) {
  const url = new URL("https://www.google.com/search");
  url.searchParams.set("q", `${word} meaning in english`);
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}

function renderDictionaryFallback(word, message) {
  dictionaryWord.textContent = word;
  dictionaryPos.textContent = "External lookup";
  dictionaryMeaning.textContent = "This word is not yet available in the built-in dictionary.";
  dictionaryExampleDe.textContent = word;
  dictionaryExampleEn.textContent = "";
  dictionaryNotes.textContent = message;
  dictionaryRelated.innerHTML = "";
  setDictionaryActionsEnabled(false);
}

function makeWordsInteractive(container) {
  const textNodes = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.trim()) {
        return NodeFilter.FILTER_REJECT;
      }

      if (node.parentElement?.closest(".word-interact")) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    }
  });

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  const wordPattern = /(\p{L}[\p{L}\p{M}-]*)/gu;

  for (const node of textNodes) {
    const fragment = document.createDocumentFragment();
    const text = node.nodeValue;
    let lastIndex = 0;

    for (const match of text.matchAll(wordPattern)) {
      const [word] = match;
      const index = match.index ?? 0;

      if (index > lastIndex) {
        fragment.append(document.createTextNode(text.slice(lastIndex, index)));
      }

      const span = document.createElement("span");
      span.className = "word-interact";
      span.dataset.word = word;
      span.textContent = word;
      fragment.append(span);
      lastIndex = index + word.length;
    }

    if (lastIndex < text.length) {
      fragment.append(document.createTextNode(text.slice(lastIndex)));
    }

    node.replaceWith(fragment);
  }
}

async function loadStory() {
  storyPayload = await api.get(`/api/stories/${slug}`, { chapter });

  document.querySelector("#story-title").textContent = storyPayload.title;
  document.querySelector("#chapter-label").textContent = `Kapitel ${storyPayload.activeChapter.chapterNumber}`;
  document.querySelector("#chapter-title").textContent = storyPayload.activeChapter.title;
  document.querySelector("#reader-title-bar").textContent = storyPayload.title;
  content.innerHTML = storyPayload.activeChapter.contentHtml;
  makeWordsInteractive(content);

  const previous = storyPayload.navigation.previousChapter;
  const next = storyPayload.navigation.nextChapter;

  const prevButton = document.querySelector("#chapter-prev");
  const nextButton = document.querySelector("#chapter-next");

  prevButton.disabled = !previous;
  nextButton.disabled = !next;
  prevButton.onclick = () => {
    if (previous) {
      window.location.href = `/read/${slug}?chapter=${previous.chapter_number}`;
    }
  };
  nextButton.onclick = () => {
    if (next) {
      window.location.href = `/read/${slug}?chapter=${next.chapter_number}`;
    }
  };

  updateProgressUI(storyPayload.progress.percent || 0);
}

function updateProgressUI(percent) {
  const rounded = Math.max(0, Math.min(100, Math.round(percent)));
  progressLabel.textContent = `${rounded}% gelesen`;
  progressBar.style.width = `${rounded}%`;
}

async function lookupWord(word, sourceElement, { openPanel = true } = {}) {
  try {
    currentLookup = await api.get("/api/dictionary/lookup", { word });

    if (activeWordElement) {
      activeWordElement.classList.remove("is-active");
    }

    activeWordElement = sourceElement;
    activeWordElement.classList.add("is-active");

    dictionaryWord.textContent = currentLookup.lookup;
    dictionaryPos.textContent = currentLookup.partOfSpeech;
    dictionaryMeaning.textContent = currentLookup.translation;
    dictionaryExampleDe.textContent = currentLookup.example.german;
    dictionaryExampleEn.textContent = currentLookup.example.english;
    dictionaryNotes.textContent = currentLookup.grammarNotes;
    dictionaryRelated.innerHTML = currentLookup.relatedWords
      .map((item) => `<button class="rounded-full bg-surface-container-high px-4 py-2 font-label text-xs font-bold uppercase tracking-[0.18em] text-primary" data-related-word="${item}">${item}</button>`)
      .join("");
    setDictionaryActionsEnabled(true);
    if (openPanel) {
      openDictionaryPanel();
    }
  } catch (error) {
    currentLookup = null;

    if (activeWordElement) {
      activeWordElement.classList.remove("is-active");
    }

    activeWordElement = sourceElement;
    activeWordElement?.classList.add("is-active");

    if (error.status === 404) {
      renderDictionaryFallback(
        word,
        "A Google search for the English meaning has been opened in a new tab so you can still continue reading without interruption."
      );
      if (openPanel) {
        openDictionaryPanel();
      }
      openGoogleMeaningSearch(word);
      showToast(`"${word}" was not in the local dictionary. Opened Google in a new tab.`, "info");
      return;
    }

    renderDictionaryFallback(word, "The dictionary is temporarily unavailable. Please try again.");
    if (openPanel) {
      openDictionaryPanel();
    }
    showToast(error.message, "error");
  }
}

content.addEventListener("click", (event) => {
  const target = event.target.closest(".word-interact");

  if (!target) {
    return;
  }

  lookupWord(target.dataset.word, target);
});

dictionaryRelated.addEventListener("click", (event) => {
  const button = event.target.closest("[data-related-word]");

  if (!button) {
    return;
  }

  lookupWord(button.dataset.relatedWord, button);
});

dictionaryCloseButton?.addEventListener("click", closeDictionaryPanel);
dictionaryBackdrop?.addEventListener("click", closeDictionaryPanel);
readerMenuToggle?.addEventListener("click", () => {
  if (readerMenuPanel.classList.contains("is-open")) {
    closeReaderMenu();
    return;
  }

  openReaderMenu();
});
readerMenuCloseButton?.addEventListener("click", closeReaderMenu);
readerMenuBackdrop?.addEventListener("click", closeReaderMenu);
backLinkMobile?.addEventListener("click", closeReaderMenu);
speedSelect.addEventListener("change", () => syncPlaybackSpeed(speedSelect));
speedSelectMobile?.addEventListener("change", () => syncPlaybackSpeed(speedSelectMobile));
mobileDictionaryMedia.addEventListener("change", (event) => {
  if (!event.matches) {
    closeDictionaryPanel();
    closeReaderMenu();
  }
});

wordAudioButton.addEventListener("click", () => {
  if (!currentLookup) {
    return;
  }

  playAudio(currentLookup.audio);
});

saveButton.addEventListener("click", async () => {
  if (!currentLookup) {
    showToast("Select a word first.", "error");
    return;
  }

  setBusy(saveButton, true, "Saving...");

  try {
    await api.post("/api/vocabulary/save", {
      entryId: currentLookup.id,
      sourceWord: currentLookup.lookup,
      storyId: storyPayload.id,
      chapterId: storyPayload.activeChapter.id,
      contextSentence: currentLookup.example.german
    });

    showToast(`${currentLookup.lookup} saved to your vocabulary list.`, "success");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setBusy(saveButton, false);
  }
});

storyPlayButton.addEventListener("click", () => {
  if (!storyPayload) {
    return;
  }

  playAudio(storyPayload.audio, { rate: getPlaybackRate() });
});

storyReplayButton.addEventListener("click", () => {
  if (!storyPayload) {
    return;
  }

  playAudio(storyPayload.audio, { rate: getPlaybackRate() });
});

storyPlayMobileButton?.addEventListener("click", () => {
  if (!storyPayload) {
    return;
  }

  playAudio(storyPayload.audio, { rate: getPlaybackRate() });
  closeReaderMenu();
});

async function syncProgress(progressPercent, keepalive = false) {
  if (!storyPayload || Math.abs(progressPercent - lastSyncedProgress) < 5) {
    return;
  }

  lastSyncedProgress = progressPercent;

  await fetch("/api/progress/reading", {
    method: "POST",
    credentials: "same-origin",
    keepalive,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      storyId: storyPayload.id,
      chapterId: storyPayload.activeChapter.id,
      progressPercent,
      minutesStudied: 2
    })
  }).catch(() => {});
}

function calculateProgress() {
  const articleTop = article.offsetTop;
  const articleHeight = article.offsetHeight;
  const scrollable = Math.max(articleHeight - window.innerHeight, 1);
  const scrolled = Math.max(0, window.scrollY - articleTop + 140);
  const percent = Math.max(0, Math.min(100, (scrolled / scrollable) * 100));
  updateProgressUI(percent);
  syncProgress(percent);
}

window.addEventListener("scroll", calculateProgress, { passive: true });
window.addEventListener("beforeunload", () => {
  const percent = Number(progressBar.style.width.replace("%", "")) || 0;
  syncProgress(percent, true);
});

await loadStory();
setDictionaryActionsEnabled(false);
await lookupWord(
  "alten",
  Array.from(document.querySelectorAll(".word-interact")).find((element) => element.dataset.word?.toLowerCase() === "alten") ||
    document.querySelector(".word-interact"),
  { openPanel: false }
);
