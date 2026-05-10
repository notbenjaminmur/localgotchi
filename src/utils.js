(() => {
  "use strict";

  const LG = window.Localgotchi = window.Localgotchi || {};

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function randomFor(seed, salt) {
    let t = hashString(`${seed}:${salt}`) + 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function createSeed() {
    const hasCrypto = globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function";
    const randomPart = hasCrypto ? globalThis.crypto.getRandomValues(new Uint32Array(1))[0] : Math.floor(Math.random() * 2 ** 32);
    return `LG-${Date.now().toString(36).toUpperCase()}-${randomPart.toString(36).toUpperCase().slice(0, 5)}`;
  }

  function stageName(stage) {
    if (stage === "adult") return "Adulte";
    if (stage === "teen") return "Ado";
    return "Bebe";
  }

  function formatClock(timestamp) {
    return new Date(timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDuration(ms) {
    const minutes = Math.max(0, Math.floor(ms / 60000));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 48) return `${hours} h`;
    return `${Math.floor(hours / 24)} j`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char];
    });
  }

  LG.Utils = { clamp, createSeed, escapeHtml, formatClock, formatDuration, randomFor, stageName };
})();
