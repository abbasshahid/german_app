import { api } from "./api.js";
import { playAudio } from "./audio.js";
import { mountShell } from "./components/layout.js";
import { ensureAuthenticated } from "./session.js";
import { setBusy, showToast } from "./ui.js";

const session = await ensureAuthenticated();

mountShell({
  sidebarTarget: "#app-sidebar",
  topbarTarget: "#app-topbar",
  user: session.user,
  activeNav: "flashcards",
  topbar: {
    eyebrow: "The Digital Atelier",
    title: "Flashcard Review",
    tabs: [
      { label: "Reading Mode", href: "/library", active: false },
      { label: "Audio", href: "/library", active: false },
      { label: "Review", href: "/flashcards", active: true }
    ]
  }
});

let sessionPayload = await api.get("/api/flashcards/session", { limit: 20 });
let currentIndex = 0;

const emptyState = document.querySelector("#flashcard-empty");
const cardState = document.querySelector("#flashcard-state");

function currentCard() {
  return sessionPayload.cards[currentIndex];
}

function renderCard() {
  const card = currentCard();

  if (!card) {
    cardState.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  cardState.classList.remove("hidden");
  emptyState.classList.add("hidden");
  document.querySelector("#session-position").textContent = `Card ${currentIndex + 1} of ${sessionPayload.cards.length}`;
  document.querySelector("#session-progress").style.width = `${((currentIndex + 1) / sessionPayload.cards.length) * 100}%`;
  document.querySelector("#flashcard-word").textContent = card.word;
  document.querySelector("#flashcard-meaning").textContent = card.meaning;
  document.querySelector("#flashcard-pos").textContent = card.partOfSpeech;
  document.querySelector("#flashcard-example-de").textContent = card.exampleGerman;
  document.querySelector("#flashcard-example-en").textContent = card.exampleEnglish;
  document.querySelector("#flashcard-level").textContent = card.level;
}

document.querySelector("#flashcard-audio").addEventListener("click", () => {
  const card = currentCard();

  if (!card) {
    return;
  }

  playAudio({
    speechText: card.word,
    locale: "de-DE"
  });
});

document.querySelectorAll("[data-rating]").forEach((button) => {
  button.addEventListener("click", async () => {
    const card = currentCard();

    if (!card) {
      return;
    }

    setBusy(button, true, "Saving...");

    try {
      await api.post("/api/flashcards/review", {
        flashcardId: card.id,
        rating: button.dataset.rating
      });

      currentIndex += 1;
      renderCard();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setBusy(button, false);
    }
  });
});

renderCard();
