// ============================================================
// TECHFEST 2026 — SITE CONFIGURATION
// Handles the Supabase connection and shared fallback data.
// ============================================================
const CONFIG = {
  supabaseUrl: "https://xflkxshfrufplfupqhei.supabase.co",
  supabaseAnonKey: "sb_publishable_aslJhNMiYb-0p-k7SnfHCw_4Z0svGRm",

  interestGoal: 200,
  techfestWebsiteURL: "https://techfest-ned.vercel.app/",
  competitionsRegisterURL: "https://techfest-ned.vercel.app/",
  techfestPDF: "assets/techfest-2026-guide.pdf",

  universities: [
    { name: "Habib University", count: 2 },
    { name: "Jinnah University for Women", count: 1 },
    { name: "NUST", count: 3 },
    { name: "IBA", count: 2 },
    { name: "FAST", count: 2 },
    { name: "Karachi University", count: 2 },
    { name: "Bahria University", count: 1 },
    { name: "Dawood University", count: 1 },
    { name: "Iqra University", count: 1 },
    { name: "IOBM", count: 0 },
    { name: "AL-Kawthar University", count: 0 },
  ],

  universityData: [
    { name: "Habib University", city: "Karachi", interested: 2, goal: 100 },
    { name: "Jinnah University for Women", city: "Karachi", interested: 1, goal: 100 },
    { name: "NUST", city: "Islamabad", interested: 3, goal: 100 },
    { name: "IBA", city: "Karachi", interested: 2, goal: 100 },
    { name: "FAST", city: "Karachi", interested: 2, goal: 100 },
    { name: "Karachi University", city: "Karachi", interested: 2, goal: 100 },
    { name: "Bahria University", city: "Islamabad", interested: 1, goal: 100 },
    { name: "Dawood University", city: "Karachi", interested: 1, goal: 100 },
    { name: "Iqra University", city: "Karachi", interested: 1, goal: 100 },
    { name: "IOBM", city: "Karachi", interested: 0, goal: 100 },
    { name: "AL-Kawthar University", city: "Karachi", interested: 0, goal: 100 },
  ],

  industryData: [
    { name: "Software & IT Services", interested: 120 },
    { name: "Fintech & Payments", interested: 96 },
    { name: "AI & Data", interested: 88 },
    { name: "Startup Ecosystem", interested: 71 },
  ],

  investorsCount: 18,
};

const supabaseClient =
  CONFIG.supabaseUrl &&
  CONFIG.supabaseAnonKey &&
  typeof window !== "undefined" &&
  window.supabase
    ? window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey)
    : null;

function placeholderTotal() {
  return (CONFIG.universities || []).reduce((sum, u) => sum + Number(u.count || 0), 0);
}

// People Interested is not a stored column. It is derived from the
// number of rows currently stored in the backend table: interest_submissions.
async function fetchInterestSubmissionCount() {
  if (!supabaseClient) {
    console.warn("[TechFest] Supabase not configured — showing placeholder count.");
    return placeholderTotal();
  }

  const { count, error } = await supabaseClient
    .from("interest_submissions")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("[TechFest] fetchInterestSubmissionCount failed, falling back:", error.message);
    return placeholderTotal();
  }

  return Number(count ?? 0);
}

async function fetchUniversityStats() {
  if (!supabaseClient) {
    console.warn("[TechFest] Supabase not configured — showing placeholder counts.");
    return CONFIG.universities;
  }

  const { data, error } = await supabaseClient
    .from("university_interest_counts")
    .select("name, count");

  if (error) {
    console.error("[TechFest] fetchUniversityStats failed, falling back:", error.message);
    return CONFIG.universities;
  }

  const countsMap = new Map();
  (data || []).forEach((item) => {
    countsMap.set(item.name, Number(item.count || 0));
  });

  // For any universities in CONFIG that aren't yet in the Supabase view,
  // ensure we check interest_submissions directly
  const missingInDb = (CONFIG.universities || []).filter((u) => !countsMap.has(u.name));
  if (missingInDb.length > 0) {
    try {
      const { data: subData } = await supabaseClient
        .from("interest_submissions")
        .select("university");
      if (subData) {
        subData.forEach((row) => {
          if (row.university && !countsMap.has(row.university)) {
            countsMap.set(row.university, 0);
          }
          if (row.university && missingInDb.some((m) => m.name === row.university)) {
            countsMap.set(row.university, (countsMap.get(row.university) || 0) + 1);
          }
        });
      }
    } catch (_) {}
  }

  const result = [];
  const seen = new Set();

  (CONFIG.universities || []).forEach((u) => {
    seen.add(u.name);
    result.push({
      name: u.name,
      count: countsMap.has(u.name) ? countsMap.get(u.name) : Number(u.count || 0),
    });
  });

  countsMap.forEach((count, name) => {
    if (!seen.has(name)) {
      result.push({ name, count });
    }
  });

  return result;
}

async function submitInterestForm(payload) {
  if (!supabaseClient) {
    console.warn(
      "[TechFest] Supabase not configured — this submission is NOT being stored anywhere.",
      payload
    );
    await new Promise((resolve) => setTimeout(resolve, 900));
    return { ok: true, stored: false };
  }

  const { error } = await supabaseClient.from("interest_submissions").insert({
    full_name: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    university: payload.university,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { ok: true, stored: true };
}
