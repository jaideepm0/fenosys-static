(() => {
  const root = document.documentElement;
  const motionReady = () => typeof window !== "undefined" && typeof window.gsap !== "undefined";
  const scrollTriggerReady = () => motionReady() && typeof window.ScrollTrigger !== "undefined";
  const pointerState = {
    media: typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(pointer:fine)") : null,
    idleTimer: null,
    initialized: false,
  };
  const motionState = {
    registered: false,
    routeContext: null,
  };

  function pointerOpacityPalette() {
    return (root.dataset.theme || "light") === "dark"
      ? { active: "0.34", idle: "0.18" }
      : { active: "0.28", idle: "0.16" };
  }

  function animatePointerVars(vars, config = {}) {
    if (motionReady()) {
      window.gsap.to(root, {
        ...vars,
        duration: config.duration ?? 0.5,
        ease: config.ease ?? "sine.out",
        overwrite: config.overwrite ?? "auto",
      });
    } else {
      Object.entries(vars).forEach(([prop, value]) => {
        root.style.setProperty(prop, value);
      });
    }
  }

  function syncPointerAmbient(options = {}) {
    const { idle } = pointerOpacityPalette();
    animatePointerVars({ "--pointer-opacity": idle }, options);
  }

  function clearPointerIdle() {
    if (pointerState.idleTimer) {
      window.clearTimeout(pointerState.idleTimer);
      pointerState.idleTimer = null;
    }
  }

  function schedulePointerIdle() {
    clearPointerIdle();
    pointerState.idleTimer = window.setTimeout(() => {
      pointerState.idleTimer = null;
      syncPointerAmbient();
    }, 1200);
  }

  function handlePointerMove(event) {
    const type = event.pointerType;
    const isFine = !type || type === "mouse" || type === "pen";
    if ((pointerState.media && !pointerState.media.matches) || !isFine) return;
    const x = `${((event.clientX / window.innerWidth) * 100).toFixed(2)}%`;
    const y = `${((event.clientY / window.innerHeight) * 100).toFixed(2)}%`;
    const { active } = pointerOpacityPalette();
    animatePointerVars(
      {
        "--pointer-x": x,
        "--pointer-y": y,
        "--pointer-opacity": active,
      },
      { duration: 0.45, ease: "sine.out" }
    );
    schedulePointerIdle();
  }

  function handlePointerExit() {
    if (pointerState.media && !pointerState.media.matches) return;
    clearPointerIdle();
    syncPointerAmbient();
  }

  function initPointerTracking() {
    if (pointerState.initialized) return;
    pointerState.initialized = true;
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerExit);
    window.addEventListener("pointercancel", handlePointerExit);
    window.addEventListener("blur", handlePointerExit);
    if (pointerState.media) {
      const mediaChange = (event) => {
        if (event.matches) {
          syncPointerAmbient({ duration: 0 });
        } else {
          animatePointerVars({ "--pointer-opacity": "0" }, { duration: 0.3, ease: "sine.inOut" });
        }
      };
      if (typeof pointerState.media.addEventListener === "function") {
        pointerState.media.addEventListener("change", mediaChange);
      } else if (typeof pointerState.media.addListener === "function") {
        pointerState.media.addListener(mediaChange);
      }
    }
    if (pointerState.media && !pointerState.media.matches) {
      animatePointerVars({ "--pointer-opacity": "0" }, { duration: 0 });
    } else {
      syncPointerAmbient({ duration: 0 });
    }
  }

  function registerMotionPlugins() {
    if (!motionReady() || motionState.registered) return;
    if (scrollTriggerReady()) {
      window.gsap.registerPlugin(window.ScrollTrigger);
    }
    motionState.registered = true;
  }

  function teardownRouteAnimations() {
    if (motionState.routeContext) {
      motionState.routeContext.revert();
      motionState.routeContext = null;
    }
    if (scrollTriggerReady()) {
      window.ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    }
  }

  function animateNavHighlight(activeLink) {
    if (!motionReady() || !activeLink) return;
    window.gsap.fromTo(
      activeLink,
      { y: -2, autoAlpha: 0.8 },
      { y: 0, autoAlpha: 1, duration: 0.3, ease: "power2.out", overwrite: "auto" }
    );
  }

  function animateRouteOut() {
    if (!motionReady() || !outlet || !outlet.children.length) return Promise.resolve();
    const items = Array.from(outlet.children);
    return new Promise((resolve) => {
      window.gsap.to(items, {
        autoAlpha: 0,
        y: -12,
        duration: 0.24,
        ease: "power1.out",
        stagger: 0.04,
        overwrite: "auto",
        onComplete: resolve,
      });
    });
  }

  function animateRouteIn() {
    if (!motionReady() || !outlet || !outlet.children.length) return;
    const items = Array.from(outlet.children);
    window.gsap.fromTo(
      items,
      { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.06, overwrite: "auto" }
    );
  }

  function setupRouteAnimations(scope = document) {
    if (!motionReady()) return;
    registerMotionPlugins();
    teardownRouteAnimations();
    motionState.routeContext = window.gsap.context(() => {
      const surfaces = window.gsap.utils.toArray(scope.querySelectorAll(".surface, .surface-soft"));
      surfaces.forEach((surface, index) => {
        const delay = Math.min(index * 0.04, 0.28);
        window.gsap.from(surface, {
          autoAlpha: 0,
          y: 28,
          scale: 0.985,
          duration: 0.8,
          ease: "power3.out",
          delay,
          scrollTrigger: scrollTriggerReady()
            ? {
                trigger: surface,
                start: "top 85%",
                toggleActions: "play none none reverse",
              }
            : undefined,
        });
      });

      const headings = window.gsap.utils.toArray(
        scope.querySelectorAll("h1, h2, h3, .eyebrow, [data-motion='headline']")
      );
      headings.forEach((heading) => {
        window.gsap.from(heading, {
          autoAlpha: 0,
          y: 18,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: scrollTriggerReady()
            ? {
                trigger: heading,
                start: "top 90%",
                toggleActions: "play none none reverse",
              }
            : undefined,
        });
      });

      const buttons = window.gsap.utils.toArray(scope.querySelectorAll(".accent-btn, .outline-btn, .theme-toggle"));
      buttons.forEach((button) => {
        window.gsap.from(button, {
          autoAlpha: 0,
          y: 16,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: scrollTriggerReady()
            ? {
                trigger: button,
                start: "top 92%",
                toggleActions: "play none none reverse",
              }
            : undefined,
        });
      });

      if (scrollTriggerReady()) {
        window.ScrollTrigger.refresh();
      }
    }, scope);
  }

  function attachSurfaceHoverAnimations(scope = document) {
    if (!motionReady()) return;
    const nodes = scope.querySelectorAll(".surface, .surface-soft");
    nodes.forEach((element) => {
      if (element.dataset.hoverBound === "true") return;
      element.dataset.hoverBound = "true";
      const baseShadow = window.getComputedStyle(element).boxShadow;
      element.dataset.hoverShadowBase = baseShadow;
      element.addEventListener("pointerenter", () => {
        if (pointerState.media && !pointerState.media.matches) return;
        const elevatedShadow =
          (root.dataset.theme || "light") === "dark"
            ? "0 26px 50px -34px rgba(8, 10, 30, 0.7)"
            : "0 22px 46px -34px rgba(148, 118, 255, 0.32)";
        window.gsap.to(element, {
          y: -4,
          boxShadow: elevatedShadow,
          duration: 0.45,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
      element.addEventListener("pointerleave", () => {
        window.gsap.to(element, {
          y: 0,
          boxShadow: element.dataset.hoverShadowBase || baseShadow,
          duration: 0.5,
          ease: "power3.out",
          overwrite: "auto",
        });
      });
    });
  }

  function postRouteRender() {
    animateRouteIn();
    if (outlet) attachSurfaceHoverAnimations(outlet);
    setupRouteAnimations(outlet || document);
  }

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
    root.dataset.theme = value;
    if (themeToggleLabel) themeToggleLabel.textContent = value === "dark" ? "Light mode" : "Dark mode";
    themeToggle?.setAttribute("aria-pressed", value === "dark" ? "true" : "false");
    syncPointerAmbient({ duration: 0.4, ease: "sine.inOut" });
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
    let activated = null;
    navLinks.forEach((link) => {
      const isActive = link.getAttribute("data-route-link") === route;
      if (link.classList.contains("nav-link")) {
        link.classList.toggle("nav-link-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "page");
          activated = link;
        } else {
          link.removeAttribute("aria-current");
        }
      } else {
        link.classList.remove("nav-link-active");
        link.removeAttribute("aria-current");
      }
    });
    if (activated) animateNavHighlight(activated);
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
    postRouteRender();
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
    if (motionReady()) teardownRouteAnimations();
    await animateRouteOut();
    try {
      const html = await fetchRoute(resource);
      render(html);
      postRouteRender();
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
    const current = root.dataset.theme || resolveTheme();
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
    initPointerTracking();
    registerMotionPlugins();
    attachSurfaceHoverAnimations(document);
    const yearEl = document.getElementById("copyright-year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
    if (!window.location.hash) window.location.replace(`#${DEFAULT_ROUTE}`);
    handleRouteChange();
    syncNavWithViewport();
    (window.requestIdleCallback || ((fn) => setTimeout(fn, 200)))(preloadRoutes);
  });
})();
