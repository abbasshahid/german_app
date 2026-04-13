import { getRecommendedStoryCards, getStoryDetail, getStoryLibrary } from "../services/story-service.js";

export function listStoriesController(req, res) {
  res.json(getStoryLibrary(req.query));
}

export function recommendedStoriesController(req, res) {
  res.json({
    items: getRecommendedStoryCards(req.query.level || req.currentUser.cefr_level)
  });
}

export function getStoryController(req, res) {
  res.json(getStoryDetail(req.params.slug, req.query.chapter, req.currentUser.id));
}
