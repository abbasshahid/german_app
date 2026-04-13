let activeAudio = null;

export function stopAudio() {
  if (activeAudio) {
    window.speechSynthesis.cancel();
    activeAudio = null;
  }
}

export function playAudio(payload, { rate = 1 } = {}) {
  if (!payload) {
    return;
  }

  if (payload.audioUrl) {
    const audio = new Audio(payload.audioUrl);
    audio.play();
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
