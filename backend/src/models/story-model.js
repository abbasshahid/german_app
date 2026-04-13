import { all, one, run } from "./base-model.js";

export function listStories({
  search = "",
  cefr_level = "",
  genre = "",
  max_minutes = null,
  min_minutes = null,
  limit = 12,
  offset = 0
}) {
  return all(
    `
      SELECT *
      FROM stories
      WHERE is_published = 1
        AND (@search = '' OR title LIKE '%' || @search || '%' OR excerpt LIKE '%' || @search || '%')
        AND (@cefr_level = '' OR cefr_level = @cefr_level)
        AND (@genre = '' OR genre = @genre)
        AND (@max_minutes IS NULL OR read_minutes <= @max_minutes)
        AND (@min_minutes IS NULL OR read_minutes >= @min_minutes)
      ORDER BY is_featured DESC, created_at DESC, title ASC
      LIMIT @limit OFFSET @offset
    `,
    { search, cefr_level, genre, max_minutes, min_minutes, limit, offset }
  );
}

export function countStories(filters) {
  return one(
    `
      SELECT COUNT(*) AS count
      FROM stories
      WHERE is_published = 1
        AND (@search = '' OR title LIKE '%' || @search || '%' OR excerpt LIKE '%' || @search || '%')
        AND (@cefr_level = '' OR cefr_level = @cefr_level)
        AND (@genre = '' OR genre = @genre)
        AND (@max_minutes IS NULL OR read_minutes <= @max_minutes)
        AND (@min_minutes IS NULL OR read_minutes >= @min_minutes)
    `,
    filters
  ).count;
}

export function getStoryBySlug(slug) {
  return one("SELECT * FROM stories WHERE slug = @slug", { slug });
}

export function getStoryById(id) {
  return one("SELECT * FROM stories WHERE id = @id", { id });
}

export function getRecommendedStories(cefrLevel, limit = 3) {
  return all(
    `
      SELECT *
      FROM stories
      WHERE is_published = 1
        AND (@cefrLevel = '' OR cefr_level = @cefrLevel)
      ORDER BY is_featured DESC, created_at DESC
      LIMIT @limit
    `,
    { cefrLevel, limit }
  );
}

export function listStoryChapters(storyId) {
  return all(
    `
      SELECT *
      FROM story_chapters
      WHERE story_id = @storyId
      ORDER BY chapter_number ASC
    `,
    { storyId }
  );
}

export function getStoryChapter(storyId, chapterNumber) {
  return one(
    `
      SELECT *
      FROM story_chapters
      WHERE story_id = @storyId AND chapter_number = @chapterNumber
    `,
    { storyId, chapterNumber }
  );
}

export function createStory(story) {
  run(
    `
      INSERT INTO stories (
        id, slug, title, subtitle, excerpt, content_type, cefr_level, genre, read_minutes, word_count,
        cover_image_url, audio_text, audio_url, is_featured, is_published, created_at, updated_at
      ) VALUES (
        @id, @slug, @title, @subtitle, @excerpt, @content_type, @cefr_level, @genre, @read_minutes, @word_count,
        @cover_image_url, @audio_text, @audio_url, @is_featured, @is_published, @created_at, @updated_at
      )
    `,
    story
  );

  return getStoryById(story.id);
}

export function createStoryChapter(chapter) {
  run(
    `
      INSERT INTO story_chapters (
        id, story_id, chapter_number, title, content_html, image_url, created_at
      ) VALUES (
        @id, @story_id, @chapter_number, @title, @content_html, @image_url, @created_at
      )
    `,
    chapter
  );
}
