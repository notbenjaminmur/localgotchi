(() => {
  "use strict";

  const LG = window.Localgotchi = window.Localgotchi || {};

  LG.Config = {
    storageKey: "localgotchi.save.v1",
    autosaveMs: 5000,
    hourMs: 60 * 60 * 1000,
    dayMs: 24 * 60 * 60 * 1000,
    maxCatchupMs: 72 * 60 * 60 * 1000,
    teenAgeSeconds: 3 * 24 * 60 * 60,
    adultAgeSeconds: 10 * 24 * 60 * 60,
    worldWidth: 480,
    worldHeight: 270
  };

  LG.Needs = [
    ["hunger", "Faim", "#ef8a87"],
    ["thirst", "Soif", "#5fb4d8"],
    ["happiness", "Bonheur", "#83c76f"],
    ["energy", "Energie", "#f2c35b"],
    ["hygiene", "Hygiene", "#ad92d6"],
    ["health", "Sante", "#f08fb4"]
  ];
})();
