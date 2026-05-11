(() => {
  "use strict";

  const LG = window.Localgotchi = window.Localgotchi || {};
  const { clamp, createSeed, formatDuration, randomFor } = LG.Utils;

  function baseStats() {
    return { hunger: 76, thirst: 76, happiness: 78, energy: 82, hygiene: 86, health: 100 };
  }

  function createGame(now) {
    const seed = createSeed();
    return {
      version: 1,
      status: "egg",
      seed,
      paletteIndex: Math.floor(randomFor(seed, "palette") * LG.Assets.palettes.length),
      createdAt: now,
      hatchAt: null,
      lastTickAt: now,
      lastSavedAt: now,
      location: "yard",
      stage: "egg",
      ageSeconds: 0,
      sleeping: false,
      poopCount: 0,
      poopSerial: 0,
      eventSerial: 0,
      nextPoopAt: null,
      nextEventAt: null,
      autoSleepNotified: false,
      minigame: { active: false, score: 0, endsAt: 0, target: null },
      animation: { kind: "idle", until: 0 },
      stats: baseStats(),
      log: ["Oeuf trouve. Il attend d'eclore."]
    };
  }

  function normalize(game) {
    game.version = 1;
    game.stats = { ...baseStats(), ...(game.stats || {}) };
    game.log = Array.isArray(game.log) ? game.log.slice(0, 7) : [];
    game.minigame = game.minigame || { active: false, score: 0, endsAt: 0, target: null };
    game.animation = game.animation || { kind: "idle", until: 0 };
    game.location = game.location === "cabin" ? "cabin" : "yard";
    game.autoSleepNotified = Boolean(game.autoSleepNotified);
    game.paletteIndex = Number.isInteger(game.paletteIndex) ? game.paletteIndex : 0;
    game.poopSerial = game.poopSerial || 0;
    game.eventSerial = game.eventSerial || 0;
    return game;
  }

  function addLog(game, message) {
    game.log.unshift(message);
    game.log = game.log.slice(0, 7);
  }

  function setAnimation(game, kind, durationMs = 1700) {
    const now = Date.now();
    game.animation = { kind, startedAt: now, durationMs, until: now + durationMs };
  }

  function changeStat(game, key, delta) {
    game.stats[key] = clamp((game.stats[key] || 0) + delta, 0, 100);
  }

  function advance(game, now, fromLoad = false) {
    const lastTick = game.lastTickAt || game.lastSavedAt || now;
    const elapsedMs = Math.max(0, now - lastTick);
    if (elapsedMs < 1000) return;

    if (game.status !== "alive") {
      game.lastTickAt = now;
      return;
    }

    const simulatedMs = Math.min(elapsedMs, LG.Config.maxCatchupMs);
    const hours = simulatedMs / LG.Config.hourMs;
    game.ageSeconds += simulatedMs / 1000;
    maybeAutoSleep(game);
    decayNeeds(game, hours);
    maybeAutoWake(game);
    processPoop(game, now);
    processEvents(game, now);
    updateStage(game);
    game.lastTickAt = now;
    finishMinigameIfNeeded(game, now);

    if (elapsedMs > 10 * LG.Config.dayMs && game.stats.health < 18 && (game.stats.hunger < 12 || game.stats.thirst < 12)) {
      kill(game, "Ton dyno n'a pas survecu a la longue absence.");
    }
    if (game.stats.health <= 0) {
      kill(game, "Ton dyno est mort de negligence.");
    }

    if (fromLoad && elapsedMs > 60 * 1000 && game.status === "alive") {
      addLog(game, `Retour apres ${formatDuration(elapsedMs)}. Les besoins ont evolue.`);
    }
  }

  function decayNeeds(game, hours) {
    const poopPenalty = game.poopCount * 0.75;
    if (game.sleeping) {
      changeStat(game, "energy", 55 * hours);
      changeStat(game, "hunger", -2.1 * hours);
      changeStat(game, "thirst", -2.8 * hours);
      changeStat(game, "happiness", -0.45 * hours);
    } else {
      changeStat(game, "energy", -0.65 * hours);
      changeStat(game, "hunger", -5.1 * hours);
      changeStat(game, "thirst", -6.2 * hours);
      changeStat(game, "happiness", -(1.3 + poopPenalty) * hours);
    }
    changeStat(game, "hygiene", -(2.4 + game.poopCount * 1.1) * hours);

    const lowNeedStress = ["hunger", "thirst", "energy", "hygiene", "happiness"].reduce((sum, key) => {
      return sum + Math.max(0, 35 - game.stats[key]) / 35;
    }, 0);
    if (lowNeedStress > 0) changeStat(game, "health", -lowNeedStress * 2.4 * hours);
    if (game.poopCount > 3) changeStat(game, "health", -(game.poopCount - 3) * 1.4 * hours);
    if (lowNeedStress === 0 && game.poopCount === 0) changeStat(game, "health", 3 * hours);
  }

  function maybeAutoSleep(game) {
    if (game.sleeping || game.stats.energy > 12 || game.minigame.active) return;
    game.sleeping = true;
    setAnimation(game, "sleep", 1200);
    if (!game.autoSleepNotified) {
      addLog(game, "Il est epuise et s'endort tout seul.");
      game.autoSleepNotified = true;
    }
  }

  function maybeAutoWake(game) {
    if (!game.sleeping || game.stats.energy < 96 || game.stats.hunger < 18 || game.stats.thirst < 18) return;
    game.sleeping = false;
    game.autoSleepNotified = false;
    setAnimation(game, "wake", 1400);
    addLog(game, "Il se reveille repose.");
  }

  function processPoop(game, now) {
    if (!game.nextPoopAt) game.nextPoopAt = schedulePoop(game, now);
    let loops = 0;
    while (game.nextPoopAt <= now && loops < 12) {
      game.poopCount = clamp(game.poopCount + 1, 0, 6);
      game.poopSerial += 1;
      game.nextPoopAt = schedulePoop(game, game.nextPoopAt);
      addLog(game, "Petit accident dans le decor.");
      loops += 1;
    }
    if (loops === 12 && game.nextPoopAt <= now) game.nextPoopAt = schedulePoop(game, now);
  }

  function processEvents(game, now) {
    if (!game.nextEventAt) game.nextEventAt = scheduleEvent(game, now);
    let loops = 0;
    while (game.nextEventAt <= now && loops < 8) {
      const eventRoll = randomFor(game.seed, `event-kind-${game.eventSerial}`);
      if (eventRoll < 0.24) {
        changeStat(game, "happiness", 6);
        addLog(game, "Il a trouve une baie brillante.");
      } else if (eventRoll < 0.48) {
        changeStat(game, "energy", 7);
        addLog(game, "Petite sieste spontanee.");
      } else if (eventRoll < 0.68) {
        changeStat(game, "hygiene", -8);
        addLog(game, "Il a saute dans une flaque.");
      } else if (eventRoll < 0.84) {
        changeStat(game, "hunger", -6);
        addLog(game, "Il a fait les cent pas.");
      } else {
        changeStat(game, "health", 4);
        addLog(game, "Journee calme et rassurante.");
      }
      game.eventSerial += 1;
      game.nextEventAt = scheduleEvent(game, game.nextEventAt);
      loops += 1;
    }
    if (loops === 8 && game.nextEventAt <= now) game.nextEventAt = scheduleEvent(game, now);
  }

  function schedulePoop(game, baseAt) {
    const delay = 2.4 + randomFor(game.seed, `poop-${game.poopSerial}`) * 3.6;
    return Math.round(baseAt + delay * LG.Config.hourMs);
  }

  function scheduleEvent(game, baseAt) {
    const delay = 1.5 + randomFor(game.seed, `event-${game.eventSerial}`) * 4.5;
    return Math.round(baseAt + delay * LG.Config.hourMs);
  }

  function updateStage(game) {
    const previous = game.stage;
    if (game.ageSeconds >= LG.Config.adultAgeSeconds) game.stage = "adult";
    else if (game.ageSeconds >= LG.Config.teenAgeSeconds) game.stage = "teen";
    else game.stage = "baby";
    if (previous !== game.stage) {
      setAnimation(game, "evolve", 2200);
      addLog(game, game.stage === "teen" ? "Evolution: stade ado." : "Evolution: stade adulte.");
    }
  }

  function applyAction(game, action, now) {
    advance(game, now);
    if (game.status === "egg") {
      if (action === "hatch") hatch(game, now);
      else addLog(game, "Fais d'abord eclore l'oeuf.");
      return;
    }

    if (game.status === "dead") {
      addLog(game, "Lance une nouvelle partie pour recommencer.");
      return;
    }

    if (action === "feed") {
      changeStat(game, "hunger", 28);
      changeStat(game, "thirst", -3);
      changeStat(game, "hygiene", -2);
      setAnimation(game, "feed", 1900);
      addLog(game, "Repas englouti.");
    } else if (action === "drink") {
      changeStat(game, "thirst", 30);
      changeStat(game, "health", 2);
      setAnimation(game, "drink", 1800);
      addLog(game, "Grande gorgee d'eau.");
    } else if (action === "clean") {
      const hadPoop = game.poopCount > 0;
      game.poopCount = 0;
      changeStat(game, "hygiene", hadPoop ? 48 : 18);
      changeStat(game, "happiness", hadPoop ? 5 : 1);
      setAnimation(game, "clean", 2100);
      addLog(game, hadPoop ? "Decor nettoye." : "Petit coup de propre.");
    } else if (action === "play") {
      if (game.stats.energy < 12) addLog(game, "Trop fatigue pour jouer.");
      else {
        changeStat(game, "happiness", 24);
        changeStat(game, "energy", -13);
        changeStat(game, "hunger", -7);
        changeStat(game, "thirst", -8);
        setAnimation(game, "play", 1900);
        addLog(game, "Session de jeu reussie.");
      }
    } else if (action === "pet") {
      pet(game);
    } else if (action === "sleep") {
      game.sleeping = !game.sleeping;
      if (!game.sleeping) game.autoSleepNotified = false;
      setAnimation(game, game.sleeping ? "sleep" : "wake", game.sleeping ? 900 : 1400);
      addLog(game, game.sleeping ? "Il s'endort." : "Il se reveille.");
    } else if (action === "place") {
      game.location = game.location === "cabin" ? "yard" : "cabin";
      setAnimation(game, "wake", 1300);
      addLog(game, game.location === "cabin" ? "Il rentre dans sa cabane." : "Il retourne dehors.");
    } else if (action === "minigame") {
      startMinigame(game, now);
    }
  }

  function hatch(game, now) {
    game.status = "alive";
    game.hatchAt = now;
    game.lastTickAt = now;
    game.stage = "baby";
    game.ageSeconds = 0;
    game.stats = baseStats();
    game.nextPoopAt = schedulePoop(game, now);
    game.nextEventAt = scheduleEvent(game, now);
    setAnimation(game, "hatch", 2000);
    addLog(game, "L'oeuf eclot. Ton dyno est la.");
  }

  function pet(game) {
    changeStat(game, "happiness", 13);
    changeStat(game, "health", 1);
    setAnimation(game, "pet", 1700);
    addLog(game, "Il adore les caresses.");
  }

  function startMinigame(game, now) {
    if (game.minigame.active) {
      addLog(game, "Mini-jeu deja en cours.");
      return;
    }
    if (game.stats.energy < 15) {
      addLog(game, "Il faut un peu d'energie pour jouer.");
      return;
    }
    game.minigame = { active: true, score: 0, endsAt: now + 20000, target: null };
    spawnMinigameTarget(game);
    changeStat(game, "energy", -5);
    setAnimation(game, "play");
    addLog(game, "Mini-jeu: clique les baies.");
  }

  function spawnMinigameTarget(game) {
    const key = `${game.minigame.endsAt}-${game.minigame.score}`;
    game.minigame.target = {
      x: 60 + randomFor(game.seed, `mini-x-${key}`) * 360,
      y: 58 + randomFor(game.seed, `mini-y-${key}`) * 112,
      r: 12
    };
  }

  function hitMinigameTarget(game) {
    game.minigame.score += 1;
    changeStat(game, "happiness", 1);
    setAnimation(game, "play", 500);
    spawnMinigameTarget(game);
  }

  function finishMinigameIfNeeded(game, now) {
    if (!game.minigame.active || now < game.minigame.endsAt) return;
    const score = game.minigame.score;
    game.minigame.active = false;
    game.minigame.target = null;
    changeStat(game, "happiness", 8 + score * 3);
    changeStat(game, "hunger", -Math.min(14, score * 2));
    changeStat(game, "thirst", -Math.min(10, score));
    addLog(game, `Mini-jeu fini: ${score} baie${score > 1 ? "s" : ""}.`);
  }

  function kill(game, message) {
    if (game.status === "dead") return;
    game.status = "dead";
    game.sleeping = false;
    game.minigame.active = false;
    game.stage = "dead";
    setAnimation(game, "dead", 2000);
    addLog(game, message);
  }

  LG.Simulation = {
    addLog,
    applyAction,
    advance,
    createGame,
    hitMinigameTarget,
    normalize,
    pet
  };
})();
