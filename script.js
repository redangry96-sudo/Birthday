/* =============================================================
   Birthday Wish Website — script.js
   Handles: confetti canvas, typing animation, music,
            page transitions, download card
   ============================================================= */

"use strict";

/* ── DOM references ─────────────────────────────────────────── */
const landingPage     = document.getElementById("landingPage");
const wishPage        = document.getElementById("wishPage");
const nameInput       = document.getElementById("nameInput");
const generateBtn     = document.getElementById("generateBtn");
const inputError      = document.getElementById("inputError");
const cardTitle       = document.getElementById("cardTitle");
const cardDate        = document.getElementById("cardDate");
const wishText        = document.getElementById("wishText");
const typingCursor    = document.getElementById("typingCursor");
const anotherWishBtn  = document.getElementById("anotherWishBtn");
const downloadCardBtn = document.getElementById("downloadCardBtn");
const musicBtn        = document.getElementById("musicBtn");
const bgCanvas        = document.getElementById("bgCanvas");
const ctx             = bgCanvas.getContext("2d");

/* ── State ───────────────────────────────────────────────────── */
let typingTimer        = null;
let confettiParticles  = [];
let animFrame          = null;
let isPlaying          = false;
let audioCtx           = null;
let gainNode           = null;
let musicSources       = [];
let userName           = "";

/* ── Birthday messages pool ──────────────────────────────────── */
const MESSAGES = [
  `Today is your day, {name} — a day the universe set aside just for you.

May every candle you blow out carry a wish that blooms into something wonderful. May the year ahead be filled with laughter that echoes long after the moment has passed, with friendships that feel like home, and with small, ordinary moments that somehow turn into your favourite memories.

You bring something irreplaceable into the lives of the people around you — a spark, a warmth, a kindness that ripples further than you know. The world is genuinely better with you in it, and today we celebrate that with our whole hearts.

Eat the cake. Dance a little longer. Let yourself be loved today.

Happy Birthday, {name}! 🎂✨🎉`,

  `Dearest {name}, today we celebrate the wonderful person you are.

Every year that passes is not just a number — it's a collection of courage shown, love given, obstacles overcome, and joy discovered in unexpected places. You have lived another chapter of a story that is uniquely, beautifully yours.

Here's to new adventures waiting just beyond the horizon, to dreams that are bigger and brighter than ever, and to the kind of happiness that doesn't ask permission. May this birthday mark the beginning of your most remarkable year yet.

The people who know you are lucky. Thank you for being you.

Wishing you endless joy, {name}! 🌟🎈💜`,

  `Happy Birthday, {name}! 🎉

Today we pause everything to honour the incredible journey you've taken to reach this moment. Life has offered you challenges and you have met them with grace. It has offered you joy and you have shared it generously.

As you step into a brand new year of life, may you find yourself surrounded by all the love you deserve, chasing the things that set your soul on fire, and arriving each evening feeling grateful for the day.

You deserve celebrations that last longer than a day, but let's start here — with confetti, with music, and with a whole heart full of wishes sent your way.

Shine on, {name}. The best is still ahead. 🌈💫🎂`
];

