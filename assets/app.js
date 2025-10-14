const DEFAULT_ROUTE = "home";
const ROUTES = {
  home: "pages/home.html",
  capabilities: "pages/capabilities.html",
  workflow: "pages/workflow.html",
  insights: "pages/insights.html",
  faq: "pages/faq.html",
};

const outlet = document.getElementById("route-outlet");
const navLinks = Array.from(document.querySelectorAll("[data-route-link]"));
const navToggle = document.querySelector("[data-nav-toggle]");
const navDrawer = document.querySelector("[data-nav-drawer]");
const navInline = document.querySelector("[data-nav-links]");

const routeCache = new Map();

const markActiveLink = (route) => {
  navLinks.forEach((link) => {
    const linkRoute = link.getAttribute("data-route-link");
    if (!linkRoute) return;
    const isActive = linkRoute === route;
    link.classList.toggle("bg-fenosys-500/20", isActive);
    link.classList.toggle("text-white", isActive);
    link.classList.toggle("border", isActive);
    link.classList.toggle("border-fenosys-400/50", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
};

const loadRoute = async (route) => {
  const target = ROUTES[route] ? route : DEFAULT_ROUTE;
  const resource = ROUTES[target];
  if (!resource || !outlet) return;

  markActiveLink(target);

  if (routeCache.has(resource)) {
    outlet.innerHTML = routeCache.get(resource);
    return;
  }

  try {
    const response = await fetch(resource);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${resource}`);
    }
    const html = await response.text();
    routeCache.set(resource, html);
    outlet.innerHTML = html;
  } catch (error) {
    const advisory =
      window.location.protocol === "file:"
        ? "Run this site with a local web server (for example: python3 -m http.server --directory static 5173) so routed pages can load."
        : "Please refresh or try again in a moment.";
    outlet.innerHTML = `
      <div class="grid h-full place-items-center text-center">
        <div class="max-w-sm space-y-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-8 text-sm text-slate-200">
          <p class="font-semibold text-white">Something went wrong</p>
          <p class="text-slate-300">${error.message}</p>
          <p class="text-slate-400">${advisory}</p>
        </div>
      </div>
    `;
  }
};

const setNavState = (isOpen) => {
  if (!navDrawer) return;
  if (isOpen) {
    navDrawer.classList.remove("hidden");
  } else {
    navDrawer.classList.add("hidden");
  }
  navToggle?.setAttribute("aria-expanded", String(Boolean(isOpen)));
};

const closeNav = () => setNavState(false);

const navigate = (route) => {
  const target = ROUTES[route] ? route : DEFAULT_ROUTE;
  if (window.location.hash === `#${target}`) {
    loadRoute(target);
  } else {
    window.location.hash = `#${target}`;
  }
};

const handleRouteChange = () => {
  const route = window.location.hash.replace("#", "") || DEFAULT_ROUTE;
  loadRoute(route);
  closeNav();
};

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const route = link.getAttribute("data-route-link");
    if (!route) return;
    event.preventDefault();
    navigate(route);
    closeNav();
  });
});

navToggle?.addEventListener("click", () => {
  const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
  setNavState(!isExpanded);
});

window.addEventListener("hashchange", handleRouteChange);
window.addEventListener("load", handleRouteChange);

if (!window.location.hash) {
  history.replaceState({}, "", `#${DEFAULT_ROUTE}`);
}

const yearEl = document.getElementById("copyright-year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (navToggle) {
  navToggle.setAttribute("aria-expanded", "false");
}

if (window.matchMedia) {
  const mediaQuery = window.matchMedia("(min-width: 1024px)");
  const syncNav = (event) => {
    if (event.matches) {
      navDrawer?.classList.add("hidden");
      navInline?.classList.add("lg:flex");
      navInline?.classList.remove("hidden");
      navToggle?.setAttribute("aria-expanded", "false");
    } else {
      navInline?.classList.remove("lg:flex");
      navInline?.classList.add("hidden");
    }
  };
  syncNav(mediaQuery);
  mediaQuery.addEventListener("change", syncNav);
}
