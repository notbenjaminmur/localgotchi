(() => {
  "use strict";

  const LG = window.Localgotchi = window.Localgotchi || {};
  const { escapeHtml, formatClock, formatDuration, stageName } = LG.Utils;

  function create() {
    const els = {
      stats: document.getElementById("stats"),
      log: document.getElementById("log"),
      stage: document.getElementById("stageLabel"),
      age: document.getElementById("ageLabel"),
      save: document.getElementById("saveLabel"),
      hint: document.getElementById("sceneHint"),
      minigame: document.getElementById("minigameStatus"),
      install: document.getElementById("installButton")
    };

    function bindActions(callback) {
      document.querySelectorAll("[data-action]").forEach((button) => {
        button.addEventListener("click", () => callback(button.dataset.action));
      });
    }

    function render(game) {
      const stageLabel = game.status === "egg" ? "Oeuf" : game.status === "dead" ? "Mort" : stageName(game.stage);
      els.stage.textContent = stageLabel;
      els.stage.dataset.stage = game.status === "alive" ? game.stage : game.status;
      els.age.textContent = game.status === "egg" ? "0 min" : formatDuration(game.ageSeconds * 1000);
      els.save.textContent = game.lastSavedAt ? formatClock(game.lastSavedAt) : "-";
      els.hint.textContent = game.minigame.active ? "Clique les baies avant la fin." : "Clique le dyno pour le caresser.";

      els.stats.innerHTML = LG.Needs.map(([key, label, color]) => {
        const value = Math.round(game.stats[key] || 0);
        return `
          <div class="stat" data-stat="${key}">
            <span class="stat-label">${label}</span>
            <span class="meter" aria-label="${label} ${value}%">
              <span class="meter-fill" style="--value:${value}%;--color:${color}"></span>
            </span>
            <span class="stat-value">${value}</span>
          </div>
        `;
      }).join("");

      document.querySelectorAll("[data-action]").forEach((button) => {
        const action = button.dataset.action;
        const label = button.querySelector(".action-label");
        button.disabled = false;
        if (game.status === "egg" && !["hatch", "new"].includes(action)) button.disabled = true;
        if (game.status === "alive" && action === "hatch") button.disabled = true;
        if (game.status === "dead" && action !== "new") button.disabled = true;
        button.hidden = action === "hatch" && game.status !== "egg";
        if (action === "sleep" && label) label.textContent = game.sleeping ? "Reveiller" : "Dormir";
        if (action === "place" && label) label.textContent = game.location === "cabin" ? "Sortir" : "Cabane";
      });

      if (game.minigame.active) {
        const seconds = Math.max(0, Math.ceil((game.minigame.endsAt - Date.now()) / 1000));
        els.minigame.hidden = false;
        els.minigame.textContent = `Mini-jeu: ${game.minigame.score} baie(s), ${seconds}s`;
      } else {
        els.minigame.hidden = true;
      }

      els.log.innerHTML = game.log.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("");
    }

    function showInstallButton(callback) {
      els.install.hidden = false;
      els.install.addEventListener("click", callback, { once: true });
    }

    function hideInstallButton() {
      els.install.hidden = true;
    }

    return { bindActions, hideInstallButton, render, showInstallButton };
  }

  LG.UI = { create };
})();
