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
    return Promise.resolve();
  }

  function animateRouteIn() {
    return;
  }

  function setupRouteAnimations(scope = document) {
    return;
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

  const markdownReady = () => typeof window !== "undefined" && typeof window.marked !== "undefined";
  const md = (value) => {
    if (!value) return "";
    if (!markdownReady()) return value;
    return window.marked.parse(value);
  };
  const mdInline = (value) => {
    if (!value) return "";
    if (!markdownReady()) return value;
    return window.marked.parseInline(value);
  };
  if (markdownReady() && typeof window.marked.setOptions === "function") {
    window.marked.setOptions({ mangle: false, headerIds: false });
  }

  const block = (value, className = "") => {
    if (!value) return "";
    const classes = ["markdown", className].filter(Boolean).join(" ");
    return `<div class="${classes}">${md(value)}</div>`;
  };

  const arrowIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12l-7.5 7.5M3 12h18" />
    </svg>
  `;

  const renderHero = (section = {}) => {
    const ctas = (section.ctas || [])
      .map((cta) => {
        const route = cta.route || (cta.href && cta.href.startsWith("#") ? cta.href.slice(1) : "");
        const routeAttr = route ? ` data-route-link="${route}"` : "";
        const variant = cta.variant === "outline" ? "outline-btn" : "accent-btn";
        const icon = cta.icon === "arrow" ? arrowIcon : "";
        return `
          <a href="${cta.href || "#"}"${routeAttr} class="${variant}">
            ${mdInline(cta.label)}
            ${icon}
          </a>
        `;
      })
      .join("");

    const stats = (section.stats || [])
      .map(
        (stat) => `
          <div class="space-y-1">
            <p class="text-sm uppercase tracking-[0.2em] muted">${mdInline(stat.label)}</p>
            <p class="text-2xl font-semibold">${mdInline(stat.value)}</p>
            <p class="muted text-sm">${mdInline(stat.body)}</p>
          </div>
        `
      )
      .join("");

    const features = (section.panel?.features || [])
      .map(
        (feature) => `
          <div class="surface-soft rounded-2xl p-5 space-y-2">
            <p class="font-semibold">${mdInline(feature.title)}</p>
            <p class="muted text-sm">${mdInline(feature.body)}</p>
          </div>
        `
      )
      .join("");

    return `
      <section class="grid gap-10 lg:grid-cols-[1.2fr,0.9fr] lg:gap-20">
        <div class="space-y-8">
          <div class="space-y-4">
            ${section.eyebrow ? `<p class="eyebrow">${mdInline(section.eyebrow)}</p>` : ""}
            ${
              section.title
                ? `<h1 class="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">${mdInline(section.title)}</h1>`
                : ""
            }
            ${section.lead ? `<div class="muted max-w-3xl text-base leading-relaxed markdown">${md(section.lead)}</div>` : ""}
          </div>

          ${ctas ? `<div class="flex flex-wrap gap-3">${ctas}</div>` : ""}

          ${stats ? `<div class="surface-soft grid gap-4 rounded-3xl p-6 md:grid-cols-3">${stats}</div>` : ""}
        </div>

        <div class="surface grid gap-5 rounded-3xl p-8">
          <div class="space-y-3">
            ${section.panel?.eyebrow ? `<p class="eyebrow">${mdInline(section.panel.eyebrow)}</p>` : ""}
            ${section.panel?.title ? `<h2 class="text-2xl font-semibold">${mdInline(section.panel.title)}</h2>` : ""}
            ${section.panel?.body ? `<div class="muted markdown">${md(section.panel.body)}</div>` : ""}
          </div>
          ${features ? `<div class="grid gap-4 sm:grid-cols-2">${features}</div>` : ""}
        </div>
      </section>
    `;
  };

  const renderStory = (section = {}) => {
    const playbookItems = (section.playbook?.items || [])
      .map(
        (item) =>
          `<li class="flex items-center justify-between"><span>${mdInline(item.label)}</span><span>${mdInline(
            item.status
          )}</span></li>`
      )
      .join("");

    return `
      <section class="glow-shell">
        <div class="surface rounded-[28px] p-8 sm:p-10 space-y-6">
          ${
            section.prompt
              ? `
            <div class="surface-soft rounded-2xl p-5 text-sm space-y-2">
              <p class="font-semibold">${mdInline(section.prompt.label)}</p>
              <p class="muted">${mdInline(section.prompt.body)}</p>
            </div>
          `
              : ""
          }

          ${
            section.response
              ? `
            <div class="surface-soft rounded-2xl p-6 space-y-3 text-sm">
              <p class="font-semibold">${mdInline(section.response.label)}</p>
              ${block(section.response.body, "muted")}
            </div>
          `
              : ""
          }

          ${
            section.playbook
              ? `
            <div class="surface-soft rounded-2xl p-5 text-xs space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-semibold uppercase tracking-[0.24em]">${mdInline(section.playbook.label)}</span>
                <span class="chip">${mdInline(section.playbook.status)}</span>
              </div>
              ${playbookItems ? `<ul class="muted space-y-1 text-sm">${playbookItems}</ul>` : ""}
            </div>
          `
              : ""
          }

          ${
            section.quote
              ? `
            <div class="surface-soft rounded-2xl p-6 text-sm space-y-3">
              <p class="font-semibold">${mdInline(section.quote.label)}</p>
              <blockquote class="muted italic">${mdInline(section.quote.body)}</blockquote>
            </div>
          `
              : ""
          }
        </div>
      </section>
    `;
  };

  const renderHeader = (section = {}) => `
    <header class="space-y-4 max-w-3xl">
      ${section.eyebrow ? `<p class="eyebrow">${mdInline(section.eyebrow)}</p>` : ""}
      ${section.title ? `<h2 class="text-3xl font-semibold leading-tight sm:text-4xl">${mdInline(section.title)}</h2>` : ""}
      ${section.body ? `<div class="muted markdown">${md(section.body)}</div>` : ""}
    </header>
  `;

  const renderSteps = (section = {}) => {
    const items = (section.items || [])
      .map(
        (item) => `
        <li class="surface space-y-3 rounded-3xl p-6">
          <div class="flex items-center justify-between">
            <span class="chip">${mdInline(item.step)}</span>
            <span class="chip uppercase tracking-[0.24em]">${mdInline(item.label)}</span>
          </div>
          <h3 class="text-lg font-semibold">${mdInline(item.title)}</h3>
          <p class="muted text-sm">${mdInline(item.body)}</p>
        </li>
      `
      )
      .join("");
    return `<ol class="grid gap-6 lg:grid-cols-2">${items}</ol>`;
  };

  const renderSplitList = (section = {}) => {
    const items = (section.items || [])
      .map(
        (item) => `
        <li class="surface-soft rounded-2xl p-5 space-y-2">
          <span class="font-semibold">${mdInline(item.title)}</span>
          <p class="muted">${mdInline(item.body)}</p>
        </li>
      `
      )
      .join("");

    return `
      <section class="surface grid gap-6 rounded-3xl p-10 lg:grid-cols-[1.1fr,0.9fr]">
        <div class="space-y-3">
          ${section.eyebrow ? `<p class="eyebrow">${mdInline(section.eyebrow)}</p>` : ""}
          ${section.title ? `<h3 class="text-2xl font-semibold">${mdInline(section.title)}</h3>` : ""}
          ${section.body ? `<div class="muted markdown">${md(section.body)}</div>` : ""}
        </div>
        ${items ? `<ul class="grid gap-4 text-sm">${items}</ul>` : ""}
      </section>
    `;
  };

  const renderFeatureCards = (section = {}) => {
    const items = (section.items || [])
      .map((item) => {
        const bullets = (item.bullets || [])
          .map((bullet) => `<li>&bull; ${mdInline(bullet)}</li>`)
          .join("");
        return `
        <article class="surface space-y-4 rounded-3xl p-6">
          <div class="flex items-center gap-3">
            <span class="chip">${mdInline(item.chip)}</span>
            <span class="font-semibold">${mdInline(item.title)}</span>
          </div>
          <p class="muted text-sm">${mdInline(item.body)}</p>
          ${bullets ? `<ul class="muted space-y-1 text-sm">${bullets}</ul>` : ""}
        </article>
      `;
      })
      .join("");
    return `<section class="grid gap-6 lg:grid-cols-3">${items}</section>`;
  };

  const renderFaqGrid = (section = {}) => {
    const items = (section.items || [])
      .map(
        (item) => `
        <article class="surface space-y-3 rounded-3xl p-6">
          <h3 class="text-lg font-semibold">${mdInline(item.title)}</h3>
          <p class="muted text-sm">${mdInline(item.body)}</p>
        </article>
      `
      )
      .join("");
    return `<div class="grid gap-6 lg:grid-cols-3">${items}</div>`;
  };

  const renderCtaCard = (section = {}) => `
    <div class="surface space-y-3 rounded-3xl p-8">
      ${section.eyebrow ? `<p class="eyebrow">${mdInline(section.eyebrow)}</p>` : ""}
      ${section.title ? `<h3 class="text-2xl font-semibold">${mdInline(section.title)}</h3>` : ""}
      ${section.body ? `<div class="muted markdown">${md(section.body)}</div>` : ""}
    </div>
  `;

  const renderMetricsGrid = (section = {}) => {
    const primary = section.primary || {};
    const secondary = section.secondary || {};
    const stats = (primary.stats || [])
      .map(
        (stat) => `
        <div>
          <dt class="muted text-xs uppercase tracking-[0.2em]">${mdInline(stat.label)}</dt>
          <dd class="mt-2 text-2xl font-semibold">${mdInline(stat.value)}</dd>
        </div>
      `
      )
      .join("");
    const primaryNote =
      primary.noteTitle || primary.noteBody
        ? `
      <div class="surface-soft rounded-2xl p-6 text-sm">
        ${primary.noteTitle ? `<p class="font-semibold">${mdInline(primary.noteTitle)}</p>` : ""}
        ${primary.noteBody ? block(primary.noteBody, "muted mt-2") : ""}
      </div>
    `
        : "";
    const statusItems = (secondary.items || [])
      .map(
        (item) => `
        <li class="surface-soft rounded-2xl px-4 py-3 flex items-center justify-between">
          <span class="muted">${mdInline(item.label)}</span><span class="font-semibold text-[var(--accent-mid)]">${mdInline(
            item.value
          )}</span>
        </li>
      `
      )
      .join("");

    return `
      <div class="grid gap-6 lg:grid-cols-[1.35fr,0.75fr]">
        <article class="surface space-y-6 rounded-3xl p-6">
          <div class="flex items-center justify-between text-xs uppercase tracking-[0.24em]">
            <span class="muted">${mdInline(primary.label)}</span>
            <span class="chip">${mdInline(primary.badge)}</span>
          </div>
          ${primary.body ? `<div class="muted markdown text-sm">${md(primary.body)}</div>` : ""}
          ${stats ? `<dl class="surface-soft grid gap-4 rounded-2xl p-6 text-sm sm:grid-cols-3">${stats}</dl>` : ""}
          ${primaryNote}
        </article>

        <article class="surface space-y-5 rounded-3xl p-6">
          <div class="flex items-center justify-between text-xs uppercase tracking-[0.24em]">
            <span class="muted">${mdInline(secondary.label)}</span>
            <span class="chip">${mdInline(secondary.badge)}</span>
          </div>
          ${secondary.body ? `<div class="muted markdown text-sm">${md(secondary.body)}</div>` : ""}
          ${statusItems ? `<ul class="space-y-3 text-sm">${statusItems}</ul>` : ""}
          ${
            secondary.note
              ? `<p class="surface-soft rounded-2xl p-5 text-xs text-[var(--fg-muted)]">${mdInline(secondary.note)}</p>`
              : ""
          }
        </article>
      </div>
    `;
  };

  const renderSection = (section = {}) => {
    switch (section.type) {
      case "hero":
        return renderHero(section);
      case "story":
        return renderStory(section);
      case "header":
        return renderHeader(section);
      case "steps":
        return renderSteps(section);
      case "split-list":
        return renderSplitList(section);
      case "feature-cards":
        return renderFeatureCards(section);
      case "faq-grid":
        return renderFaqGrid(section);
      case "cta-card":
        return renderCtaCard(section);
      case "metrics-grid":
        return renderMetricsGrid(section);
      default:
        return "";
    }
  };

  const DEFAULT_ROUTE = "home";
  const ROUTES = {
    home: "data/home.json",
    capabilities: "data/capabilities.json",
    workflow: "data/workflow.json",
    insights: "data/insights.json",
    faq: "data/faq.json",
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

  const updateMeta = (meta = {}) => {
    if (meta.title) document.title = meta.title;
    if (meta.description) {
      const descriptionTag = document.querySelector('meta[name="description"]');
      if (descriptionTag) descriptionTag.setAttribute("content", meta.description);
    }
  };

  const renderRoute = (data) => {
    if (!data || !Array.isArray(data.sections)) {
      renderError("Invalid content payload");
      return;
    }
    updateMeta(data.meta || {});
    const content = data.sections.map(renderSection).join("");
    render(`<div class="space-y-16">${content}</div>`);
    postRouteRender();
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

  const parseRoutePayload = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json") && !response.url.endsWith(".json")) {
      throw new Error("Expected JSON content");
    }
    const data = await response.json();
    if (!data || typeof data !== "object") throw new Error("Invalid content payload");
    return data;
  };

  const fetchRoute = async (resource) => {
    if (routeCache.has(resource)) return routeCache.get(resource);
    const response = await fetch(resource, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Failed to fetch ${resource}`);
    const data = await parseRoutePayload(response);
    routeCache.set(resource, data);
    return data;
  };

  const loadRoute = async (route) => {
    const target = ROUTES[route] ? route : DEFAULT_ROUTE;
    const resource = ROUTES[target];
    highlightNav(target);
    if (motionReady()) teardownRouteAnimations();
    await animateRouteOut();
    try {
      const data = await fetchRoute(resource);
      renderRoute(data);
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
        .then((response) => (response.ok ? parseRoutePayload(response) : Promise.reject()))
        .then((data) => routeCache.set(resource, data))
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
