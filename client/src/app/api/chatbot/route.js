import { NextResponse } from 'next/server';
import { Ollama } from 'ollama';
import dbConnect from '@/lib/dbConnect';
import Event from '@/models/Event';
import User from '@/models/User';
import Ticket from '@/models/Ticket';

const ollama = new Ollama({ host: 'http://localhost:11434' });

const LLM_MODEL = 'llama3:8b-instruct-q4_0';
const LLM_TEMPERATURE = 0.1;


// SYSTEM PROMPT

const SYSTEM_PROMPT = `You are BlockTix Support Assistant. BlockTix is an event ticketing platform.

PLATFORM KNOWLEDGE (always true):
- Users CAN browse and view events without logging in
- Users MUST log in to buy tickets, view their purchased tickets, or get recommendations
- Events page is accessible to everyone at /discover
- Tickets page requires login at /dashboard/user
- QR codes are used for event entry

STRICT RULES:
1. Use ONLY the provided CONTEXT DATA. Never invent events, tickets, dates, prices, or locations.
2. If STATUS shows "NO TICKETS FOUND" → say user has no tickets
3. If STATUS shows "NOT LOGGED IN" AND user asks for THEIR tickets → say please log in
4. If STATUS shows "NO EVENTS FOUND" → say no events were found
5. For general questions about the platform, use the PLATFORM KNOWLEDGE above
6. Keep responses SHORT (2-4 sentences max)
7. Be friendly and helpful
8. If unclear what user wants, ask them to clarify`;


// MAIN API ENDPOINT

