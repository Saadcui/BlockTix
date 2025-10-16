// utils/recommendationEngine.js

import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import UserPreference from "@/models/UserPreference";
import Event from "@/models/Event";

/**
 * REGEX CATEGORIES for keyword matching
 * - These patterns help identify which category user searched/interacted with
 */
const CATEGORY_PATTERNS = {
  sports: /(sports?|game|match|tournament|football|soccer|cricket|basketball|nba|fifa)/i,
  music: /(music|concert|band|dj|live|sing|festival|gig)/i,
  movies: /(movie|film|cinema|premiere|screening|hollywood|bollywood)/i,
  theater: /(theater|play|drama|ballet|opera|musical)/i,
  general: /(event|show|expo|conference|meetup)/i,
};

/**
 * getCategoryFromQuery
 * - Finds the most relevant category based on regex patterns
 */
export function getCategoryFromQuery(query) {
  for (const [category, regex] of Object.entries(CATEGORY_PATTERNS)) {
    if (regex.test(query)) return category;
  }
  return "general";
}

/**
 * updateUserPreference
 * - Updates a user's preference score based on the category they interacted with
 */
export async function updateUserPreference(firebase_uid, category) {
  await dbConnect();

  const user = await User.findOne({ firebase_uid });
  if (!user) throw new Error("User not found");

  let pref = await UserPreference.findOne({ userId: user._id });
  if (!pref) pref = new UserPreference({ userId: user._id });

  // Increment score for category
  pref.preferences[category] = (pref.preferences[category] || 0) + 1;
  pref.updatedAt = new Date();

  await pref.save();
  return pref.preferences;
}

/**
 * getUserPreferences
 * - Retrieves user's preference scores
 */
export async function getUserPreferences(firebase_uid) {
  await dbConnect();
  const user = await User.findOne({ firebase_uid });
  if (!user) throw new Error("User not found");

  const pref = await UserPreference.findOne({ userId: user._id });
  return pref ? pref.preferences : null;
}

/**
 * getPersonalizedRecommendations
 * - Fetches upcoming events and ranks them based on user preferences
 * - Uses regex to match event categories or tags
 */
export async function getPersonalizedRecommendations(firebase_uid) {
  await dbConnect();

  const user = await User.findOne({ firebase_uid });
  if (!user) throw new Error("User not found");

  const pref = await UserPreference.findOne({ userId: user._id });
  const userPrefs = pref?.preferences || {};

  // Fetch upcoming events (adjust field names as per your Event schema)
  const events = await Event.find({
    date: { $gte: new Date() },
  }).lean();

  // Calculate score for each event
  const scoredEvents = events.map((event) => {
    const { title = "", description = "", tags = [] } = event;
    let score = 0;

    for (const [category, regex] of Object.entries(CATEGORY_PATTERNS)) {
      if (
        regex.test(title) ||
        regex.test(description) ||
        tags.some((tag) => regex.test(tag))
      ) {
        score += userPrefs[category] || 0;
      }
    }

    return { ...event, recommendationScore: score };
  });

  // Sort events by recommendation score (desc)
  scoredEvents.sort((a, b) => b.recommendationScore - a.recommendationScore);

  return scoredEvents;
}

/**
 * getRegexMatchedEvents
 * - For search: returns events matching query text (without user data)
 */
export async function getRegexMatchedEvents(query) {
  await dbConnect();
  const regex = new RegExp(query, "i");

  const events = await Event.find({
    $or: [
      { title: regex },
      { description: regex },
      { category: regex },
      { tags: { $in: [regex] } },
    ],
  }).limit(20);

  return events;
}

/**
 * Example usage:
 * 
 * const category = getCategoryFromQuery("football match");
 * await updateUserPreference(firebase_uid, category);
 * const recommendations = await getPersonalizedRecommendations(firebase_uid);
 */
