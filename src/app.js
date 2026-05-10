(() => {
  "use strict";

  const LG = window.Localgotchi = window.Localgotchi || {};

  function start() {
    const canvas = document.getElementById("scene");
    const ui = LG.UI.create();
    let game = LG.Simulation.normalize(LG.Storage.load() || LG.Simulation.createGame(Date.now()));
    let installPrompt = null;
    const renderer = LG.Renderer.create(canvas, () => game);

    LG.Simulation.advance(game, Date.now(), true);
    commit("load");

    ui.bindActions((action) => {
      if (action === "new") {
        if (game.status === "alive") {
          const confirmed = window.confirm(
            "Nouvelle partie ? Cela va effacer la sauvegarde actuelle et tuer ton dyno. Cette action est irreversible."
          );
          if (!confirmed) return;
        }
        game = LG.Simulation.createGame(Date.now());
        commit("new-game");
        return;
      }

      LG.Simulation.applyAction(game, action, Date.now());
      commit(action);
    });

    canvas.addEventListener("pointerdown", (event) => {
      if (game.status !== "alive") return;
      LG.Simulation.advance(game, Date.now());
      const point = renderer.screenToWorld(event.clientX, event.clientY);

      if (game.minigame.active && game.minigame.target) {
        const target = game.minigame.target;
        if (Math.hypot(point.x - target.x, point.y - target.y) <= target.r + 6) {
          LG.Simulation.hitMinigameTarget(game);
          commit("minigame-hit");
          return;
        }
      }

      const bounds = renderer.getDinoBounds();
      if (bounds && point.x >= bounds.x && point.x <= bounds.x + bounds.w && point.y >= bounds.y && point.y <= bounds.y + bounds.h) {
        LG.Simulation.pet(game);
        commit("canvas-pet");
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) flushSave("hidden");
    });
    window.addEventListener("pagehide", () => flushSave("pagehide"));
    window.addEventListener("resize", renderer.resize);
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      installPrompt = event;
      ui.showInstallButton(() => {
        installPrompt.prompt();
        installPrompt.userChoice.finally(() => {
          installPrompt = null;
          ui.hideInstallButton();
        });
      });
    });

    setInterval(() => {
      LG.Simulation.advance(game, Date.now());
      ui.render(game);
    }, 1000);
    setInterval(() => flushSave("autosave"), LG.Config.autosaveMs);

    registerServiceWorker(game, ui);
    requestAnimationFrame(drawLoop);

    function drawLoop(time) {
      renderer.draw(time);
      requestAnimationFrame(drawLoop);
    }

    function commit(reason) {
      const result = LG.Storage.save(game);
      if (!result.ok) LG.Simulation.addLog(game, "Sauvegarde impossible: stockage plein ou bloque.");
      ui.render(game);
    }

    function flushSave(reason) {
      LG.Simulation.advance(game, Date.now());
      commit(reason);
    }
  }

  function registerServiceWorker(game, ui) {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  LG.App = { start };
})();