export async function POST(req) {
  try {
    const { message, userId } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    console.log('User message:', message);
    console.log('User ID:', userId || 'NOT LOGGED IN');

    await dbConnect();

    // STEP 1: Retrieve relevant data from MongoDB
    const contextData = await retrieveRelevantData(message, userId);

    console.log('Retrieved:', {
      events: contextData.events.length,
      tickets: contextData.userTickets.length,
      intent: JSON.stringify(contextData.intent)
    });

    // STEP 2: Build context string
    const contextString = buildContextString(contextData, message, userId);

    // STEP 3: Generate response via Ollama
    const response = await generateRAGResponse(message, contextString, contextData.intent, userId);

    console.log('Final response:', response);

    return NextResponse.json({
      success: true,
      message: response,
      metadata: {
        eventsFound: contextData.events.length,
        userTicketsCount: contextData.userTickets.length,
        model: LLM_MODEL
      }
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json({
      success: false,
      message: "I'm having trouble right now. Please try again in a moment."
    }, { status: 500 });
  }
}


// INTENT DETECTION

function detectIntent(query) {
  const intent = {
    needsEvents: false,
    isRecommendation: false,
    isTicketQuery: false,
    isTroubleshooting: false,
    isConversational: false,
    isNavigation: false,
    category: null,
    location: null,
    priceMax: null,
    dateRange: null
  };

  // Short/conversational messages (≤2 words or punctuation only)
  const wordCount = query.trim().split(/\s+/).length;
  if (
    wordCount <= 2 ||
    query.match(/^[?!.]+$/) ||
    query.match(/^(ok|okay|thanks|thank you|hi|hello|hey|cool|great|sure|yes|no|nope|yep|alright|got it)$/i)
  ) {
    intent.isConversational = true;
    return intent;
  }

  // Navigation questions
  if (query.match(/how (do i|to) (go|navigate|get|access|find|open|view) (to |the )?(event|ticket|page|section|dashboard|wallet|profile)/i)) {
    intent.isNavigation = true;
    return intent;
  }
  if (query.match(/where (is|can i find|do i go) (the )?(event|ticket|page|section|dashboard)/i)) {
    intent.isNavigation = true;
    return intent;
  }
  if (query.match(/events? page|ticket page|discover page|how (to|do i) (browse|find) events?/i)) {
    intent.isNavigation = true;
    return intent;
  }

  // Recommendation
  if (query.match(/recommend|suggest|for me|best events|what should i (attend|see|go)/i)) {
    intent.isRecommendation = true;
    intent.needsEvents = true;
    return intent;
  }

  // Ticket queries — ONLY for user's OWN tickets (uses possessive "my")
  if (query.match(/\bmy tickets?\b|\bmy events?\b|\bi (purchased|bought)\b|\bshow my\b|\bview my\b|\bmy orders?\b/i)) {
    intent.isTicketQuery = true;
    return intent;
  }

  // Troubleshooting
  if (query.match(/problem|issue|error|not working|failed|can't|cannot|how do i|how to|payment failed|qr code|forgot password|waitlist|refund/i)) {
    intent.isTroubleshooting = true;
    return intent;
  }

  // Category detection
  const categories = {
    'music|concert|band|performance': 'Music',
    'sports|cricket|football|basketball|match|game|tournament': 'Sports',
    'art|gallery|exhibition|museum|painting': 'Art',
    'workshop|seminar|conference|lecture|training': 'Education',
    'food|drink|restaurant|culinary|dining': 'Food And Drink',
    'festival|carnival|celebration|fair': 'Festival'
  };

  for (const [pattern, category] of Object.entries(categories)) {
    if (query.match(new RegExp(pattern, 'i'))) {
      intent.category = category;
      intent.needsEvents = true;
    }
  }

  // Location detection
  const locationMatch = query.match(/\bin\s+([a-z][a-z\s]{2,25}?)(?:\s+under|\s+below|\s+on|\s*$)|\bat\s+([a-z][a-z\s]{2,25}?)(?:\s+under|\s*$)/i);
  if (locationMatch) {
    const loc = (locationMatch[1] || locationMatch[2])?.trim();
    if (loc && loc.length > 2) {
      intent.location = loc;
      intent.needsEvents = true;
    }
  }

  // Price detection
  const priceMatch = query.match(/under\s+\$?(\d+)|below\s+\$?(\d+)|cheaper\s+than\s+\$?(\d+)|less than\s+\$?(\d+)/i);
  if (priceMatch) {
    intent.priceMax = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3] || priceMatch[4]);
    intent.needsEvents = true;
  }

  // Date range detection
  if (query.match(/\b(today|tomorrow|this weekend|weekend|this week|this month)\b/i)) {
    intent.dateRange = parseDateRange(query);
    intent.needsEvents = true;
  }

  // General event browsing (without "my" — so not personal tickets)
  if (query.match(/\b(events?|show|concert|happening|available|upcoming|browse)\b/i) && !intent.isTicketQuery) {
    intent.needsEvents = true;
  }

  return intent;
}


// DATE RANGE PARSER

function parseDateRange(query) {
  const now = new Date();

  if (query.includes('today')) {
    return {
      start: new Date(new Date().setHours(0, 0, 0, 0)),
      end: new Date(new Date().setHours(23, 59, 59, 999))
    };
  }
  if (query.includes('tomorrow')) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return {
      start: new Date(new Date(d).setHours(0, 0, 0, 0)),
      end: new Date(new Date(d).setHours(23, 59, 59, 999))
    };
  }
  if (query.includes('weekend')) {
    const day = now.getDay();
    const daysToFriday = (5 - day + 7) % 7 || 7;
    const friday = new Date();
    friday.setDate(now.getDate() + daysToFriday);
    friday.setHours(0, 0, 0, 0);
    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);
    sunday.setHours(23, 59, 59, 999);
    return { start: friday, end: sunday };
  }
  if (query.includes('this week')) {
    const end = new Date();
    end.setDate(now.getDate() + 7);
    return { start: now, end };
  }
  if (query.includes('this month')) {
    const end = new Date();
    end.setMonth(now.getMonth() + 1);
    return { start: now, end };
  }
  return null;
}


// DATABASE FUNCTIONS

async function retrieveRelevantData(query, userId) {
  const lowerQuery = query.toLowerCase();
  const intent = detectIntent(lowerQuery);

  let events = [];
  let userTickets = [];
  let user = null;

  try {
    // Only fetch user data when specifically needed
    if (userId && (intent.isTicketQuery || intent.isRecommendation)) {
      user = await User.findOne({ firebase_uid: userId });
      userTickets = await getUserTickets(userId);
    }

    // Only fetch events when needed
    if (intent.needsEvents) {
      if (intent.isRecommendation && userId) {
        events = await recommendEvents(userId);
      } else {
        events = await searchEvents({
          category: intent.category,
          location: intent.location,
          priceMax: intent.priceMax,
          dateRange: intent.dateRange
        });
      }
    }
  } catch (error) {
    console.error('Error retrieving data:', error);
  }

  return { events, userTickets, user, intent };
}

