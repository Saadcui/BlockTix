import crypto from "crypto";
import path from "path";
import dbConnect from "@/lib/dbConnect";
import Event from "@/models/Event";
import User from "@/models/User";
import ClickPreference from "@/models/ClickPreference";



export async function GET(req) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const firebase_uid = searchParams.get("firebase_uid");
    let numericUserId = searchParams.get("userId");
    const topParam = searchParams.get("top");
    const top = topParam ? Math.max(1, parseInt(topParam, 10) || 3) : 3;

    // 🟢 Base events from MongoDB
    const events = await Event.find({}).lean();

    // If an explicit user id is not provided, try to derive one from the authenticated app user.
    if (!numericUserId && firebase_uid) {
      const user = await User.findOne({ firebase_uid }).lean();

      if (user) {
        try {
          // Load ML service from external directory
          const mlServicePath = path.resolve(process.cwd(), "..", "ml", "recommender.js");
          const ml = require(mlServicePath);
          const { getKnownUserIds } = ml;

          if (getKnownUserIds) {
            const knownIds = getKnownUserIds();
            if (knownIds.length > 0) {
              const hash = crypto
                .createHash("md5")
                .update(String(user._id))
                .digest("hex");
              const int = parseInt(hash.slice(0, 8), 16);
              const idx = int % knownIds.length;
              numericUserId = knownIds[idx];
            }
          }
        } catch (e) {
          console.error("Failed to map user to ML user id:", e);
        }
      }
    }

    // If we still don't have a numeric user id, just return events as-is.
    if (!numericUserId) {
      return new Response(
        JSON.stringify({ success: true, events }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    //  Use ML recommender to rank categories, then sort events, optionally boosted by per-category click preferences.
    try {
      // Load ML service from external directory
      const mlServicePath = path.resolve(process.cwd(), "..", "ml", "recommender.js");
      const ml = require(mlServicePath);
      const { getRecommendedCategories, getRecommendedCategoriesVerbose } = ml;

      if (!getRecommendedCategories) {
        throw new Error("Recommender implementation not found");
      }

      // Prefer verbose stats when available so we can expose richer metadata
      const verbose = getRecommendedCategoriesVerbose
        ? await getRecommendedCategoriesVerbose(numericUserId, top)
        : null;

      const categoryOrder = verbose
        ? verbose.map((c) => c.category)
        : await getRecommendedCategories(numericUserId, top);

      // Highest-ranked category should get the highest base score
      const baseScore = categoryOrder.length;
      const mlCategoryScores = categoryOrder.reduce((acc, cat, index) => {
        acc[cat] = baseScore - index;
        return acc;
      }, {});

      // Optional: overlay of user-specific click preferences
      let clickScores = {};
      if (firebase_uid) {
        const user = await User.findOne({ firebase_uid }).lean();
        if (user) {
          const clickPref = await ClickPreference.findOne({
            userId: user._id,
          }).lean();
          if (clickPref?.categoryClicks) {
            // Convert Map-like object into plain record (works for plain JS objects too)
            clickScores = Object.fromEntries(
              Object.entries(clickPref.categoryClicks)
            );
          }
        }
      }

      // Tunable weight for how strongly clicks should boost categories
      const CLICK_WEIGHT = 0.5;

      const scoredEvents = events
        .map((event) => {
          const cat = event.category;
          const mlScore = cat ? mlCategoryScores[cat] || 0 : 0;
          const clickScore = cat ? clickScores[cat] || 0 : 0;
          const recommendationScore = mlScore + CLICK_WEIGHT * clickScore;
          return { ...event, recommendationScore };
        })
        .sort((a, b) => b.recommendationScore - a.recommendationScore);

      return new Response(
        JSON.stringify({
          success: true,
          events: scoredEvents,
          userId: Number(numericUserId),
          recommendedCategories: verbose ?? categoryOrder,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.error("ML service error:", e);
      // Fallback: return unsorted events so the UI still works
      return new Response(
        JSON.stringify({ success: true, events }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Recommendation API Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
