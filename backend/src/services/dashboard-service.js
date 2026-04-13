import { getRecommendedStories } from "../models/story-model.js";
import { getDashboardCounts, getTotalMinutesStudied, listRecentActivity } from "../models/progress-model.js";
import { nowIso, toDateKey } from "../utils/time.js";

function computeStreak(activityRows) {
  const activeDays = new Set(activityRows.map((row) => row.activity_date));
  let streak = 0;
  const cursor = new Date();

  while (activeDays.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getDashboardOverview(user) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const activityRows = listRecentActivity(user.id, toDateKey(sevenDaysAgo));
  const counts = getDashboardCounts(user.id, nowIso());
  const recommendedStories = getRecommendedStories(user.cefr_level, 3);

  return {
    greeting: `Guten Morgen, ${user.name.split(" ")[0]}.`,
    focusTopic: "subordinate clauses and architectural vocabulary",
    user: {
      name: user.name,
      level: user.cefr_level,
      dailyGoal: user.daily_goal,
      totalMinutesStudied: getTotalMinutesStudied(user.id)
    },
    stats: {
      activeStreakDays: computeStreak(activityRows),
      wordsSaved: counts.words_saved,
      wordsMastered: counts.words_mastered,
      storiesCompleted: counts.stories_completed,
      dueReviews: counts.due_reviews
    },
    weeklyActivity: activityRows.map((row) => ({
      date: row.activity_date,
      minutesStudied: row.minutes_studied,
      wordsSaved: row.words_saved,
      flashcardsReviewed: row.flashcards_reviewed
    })),
    recommendedStories: recommendedStories.map((story) => ({
      id: story.id,
      slug: story.slug,
      title: story.title,
      excerpt: story.excerpt,
      level: story.cefr_level,
      minutes: story.read_minutes,
      coverImageUrl: story.cover_image_url
    })),
    nextMilestone: {
      title: "Ready for your next milestone?",
      description: 'You are 3 lessons away from completing the "Academic Writing" module.',
      cta: "Continue Module"
    }
  };
}
