/* Zeyna-inspired static landing
   - loader with percent
   - fullscreen menu overlay
   - custom cursor (desktop only)
   - anchor "transition" feel
   - counters on view
   - demo grid with category + tag filtering
*/

const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => Array.from(root.querySelectorAll(q));

/* ---------------- Loader ---------------- */
const loader = $(".loader");
const loaderPct = $("#loaderPct");
const loaderBar = $(".loader__bar");

function runLoader() {
  // Simulated progress that ends quickly but feels premium
  const start = performance.now();
  const duration = 900; // ms
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const p = Math.round(easeOut(t) * 100);
    loaderPct.textContent = String(p);
    loaderBar.style.width = `${p}%`;

    if (t < 1) requestAnimationFrame(tick);
    else {
      setTimeout(() => loader.classList.add("is-done"), 200);
    }
  }
  requestAnimationFrame(tick);
}
runLoader();

/* ---------------- Menu overlay ---------------- */
const menuBtn = $("#menuBtn");
const menuBtnLabel = $("#menuBtnLabel");
const menu = $("#menuOverlay");
const menuClose = $("#menuClose");
const menuBackdrop = $("#menuBackdrop");

function openMenu() {
  menu.classList.add("is-open");
  menu.setAttribute("aria-hidden", "false");
  menuBtn.setAttribute("aria-expanded", "true");
  menuBtnLabel.textContent = "CLOSE";
  document.body.style.overflow = "hidden";
}
function closeMenu() {
  menu.classList.remove("is-open");
  menu.setAttribute("aria-hidden", "true");
  menuBtn.setAttribute("aria-expanded", "false");
  menuBtnLabel.textContent = "MENU";
  document.body.style.overflow = "";
}

menuBtn.addEventListener("click", () => {
  if (menu.classList.contains("is-open")) closeMenu();
  else openMenu();
});
menuClose.addEventListener("click", closeMenu);
menuBackdrop.addEventListener("click", closeMenu);

// Close on ESC
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menu.classList.contains("is-open")) closeMenu();
});

// Close when clicking a menu item
$$(".menu__item", menu).forEach((a) => a.addEventListener("click", closeMenu));

/* ---------------- Custom cursor ---------------- */
const cursor = $(".cursor");
const isTouch =
  matchMedia("(pointer: coarse)").matches ||
  "ontouchstart" in window ||
  navigator.maxTouchPoints > 0;

if (!isTouch) {
  let cx = window.innerWidth / 2;
  let cy = window.innerHeight / 2;
  let tx = cx, ty = cy;

  cursor.classList.add("is-on");

  window.addEventListener("mousemove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
  });

  function animate() {
    // smooth follow
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    cursor.style.left = `${cx}px`;
    cursor.style.top = `${cy}px`;
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // grow on interactive
  const bigSelectors = "a, button, .chip, .demo";
  function setBig(on) {
    cursor.classList.toggle("is-big", on);
  }
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(bigSelectors)) setBig(true);
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest(bigSelectors)) setBig(false);
  });
}

/* ---------------- Anchor transition feel ---------------- */
function softTransitionScrollTo(hash) {
  const target = $(hash);
  if (!target) return;

  document.body.classList.add("soft-fade");
  // small delay to simulate transition
  setTimeout(() => {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => document.body.classList.remove("soft-fade"), 260);
  }, 80);
}

// Intercept internal anchors
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;

  const href = a.getAttribute("href");
  if (!href || href === "#") return;

  e.preventDefault();
  history.pushState(null, "", href);
  softTransitionScrollTo(href);
});

// Optional: handle back/forward
window.addEventListener("popstate", () => {
  if (location.hash) softTransitionScrollTo(location.hash);
});

/* ---------------- Counters on view ---------------- */
function animateCount(el) {
  const target = Number(el.dataset.target || "0");
  const duration = 900;
  const start = performance.now();
  const from = 0;

  const fmt = new Intl.NumberFormat("en-US");
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const val = Math.round(from + (target - from) * eased);
    el.textContent = fmt.format(val);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const countEls = $$("[data-count]");
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((ent) => {
      if (ent.isIntersecting) {
        animateCount(ent.target);
        io.unobserve(ent.target);
      }
    });
  },
  { threshold: 0.45 }
);
countEls.forEach((el) => io.observe(el));

