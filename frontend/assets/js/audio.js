let activeAudio = null;

export function stopAudio() {
  if (activeAudio) {
    window.speechSynthesis.cancel();
    if (activeAudio instanceof HTMLAudioElement) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    }
    activeAudio = null;
  }
}

export function playAudio(payload, { rate = 1 } = {}) {
  if (!payload) {
    return;
  }

  if (payload.audioUrl) {
    stopAudio();
    const audio = new Audio(payload.audioUrl);
    audio.playbackRate = rate;
    activeAudio = audio;
    audio.addEventListener("ended", () => {
      if (activeAudio === audio) {
        activeAudio = null;
      }
    });
    audio.play().catch(() => {
      activeAudio = null;
    });
    return;
  }

  if (!("speechSynthesis" in window)) {
    return;
  }

  stopAudio();

  const utterance = new SpeechSynthesisUtterance(payload.speechText);
  utterance.lang = payload.locale || "de-DE";
  utterance.rate = rate;
  activeAudio = utterance;
  window.speechSynthesis.speak(utterance);
}
