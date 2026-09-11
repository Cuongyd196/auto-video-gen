window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });
window.__timelines["news-video"] = tl;

(function () {
  const stage = document.getElementById("stage");
  if (!stage) return;

  const timed = Array.from(stage.querySelectorAll("[data-layout]"));
  timed.forEach((scene) => {
    const start = parseFloat(scene.dataset.start || "0");
    const layout = scene.dataset.layout;

    if (layout === "screen-demo") {
      const headline = scene.querySelector(".product-demo-headline");
      const subtitle = scene.querySelector(".product-demo-subtitle");
      if (headline) {
        tl.fromTo(headline, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.25 }, start + 0.05);
      }
      if (subtitle) {
        tl.fromTo(subtitle, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.25 }, start + 0.12);
      }
    }

    if (layout === "product-text") {
      const main = scene.querySelector(".product-text-main");
      const kicker = scene.querySelector(".product-text-kicker");
      const subtitle = scene.querySelector(".product-text-subtitle");
      if (kicker) tl.fromTo(kicker, { opacity: 0 }, { opacity: 1, duration: 0.2 }, start + 0.05);
      if (main) tl.fromTo(main, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.3 }, start + 0.08);
      if (subtitle) tl.fromTo(subtitle, { opacity: 0 }, { opacity: 1, duration: 0.25 }, start + 0.2);
    }

    if (layout === "product-outro") {
      const inner = scene.querySelector(".product-outro-inner");
      if (inner) {
        tl.fromTo(inner, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.35 }, start + 0.08);
      }
    }
  });
})();
