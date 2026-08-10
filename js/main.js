(() => {
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");
  const resumeButtons = Array.from(document.querySelectorAll(".js-resume"));
  const resumeNote = document.getElementById("resume-note");

  // Remove tracking params (utm_*, gclid, fbclid, etc.) from the visible URL
  const cleanTrackingParams = () => {
    try {
      const url = new URL(window.location.href);
      const removable = [];
      url.searchParams.forEach((_, key) => {
        const lower = key.toLowerCase();
        if (
          lower.startsWith("utm_") ||
          lower === "gclid" ||
          lower === "fbclid" ||
          lower === "mc_cid" ||
          lower === "mc_eid" ||
          lower === "ref"
        ) {
          removable.push(key);
        }
      });
      if (!removable.length) return;
      removable.forEach((key) => url.searchParams.delete(key));
      const clean =
        url.pathname +
        (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "") +
        url.hash;
      window.history.replaceState({}, document.title, clean);
    } catch {
      // Ignore URL API failures in older environments
    }
  };

  cleanTrackingParams();

  const setNavLabel = (expanded) => {
    if (!navToggle) return;
    navToggle.setAttribute(
      "aria-label",
      expanded ? "Close navigation menu" : "Open navigation menu"
    );
  };

  const closeNav = () => {
    if (!navToggle || !navLinks) return;
    const wasOpen = navToggle.getAttribute("aria-expanded") === "true";
    navLinks.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    setNavLabel(false);
    document.body.classList.remove("nav-open");
    if (wasOpen) navToggle.focus();
  };

  const openNav = () => {
    if (!navToggle || !navLinks) return;
    navLinks.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    setNavLabel(true);
    document.body.classList.add("nav-open");
    const firstLink = navLinks.querySelector("a");
    if (firstLink) firstLink.focus();
  };

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      if (expanded) closeNav();
      else openNav();
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNav();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) closeNav();
    });
  }

  const sectionIds = [
    "home",
    "about",
    "skills",
    "experience",
    "projects",
    "data-engineering",
    "certifications",
    "contact",
  ];

  const navAnchors = Array.from(document.querySelectorAll(".nav-links a"));

  const setActiveNav = () => {
    const offset = 100;
    let current = "home";

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      if (top - offset <= 0) current = id;
    }

    navAnchors.forEach((anchor) => {
      const href = anchor.getAttribute("href") || "";
      const match = href === `#${current}`;
      if (match) anchor.setAttribute("aria-current", "true");
      else anchor.removeAttribute("aria-current");
    });
  };

  window.addEventListener("scroll", setActiveNav, { passive: true });
  setActiveNav();

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = document.querySelectorAll(".reveal");

  if (reduceMotion) {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  } else if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealItems.forEach((el) => observer.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  }

  const showToast = (message) => {
    let toast = document.getElementById("action-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "action-toast";
      toast.className = "action-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 3200);
  };

  const copyText = async (value) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {
      // fall through
    }
    try {
      const input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(input);
      return ok;
    } catch {
      return false;
    }
  };

  // Reliable email open: simplified mailto + explicit navigation
  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href) return;
      event.preventDefault();
      window.location.href = href;
      window.setTimeout(() => {
        showToast("If email did not open, write to rohitchouhan.analyst@gmail.com");
      }, 700);
    });
  });

  // Call links: try tel:, and always offer a copy fallback on desktop
  document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
    link.addEventListener("click", async (event) => {
      const href = link.getAttribute("href") || "";
      const phone = href.replace(/^tel:/i, "").trim();
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

      if (!isMobile) {
        event.preventDefault();
        const copied = await copyText(phone);
        showToast(
          copied
            ? `Phone copied: ${phone}`
            : `Call ${phone} (phone dialer unavailable on this device)`
        );
        return;
      }

      // Mobile: allow native dialer; still confirm in UI
      window.setTimeout(() => {
        showToast(`Calling ${phone}`);
      }, 200);
    });
  });

  const preventResumeClick = (event) => {
    event.preventDefault();
    showToast("Add assets/resume.pdf to enable download");
  };

  const markResumeMissing = () => {
    resumeButtons.forEach((btn) => {
      btn.classList.add("is-disabled");
      btn.setAttribute("aria-disabled", "true");
      btn.setAttribute("title", "Add assets/resume.pdf to enable download");
      btn.removeAttribute("download");
      btn.addEventListener("click", preventResumeClick);
    });
    if (resumeNote) resumeNote.hidden = false;
  };

  const enableResume = () => {
    resumeButtons.forEach((btn) => {
      btn.classList.remove("is-disabled");
      btn.removeAttribute("aria-disabled");
      btn.removeAttribute("title");
      btn.setAttribute("download", "");
      btn.removeEventListener("click", preventResumeClick);
    });
    if (resumeNote) resumeNote.hidden = true;
  };

  const checkResume = async () => {
    if (!resumeButtons.length) return;
    try {
      const response = await fetch("assets/resume.pdf", {
        method: "HEAD",
        cache: "no-store",
      });
      if (response.ok) enableResume();
      else markResumeMissing();
    } catch {
      markResumeMissing();
    }
  };

  checkResume();
})();
