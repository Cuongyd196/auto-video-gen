// v2 Animation Engine — template-specific entrance animations
// HyperFrames runtime drives playback by seeking the timeline.
//
// IMPORTANT: Only use supported GSAP props: opacity, x, y, scale, scaleX, scaleY, rotation, width, height, visibility.
// Do NOT use `delay:` in vars — use position parameter (3rd arg) instead.
// Do NOT use `attr:` settings. No complex easings.

window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });
window.__timelines["news-video"] = tl;

(function () {
  // ── Inject shimmer masks into all .shimmer-sweep-target elements ──────────
  document.querySelectorAll(".shimmer-sweep-target").forEach((el) => {
    if (!el.querySelector(".shimmer-mask")) {
      const mask = document.createElement("div");
      mask.className = "shimmer-mask";
      el.appendChild(mask);
    }
  });

  const stage = document.getElementById("stage");
  const scenes = Array.from(stage.querySelectorAll(".scene"));

  // ── Scene dispatch ──────────────────────────────────────────────────────
  scenes.forEach((scene) => {
    const start = parseFloat(scene.dataset.start);
    const dur   = parseFloat(scene.dataset.duration);
    const layout = scene.dataset.layout;

    // Scene visibility: fade in/out
    tl.set(scene, { opacity: 1 }, start);
    tl.set(scene, { opacity: 0 }, start + dur);

    if (layout === "hook") {
      animateHook(scene, tl, start);
    } else if (layout === "comparison") {
      animateComparison(scene, tl, start);
    } else if (layout === "stat-hero") {
      animateStatHero(scene, tl, start);
    } else if (layout === "feature-list") {
      animateFeatureList(scene, tl, start);
    } else if (layout === "callout") {
      animateCallout(scene, tl, start);
    } else if (layout === "outro") {
      animateOutro(scene, tl, start, dur);
    }
  });

  // ── HOOK ──────────────────────────────────────────────────────────────
  function animateHook(scene, tl, start) {
    const headline = scene.querySelector(".hook-headline");
    if (headline) {
      // Scale pop in
      tl.fromTo(headline, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6 }, start + 0.15);
      // Shimmer sweep after entrance
      const mask = headline.querySelector(".shimmer-mask");
      if (mask) {
        tl.fromTo(mask, { x: "-120%" }, { x: "120%", duration: 1.0 }, start + 0.7);
      }
    }

    const subhead = scene.querySelector(".hook-subhead");
    if (subhead) {
      tl.fromTo(subhead, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, start + 0.55);
    }
  }

  // ── COMPARISON ────────────────────────────────────────────────────────
  function animateComparison(scene, tl, start) {
    const leftCard = scene.querySelector(".cmp-left");
    if (leftCard) {
      tl.fromTo(leftCard, { x: -80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 }, start + 0.15);
    }

    const vs = scene.querySelector(".cmp-vs");
    if (vs) {
      tl.fromTo(vs, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35 }, start + 0.45);
    }

    const rightCard = scene.querySelector(".cmp-right");
    if (rightCard) {
      tl.fromTo(rightCard, { x: 80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 }, start + 0.6);
    }
  }

  // ── STAT HERO ─────────────────────────────────────────────────────────
  function animateStatHero(scene, tl, start) {
    const value = scene.querySelector(".stat-value");
    if (value) {
      tl.fromTo(value, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6 }, start + 0.15);
      // Shimmer sweep on the stat value
      const mask = value.querySelector(".shimmer-mask");
      if (mask) {
        tl.fromTo(mask, { x: "-120%" }, { x: "120%", duration: 1.0 }, start + 0.7);
      }
    }

    const label = scene.querySelector(".stat-label");
    if (label) {
      tl.fromTo(label, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, start + 0.55);
    }

    const context = scene.querySelector(".stat-context");
    if (context) {
      tl.fromTo(context, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, start + 0.85);
    }
  }

  // ── FEATURE LIST ──────────────────────────────────────────────────────
  function animateFeatureList(scene, tl, start) {
    const card = scene.querySelector(".feat-card");
    if (card) {
      tl.fromTo(card, { y: 60, scale: 0.95, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.5 }, start + 0.1);
    }

    const rule = scene.querySelector(".feat-rule");
    if (rule) {
      tl.fromTo(rule, { scaleX: 0, opacity: 1 }, { scaleX: 1, opacity: 1, duration: 0.4 }, start + 0.45);
    }

    const bullets = scene.querySelectorAll(".feat-bullet");
    bullets.forEach((b, i) => {
      tl.fromTo(b, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4 }, start + 0.6 + i * 0.15);
    });
  }

  // ── CALLOUT ───────────────────────────────────────────────────────────
  function animateCallout(scene, tl, start) {
    const card = scene.querySelector(".callout-card");
    if (card) {
      tl.fromTo(card, { y: 50, scale: 0.92, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.55 }, start + 0.2);
    }
  }

  // ── OUTRO ─────────────────────────────────────────────────────────────
  function animateOutro(scene, tl, start, dur) {
    const cta = scene.querySelector(".out-cta-top");
    if (cta) {
      tl.fromTo(cta, { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.45 }, start + 0.2);
    }

    const channel = scene.querySelector(".out-channel");
    if (channel) {
      tl.fromTo(channel, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55 }, start + 0.55);
    }

    const underline = scene.querySelector(".out-underline");
    if (underline) {
      tl.fromTo(underline, { width: 0 }, { width: "600px", duration: 0.5 }, start + 0.9);
    }

    const source = scene.querySelector(".out-source");
    if (source) {
      tl.fromTo(source, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, start + 1.3);
    }

    // ── TikTok follow card animation (last ~3.5s of outro) ──────────────
    // Adapted from HyperFrames `tiktok-follow` block.
    // Card lives inside the outro scene (id="tt-card"); slide up + button click sequence.
    const ttCard = scene.querySelector("#tt-card");
    if (ttCard) {
      const ttBtn      = scene.querySelector("#tt-follow-btn");
      const ttFollow   = scene.querySelector("#tt-btn-follow");
      const ttFollwing = scene.querySelector("#tt-btn-following");
      const ttBase     = start + 1.6;  // start TikTok sequence 1.6s into outro

      // Slide in from bottom + fade in
      tl.fromTo(ttCard,
        { opacity: 0, y: 300 },
        { opacity: 1, y: 0, duration: 0.5 },
        ttBase
      );

      // Button press (scale down)
      if (ttBtn) {
        tl.to(ttBtn, { scale: 0.92, duration: 0.15 }, ttBase + 0.9);
        // Release with slight bounce (use scale up)
        tl.to(ttBtn, { scale: 1, duration: 0.4 }, ttBase + 1.05);
      }

      // Swap "Follow" → "Following" (opacity)
      if (ttFollow) {
        tl.to(ttFollow, { opacity: 0, duration: 0.08 }, ttBase + 1.05);
      }
      if (ttFollwing) {
        tl.to(ttFollwing, { opacity: 1, duration: 0.08 }, ttBase + 1.08);
      }

      // Hold + subtle zoom-in to focus viewer attention on the card.
      // Slow zoom from scale 1 → 1.08 over the remaining outro duration.
      const holdStart = ttBase + 1.3;             // after click animation
      const holdEnd   = start + dur - 0.1;        // ends just before scene ends
      const holdLen   = Math.max(0.5, holdEnd - holdStart);
      tl.to(ttCard, { scale: 1.08, duration: holdLen }, holdStart);
    }
  }
})();
