import dbConnect from "@/lib/dbConnect";
import Event from "@/models/Event";
import User from "@/models/User";
import UserPreference from "@/models/UserPreference";

export async function GET(req) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const firebase_uid = searchParams.get("firebase_uid");

    // 🟢 Fetch all events (base list)
    const events = await Event.find({});

    if (!firebase_uid) {
      return new Response(
        JSON.stringify({ success: true, events }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🟢 Step 1: Find user by firebase_uid
    const user = await User.findOne({ firebase_uid });
    if (!user) {
      console.log("❌ No user found for firebase_uid:", firebase_uid);
      return new Response(
        JSON.stringify({ success: true, events }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🟢 Step 2: Find preferences using user._id
    const preferences = await UserPreference.findOne({ userId: user._id });
    if (!preferences) {
      console.log("❌ No preferences found for user:", user._id);
      return new Response(
        JSON.stringify({ success: true, events }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const scores = preferences.preferences || {};

    // 🟢 Step 3: Sort events by preference scores
    const sortedEvents = [...events].sort((a, b) => {
      const aScore = scores[a.category?.toLowerCase()] || 0;
      const bScore = scores[b.category?.toLowerCase()] || 0;
      return bScore - aScore;
    });

    console.log("✅ Sorted for user:", firebase_uid, scores);

    return new Response(
      JSON.stringify({ success: true, events: sortedEvents }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Recommendation API Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