/* ── Canvas resize ───────────────────────────────────────────── */
function resizeCanvas() {
  bgCanvas.width  = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* ── Confetti setup ──────────────────────────────────────────── */
const CONFETTI_COLORS = [
  "#7c3aed", "#a78bfa", "#ec4899", "#f9a8d4",
  "#f59e0b", "#fde68a", "#ffffff", "#c4b5fd"
];

function createConfetti(count = 130) {
  confettiParticles = [];
  for (let i = 0; i < count; i++) {
    confettiParticles.push({
      x:        Math.random() * bgCanvas.width,
      y:        Math.random() * -bgCanvas.height,             // start above viewport
      w:        Math.random() * 8 + 5,
      h:        Math.random() * 5 + 3,
      color:    CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      speed:    Math.random() * 3 + 1.5,
      angle:    Math.random() * Math.PI * 2,
      spin:     (Math.random() - 0.5) * 0.12,
      drift:    (Math.random() - 0.5) * 1.2,
      opacity:  Math.random() * 0.6 + 0.4
    });
  }
}

function drawConfetti() {
  ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

  confettiParticles.forEach(p => {
    // Update physics
    p.y     += p.speed;
    p.x     += p.drift;
    p.angle += p.spin;

    // Wrap horizontally
    if (p.x > bgCanvas.width + 20)  p.x = -20;
    if (p.x < -20)                   p.x = bgCanvas.width + 20;

    // Reset when offscreen bottom
    if (p.y > bgCanvas.height + 20) {
      p.y = Math.random() * -80 - 20;
      p.x = Math.random() * bgCanvas.width;
    }

    // Draw
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
    ctx.rotate(p.angle);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.rect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.fill();
    ctx.restore();
  });

  animFrame = requestAnimationFrame(drawConfetti);
}

function stopConfetti() {
  if (animFrame) {
    cancelAnimationFrame(animFrame);
    animFrame = null;
  }
  ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  confettiParticles = [];
}

/* ── Typing animation ────────────────────────────────────────── */
function typeMessage(message, onComplete) {
  wishText.textContent = "";
  typingCursor.classList.remove("hidden");
  let i = 0;

  function tick() {
    if (i <= message.length) {
      wishText.textContent = message.slice(0, i);
      i++;
      // Pause slightly on punctuation for natural rhythm
      const ch = message[i - 1];
      const delay = (ch === "." || ch === "!" || ch === "?") ? 60
                  : (ch === ",") ? 35
                  : 22;
      typingTimer = setTimeout(tick, delay);
    } else {
      typingCursor.classList.add("hidden");
      if (typeof onComplete === "function") onComplete();
    }
  }

  tick();
}

/* ── Page transitions ────────────────────────────────────────── */
function showWishPage(name) {
  userName = name.trim();

  /* Pick a random message and fill placeholder */
  const template = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  const fullMsg  = template.replaceAll("{name}", userName);

  /* Set card header */
  cardTitle.textContent = `Happy Birthday, ${userName}! 🎂🎉`;
  cardDate.textContent  = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  /* Transition: exit landing, enter wish */
  landingPage.classList.add("exit");
  landingPage.classList.remove("active");

  setTimeout(() => {
    landingPage.classList.remove("exit");
    wishPage.classList.add("active");

    /* Start confetti */
    createConfetti(140);
    drawConfetti();

    /* Start typing after a tiny reveal delay */
    setTimeout(() => typeMessage(fullMsg), 300);
  }, 400);
}

function showLandingPage() {
  /* Stop typing */
  if (typingTimer) clearTimeout(typingTimer);
  wishText.textContent = "";
  typingCursor.classList.remove("hidden");

  /* Stop confetti */
  stopConfetti();

  /* Transition */
  wishPage.classList.add("exit");
  wishPage.classList.remove("active");

  setTimeout(() => {
    wishPage.classList.remove("exit");
    landingPage.classList.add("active");
    nameInput.value = "";
    nameInput.focus();
    inputError.textContent = "";
  }, 400);
}

/* ── Input validation & generate ────────────────────────────── */
function handleGenerate() {
  const raw = nameInput.value.trim();

  if (!raw) {
    inputError.textContent = "Please enter your name first ✨";
    nameInput.focus();
    return;
  }

  if (raw.length < 2) {
    inputError.textContent = "Name seems too short — try your full name!";
    nameInput.focus();
    return;
  }

  inputError.textContent = "";
  showWishPage(raw);
}

generateBtn.addEventListener("click", handleGenerate);

nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleGenerate();
  if (inputError.textContent) inputError.textContent = "";
});

/* ── "Another wish" button ───────────────────────────────────── */
anotherWishBtn.addEventListener("click", showLandingPage);

