/* Project Watershed — site behavior */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile nav ---------- */
  function initNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-nav]");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.setAttribute("data-open", String(!open));
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        nav.setAttribute("data-open", "false");
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Hero: document scramble → resolve → grade stamp ---------- */
  var SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%$&";

  function scrambleLine(el, finalText, duration, onDone) {
    var frame = 0;
    var totalFrames = Math.round(duration / 40);
    var resolveFrom = Math.round(totalFrames * 0.55);

    var interval = setInterval(function () {
      frame++;
      var progress = frame / totalFrames;
      var lockedCount = frame < resolveFrom ? 0 : Math.floor(finalText.length * ((frame - resolveFrom) / (totalFrames - resolveFrom)));
      var out = "";
      for (var i = 0; i < finalText.length; i++) {
        if (finalText[i] === " ") { out += " "; continue; }
        if (i < lockedCount || frame >= totalFrames) {
          out += finalText[i];
        } else {
          out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
      }
      el.textContent = out;

      if (frame >= totalFrames) {
        clearInterval(interval);
        el.textContent = finalText;
        if (onDone) onDone();
      }
    }, 40);
  }

  function initHeroDoc() {
    var doc = document.querySelector("[data-hero-doc]");
    if (!doc) return;

    var lines = doc.querySelectorAll("[data-scramble]");
    var stampWrap = doc.querySelector("[data-hero-stamp]");

    function resolveAll() {
      lines.forEach(function (el) {
        el.textContent = el.getAttribute("data-scramble");
      });
      if (stampWrap) stampWrap.classList.add("is-visible");
    }

    if (prefersReducedMotion) {
      resolveAll();
      return;
    }

    var played = false;
    function play() {
      if (played) return;
      played = true;
      lines.forEach(function (el, i) {
        var text = el.getAttribute("data-scramble");
        setTimeout(function () {
          scrambleLine(el, text, 650);
        }, i * 220);
      });
      var totalDelay = lines.length * 220 + 650;
      setTimeout(function () {
        if (stampWrap) stampWrap.classList.add("is-visible");
      }, totalDelay + 150);
    }

    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              play();
              obs.disconnect();
            }
          });
        },
        { threshold: 0.3 }
      );
      obs.observe(doc);
    } else {
      play();
    }
  }

  /* ---------- Forms: placeholder submit handlers ---------- */
  // TODO: replace submitToPlaceholder with a real API call once the
  // Project Watershed backend / ESP integration exists.
  function submitToPlaceholder(formEl, data) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        console.log("[Project Watershed] placeholder submission", formEl, data);
        resolve({ ok: true });
      }, 500);
    });
  }

  function initForms() {
    document.querySelectorAll("[data-signup-form], [data-interest-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var button = form.querySelector("button[type='submit']");
        var successEl = form.querySelector("[data-form-success]");
        var formData = {};
        new FormData(form).forEach(function (value, key) { formData[key] = value; });

        if (button) {
          if (!button.getAttribute("data-original-label")) {
            button.setAttribute("data-original-label", button.textContent);
          }
          button.disabled = true;
          button.textContent = "Sending…";
        }

        submitToPlaceholder(form, formData).then(function () {
          form.reset();
          if (button) {
            button.disabled = false;
            button.textContent = button.getAttribute("data-original-label");
          }
          if (successEl) {
            successEl.hidden = false;
          }
        });
      });
    });
  }

  /* ---------- Pip: corner fun-fact widget ---------- */
  var PIP_IMAGES = {
    leak: "assets/pip/pip-leak.png",
    thumbsup: "assets/pip/pip-thumbsup.png",
    sad: "assets/pip/pip-sad.png",
    clipboard: "assets/pip/pip-clipboard.png"
  };

  var PIP_FACTS = [
    { pose: "leak", text: "America loses about 2.1 trillion gallons of treated water to leaks every year." },
    { pose: "sad", text: "Small utilities average water losses above 20% of total supply. Some lose 40%." },
    { pose: "clipboard", text: "87% of water loss comes from physical leaks, ones that can actually be found and fixed." },
    { pose: "clipboard", text: "Utilities already file water audit reports every year. They're just buried in inconsistent PDFs nobody reads." },
    { pose: "thumbsup", text: "One Wisconsin utility cut its water loss from 36% to 9%, for just $3,000 in repairs." },
    { pose: "sad", text: "1 in 7 U.S. households already faces an unaffordable water bill." },
    { pose: "leak", text: "Water loss costs American ratepayers about $6.4 billion a year." },
    { pose: "clipboard", text: "America has 2.2 million miles of water pipes. Most were built in the 1950s and 60s." }
  ];

  function initPip() {
    var widget = document.querySelector("[data-pip-widget]");
    if (!widget) return;

    var btn = widget.querySelector("[data-pip-btn]");
    var panel = widget.querySelector("[data-pip-panel]");
    var img = widget.querySelector("[data-pip-img]");
    var factEl = widget.querySelector("[data-pip-fact]");
    var closeBtn = widget.querySelector("[data-pip-close]");
    var nextBtn = widget.querySelector("[data-pip-next]");
    var lastIndex = -1;

    function showRandomFact() {
      var idx = Math.floor(Math.random() * PIP_FACTS.length);
      if (PIP_FACTS.length > 1) {
        while (idx === lastIndex) { idx = Math.floor(Math.random() * PIP_FACTS.length); }
      }
      lastIndex = idx;
      var entry = PIP_FACTS[idx];
      if (factEl) factEl.textContent = entry.text;
      if (img) img.src = PIP_IMAGES[entry.pose];
    }

    function openPanel() {
      showRandomFact();
      panel.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
    }

    function closePanel() {
      panel.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    }

    btn.addEventListener("click", function () {
      if (panel.classList.contains("is-open")) {
        closePanel();
      } else {
        openPanel();
      }
    });
    if (closeBtn) closeBtn.addEventListener("click", closePanel);
    if (nextBtn) nextBtn.addEventListener("click", showRandomFact);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePanel();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initReveal();
    initHeroDoc();
    initForms();
    initPip();
  });
})();
