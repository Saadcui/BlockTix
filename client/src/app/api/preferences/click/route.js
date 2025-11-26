import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import ClickPreference from "@/models/ClickPreference";

/**
 * Increment a simple per-category click counter for a user.
 * This does not replace the MovieLens engine; it only provides
 * a lightweight "recent interest" signal that can be combined
 * with CSV-based scores.
 *
 * Body:
 * - firebase_uid: string (required)
 * - category: string (required, should match Event.category values)
 */
export async function POST(req) {
  await dbConnect();

  try {
    const { firebase_uid, category } = await req.json();

    if (!firebase_uid || !category) {
      return new Response(
        JSON.stringify({ success: false, message: "firebase_uid and category are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const user = await User.findOne({ firebase_uid });
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    let pref = await ClickPreference.findOne({ userId: user._id });
    if (!pref) {
      pref = new ClickPreference({ userId: user._id });
    }

    const current = pref.categoryClicks.get(category) || 0;
    pref.categoryClicks.set(category, current + 1);
    await pref.save();

    return new Response(
      JSON.stringify({
        success: true,
        category,
        clicks: pref.categoryClicks.get(category),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ ClickPreference update failed:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal Server Error", error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


