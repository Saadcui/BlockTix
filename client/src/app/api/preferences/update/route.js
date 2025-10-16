import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import UserPreference from "@/models/UserPreference";

export async function POST(req) {
  await dbConnect();

  try {
    const body = await req.json();
    const { firebase_uid, category, query } = body;

    if (!firebase_uid) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing firebase_uid" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 1️⃣: Find the user
    const user = await User.findOne({ firebase_uid });
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 2️⃣: Find or create preferences for this user
    let pref = await UserPreference.findOne({ userId: user._id });
    if (!pref) {
      pref = new UserPreference({
        userId: user._id,
        preferences: {
          sports: 0,
          music: 0,
          movies: 0,
          theater: 0,
          general: 0,
        },
      });
    }

    // Step 3️⃣: Determine key to increment
    const key = (category || query || "general").toLowerCase();

    // ✅ Initialize missing keys
    if (pref.preferences[key] === undefined) {
      pref.preferences[key] = 0;
    }

    // ✅ Increment score
    pref.preferences[key] += 1;

    // Step 4️⃣: Save
    await pref.save();

    console.log(`✅ Preference updated for ${user.name}: ${key} -> ${pref.preferences[key]}`);

    return new Response(
      JSON.stringify({ success: true, preferences: pref.preferences }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Preference update failed:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal Server Error", error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
