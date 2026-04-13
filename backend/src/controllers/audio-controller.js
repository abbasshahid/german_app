import { findDictionaryEntryById } from "../models/dictionary-model.js";
import { getStoryById } from "../models/story-model.js";
import { notFound } from "../utils/http-error.js";
import { getStoryAudio, getWordAudio } from "../services/audio-service.js";

export function getWordAudioController(req, res) {
  const entry = findDictionaryEntryById(req.params.entryId);

  if (!entry) {
    throw notFound("Dictionary entry not found.");
  }

  res.json(getWordAudio(entry));
}

export function getStoryAudioController(req, res) {
  const story = getStoryById(req.params.storyId);

  if (!story) {
    throw notFound("Story not found.");
  }

  res.json(getStoryAudio(story));
}