async function searchEvents({ category, location, priceMax, dateRange }) {
  try {
    const filters = {};
    if (category) filters.category = category;
    if (location) filters.location = { $regex: location, $options: 'i' };
    if (priceMax) filters.price = { $lte: priceMax };
    filters.date = dateRange
      ? { $gte: dateRange.start, $lte: dateRange.end }
      : { $gte: new Date() };
    filters.remainingTickets = { $gt: 0 };

    return await Event.find(filters).sort({ date: 1 }).limit(5).lean();
  } catch (err) {
    console.error('searchEvents error:', err);
    return [];
  }
}

async function getUserTickets(userId) {
  try {
    return await Ticket.find({ userId })
      .populate('eventId')
      .sort({ purchaseDate: -1 })
      .limit(10)
      .lean();
  } catch (err) {
    console.error('getUserTickets error:', err);
    return [];
  }
}

async function recommendEvents(userId) {
  try {
    const userTickets = await Ticket.find({ userId }).populate('eventId').lean();
    const preferredCategories = [...new Set(
      userTickets.map(t => t.eventId?.category).filter(Boolean)
    )];

    if (preferredCategories.length) {
      return await Event.find({
        category: { $in: preferredCategories },
        date: { $gte: new Date() },
        remainingTickets: { $gt: 0 }
      }).sort({ date: 1 }).limit(5).lean();
    }

    // Fallback: return upcoming events
    return await Event.find({
      date: { $gte: new Date() },
      remainingTickets: { $gt: 0 }
    }).sort({ date: 1 }).limit(5).lean();
  } catch (err) {
    console.error('recommendEvents error:', err);
    return [];
  }
}


// CONTEXT BUILDING

function buildContextString({ events, userTickets, user, intent }, userQuery, userId) {
  let context = `USER QUERY: "${userQuery}"\n\n`;

  // TICKET CONTEXT (only when user asks for THEIR tickets)
  if (intent.isTicketQuery) {
    if (!userId) {
      context += `TICKET STATUS: NOT LOGGED IN\n`;
      context += `User must log in to view their tickets.\n\n`;
    } else if (userTickets.length === 0) {
      context += `TICKET STATUS: NO TICKETS FOUND\n`;
      context += `This user has not purchased any tickets yet.\n\n`;
    } else {
      context += `USER'S TICKETS (${userTickets.length} total):\n`;
      userTickets.slice(0, 5).forEach((t, i) => {
        const e = t.eventId;
        if (e) {
          context += `\nTicket ${i + 1}:\n`;
          context += `  Event: ${e.event}\n`;
          context += `  Date: ${new Date(e.date).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}\n`;
          context += `  Time: ${e.time}\n`;
          context += `  Location: ${e.location}\n`;
          context += `  Status: ${t.status}\n`;
        }
      });
      context += '\n';
    }
  }

  // EVENT CONTEXT
  if (intent.needsEvents) {
    if (events.length === 0) {
      context += `EVENT STATUS: NO EVENTS FOUND\n`;
      if (intent.category) context += `Searched category: ${intent.category}\n`;
      if (intent.location) context += `Searched location: ${intent.location}\n`;
      if (intent.priceMax) context += `Max price searched: $${intent.priceMax}\n`;
      context += '\n';
    } else {
      context += `AVAILABLE EVENTS (${events.length} found):\n`;
      events.slice(0, 5).forEach((e, i) => {
        context += `\nEvent ${i + 1}:\n`;
        context += `  Name: ${e.event}\n`;
        context += `  Category: ${e.category}\n`;
        context += `  Date: ${new Date(e.date).toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        })}\n`;
        context += `  Time: ${e.time}\n`;
        context += `  Location: ${e.location}\n`;
        context += `  Price: $${e.price}\n`;
        context += `  Tickets Available: ${e.remainingTickets}\n`;
        if (e.earlyBird?.enabled && new Date() < new Date(e.earlyBird.endDate)) {
          context += `  Early Bird Price: $${e.earlyBird.discountPrice}\n`;
        }
      });
      context += '\n';
    }
  }

  // TROUBLESHOOTING CONTEXT
  if (intent.isTroubleshooting) {
    context += buildTroubleshootingContext(userQuery);
  }

  // NAVIGATION CONTEXT
  if (intent.isNavigation) {
    context += `PLATFORM NAVIGATION:\n`;
    context += `- Browse Events (no login needed): /discover\n`;
    context += `- My Tickets (login required): /dashboard/user\n`;
    context += `- Login: /login\n`;
    context += `- Profile: /profile\n`;
    context += `- Help: /help\n\n`;
  }

  // CONVERSATIONAL
  if (intent.isConversational) {
    context += `NOTE: User sent a short/casual message. Respond naturally and offer to help.\n\n`;
  }

  context += `==== END OF CONTEXT DATA ====\n`;
  return context;
}

