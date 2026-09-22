// ============================================================
// TECHFEST 2026 — HOMEPAGE SCRIPT
// Reads live data from Supabase when available and falls back to the
// configured placeholder values otherwise.
// ============================================================

function normalizeUniversityRows(rows) {
  return (rows || []).map((row) => ({
    name: row.name,
    city: row.city || "",
    interested: Number(row.count ?? row.interested ?? 0),
    goal: Number(row.goal || 100),
  }));
}

// ============================================================
// Starfield background
// ============================================================
function renderStarfield() {
  const field = document.getElementById("starfield");
  const fragment = document.createDocumentFragment();
  const count = 60;

  for (let i = 0; i < count; i++) {
    const star = document.createElement("span");
    star.className = "star";
    const size = Math.random() < 0.15 ? 3 : Math.random() < 0.5 ? 2 : 1;
    star.style.top = `${Math.random() * 100}%`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.animationDelay = `${Math.random() * 4}s`;
    star.style.animationDuration = `${2.6 + Math.random() * 2.4}s`;
    fragment.appendChild(star);
  }
  field.appendChild(fragment);
}

// ============================================================
// Orbit counter (signature element)
// ============================================================
const RADIUS = 104;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initOrbitCounter(count, goal) {
  const ringFill = document.getElementById("ringFill");
  const numberEl = document.getElementById("orbitNumber");

  ringFill.style.strokeDasharray = String(CIRCUMFERENCE);
  ringFill.style.strokeDashoffset = String(CIRCUMFERENCE);

  const fillRatio = Math.max(0, Math.min(1, count / goal));
  const targetOffset = CIRCUMFERENCE * (1 - fillRatio);

  requestAnimationFrame(() => {
    ringFill.style.strokeDashoffset = String(targetOffset);
  });

  if (prefersReducedMotion) {
    numberEl.textContent = String(count);
    return;
  }

  const durationMs = 1200;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / durationMs, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    numberEl.textContent = String(Math.round(eased * count));
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ============================================================
// Quick stats strip (Universities / Interested / Industry / Investors)
// ============================================================
function animateStatNumber(el, target, durationMs = 900) {
  if (!el) return;
  if (prefersReducedMotion) {
    el.textContent = String(target);
    return;
  }
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / durationMs, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = String(Math.round(eased * target));
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderQuickStats(universityCount, interestSubmissionCount) {
  animateStatNumber(document.getElementById("statUniversities"), universityCount);
  animateStatNumber(document.getElementById("statInterested"), interestSubmissionCount);
  animateStatNumber(document.getElementById("statIndustries"), CONFIG.industryData.length);
  animateStatNumber(document.getElementById("statInvestors"), CONFIG.investorsCount);
}

// ============================================================
// University reach preview (top universities by interest)
// ============================================================
const HOME_RING_RADIUS = 26;
const HOME_RING_CIRCUMFERENCE = 2 * Math.PI * HOME_RING_RADIUS;

function buildHomeUniversityCard(rankIndex, item) {
  const goal = item.goal || 100;
  const pct = Math.max(0, Math.min(100, Math.round((item.interested / goal) * 100)));
  const rank = String(rankIndex + 1).padStart(2, "0");
  const offset = HOME_RING_CIRCUMFERENCE * (1 - pct / 100);

  const card = document.createElement("article");
  card.className = "lb-card";
  card.innerHTML = `
    <span class="lb-rank">#${rank}</span>
    <div class="lb-body">
      <svg viewBox="0 0 64 64" class="lb-ring" aria-hidden="true">
        <circle cx="32" cy="32" r="${HOME_RING_RADIUS}" class="lb-ring-track" />
        <circle cx="32" cy="32" r="${HOME_RING_RADIUS}" class="lb-ring-fill"
          style="stroke-dasharray:${HOME_RING_CIRCUMFERENCE};stroke-dashoffset:${HOME_RING_CIRCUMFERENCE};"
          data-target-offset="${offset}" />
      </svg>
      <div class="lb-info">
        <h3 class="lb-name">${item.name}</h3>
        <span class="lb-sub">${item.city || "Campus"}</span>
        <span class="lb-count" data-target="${item.interested}">0</span>
        <span class="lb-goal">of ${goal} goal &middot; ${pct}%</span>
      </div>
    </div>
  `;
  return card;
}

function animateHomeCard(card) {
  const ringFill = card.querySelector(".lb-ring-fill");
  const countEl = card.querySelector(".lb-count");
  const target = Number(countEl.dataset.target);
  const targetOffset = Number(ringFill.dataset.targetOffset);

  requestAnimationFrame(() => {
    ringFill.style.transition = "stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1)";
    ringFill.style.strokeDashoffset = String(targetOffset);
  });

  if (prefersReducedMotion) {
    countEl.textContent = String(target);
    return;
  }

  const durationMs = 1000;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / durationMs, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    countEl.textContent = String(Math.round(eased * target));
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderHomeUniversityReach(items = []) {
  const grid = document.getElementById("homeUniversityGrid");
  if (!grid) return;

  const source = items.length ? items : CONFIG.universityData;
  const top = [...source]
    .sort((a, b) => (b.interested ?? b.count ?? 0) - (a.interested ?? a.count ?? 0))
    .slice(0, 6)
    .map((item) => ({
      name: item.name,
      city: item.city || "",
      interested: Number(item.interested ?? item.count ?? 0),
      goal: Number(item.goal || 100),
    }));

  grid.innerHTML = "";
  top.forEach((item, i) => {
    const card = buildHomeUniversityCard(i, item);
    grid.appendChild(card);
    animateHomeCard(card);
  });
}

// ============================================================
// Accessible modal helpers (focus trap + Escape to close)
// ============================================================
let lastFocusedEl = null;
let activeOverlay = null;

function openModal(overlay) {
  lastFocusedEl = document.activeElement;
  activeOverlay = overlay;
  overlay.hidden = false;
  document.body.style.overflow = "hidden";

  const focusable = overlay.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  focusable[0]?.focus();

  document.addEventListener("keydown", handleModalKeydown);
}

function closeModal(overlay) {
  overlay.hidden = true;
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleModalKeydown);
  activeOverlay = null;
  lastFocusedEl?.focus?.();
}

function handleModalKeydown(e) {
  if (!activeOverlay) return;
  if (e.key === "Escape") {
    closeModal(activeOverlay);
    return;
  }
  if (e.key === "Tab") {
    const focusable = activeOverlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

// ============================================================
// Wire everything up
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  renderStarfield();

  async function refreshHomeStats() {
    const universityData = normalizeUniversityRows(await fetchUniversityStats());
    const interestSubmissionCount = await fetchInterestSubmissionCount();

    initOrbitCounter(interestSubmissionCount, CONFIG.interestGoal);
    renderQuickStats(universityData.length, interestSubmissionCount);
    renderHomeUniversityReach(universityData);
  }

  await refreshHomeStats();

  if (supabaseClient) {
    const homeChannel = supabaseClient
      .channel("techfest-home-live-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "interest_submissions" },
        async () => {
          await refreshHomeStats();
        }
      );

    homeChannel.subscribe((status) => {
      console.log("[TechFest] Supabase home Realtime status:", status);
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) refreshHomeStats();
    });

    window.addEventListener("focus", () => {
      refreshHomeStats();
    });
  }

  const infoOverlay = document.getElementById("infoModalOverlay");

  document.getElementById("btnNotInterested").addEventListener("click", () => {
    document.getElementById("websiteLink").href = CONFIG.techfestWebsiteURL;
    openModal(infoOverlay);
  });

  document.querySelectorAll("[data-close]").forEach((el) => {
    el.addEventListener("click", () => {
      if (!infoOverlay.hidden) closeModal(infoOverlay);
    });
  });
});
