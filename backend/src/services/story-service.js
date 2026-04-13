import { getStoryProgress } from "../models/progress-model.js";
import {
  countStories,
  createStory,
  createStoryChapter,
  getStoryBySlug,
  getRecommendedStories,
  getStoryChapter,
  listStories,
  listStoryChapters
} from "../models/story-model.js";
import { notFound } from "../utils/http-error.js";
import { createId } from "../utils/ids.js";
import { nowIso } from "../utils/time.js";
import { stripHtml } from "../utils/strings.js";
import { getStoryAudio } from "./audio-service.js";

function mapStorySummary(story) {
  return {
    id: story.id,
    slug: story.slug,
    title: story.title,
    subtitle: story.subtitle,
    excerpt: story.excerpt,
    type: story.content_type,
    level: story.cefr_level,
    genre: story.genre,
    minutes: story.read_minutes,
    wordCount: story.word_count,
    coverImageUrl: story.cover_image_url,
    isFeatured: Boolean(story.is_featured)
  };
}

export function getStoryLibrary(filters) {
  const requestedPage = Number(filters.page);
  const requestedPageSize = Number(filters.pageSize);
  const page = Number.isFinite(requestedPage) && requestedPage >= 1 ? Math.trunc(requestedPage) : 1;
  const pageSize =
    Number.isFinite(requestedPageSize) && requestedPageSize >= 1 ? Math.min(Math.trunc(requestedPageSize), 50) : 12;
  const offset = (page - 1) * pageSize;

  const durationMap = {
    short: { max_minutes: 5, min_minutes: null },
    medium: { max_minutes: 15, min_minutes: 5 },
    long: { max_minutes: null, min_minutes: 15 }
  };

  const duration = durationMap[filters.duration] ?? { max_minutes: null, min_minutes: null };

  const query = {
    search: typeof filters.search === "string" ? filters.search : "",
    cefr_level: typeof filters.level === "string" ? filters.level : "",
    genre: typeof filters.genre === "string" ? filters.genre : "",
    max_minutes: duration.max_minutes,
    min_minutes: duration.min_minutes,
    limit: pageSize,
    offset
  };

  const countQuery = {
    search: query.search,
    cefr_level: query.cefr_level,
    genre: query.genre,
    max_minutes: duration.max_minutes,
    min_minutes: duration.min_minutes
  };

  const items = listStories(query).map(mapStorySummary);
  const total = countStories(countQuery);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    },
    filters: {
      search: query.search,
      level: query.cefr_level,
      genre: query.genre,
      duration: typeof filters.duration === "string" ? filters.duration : ""
    }
  };
}

export function getRecommendedStoryCards(level) {
  return getRecommendedStories(level, 3).map(mapStorySummary);
}

export function getStoryDetail(slug, chapterNumber, userId) {
  const story = getStoryBySlug(slug);

  if (!story) {
    throw notFound("Story not found.");
  }

  const chapters = listStoryChapters(story.id);
  const activeChapter = getStoryChapter(story.id, Number(chapterNumber)) ?? chapters[0];
  const progress = getStoryProgress(userId, story.id, activeChapter?.id ?? null);

  return {
    ...mapStorySummary(story),
    audio: getStoryAudio(story),
    chapters: chapters.map((chapter) => ({
      id: chapter.id,
      chapterNumber: chapter.chapter_number,
      title: chapter.title
    })),
    activeChapter: {
      id: activeChapter.id,
      chapterNumber: activeChapter.chapter_number,
      title: activeChapter.title,
      contentHtml: activeChapter.content_html,
      imageUrl: activeChapter.image_url,
      plainText: stripHtml(activeChapter.content_html)
    },
    navigation: {
      previousChapter: chapters.find((chapter) => chapter.chapter_number === activeChapter.chapter_number - 1) ?? null,
      nextChapter: chapters.find((chapter) => chapter.chapter_number === activeChapter.chapter_number + 1) ?? null
    },
    progress: {
      percent: progress?.progress_percent ?? 0,
      completedAt: progress?.completed_at ?? null
    }
  };
}

export function createStoryDraft(payload) {
  const timestamp = nowIso();
  const story = createStory({
    id: createId("story"),
    slug: payload.slug,
    title: payload.title,
    subtitle: payload.subtitle ?? "",
    excerpt: payload.excerpt,
    content_type: payload.contentType,
    cefr_level: payload.level,
    genre: payload.genre,
    read_minutes: payload.minutes,
    word_count: payload.wordCount,
    cover_image_url: payload.coverImageUrl ?? null,
    audio_text: payload.audioText ?? null,
    audio_url: payload.audioUrl ?? null,
    is_featured: payload.isFeatured ? 1 : 0,
    is_published: 1,
    created_at: timestamp,
    updated_at: timestamp
  });

  for (const chapter of payload.chapters) {
    createStoryChapter({
      id: createId("chapter"),
      story_id: story.id,
      chapter_number: chapter.chapterNumber,
      title: chapter.title,
      content_html: chapter.contentHtml,
      image_url: chapter.imageUrl ?? null,
      created_at: timestamp
    });
  }

  return getStoryDetail(story.slug, 1, null);
}
