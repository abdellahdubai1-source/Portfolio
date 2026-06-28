/* =====================================================================
   ABDELLAH TEHA — PORTFOLIO SCRIPT
   Vanilla JS only. Progressively enhances the markup in index.html;
   every feature degrades gracefully if a browser API is unsupported.
   Structure: Setup → Mobile Nav → Smooth Scroll → Scroll Effects →
   Active Nav Link → Reveal Animations → Counters → FAQ → Contact
   Form → Back to Top → Init.
   ===================================================================== */
(function () {
  "use strict";

  /* ===================================================================
     0. SETUP
     =================================================================== */

  // Enable JS-dependent styling (scroll reveals, etc.) now that the
  // script has actually loaded and run.
  document.body.classList.remove("no-js");

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function getCssVar(name, fallback) {
    try {
      var value = getComputedStyle(document.documentElement).getPropertyValue(name);
      return value && value.trim() ? value.trim() : fallback;
    } catch (err) {
      return fallback;
    }
  }

  var header = document.querySelector(".site-header");
  var navToggle = document.getElementById("navToggle");
  var navCollapse = document.getElementById("navMenu");


  /* ===================================================================
     1. MOBILE NAVIGATION
     =================================================================== */

  function openMobileMenu() {
    if (!navToggle) return;
    navToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeMobileMenu() {
    if (!navToggle) return;
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  if (navToggle && navCollapse) {
    navToggle.addEventListener("click", function () {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    // Close the menu whenever a link inside it is clicked.
    navCollapse.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMobileMenu);
    });

    // Close on Escape, returning focus to the toggle button.
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        closeMobileMenu();
        navToggle.focus();
      }
    });

    // Close on outside click.
    document.addEventListener("click", function (event) {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      if (!isOpen) return;
      var clickedInside = navCollapse.contains(event.target) || navToggle.contains(event.target);
      if (!clickedInside) {
        closeMobileMenu();
      }
    });

    // Reset state if the viewport grows into the desktop layout.
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024) {
        closeMobileMenu();
      }
    });
  }


  /* ===================================================================
     2. SMOOTH SCROLLING FOR INTERNAL LINKS
     =================================================================== */

  function focusTarget(targetEl) {
    var hadTabIndex = targetEl.hasAttribute("tabindex");
    if (!hadTabIndex) {
      targetEl.setAttribute("tabindex", "-1");
    }
    targetEl.focus({ preventScroll: true });
    if (!hadTabIndex) {
      targetEl.addEventListener(
        "blur",
        function handleBlur() {
          targetEl.removeAttribute("tabindex");
          targetEl.removeEventListener("blur", handleBlur);
        },
        { once: true }
      );
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    // Let the skip link jump instantly — speed matters more than easing there.
    if (link.classList.contains("skip-link")) return;

    link.addEventListener("click", function (event) {
      var href = link.getAttribute("href");

      if (!href || href === "#") {
        event.preventDefault();
        return;
      }

      // Links that open elsewhere (e.g. placeholder demo/GitHub buttons).
      if (link.hasAttribute("target")) return;

      var targetEl;
      try {
        targetEl = document.querySelector(href);
      } catch (err) {
        targetEl = null;
      }
      if (!targetEl) return;

      event.preventDefault();
      targetEl.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });

      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", href);
      }

      focusTarget(targetEl);
    });
  });


  /* ===================================================================
     3. SCROLL EFFECTS — sticky header state + back-to-top visibility
     =================================================================== */

  var scrollTicking = false;
  var headerScrolled = false;

  function updateHeaderState() {
    if (!header) return;
    var shouldBeScrolled = window.scrollY > 12;
    if (shouldBeScrolled !== headerScrolled) {
      headerScrolled = shouldBeScrolled;
      header.classList.toggle("site-header--scrolled", headerScrolled);
      header.style.boxShadow = headerScrolled ? "0 12px 32px rgba(0, 0, 0, 0.35)" : "";
    }
  }

  function onScroll() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(function () {
      updateHeaderState();
      updateBackToTopVisibility();
      scrollTicking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });


  /* ===================================================================
     4. ACTIVE NAV LINK WHILE SCROLLING
     =================================================================== */

  var sectionIds = ["home", "about", "services", "featured-project", "portfolio", "contact"];
  var navLinks = document.querySelectorAll(".nav__link");

  function setActiveLink(id) {
    navLinks.forEach(function (link) {
      if (link.getAttribute("href") === "#" + id) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  if ("IntersectionObserver" in window && navLinks.length) {
    var trackedSections = sectionIds
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);

    if (trackedSections.length) {
      var headerOffset = header ? header.offsetHeight : 76;
      var sectionObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              setActiveLink(entry.target.id);
            }
          });
        },
        { root: null, rootMargin: "-" + (headerOffset + 1) + "px 0px -70% 0px", threshold: 0 }
      );
      trackedSections.forEach(function (section) {
        sectionObserver.observe(section);
      });
    }
  }


  /* ===================================================================
     5. REVEAL ANIMATIONS FOR [data-animate]
     =================================================================== */

  var animatedEls = document.querySelectorAll("[data-animate]");

  if ("IntersectionObserver" in window && animatedEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    animatedEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // No IntersectionObserver support — show everything immediately.
    animatedEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }


  /* ===================================================================
     6. COUNTER ANIMATION FOR [data-counter]
     =================================================================== */

  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-target"));
    if (isNaN(target)) return;

    var originalText = el.textContent.trim();
    var suffixMatch = originalText.match(/[^\d.\-]+$/);
    var suffix = suffixMatch ? suffixMatch[0] : "";

    if (prefersReducedMotion()) {
      el.textContent = target + suffix;
      return;
    }

    var duration = 1200;
    var startTime = null;

    function tick(now) {
      if (startTime === null) startTime = now;
      var progress = Math.min((now - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(eased * target);
      el.textContent = current + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else {
        el.textContent = target + suffix;
      }
    }

    window.requestAnimationFrame(tick);
  }

  var counterEls = document.querySelectorAll("[data-counter]");

  if ("IntersectionObserver" in window && counterEls.length) {
    var counterObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counterEls.forEach(function (el) {
      counterObserver.observe(el);
    });
  } else {
    counterEls.forEach(animateCounter);
  }


  /* ===================================================================
     7. FAQ — smooth open/close for native <details>
     =================================================================== */

  var supportsWebAnimations = typeof Element.prototype.animate === "function";

  function openFaqItem(item, answer) {
    item.setAttribute("open", "");
    var endHeight = answer.scrollHeight;
    answer.style.overflow = "hidden";
    var animation = answer.animate(
      [{ height: "0px", opacity: 0 }, { height: endHeight + "px", opacity: 1 }],
      { duration: 220, easing: "ease-out" }
    );
    animation.onfinish = function () {
      answer.style.overflow = "";
      answer.style.height = "";
    };
  }

  function closeFaqItem(item, answer) {
    var startHeight = answer.scrollHeight;
    answer.style.overflow = "hidden";
    var animation = answer.animate(
      [{ height: startHeight + "px", opacity: 1 }, { height: "0px", opacity: 0 }],
      { duration: 200, easing: "ease-in" }
    );
    animation.onfinish = function () {
      item.removeAttribute("open");
      answer.style.overflow = "";
      answer.style.height = "";
    };
  }

  if (supportsWebAnimations && !prefersReducedMotion()) {
    document.querySelectorAll(".faq-item").forEach(function (item) {
      var summary = item.querySelector(".faq-item__question");
      var answer = item.querySelector(".faq-item__answer");
      if (!summary || !answer) return;

      summary.addEventListener("click", function (event) {
        event.preventDefault();
        answer.getAnimations().forEach(function (animation) {
          animation.cancel();
        });
        if (item.hasAttribute("open")) {
          closeFaqItem(item, answer);
        } else {
          openFaqItem(item, answer);
        }
      });
    });
  }
  // Otherwise: native <details>/<summary> behavior is left untouched —
  // it is already fully accessible and works with no JS at all.


  /* ===================================================================
     8. CONTACT FORM — basic client-side validation
     =================================================================== */

  var contactForm = document.querySelector(".contact__form");

  function clearFieldError(fieldEl) {
    fieldEl.removeAttribute("aria-invalid");
    fieldEl.removeAttribute("aria-describedby");
    var errorEl = document.getElementById(fieldEl.id + "-error");
    if (errorEl) errorEl.remove();
  }

  function showFieldError(fieldEl, message) {
    fieldEl.setAttribute("aria-invalid", "true");
    var errorId = fieldEl.id + "-error";
    fieldEl.setAttribute("aria-describedby", errorId);

    var errorEl = document.getElementById(errorId);
    if (!errorEl) {
      errorEl = document.createElement("p");
      errorEl.id = errorId;
      errorEl.setAttribute("role", "alert");
      errorEl.style.color = "#e0245e";
      errorEl.style.fontSize = "0.8125rem";
      errorEl.style.marginTop = "0.4rem";
      fieldEl.insertAdjacentElement("afterend", errorEl);
    }
    errorEl.textContent = message;
  }

  var successTimeoutId = null;

  function showFormSuccess(formEl) {
    var successEl = formEl.querySelector(".form-success-message");
    if (!successEl) {
      successEl = document.createElement("p");
      successEl.className = "form-success-message";
      successEl.setAttribute("role", "status");
      successEl.style.marginTop = "1rem";
      successEl.style.fontSize = "0.9375rem";
      successEl.style.fontWeight = "600";
      successEl.style.color = "#1fae6b";
      formEl.appendChild(successEl);
    }
    successEl.textContent =
      "Thanks! Your message has been received \u2014 I'll get back to you within a few hours.";

    window.clearTimeout(successTimeoutId);
    successTimeoutId = window.setTimeout(function () {
      if (successEl && successEl.parentNode) successEl.remove();
    }, 6000);
  }

  if (contactForm) {
    var nameField = contactForm.querySelector("#contactName");
    var emailField = contactForm.querySelector("#contactEmail");
    var messageField = contactForm.querySelector("#contactMessage");
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var fields = [
        { el: nameField, isValid: function (v) { return v.trim().length > 1; }, message: "Please enter your full name." },
        { el: emailField, isValid: function (v) { return emailPattern.test(v.trim()); }, message: "Please enter a valid email address." },
        { el: messageField, isValid: function (v) { return v.trim().length > 9; }, message: "Please add a short message (10+ characters)." },
      ];

      var isFormValid = true;

      fields.forEach(function (field) {
        if (!field.el) return;
        clearFieldError(field.el);
        if (!field.isValid(field.el.value || "")) {
          isFormValid = false;
          showFieldError(field.el, field.message);
        }
      });

      if (!isFormValid) {
        var firstInvalid = contactForm.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      showFormSuccess(contactForm);
      contactForm.reset();
    });
  }


  /* ===================================================================
     9. BACK TO TOP BUTTON (created dynamically, styled from CSS tokens)
     =================================================================== */

  function createBackToTopButton() {
    var button = document.createElement("button");
    button.type = "button";
    button.id = "backToTop";
    button.setAttribute("aria-label", "Back to top");
    button.textContent = "\u2191";

    var accent = getCssVar("--color-accent", "#6c5ce7");
    var accent2 = getCssVar("--color-accent-2", "#36c2ff");

    Object.assign(button.style, {
      position: "fixed",
      right: "20px",
      bottom: "20px",
      width: "48px",
      height: "48px",
      borderRadius: "50%",
      border: "none",
      background: "linear-gradient(135deg, " + accent + ", " + accent2 + ")",
      color: "#ffffff",
      fontSize: "1.25rem",
      lineHeight: "1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      boxShadow: "0 14px 30px rgba(108, 92, 231, 0.4)",
      opacity: "0",
      visibility: "hidden",
      transform: "translateY(12px)",
      transition: "opacity .3s ease, transform .3s ease, visibility .3s ease",
      zIndex: "95",
    });

    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      var brandLink = document.querySelector(".site-header .nav__brand");
      if (brandLink) brandLink.focus();
    });

    document.body.appendChild(button);
    return button;
  }

  var backToTopButton = createBackToTopButton();

  function updateBackToTopVisibility() {
    if (!backToTopButton) return;
    var shouldShow = window.scrollY > 480;
    backToTopButton.style.opacity = shouldShow ? "1" : "0";
    backToTopButton.style.visibility = shouldShow ? "visible" : "hidden";
    backToTopButton.style.transform = shouldShow ? "translateY(0)" : "translateY(12px)";
  }


  /* ===================================================================
     10. INIT — set correct initial state on load
     =================================================================== */

  onScroll();
})();