/* ── Download birthday card ──────────────────────────────────── */
downloadCardBtn.addEventListener("click", () => {
  const card = document.getElementById("birthdayCard");

  /* Build an off-screen SVG representation of the card */
  const w = 800, h = 560;
  const name = userName || "Friend";
  const dateStr = cardDate.textContent;
  const rawMsg  = wishText.textContent;

  /* Word-wrap helper for SVG */
  function wrapText(text, maxChars) {
    const lines = [];
    const paragraphs = text.split("\n");
    paragraphs.forEach(para => {
      if (!para.trim()) { lines.push(""); return; }
      const words = para.split(" ");
      let line = "";
      words.forEach(word => {
        if ((line + word).length > maxChars) {
          lines.push(line.trim());
          line = word + " ";
        } else {
          line += word + " ";
        }
      });
      if (line.trim()) lines.push(line.trim());
    });
    return lines;
  }

  const lines       = wrapText(rawMsg, 78);
  const lineHeight  = 22;
  const textStart   = 290;
  const svgHeight   = Math.max(h, textStart + lines.length * lineHeight + 80);

  const svgLines = lines.map((l, i) =>
    `<text x="400" y="${textStart + i * lineHeight}" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-family="Georgia,serif" font-size="14" font-weight="300">${escapeXml(l)}</text>`
  ).join("\n");

  function escapeXml(s) {
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${svgHeight}" viewBox="0 0 ${w} ${svgHeight}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#1a0533"/>
      <stop offset="40%"  stop-color="#2d1065"/>
      <stop offset="70%"  stop-color="#831843"/>
      <stop offset="100%" stop-color="#450a0a"/>
    </linearGradient>
    <linearGradient id="titleGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#a78bfa"/>
      <stop offset="50%"  stop-color="#f9a8d4"/>
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${w}" height="${svgHeight}" fill="url(#bg)" rx="24"/>

  <!-- Decorative confetti dots -->
  ${Array.from({length: 28}, (_,i) => {
    const cx = 50 + (i * 29) % (w - 50);
    const cy = 30 + (i * 17) % (svgHeight - 40);
    const r  = 3 + (i % 4);
    const colors = ["#7c3aed","#ec4899","#f59e0b","#a78bfa","#f9a8d4"];
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${colors[i%5]}" opacity="0.5"/>`;
  }).join("\n  ")}

  <!-- Card glass panel -->
  <rect x="60" y="40" width="${w-120}" height="${svgHeight-80}" rx="20"
        fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>

  <!-- Cake emoji approximation (circle + text) -->
  <text x="400" y="118" text-anchor="middle" font-size="52">🎂</text>

  <!-- Title -->
  <text x="400" y="180" text-anchor="middle"
        fill="url(#titleGrad)"
        font-family="Georgia,serif" font-size="28" font-weight="700"
        letter-spacing="0.5">Happy Birthday, ${escapeXml(name)}! 🎉</text>

  <!-- Date -->
  <text x="400" y="208" text-anchor="middle"
        fill="rgba(255,255,255,0.5)"
        font-family="Georgia,serif" font-size="13" letter-spacing="2">
    ${escapeXml(dateStr)}
  </text>

  <!-- Divider stars -->
  <text x="350" y="248" text-anchor="middle" font-size="16" opacity="0.7">🌟</text>
  <text x="400" y="248" text-anchor="middle" font-size="16" opacity="0.7">✨</text>
  <text x="450" y="248" text-anchor="middle" font-size="16" opacity="0.7">🌟</text>

  <!-- Message lines -->
  ${svgLines}

  <!-- Footer divider -->
  <line x1="160" y1="${textStart + lines.length * lineHeight + 16}"
        x2="${w-160}" y2="${textStart + lines.length * lineHeight + 16}"
        stroke="rgba(255,255,255,0.15)" stroke-width="1"/>

  <!-- Signature -->
  <text x="400" y="${textStart + lines.length * lineHeight + 44}"
        text-anchor="middle" fill="#f9a8d4"
        font-family="Georgia,serif" font-size="16" font-style="italic">
    With love &amp; joy 💜
  </text>

  <!-- Bottom badge -->
  <text x="${w/2}" y="${svgHeight - 18}"
        text-anchor="middle" fill="rgba(255,255,255,0.3)"
        font-family="Georgia,serif" font-size="11">
    🎉 Birthday Surprise — created with love
  </text>
</svg>`;

  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `birthday-card-${name.toLowerCase().replace(/\s+/g,"-")}.svg`;
  a.click();
  URL.revokeObjectURL(url);
});

/* ── Web Audio birthday melody ───────────────────────────────── */
/*
  Plays a simple happy-birthday-esque melody using the Web Audio API.
  Notes: C D E F G A B in 4th octave.
*/
const NOTE_FREQS = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
  A3: 220.00, G3: 196.00
};

/* A cheerful pentatonic melody loop */
const MELODY = [
  // Note, duration (s)
  ["C4", 0.30], ["C4", 0.15], ["D4", 0.45],
  ["C4", 0.45], ["F4", 0.45], ["E4", 0.60],

  ["C4", 0.30], ["C4", 0.15], ["D4", 0.45],
  ["C4", 0.45], ["G4", 0.45], ["F4", 0.60],

  ["C4", 0.30], ["C4", 0.15], ["C5", 0.45],
  ["A4", 0.45], ["F4", 0.30], ["E4", 0.30], ["D4", 0.45],

  ["B4", 0.30], ["B4", 0.15], ["A4", 0.45],
  ["F4", 0.45], ["G4", 0.45], ["F4", 0.90],

  ["R",  0.40]  // rest
];

function getOrCreateAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.18;
    gainNode.connect(audioCtx.destination);
  }
  return audioCtx;
}

let melodyLoop = null;

function playMelodyLoop() {
  const ac = getOrCreateAudioCtx();
  if (ac.state === "suspended") ac.resume();

  let time = ac.currentTime + 0.05;
  const noteGain = ac.createGain();
  noteGain.gain.value = 1;
  noteGain.connect(gainNode);

  MELODY.forEach(([note, dur]) => {
    if (note === "R") { time += dur; return; }
    const freq = NOTE_FREQS[note];
    if (!freq) { time += dur; return; }

    const osc  = ac.createOscillator();
    const env  = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(env);
    env.connect(noteGain);

    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(0.7, time + 0.02);
    env.gain.setValueAtTime(0.7, time + dur * 0.6);
    env.gain.linearRampToValueAtTime(0, time + dur);

    /* Add a soft octave above for brightness */
    const osc2 = ac.createOscillator();
    const env2 = ac.createGain();
    osc2.type = "sine";
    osc2.frequency.value = freq * 2;
    osc2.connect(env2);
    env2.connect(noteGain);
    env2.gain.setValueAtTime(0, time);
    env2.gain.linearRampToValueAtTime(0.2, time + 0.02);
    env2.gain.linearRampToValueAtTime(0, time + dur);

    osc.start(time);
    osc.stop(time + dur + 0.05);
    osc2.start(time);
    osc2.stop(time + dur + 0.05);

    time += dur;
  });

  /* Schedule next loop */
  const totalDuration = MELODY.reduce((s, [, d]) => s + d, 0);
  melodyLoop = setTimeout(playMelodyLoop, (totalDuration - 0.05) * 1000);
}

function stopMelodyLoop() {
  if (melodyLoop) {
    clearTimeout(melodyLoop);
    melodyLoop = null;
  }
  if (gainNode) {
    gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
    setTimeout(() => {
      gainNode.gain.value = 0.18;
    }, 500);
  }
}

musicBtn.addEventListener("click", () => {
  if (isPlaying) {
    stopMelodyLoop();
    musicBtn.textContent = "🎵";
    musicBtn.title = "Play birthday music";
    musicBtn.setAttribute("aria-label", "Play birthday music");
    musicBtn.classList.remove("playing");
    isPlaying = false;
  } else {
    playMelodyLoop();
    musicBtn.textContent = "🔇";
    musicBtn.title = "Pause birthday music";
    musicBtn.setAttribute("aria-label", "Pause birthday music");
    musicBtn.classList.add("playing");
    isPlaying = true;
  }
});

/* ── Auto-start gentle background particles on load ─────────── */
(function initIdleParticles() {
  /* Subtle floating stars in the background even on landing */
  const idleParticles = Array.from({ length: 30 }, () => ({
    x:       Math.random() * window.innerWidth,
    y:       Math.random() * window.innerHeight,
    r:       Math.random() * 2 + 1,
    speed:   Math.random() * 0.5 + 0.2,
    opacity: Math.random() * 0.5 + 0.1,
    color:   CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
  }));

  function drawIdle() {
    /* Only draw idle dots when confetti isn't active */
    if (confettiParticles.length > 0) { requestAnimationFrame(drawIdle); return; }
    ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

    idleParticles.forEach(p => {
      p.y -= p.speed;
      if (p.y < -10) { p.y = bgCanvas.height + 10; p.x = Math.random() * bgCanvas.width; }
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(drawIdle);
  }

  drawIdle();
})();

/* ── Focus the input on load ─────────────────────────────────── */
window.addEventListener("load", () => {
  nameInput.focus();
});
