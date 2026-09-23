// ============================================================
// TECHFEST 2026 — INTEREST PAGE SCRIPT
// Reads live university counts from Supabase and writes form
// submissions to the live database once the connection is active.
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
// Starfield background (shared look with homepage)
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

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// ============================================================
// Leaderboard card rendering (donut ring + rank + count-up)
// ============================================================
function buildCard(rankIndex, name, subtitle, interested, goal) {
  const pct = Math.max(0, Math.min(100, Math.round((interested / goal) * 100)));
  const rank = String(rankIndex + 1).padStart(2, "0");
  const offset = RING_CIRCUMFERENCE * (1 - pct / 100);

  const card = document.createElement("article");
  card.className = "lb-card";
  card.innerHTML = `
    <span class="lb-rank">#${rank}</span>
    <div class="lb-body">
      <svg viewBox="0 0 64 64" class="lb-ring" aria-hidden="true">
        <circle cx="32" cy="32" r="${RING_RADIUS}" class="lb-ring-track" />
        <circle cx="32" cy="32" r="${RING_RADIUS}" class="lb-ring-fill"
          style="stroke-dasharray:${RING_CIRCUMFERENCE};stroke-dashoffset:${RING_CIRCUMFERENCE};"
          data-target-offset="${offset}" />
      </svg>
      <div class="lb-info">
        <h3 class="lb-name">${name}</h3>
        ${subtitle ? `<span class="lb-sub">${subtitle}</span>` : ""}
        <span class="lb-count" data-target="${interested}">0</span>
        <span class="lb-goal">of ${goal} goal &middot; ${pct}%</span>
      </div>
    </div>
  `;
  return card;
}

function renderLeaderboard(gridEl, items, withCity) {
  gridEl.innerHTML = "";
  const sorted = [...items].sort((a, b) => (b.interested ?? b.count ?? 0) - (a.interested ?? a.count ?? 0));
  sorted.forEach((item, i) => {
    const goal = item.goal || 100;
    const subtitle = withCity ? item.city : "";
    gridEl.appendChild(buildCard(i, item.name, subtitle, Number(item.interested ?? item.count ?? 0), goal));
  });
}

// Animate a single card's ring + number once it's visible
function animateCard(card) {
  if (card.dataset.animated === "true") return;
  card.dataset.animated = "true";

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

function observeCards(root) {
  const cards = root.querySelectorAll(".lb-card");
  if (!("IntersectionObserver" in window)) {
    cards.forEach(animateCard);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) animateCard(entry.target);
      });
    },
    { threshold: 0.35 }
  );
  cards.forEach((c) => io.observe(c));
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
// Tabs: Universities <-> Industry Partners
// ============================================================
function initTabs(universityGrid, industryGrid) {
  const tabUni = document.getElementById("tabUniversities");
  const tabInd = document.getElementById("tabIndustries");

  tabUni.addEventListener("click", () => {
    tabUni.classList.add("is-active");
    tabUni.setAttribute("aria-selected", "true");
    tabInd.classList.remove("is-active");
    tabInd.setAttribute("aria-selected", "false");
    universityGrid.hidden = false;
    industryGrid.hidden = true;
    observeCards(universityGrid);
  });

  tabInd.addEventListener("click", () => {
    tabInd.classList.add("is-active");
    tabInd.setAttribute("aria-selected", "true");
    tabUni.classList.remove("is-active");
    tabUni.setAttribute("aria-selected", "false");
    industryGrid.hidden = false;
    universityGrid.hidden = true;
    observeCards(industryGrid);
  });
}

// ============================================================
// University <select> options
// ============================================================
function populateUniversitySelect(names) {
  const select = document.getElementById("university");
  if (!select) return;

  const defaultNames = (CONFIG.universities || []).map((u) => u.name);
  const allNames = Array.from(new Set([...(names || []), ...defaultNames, "IOBM"])).filter(Boolean);
  const options = allNames.sort((a, b) => a.localeCompare(b));

  select.innerHTML = '<option value="" disabled selected>Select your university</option>';

  options.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);
  });

  const otherOpt = document.createElement("option");
  otherOpt.value = "Other";
  otherOpt.textContent = "Other";
  select.appendChild(otherOpt);
}

// ============================================================
// Form validation + submit
// ============================================================
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+\d][\d\s-]{6,}$/;

function validateForm(values) {
  const errors = {};
  if (!values.university.trim()) errors.university = "Select your university.";
  if (!values.fullName.trim()) errors.fullName = "Enter your full name.";
  if (!values.phone.trim()) {
    errors.phone = "Enter your phone number.";
  } else if (!PHONE_PATTERN.test(values.phone.trim())) {
    errors.phone = "Enter a valid phone number.";
  }
  if (!values.email.trim()) {
    errors.email = "Enter your email address.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  return errors;
}

function showFieldErrors(errors) {
  ["university", "fullName", "phone", "email"].forEach((id) => {
    const input = document.getElementById(id);
    const errorEl = document.getElementById(`${id}-error`);
    if (errors[id]) {
      input.setAttribute("aria-invalid", "true");
      errorEl.textContent = errors[id];
    } else {
      input.removeAttribute("aria-invalid");
      errorEl.textContent = "";
    }
  });
}

// ============================================================
// Wire everything up
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  renderStarfield();

  const universityGrid = document.getElementById("universityGrid");
  const industryGrid = document.getElementById("industryGrid");
  const select = document.getElementById("university");

  // Pre-populate dropdown immediately so options are available without network latency
  if (select) {
    populateUniversitySelect((CONFIG.universities || []).map((u) => u.name));
  }

  async function refreshLeaderboard() {
    const universityStats = normalizeUniversityRows(await fetchUniversityStats());
    const interestSubmissionCount = await fetchInterestSubmissionCount();

    renderLeaderboard(universityGrid, universityStats, true);
    renderLeaderboard(industryGrid, CONFIG.industryData, false);
    observeCards(universityGrid);
    renderQuickStats(universityStats.length, interestSubmissionCount);

    if (select) {
      populateUniversitySelect(universityStats.map((u) => u.name));
    }
  }

  await refreshLeaderboard();

  if (supabaseClient) {
    supabaseClient
      .channel("techfest-interest-live-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "interest_submissions" },
        async () => {
          await refreshLeaderboard();
        }
      )
      .subscribe();
  }

  initTabs(universityGrid, industryGrid);

  [document.getElementById("registerLink"), document.getElementById("registerLinkSuccess")].forEach((el) => {
    el.href = CONFIG.competitionsRegisterURL;
  });

  const form = document.getElementById("interestForm");
  const submitBtn = document.getElementById("submitBtn");
  const submitLabel = document.getElementById("submitLabel");
  const formSuccess = document.getElementById("formSuccess");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const values = {
      university: document.getElementById("university").value,
      fullName: document.getElementById("fullName").value,
      phone: document.getElementById("phone").value,
      email: document.getElementById("email").value,
    };

    const errors = validateForm(values);
    showFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    submitBtn.disabled = true;
    submitLabel.innerHTML = '<span class="spinner" aria-hidden="true"></span>Sending…';

    try {
      await submitInterestForm(values);
      await refreshLeaderboard();
      form.hidden = true;
      formSuccess.hidden = false;
      formSuccess.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });

      const checkPath = formSuccess.querySelector(".check-path");
      if (checkPath) {
        checkPath.style.animation = "none";
        void checkPath.offsetWidth;
        checkPath.style.animation = "";
      }
    } finally {
      submitBtn.disabled = false;
      submitLabel.textContent = "Send Signal";
    }
  });
});
