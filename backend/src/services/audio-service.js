import { findAudioAsset } from "../models/audio-model.js";

function formatAsset(asset, fallbackText) {
  return {
    provider: asset?.provider ?? "browser-tts",
    locale: asset?.locale ?? "de-DE",
    speechText: asset?.speech_text ?? fallbackText,
    audioUrl: asset?.audio_url ?? null,
    durationSeconds: asset?.duration_seconds ?? null,
    useBrowserTts: !asset?.audio_url
  };
}

export function getWordAudio(entry) {
  const asset = findAudioAsset("word", entry.id);
  return formatAsset(asset, entry.audio_label ?? entry.lemma);
}

export function getStoryAudio(story) {
  const asset = findAudioAsset("story", story.id);
  return formatAsset(asset, story.audio_text ?? story.title);
}