/* ---------------- Demo data + filters ---------------- */
const DEMOS = [
  { title: "Agency Main", category: "Agency", tags: ["Main", "Fullscreen"] },
  { title: "AI Agency", category: "Agency", tags: ["Startup", "Technology"] },
  { title: "Construction Company", category: "Corporate", tags: ["Service"] },
  { title: "Cosmetics Shop", category: "Shop", tags: ["Masking", "WooCommerce"] },
  { title: "SaaS Startup", category: "Startup", tags: ["3D Renderer", "Technology"] },
  { title: "App Landing", category: "Landing", tags: ["One Page", "Technology"] },
  { title: "Showcase Void", category: "Personal", tags: ["2D Perspective"] },
  { title: "Freelancer Portfolio", category: "Personal", tags: ["Portfolio"] },
  { title: "Architecture Studio", category: "Corporate", tags: ["SVG Drawings", "Service"] },
  { title: "Digital Services", category: "Service", tags: ["Portfolio", "Shop"] },
  { title: "Minimal Agency", category: "Agency", tags: ["Photography"] },
  { title: "Showcase Cards", category: "Personal", tags: ["2D Perspective"] },
];

const categories = ["All", ...Array.from(new Set(DEMOS.map(d => d.category)))];
const tags = Array.from(new Set(DEMOS.flatMap(d => d.tags))).sort((a,b)=>a.localeCompare(b));

const catChips = $("#catChips");
const tagChips = $("#tagChips");
const grid = $("#demoGrid");
const resetBtn = $("#resetFilters");

const state = {
  category: "All",
  tags: new Set(),
};

function chip(label, onClick) {
  const el = document.createElement("div");
  el.className = "chip";
  el.textContent = label;
  el.tabIndex = 0;
  el.setAttribute("role", "button");
  el.addEventListener("click", onClick);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") onClick();
  });
  return el;
}

function renderChips() {
  catChips.innerHTML = "";
  categories.forEach((c) => {
    const el = chip(c, () => {
      state.category = c;
      render();
    });
    if (state.category === c) el.classList.add("is-on");
    catChips.appendChild(el);
  });

  tagChips.innerHTML = "";
  tags.forEach((t) => {
    const el = chip(t, () => {
      if (state.tags.has(t)) state.tags.delete(t);
      else state.tags.add(t);
      render();
    });
    if (state.tags.has(t)) el.classList.add("is-on");
    tagChips.appendChild(el);
  });
}

function matches(d) {
  const catOk = state.category === "All" || d.category === state.category;
  const tagsOk =
    state.tags.size === 0 ||
    Array.from(state.tags).every((t) => d.tags.includes(t));
  return catOk && tagsOk;
}

function demoCard(d) {
  const wrap = document.createElement("article");
  wrap.className = "demo";

  const thumb = document.createElement("div");
  thumb.className = "demo__thumb";

  const body = document.createElement("div");
  body.className = "demo__body";

  const title = document.createElement("h3");
  title.className = "demo__title";
  title.textContent = d.title;

  const meta = document.createElement("div");
  meta.className = "demo__meta";

  const c = document.createElement("span");
  c.className = "badge2";
  c.textContent = d.category;
  meta.appendChild(c);

  d.tags.slice(0, 3).forEach((t) => {
    const b = document.createElement("span");
    b.className = "badge2";
    b.textContent = t;
    meta.appendChild(b);
  });

  const p = document.createElement("p");
  p.className = "muted";
  p.style.margin = "8px 0 0";
  p.style.lineHeight = "1.6";
  p.textContent = "Responsive card — hover for lift.";

  body.appendChild(title);
  body.appendChild(p);
  body.appendChild(meta);

  wrap.appendChild(thumb);
  wrap.appendChild(body);

  return wrap;
}

function render() {
  renderChips();

  grid.innerHTML = "";
  const items = DEMOS.filter(matches);

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "No results. Try removing some tags.";
    grid.appendChild(empty);
    return;
  }

  items.forEach((d) => grid.appendChild(demoCard(d)));
}

resetBtn.addEventListener("click", () => {
  state.category = "All";
  state.tags.clear();
  render();
});

render();

/* ---------------- Footer year ---------------- */
$("#year").textContent = String(new Date().getFullYear());

/* ---------------- Optional: global fade class ---------------- */
const style = document.createElement("style");
style.textContent = `
  body.soft-fade main.page { filter: blur(6px); opacity: .90; transition: .22s ease; }
  main.page { transition: .22s ease; }
`;
document.head.appendChild(style);
