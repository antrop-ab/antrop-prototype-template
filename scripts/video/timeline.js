// Körs i webbläsaren, inuti en videokomposition (video/<namn>/index.html).
//
//   <script src="../../node_modules/gsap/dist/gsap.min.js"></script>
//   <script src="../../scripts/video/timeline.js"></script>
//   <script>
//     const { tl, cue, at } = createVideo({ duration: 30, music: { bpm: 112, sections: [...] } })
//     tl.from(".title", { y: 40, opacity: 0, duration: 0.8, ease: "expo.out" }, 0.5)
//     cue("whoosh", 0.4)
//   </script>
//
// fonts: typsnitt som ska vara laddade innan första bilden, t.ex. ["900 80px 'TT Norms'"].
// Renderaren (scripts/video/render.mjs) stegar tidslinjen bildruta för bildruta
// och syntetiserar ljudet från alla cue(). Öppnar du filen i en vanlig webbläsare
// får du en förhandsvisning med spela-knapp och tidsreglage (utan ljud).

(function () {
  const rendering = new URLSearchParams(location.search).has("render");

  window.createVideo = function createVideo({ duration, music = {}, width = 1920, height = 1080, fonts = [] }) {
    const tl = gsap.timeline({ paused: true });
    const cues = [];
    const video = { duration, music, cues, width, height, ready: false };

    /** Markerar en ljudeffekt vid tiden t (sekunder). */
    const cue = (type, t, params = {}) => cues.push({ type, t, ...params });

    /** Skriver text tecken för tecken med tangentljud. Returnerar sluttiden. */
    const type = (el, text, start, { cps = 22, sound = true } = {}) => {
      const node = typeof el === "string" ? document.querySelector(el) : el;
      const obj = { n: 0 };
      const dur = text.length / cps;
      tl.to(obj, {
        n: text.length,
        duration: dur,
        ease: "none",
        onUpdate: () => (node.textContent = text.slice(0, Math.round(obj.n))),
      }, start);
      tl.set(node, { textContent: "" }, 0);
      if (sound) {
        for (let i = 0; i < text.length; i++) {
          if (text[i] !== " " && i % 2 === 0) cue("type", start + i / cps);
        }
      }
      return start + dur;
    };

    video.seek = (t) => {
      tl.seek(t, false);
      document.querySelectorAll("video").forEach((v) => {
        const start = Number(v.dataset.start ?? 0);
        v.currentTime = Math.max(0, t - start);
      });
    };

    window.__video = video;

    // Vänta in typsnitt och bilder innan renderaren börjar.
    Promise.all([
      ...fonts.map((f) => document.fonts.load(f)),
      document.fonts.ready,
      ...[...document.images].map((img) => (img.decode ? img.decode().catch(() => {}) : null)),
    ]).then(() => {
      video.ready = true;
      video.seek(0);
      if (!rendering) mountPreview(video);
    });

    return { tl, cue, type, video };
  };

  function mountPreview(video) {
    const stage = document.querySelector(".stage");
    const fit = () => {
      const s = Math.min(innerWidth / video.width, (innerHeight - 56) / video.height);
      stage.style.transform = `scale(${s})`;
      stage.style.transformOrigin = "0 0";
    };
    fit();
    addEventListener("resize", fit);
    const bar = document.createElement("div");
    bar.style.cssText =
      "position:fixed;left:0;right:0;bottom:0;height:56px;display:flex;gap:12px;align-items:center;padding:0 16px;background:#111;color:#fff;font:14px system-ui;z-index:99999";
    bar.innerHTML = `<button style="font:inherit;padding:6px 14px">Spela</button><input type="range" min="0" max="${video.duration}" step="0.01" value="0" style="flex:1"><span style="width:90px;text-align:right">0.00 s</span>`;
    document.body.appendChild(bar);
    const [btn, range, label] = bar.children;
    let playing = false;
    let t0 = 0;
    let from = 0;
    const show = (t) => {
      video.seek(t);
      range.value = t;
      label.textContent = `${t.toFixed(2)} s`;
    };
    const loop = (now) => {
      if (!playing) return;
      const t = from + (now - t0) / 1000;
      if (t >= video.duration) {
        playing = false;
        btn.textContent = "Spela";
        return show(video.duration);
      }
      show(t);
      requestAnimationFrame(loop);
    };
    btn.onclick = () => {
      playing = !playing;
      btn.textContent = playing ? "Paus" : "Spela";
      if (playing) {
        from = Number(range.value) >= video.duration ? 0 : Number(range.value);
        t0 = performance.now();
        requestAnimationFrame(loop);
      }
    };
    range.oninput = () => {
      playing = false;
      btn.textContent = "Spela";
      show(Number(range.value));
    };
    const start = Number(new URLSearchParams(location.search).get("t") ?? 0);
    show(start);
  }
})();
