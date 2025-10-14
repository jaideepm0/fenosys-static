const DEFAULT_ROUTE = "home";

const panels = Array.from(document.querySelectorAll("[data-route]"));
const navLinks = Array.from(document.querySelectorAll("[data-route-link]"));
const navToggle = document.querySelector(".nav__toggle");
const navLinksContainer = document.querySelector(".nav__links");

const setActiveRoute = (targetRoute) => {
  const route = targetRoute && panels.some((panel) => panel.dataset.route === targetRoute)
    ? targetRoute
    : DEFAULT_ROUTE;

  panels.forEach((panel) => {
    const isActive = panel.dataset.route === route;
    panel.toggleAttribute("hidden", !isActive);
  });

  navLinks.forEach((link) => {
    const linkRoute = link.getAttribute("data-route-link");
    if (!linkRoute) return;
    link.classList.toggle("is-active", linkRoute === route);
  });

  if (window.location.hash !== `#${route}`) {
    history.replaceState({}, "", `#${route}`);
  }
};

const handleRouteChange = () => {
  const route = window.location.hash.replace("#", "") || DEFAULT_ROUTE;
  setActiveRoute(route);
  if (window.innerWidth <= 780 && navLinksContainer?.classList.contains("is-open")) {
    navLinksContainer.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  }
};

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const route = link.getAttribute("data-route-link");
    if (!route) return;
    setActiveRoute(route);

    if (navLinksContainer?.classList.contains("is-open")) {
      navLinksContainer.classList.remove("is-open");
      navToggle?.setAttribute("aria-expanded", "false");
    }

    if (window.innerWidth <= 780) {
      event.preventDefault();
      history.pushState({}, "", `#${route}`);
    }
  });
});

navToggle?.addEventListener("click", () => {
  const isOpen = navLinksContainer?.classList.toggle("is-open");
  if (typeof isOpen === "boolean") {
    navToggle.setAttribute("aria-expanded", String(isOpen));
  }
});

window.addEventListener("hashchange", handleRouteChange);
window.addEventListener("load", handleRouteChange);

const yearEl = document.getElementById("copyright-year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (navToggle) {
  navToggle.setAttribute("aria-expanded", "false");
}

handleRouteChange();
