(() => {
  "use strict";

  const LG = window.Localgotchi = window.Localgotchi || {};

  function load() {
    try {
      const raw = localStorage.getItem(LG.Config.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function save(game) {
    try {
      game.lastSavedAt = Date.now();
      localStorage.setItem(LG.Config.storageKey, JSON.stringify(game));
      return { ok: true };
    } catch (error) {
      return { ok: false, error };
    }
  }

  LG.Storage = { load, save };
})();
