(() => {
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
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const themeToggleLabel = themeToggle?.querySelector("span");

  const storageKey = "preferred-theme";
  const routeCache = new Map();

  const applyTheme = (theme) => {
    const value = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = value;
    if (themeToggleLabel) themeToggleLabel.textContent = value === "dark" ? "Light mode" : "Dark mode";
    themeToggle?.setAttribute("aria-pressed", value === "dark" ? "true" : "false");
  };

  const resolveTheme = () => {
    const stored = localStorage.getItem(storageKey);
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const setTheme = (theme) => {
    applyTheme(theme);
    localStorage.setItem(storageKey, theme);
  };

  const highlightNav = (route) => {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute("data-route-link") === route;
      if (link.classList.contains("nav-link")) {
        link.classList.toggle("nav-link-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      } else {
        link.classList.remove("nav-link-active");
        link.removeAttribute("aria-current");
      }
    });
  };

  const render = (html) => {
    if (outlet) outlet.innerHTML = html;
  };

  const renderError = (message) => {
    render(`
      <div class="flex h-full items-center justify-center">
        <div class="surface-soft max-w-sm space-y-3 rounded-2xl p-6 text-sm">
          <p class="font-semibold">Something went wrong</p>
          <p class="muted">${message}</p>
        </div>
      </div>
    `);
  };

  const fetchRoute = async (resource) => {
    if (routeCache.has(resource)) return routeCache.get(resource);
    const response = await fetch(resource, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Failed to fetch ${resource}`);
    const html = await response.text();
    routeCache.set(resource, html);
    return html;
  };

  const loadRoute = async (route) => {
    const target = ROUTES[route] ? route : DEFAULT_ROUTE;
    const resource = ROUTES[target];
    highlightNav(target);
    try {
      const html = await fetchRoute(resource);
      render(html);
    } catch (error) {
      renderError(error.message ?? "Unable to load content");
    }
  };

  const handleNavLink = (event, route) => {
    event.preventDefault();
    if (!route) return;
    if (window.location.hash === `#${route}`) {
      loadRoute(route);
    } else {
      window.location.hash = `#${route}`;
    }
  };

  navLinks.forEach((link) => {
    const route = link.getAttribute("data-route-link");
    link.addEventListener("click", (event) => handleNavLink(event, route));
  });

  navToggle?.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    navDrawer?.classList.toggle("hidden", expanded);
  });

  const handleRouteChange = () => {
    const route = window.location.hash.replace("#", "") || DEFAULT_ROUTE;
    loadRoute(route);
    if (navDrawer && !navDrawer.classList.contains("hidden")) {
      navDrawer.classList.add("hidden");
      navToggle?.setAttribute("aria-expanded", "false");
    }
  };

  window.addEventListener("hashchange", handleRouteChange);

  themeToggle?.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || resolveTheme();
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
  });

  const systemQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  if (systemQuery) {
    const syncSystemPreference = (event) => {
      const stored = localStorage.getItem(storageKey);
      if (!stored) applyTheme(event.matches ? "dark" : "light");
    };
    if (typeof systemQuery.addEventListener === "function") {
      systemQuery.addEventListener("change", syncSystemPreference);
    } else if (typeof systemQuery.addListener === "function") {
      systemQuery.addListener(syncSystemPreference);
    }
  }

  const preloadRoutes = () => {
    Object.entries(ROUTES).forEach(([route, resource]) => {
      if (route === DEFAULT_ROUTE || routeCache.has(resource)) return;
      fetch(resource, { cache: "no-cache" })
        .then((response) => (response.ok ? response.text() : Promise.reject()))
        .then((html) => routeCache.set(resource, html))
        .catch(() => {});
    });
  };

  const syncNavWithViewport = () => {
    if (!navInline || !navDrawer) return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const update = (event) => {
      if (event.matches) {
        navDrawer.classList.add("hidden");
        navToggle?.setAttribute("aria-expanded", "false");
      }
    };
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(update);
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(resolveTheme());
    const yearEl = document.getElementById("copyright-year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
    if (!window.location.hash) window.location.replace(`#${DEFAULT_ROUTE}`);
    handleRouteChange();
    syncNavWithViewport();
    (window.requestIdleCallback || ((fn) => setTimeout(fn, 200)))(preloadRoutes);
  });
})();