function buildTroubleshootingContext(query) {
  let ctx = 'TROUBLESHOOTING INFO:\n';

  if (query.match(/payment|pay|transaction/i)) {
    ctx += `\nPayment issue steps:\n1. Verify card details\n2. Check sufficient funds\n3. Try different payment method\n4. Clear browser cache\n5. Contact support with order ID\n`;
  }
  if (query.match(/qr code|qr not/i)) {
    ctx += `\nQR Code issue steps:\n1. Check email (including spam)\n2. Log in → My Tickets\n3. Re-download ticket\n4. Ensure good lighting when scanning\n5. Hold phone steady at entry point\n`;
  }
  if (query.match(/ticket not|missing ticket|didn't receive|no ticket/i)) {
    ctx += `\nMissing ticket steps:\n1. Check email and spam folder\n2. Log in → My Tickets\n3. Verify purchase was successful\n4. Contact support if still missing\n`;
  }
  if (query.match(/login|password|access|locked/i)) {
    ctx += `\nLogin issue steps:\n1. Click "Forgot Password"\n2. Check email verification\n3. Clear cookies and cache\n4. Try different browser\n5. Contact support for account recovery\n`;
  }
  if (query.match(/waitlist/i)) {
    ctx += `\nWaitlist info:\n- Join waitlist from the event page\n- You'll be emailed if tickets open up\n- First-come-first-served basis\n`;
  }
  if (query.match(/how (do i|to) buy|how (do i|to) purchase|how (do i|to) get ticket/i)) {
    ctx += `\nHow to buy tickets:\n1. Browse events on /discover\n2. Click on the event you want\n3. Select ticket quantity\n4. Complete payment\n5. Ticket sent to your email\n`;
  }

  return ctx + '\n';
}


// RAG RESPONSE GENERATION

async function generateRAGResponse(userMessage, context, intent, userId) {
  try {
    const fullPrompt = `${SYSTEM_PROMPT}

===== CONTEXT DATA START =====
${context}
===== CONTEXT DATA END =====

User Question: "${userMessage}"

Your answer (2-4 sentences, use ONLY the context data, be helpful):`;

    console.log('Calling Ollama...');

    const response = await ollama.generate({
      model: LLM_MODEL,
      prompt: fullPrompt,
      stream: false,
      options: {
        temperature: LLM_TEMPERATURE,
        num_predict: 150,
        num_ctx: 4096,
        top_p: 0.9,
        top_k: 20,
        repeat_penalty: 1.1
      }
    });

    let answer = response.response.trim();
    console.log('Raw LLM answer:', answer);

  
    // PRECISE ANTI-HALLUCINATION CHECKS

    // CHECK 1: LLM is listing fake structured ticket data
    // Triggers on patterns like "• Event: X", "Ticket 1:", "Rs 2,500", "The Arena"
    const fakingTicketList =
      answer.match(/here are your tickets:/i) ||
      answer.match(/ticket\s+\d+\s*:/i) ||
      answer.match(/•\s+event:/i) ||
      answer.match(/rs\s+\d{3,}/i);   // Invented price in local currency

    if (fakingTicketList && (context.includes('TICKET STATUS: NO TICKETS FOUND') || context.includes('TICKET STATUS: NOT LOGGED IN'))) {
      console.warn('Hallucinated ticket list detected — overriding');
      return !userId
        ? "Please log in to view your tickets."
        : "You don't have any tickets yet. Browse events at /discover and purchase tickets to see them here!";
    }

    // CHECK 2: LLM lists fake events when search returned nothing
    const fakingEventList =
      answer.match(/event\s+\d+\s*:/i) ||
      answer.match(/name:\s+\w+.*date:/i);

    if (fakingEventList && context.includes('EVENT STATUS: NO EVENTS FOUND')) {
      console.warn('Hallucinated event list detected — overriding');
      return "I couldn't find any events matching your search. Try different criteria or visit /discover to browse all events.";
    }

    return answer;

  } catch (error) {
    console.error('Ollama error:', error);
    return "I'm having trouble processing your request right now. Please try again in a moment.";
  }
}