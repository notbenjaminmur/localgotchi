(() => {
  "use strict";

  const LG = window.Localgotchi = window.Localgotchi || {};
  const WORLD_W = LG.Config.worldWidth;
  const WORLD_H = LG.Config.worldHeight;
  const { randomFor } = LG.Utils;

  function create(canvas, getGame) {
    const ctx = canvas.getContext("2d");
    const viewport = { scale: 1, offsetX: 0, offsetY: 0 };
    let dinoBounds = null;
    let lastFacing = 1;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ctx.imageSmoothingEnabled = false;
    }

    function screenToWorld(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const canvasX = ((clientX - rect.left) / rect.width) * canvas.width;
      const canvasY = ((clientY - rect.top) / rect.height) * canvas.height;
      return {
        x: (canvasX - viewport.offsetX) / viewport.scale,
        y: (canvasY - viewport.offsetY) / viewport.scale
      };
    }

    function draw(time) {
      resize();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#8ed3f0";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const isPortrait = canvas.height > canvas.width * 1.15;
      const scale = isPortrait ? canvas.width / WORLD_W : Math.max(canvas.width / WORLD_W, canvas.height / WORLD_H);
      viewport.scale = scale;
      viewport.offsetX = Math.round((canvas.width - WORLD_W * scale) / 2);
      viewport.offsetY = isPortrait ? Math.max(0, Math.round(canvas.height - WORLD_H * scale - 86)) : Math.round((canvas.height - WORLD_H * scale) / 2);
      ctx.setTransform(scale, 0, 0, scale, viewport.offsetX, viewport.offsetY);
      ctx.imageSmoothingEnabled = false;
      drawWorld(time, getGame(), ctx);
    }

    function drawWorld(time, game, target) {
      dinoBounds = null;
      drawBackground(time, target, game);

      if (game.status === "egg") {
        drawDinoShadow(target, 246, 215, 92);
        drawSprite(target, LG.Assets.sprites.egg, 184, 98 + Math.sin(time / 260) * 2, 6, LG.Assets.eggColors);
      } else if (game.status === "dead") {
        drawTombstone(target, 210, 140);
      } else {
        drawPoops(target, game.poopCount, game.location);
        const stage = LG.Assets.dinoStages[game.stage] || LG.Assets.dinoStages.baby;
        const action = currentAction(game, time);
        const walk = movementForAction(action, time);
        const bob = game.sleeping ? 0 : Math.abs(Math.sin(time / 210)) * 2;
        const jump = ["play", "hatch", "evolve"].includes(action) ? Math.abs(Math.sin(time / 90)) * 8 : action === "hop" ? Math.abs(Math.sin(time / 120)) * 3 : 0;
        const spriteWidth = stage.width * stage.scale;
        const spriteHeight = stage.height * stage.scale;
        const x = 240 + walk - spriteWidth / 2;
        const y = stage.ground - spriteHeight - bob - jump;
        const facing = facingForAction(action, time);
        if (facing !== 0) lastFacing = facing;
        dinoBounds = { x, y, w: spriteWidth, h: spriteHeight };
        drawDinoShadow(target, x + spriteWidth * 0.5, stage.ground + 2, spriteWidth * 0.72);
        if (["wander", "sniff"].includes(action)) drawStepDust(target, x + spriteWidth * 0.52, stage.ground + 2, lastFacing, time);
        drawFacingDino(target, game.stage, x, y, spriteWidth, stage.scale, dinoColors(game), action, time, lastFacing);
        if (game.sleeping) drawSleepMarks(target, lastFacing === 1 ? x + spriteWidth + 8 : x - 36, y + 8, time);
        drawActionEffect(target, action, dinoBounds, time, lastFacing);
      }

      if (game.minigame.active && game.minigame.target) {
        drawBerry(target, game.minigame.target.x, game.minigame.target.y, time);
      }
    }

    return { draw, getDinoBounds: () => dinoBounds, resize, screenToWorld };
  }

  function currentAction(game, time) {
    if (!game.animation || game.animation.until < Date.now()) return idleAction(game, time);
    return game.animation.kind;
  }

  function idleAction(game, time) {
    if (game.sleeping) return "sleep";
    if (game.stats.energy < 22) return "tired";
    if (game.stats.happiness < 22) return "sad";
    const offset = randomFor(game.seed, "idle-offset") * 5000;
    const slot = Math.floor((time + offset) / 6500);
    const roll = randomFor(game.seed, `idle-${slot}`);
    if (roll < 0.2) return "look";
    if (roll < 0.4) return "sniff";
    if (roll < 0.6) return "selfplay";
    if (roll < 0.76) return "hop";
    return "wander";
  }

  function movementForAction(action, time) {
    if (["sleep", "look", "selfplay", "tired", "sad"].includes(action)) return 0;
    if (action === "sniff") return Math.sin(time / 900) * 18;
    return Math.sin(time / 1100) * 72;
  }

  function facingForAction(action, time) {
    if (["sleep", "look", "selfplay", "tired", "sad"].includes(action)) return 0;
    const divisor = action === "sniff" ? 900 : 1100;
    const direction = Math.cos(time / divisor);
    if (Math.abs(direction) < 0.12) return 0;
    return direction > 0 ? 1 : -1;
  }

  function drawBackground(time, ctx, game) {
    if (game.location === "cabin") drawCabinBackground(time, ctx);
    else drawYardBackground(time, ctx);
  }

  function drawYardBackground(time, ctx) {
    ctx.fillStyle = "#8ed3f0";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    drawSun(ctx, 382, 34);
    drawCloud(ctx, (420 - (time / 90) % 620), 34);
    drawCloud(ctx, (120 - (time / 120) % 620), 58);

    ctx.fillStyle = "#6bbd76";
    drawBlockyHill(ctx, -40, 178, 170, 70);
    ctx.fillStyle = "#77c99a";
    drawBlockyHill(ctx, 300, 170, 190, 78);
    drawTree(ctx, 32, 140, 1.05);
    drawTree(ctx, 396, 132, 1.2);
    drawFence(ctx, 292, 183);
    drawMailbox(ctx, 60, 184);
    drawFlowers(ctx, 360, 201);
    ctx.fillStyle = "#d9b765";
    ctx.fillRect(0, 210, WORLD_W, 60);
    ctx.fillStyle = "#52a852";
    ctx.fillRect(0, 206, WORLD_W, 12);

    const tileOffset = Math.floor((time / 70) % 32);
    for (let x = -tileOffset; x < WORLD_W; x += 32) {
      ctx.fillStyle = x % 64 === 0 ? "#3e8d3d" : "#83d16c";
      ctx.fillRect(x, 206, 16, 8);
    }
    drawGrassTufts(ctx, time);
  }

  function drawCabinBackground(time, ctx) {
    ctx.fillStyle = "#9b6946";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    for (let y = 0; y < 178; y += 22) {
      ctx.fillStyle = y % 44 === 0 ? "#ad7650" : "#8d5f42";
      ctx.fillRect(0, y, WORLD_W, 20);
      ctx.fillStyle = "#65422f";
      ctx.fillRect(0, y + 20, WORLD_W, 2);
    }

    ctx.fillStyle = "#171717";
    ctx.fillRect(48, 34, 96, 70);
    ctx.fillStyle = "#6fc5e8";
    ctx.fillRect(54, 40, 84, 58);
    ctx.fillStyle = "#fff0a3";
    ctx.fillRect(62, 48, 18, 14);
    ctx.fillStyle = "#171717";
    ctx.fillRect(94, 40, 5, 58);
    ctx.fillRect(54, 66, 84, 5);

    ctx.fillStyle = "#6b4a38";
    ctx.fillRect(0, 178, WORLD_W, 92);
    for (let x = -20; x < WORLD_W; x += 48) {
      ctx.fillStyle = "#7d563f";
      ctx.fillRect(x, 178, 34, 92);
      ctx.fillStyle = "#503629";
      ctx.fillRect(x + 34, 178, 3, 92);
    }

    drawCabinBed(ctx, 314, 143);
    drawCabinShelf(ctx, 338, 52);
    drawCabinRug(ctx, 164, 211);
    drawCabinBowl(ctx, 94, 200);
    drawCabinPlant(ctx, 38, 178);
    drawCabinLantern(ctx, 218, 64, time);
  }

  function drawCabinBed(ctx, x, y) {
    ctx.fillStyle = "#171717";
    ctx.fillRect(x, y, 118, 50);
    ctx.fillStyle = "#744531";
    ctx.fillRect(x + 6, y + 8, 106, 36);
    ctx.fillStyle = "#ef8a87";
    ctx.fillRect(x + 12, y + 14, 62, 20);
    ctx.fillStyle = "#fff8df";
    ctx.fillRect(x + 76, y + 14, 28, 18);
  }

  function drawCabinShelf(ctx, x, y) {
    ctx.fillStyle = "#171717";
    ctx.fillRect(x, y, 96, 8);
    ctx.fillRect(x + 8, y + 8, 8, 34);
    ctx.fillRect(x + 78, y + 8, 8, 34);
    ctx.fillStyle = "#d99645";
    ctx.fillRect(x + 24, y - 18, 18, 18);
    ctx.fillStyle = "#83c76f";
    ctx.fillRect(x + 52, y - 13, 16, 13);
  }

  function drawCabinRug(ctx, x, y) {
    ctx.fillStyle = "#171717";
    ctx.fillRect(x, y, 142, 24);
    ctx.fillStyle = "#ad92d6";
    ctx.fillRect(x + 6, y + 5, 130, 14);
    ctx.fillStyle = "#f2c35b";
    ctx.fillRect(x + 18, y + 9, 36, 6);
    ctx.fillRect(x + 88, y + 9, 36, 6);
  }

  function drawCabinBowl(ctx, x, y) {
    ctx.fillStyle = "#171717";
    ctx.fillRect(x, y + 8, 42, 18);
    ctx.fillStyle = "#7bb8df";
    ctx.fillRect(x + 5, y + 10, 32, 10);
    ctx.fillStyle = "#f2c35b";
    ctx.fillRect(x + 12, y + 5, 18, 7);
  }

  function drawCabinPlant(ctx, x, y) {
    ctx.fillStyle = "#171717";
    ctx.fillRect(x + 10, y + 26, 36, 28);
    ctx.fillStyle = "#9b6946";
    ctx.fillRect(x + 15, y + 30, 26, 20);
    ctx.fillStyle = "#171717";
    ctx.fillRect(x + 23, y + 4, 6, 28);
    ctx.fillRect(x + 10, y + 12, 18, 8);
    ctx.fillRect(x + 28, y + 9, 22, 8);
    ctx.fillRect(x + 31, y + 22, 18, 8);
    ctx.fillStyle = "#65b85e";
    ctx.fillRect(x + 24, y + 6, 3, 24);
    ctx.fillRect(x + 12, y + 14, 14, 4);
    ctx.fillRect(x + 30, y + 11, 18, 4);
    ctx.fillRect(x + 33, y + 24, 14, 4);
  }

  function drawCabinLantern(ctx, x, y, time) {
    const glow = Math.floor(Math.abs(Math.sin(time / 420)) * 2);
    ctx.fillStyle = "#171717";
    ctx.fillRect(x + 12, y - 18, 4, 18);
    ctx.fillRect(x, y, 30, 38);
    ctx.fillStyle = "#744531";
    ctx.fillRect(x + 4, y + 4, 22, 30);
    ctx.fillStyle = glow ? "#ffe77d" : "#f5c95b";
    ctx.fillRect(x + 9, y + 10, 12, 17);
    ctx.fillStyle = "#fff0a3";
    ctx.fillRect(x + 12, y + 12, 5, 7);
  }

  function drawSun(ctx, x, y) {
    ctx.fillStyle = "#171717";
    ctx.fillRect(x - 4, y - 4, 40, 40);
    ctx.fillStyle = "#f5d15f";
    ctx.fillRect(x, y, 32, 32);
    ctx.fillStyle = "#fff0a3";
    ctx.fillRect(x + 8, y + 6, 10, 8);
  }

  function drawCloud(ctx, x, y) {
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(x, y, 42, 12);
    ctx.fillRect(x + 10, y - 10, 24, 12);
    ctx.fillRect(x + 42, y + 4, 20, 8);
  }

  function drawBlockyHill(ctx, x, y, w, h) {
    ctx.fillRect(x, y + h * 0.45, w, h * 0.55);
    ctx.fillRect(x + w * 0.18, y + h * 0.24, w * 0.64, h * 0.4);
    ctx.fillRect(x + w * 0.34, y, w * 0.32, h * 0.38);
  }

  function drawTree(ctx, x, y, scale) {
    const s = scale;
    ctx.fillStyle = "#171717";
    ctx.fillRect(x + 20 * s, y + 38 * s, 14 * s, 48 * s);
    ctx.fillStyle = "#8a5a34";
    ctx.fillRect(x + 24 * s, y + 42 * s, 8 * s, 42 * s);
    ctx.fillStyle = "#171717";
    ctx.fillRect(x + 4 * s, y + 18 * s, 48 * s, 32 * s);
    ctx.fillRect(x + 12 * s, y + 2 * s, 34 * s, 28 * s);
    ctx.fillRect(x, y + 34 * s, 62 * s, 26 * s);
    ctx.fillStyle = "#4f9f54";
    ctx.fillRect(x + 8 * s, y + 22 * s, 40 * s, 24 * s);
    ctx.fillRect(x + 16 * s, y + 6 * s, 26 * s, 22 * s);
    ctx.fillRect(x + 5 * s, y + 38 * s, 52 * s, 18 * s);
    ctx.fillStyle = "#70be68";
    ctx.fillRect(x + 20 * s, y + 16 * s, 14 * s, 10 * s);
    ctx.fillRect(x + 34 * s, y + 31 * s, 13 * s, 8 * s);
  }

  function drawFence(ctx, x, y) {
    ctx.fillStyle = "#171717";
    for (let i = 0; i < 5; i += 1) {
      ctx.fillRect(x + i * 22, y - 28, 10, 40);
    }
    ctx.fillRect(x - 4, y - 19, 124, 8);
    ctx.fillStyle = "#fff8df";
    for (let i = 0; i < 5; i += 1) {
      ctx.fillRect(x + 2 + i * 22, y - 24, 6, 32);
    }
    ctx.fillRect(x, y - 17, 116, 4);
  }

  function drawMailbox(ctx, x, y) {
    ctx.fillStyle = "#171717";
    ctx.fillRect(x + 18, y - 22, 54, 34);
    ctx.fillRect(x + 34, y + 10, 8, 34);
    ctx.fillStyle = "#4e9bc8";
    ctx.fillRect(x + 24, y - 16, 42, 22);
    ctx.fillStyle = "#ef8a87";
    ctx.fillRect(x + 50, y - 8, 8, 8);
    ctx.fillStyle = "#8a5a34";
    ctx.fillRect(x + 36, y + 12, 4, 30);
  }

  function drawFlowers(ctx, x, y) {
    for (let i = 0; i < 5; i += 1) {
      const fx = x + i * 13;
      ctx.fillStyle = "#4e8e38";
      ctx.fillRect(fx + 3, y + 4, 3, 10);
      ctx.fillStyle = i % 2 === 0 ? "#ef8a87" : "#f2c35b";
      ctx.fillRect(fx, y, 8, 8);
      ctx.fillStyle = "#fff8df";
      ctx.fillRect(fx + 3, y + 3, 2, 2);
    }
  }

  function drawGrassTufts(ctx, time) {
    for (let i = 0; i < 16; i += 1) {
      const x = (i * 37 + Math.floor(time / 160) % 37) % WORLD_W;
      const y = 219 + (i % 3) * 8;
      ctx.fillStyle = i % 2 === 0 ? "#4f9f54" : "#3e8d3d";
      ctx.fillRect(x, y, 3, 10);
      ctx.fillRect(x + 3, y + 4, 3, 6);
      ctx.fillRect(x - 3, y + 5, 3, 5);
    }
  }

  function drawDinoShadow(ctx, cx, y, width) {
    ctx.fillStyle = "rgba(23, 23, 23, 0.18)";
    ctx.fillRect(Math.round(cx - width / 2), y, Math.round(width), 4);
    ctx.fillRect(Math.round(cx - width / 2 + 8), y + 4, Math.round(width - 16), 3);
  }

  function drawStepDust(ctx, x, y, facing, time) {
    const phase = Math.floor(time / 120) % 4;
    for (let i = 0; i < 3; i += 1) {
      const size = 2 + ((phase + i) % 2);
      ctx.fillStyle = i % 2 === 0 ? "#d6bc72" : "#b99b5f";
      ctx.fillRect(Math.round(x - facing * (18 + i * 8)), Math.round(y - 2 - i * 2), size * 2, size);
    }
  }

  function drawPoops(ctx, count, location) {
    for (let i = 0; i < count; i += 1) {
      const x = 36 + i * 28;
      const y = location === "cabin" ? 202 : 198;
      ctx.fillStyle = "#171717";
      ctx.fillRect(x, y, 18, 6);
      ctx.fillRect(x + 4, y - 8, 12, 8);
      ctx.fillRect(x + 8, y - 14, 8, 6);
      ctx.fillStyle = "#8b5a2b";
      ctx.fillRect(x + 4, y, 10, 4);
      ctx.fillRect(x + 8, y - 8, 6, 6);
    }
  }

  function drawTombstone(ctx, x, y) {
    ctx.fillStyle = "#171717";
    ctx.fillRect(x + 10, y, 64, 74);
    ctx.fillStyle = "#b8b8b8";
    ctx.fillRect(x + 16, y + 6, 52, 62);
    ctx.fillStyle = "#8f8f8f";
    ctx.fillRect(x + 24, y + 18, 36, 6);
    ctx.fillRect(x + 34, y + 28, 16, 6);
    ctx.fillStyle = "#171717";
    ctx.fillRect(x + 30, y + 42, 24, 6);
    ctx.fillRect(x + 38, y + 34, 8, 22);
  }

  function drawBerry(ctx, x, y, time) {
    const bob = Math.sin(time / 120) * 3;
    ctx.fillStyle = "#171717";
    ctx.fillRect(x - 12, y - 8 + bob, 24, 20);
    ctx.fillStyle = "#ef5f76";
    ctx.fillRect(x - 8, y - 4 + bob, 16, 12);
    ctx.fillStyle = "#f5b2b0";
    ctx.fillRect(x - 2, y - 2 + bob, 4, 4);
    ctx.fillStyle = "#4e8e38";
    ctx.fillRect(x - 2, y - 12 + bob, 10, 6);
  }

  function drawSleepMarks(ctx, x, y, time) {
    ctx.fillStyle = "#171717";
    const rise = Math.floor((time / 250) % 18);
    ctx.fillRect(x, y - rise, 12, 4);
    ctx.fillRect(x + 8, y - rise - 8, 12, 4);
    ctx.fillRect(x + 20, y - rise - 16, 12, 4);
  }

  function drawActionEffect(ctx, action, bounds, time, facing) {
    if (!bounds || action === "idle" || action === "sleep") return;
    const side = facing === 1 ? 1 : -1;
    const frontX = facing === 1 ? bounds.x + bounds.w + 8 : bounds.x - 8;
    const baseY = bounds.y + bounds.h * 0.52;
    const pulse = Math.floor(Math.abs(Math.sin(time / 90)) * 4);

    if (action === "feed") drawFeedEffect(ctx, frontX, baseY, side, pulse, time);
    else if (action === "drink") drawDrinkEffect(ctx, frontX, baseY, side, pulse, time);
    else if (action === "clean") drawCleanEffect(ctx, bounds, time);
    else if (action === "pet") drawPetEffect(ctx, bounds, time);
    else if (action === "play" || action === "selfplay" || action === "hop") drawPlayEffect(ctx, bounds, time, side);
    else if (action === "hatch" || action === "evolve") drawSparkleBurst(ctx, bounds, time);
    else if (action === "wake") drawWakeEffect(ctx, bounds, time);
    else if (action === "look" || action === "sniff") drawLookEffect(ctx, frontX, baseY - 24, side);
    else if (action === "tired" || action === "sad") drawMoodEffect(ctx, bounds, action);
  }

  function drawFeedEffect(ctx, frontX, y, side, pulse, time) {
    const x = frontX + side * (6 + pulse);
    drawOutlinedRect(ctx, x - (side === 1 ? 0 : 24), y - 12, 24, 20, "#d99645");
    ctx.fillStyle = "#f2c35b";
    ctx.fillRect(x + side * 4 - (side === -1 ? 16 : 0), y - 8, 10, 8);
    ctx.fillStyle = "#171717";
    ctx.fillRect(x + side * 23 - (side === -1 ? 46 : 0), y + 5, 18, 5);
    ctx.fillStyle = "#fff8df";
    ctx.fillRect(x + side * 26 - (side === -1 ? 48 : 0), y + 6, 12, 3);
    drawPixel(ctx, x - side * 9, y - 18 + Math.floor(Math.sin(time / 80) * 2), "#d99645", 4);
    drawPixel(ctx, x - side * 17, y - 5, "#f2c35b", 3);
  }

  function drawDrinkEffect(ctx, frontX, y, side, pulse, time) {
    const x = frontX + side * (8 + pulse);
    drawOutlinedRect(ctx, x - (side === 1 ? 0 : 18), y - 20, 18, 32, "#7bb8df");
    ctx.fillStyle = "#e8f6ff";
    ctx.fillRect(x + side * 4 - (side === -1 ? 13 : 0), y - 14, 8, 18);
    for (let i = 0; i < 4; i += 1) {
      const dx = side * (22 + i * 7);
      drawPixel(ctx, frontX + dx, y - 12 + ((Math.floor(time / 100) + i) % 3) * 6, "#76c8f2", 4);
    }
  }

  function drawCleanEffect(ctx, bounds, time) {
    const showerX = bounds.x + bounds.w * 0.52;
    drawOutlinedRect(ctx, showerX - 22, bounds.y - 28, 44, 14, "#b5d9ec");
    ctx.fillStyle = "#171717";
    ctx.fillRect(showerX - 4, bounds.y - 14, 8, 18);
    for (let i = 0; i < 10; i += 1) {
      const x = bounds.x + 8 + (i * 17) % Math.max(20, bounds.w - 16);
      const y = bounds.y + 8 + ((Math.floor(time / 90) + i * 5) % Math.max(16, bounds.h - 8));
      drawBubble(ctx, x, y, i % 3 === 0 ? 8 : 5);
    }
    for (let i = 0; i < 7; i += 1) {
      drawPixel(ctx, bounds.x + bounds.w * 0.25 + i * 10, bounds.y + 2 + ((Math.floor(time / 80) + i) % 5) * 8, "#76c8f2", 3);
    }
  }

  function drawPetEffect(ctx, bounds, time) {
    for (let i = 0; i < 5; i += 1) {
      const x = bounds.x + bounds.w * (0.15 + i * 0.16);
      const y = bounds.y - 8 - ((Math.floor(time / 110) + i * 4) % 22);
      drawHeart(ctx, x, y, i % 2 === 0 ? "#ff7da0" : "#ef8a87");
    }
    drawOutlinedRect(ctx, bounds.x + bounds.w * 0.44, bounds.y - 18, 24, 12, "#fff8df");
    ctx.fillStyle = "#171717";
    ctx.fillRect(bounds.x + bounds.w * 0.44 + 5, bounds.y - 14, 4, 4);
    ctx.fillRect(bounds.x + bounds.w * 0.44 + 15, bounds.y - 14, 4, 4);
  }

  function drawPlayEffect(ctx, bounds, time, side) {
    const ballX = bounds.x + bounds.w * 0.5 + Math.sin(time / 120) * 42;
    const ballY = bounds.y + bounds.h + 4 - Math.abs(Math.sin(time / 120)) * 34;
    drawOutlinedRect(ctx, ballX - 12, ballY - 12, 24, 24, "#f2c35b");
    ctx.fillStyle = "#83c76f";
    ctx.fillRect(ballX - 8, ballY - 8, 8, 8);
    ctx.fillStyle = "#fff8df";
    ctx.fillRect(ballX + 2, ballY + 2, 6, 6);
    ctx.fillStyle = "#171717";
    ctx.fillRect(ballX - side * 48, ballY - 16, 18, 4);
    ctx.fillRect(ballX - side * 38, ballY - 8, 14, 4);
  }

  function drawSparkleBurst(ctx, bounds, time) {
    for (let i = 0; i < 12; i += 1) {
      const angle = i * Math.PI * 2 / 12 + time / 260;
      const radius = 34 + (i % 3) * 11 + Math.sin(time / 120 + i) * 5;
      const x = bounds.x + bounds.w / 2 + Math.cos(angle) * radius;
      const y = bounds.y + bounds.h / 2 + Math.sin(angle) * radius;
      drawSparkle(ctx, x, y, i % 2 === 0 ? "#fff0a3" : "#f2c35b");
    }
  }

  function drawWakeEffect(ctx, bounds, time) {
    const x = bounds.x + bounds.w * 0.68;
    const y = bounds.y - 18 + Math.sin(time / 90) * 3;
    drawSparkle(ctx, x, y, "#fff0a3");
    drawSparkle(ctx, x + 18, y + 12, "#f2c35b");
  }

  function drawLookEffect(ctx, frontX, y, side) {
    const x = frontX + side * 5;
    drawOutlinedRect(ctx, x - (side === 1 ? 0 : 24), y, 24, 18, "#fff8df");
    ctx.fillStyle = "#171717";
    ctx.fillRect(x + side * 8 - (side === -1 ? 14 : 0), y + 7, 4, 4);
    ctx.fillRect(x + side * 15 - (side === -1 ? 28 : 0), y + 7, 4, 4);
  }

  function drawMoodEffect(ctx, bounds, action) {
    const x = bounds.x + bounds.w + 8;
    const y = bounds.y + 10;
    ctx.fillStyle = "#171717";
    if (action === "tired") {
      ctx.fillRect(x, y, 12, 4);
      ctx.fillRect(x + 8, y - 8, 12, 4);
      ctx.fillRect(x + 18, y - 16, 12, 4);
    } else {
      ctx.fillRect(x, y, 22, 4);
      ctx.fillRect(x + 4, y + 8, 14, 4);
    }
  }

  function drawPixelDino(ctx, stage, x, y, s, colors, action, time) {
    if (stage === "adult") drawAdultDino(ctx, x, y, s, colors, action, time);
    else if (stage === "teen") drawTeenDino(ctx, x, y, s, colors, action, time);
    else drawBabyDino(ctx, x, y, s, colors, action, time);
    drawActionPoseDetails(ctx, x, y, s, stage, colors, action, time);

    if (action === "sad" || action === "tired") {
      rect(ctx, x, y, s, "#171717", 9, stage === "adult" ? 13 : 9, 4, 1);
    }
    if (action === "sniff") {
      rect(ctx, x, y, s, "#171717", 0, stage === "adult" ? 17 : 12, 1, 1);
      rect(ctx, x, y, s, "#171717", -2, stage === "adult" ? 16 : 11, 1, 1);
    }
  }

  function drawActionPoseDetails(ctx, x, y, s, stage, c, action, time) {
    const faceMap = {
      baby: { eye: [9, 7, 3, 5], mouth: [4, 14], cheek: [15, 11], bodyPatch: [8, 6, 7, 6] },
      teen: { eye: [14, 9, 4, 6], mouth: [6, 18], cheek: [21, 15], bodyPatch: [13, 8, 9, 7] },
      adult: { eye: [17, 10, 4, 7], mouth: [7, 20], cheek: [25, 17], bodyPatch: [16, 9, 10, 8] }
    }[stage] || { eye: [9, 7, 3, 5], mouth: [4, 14], cheek: [15, 11], bodyPatch: [8, 6, 7, 6] };
    const [eyeX, eyeY, eyeW, eyeH] = faceMap.eye;
    const [mouthX, mouthY] = faceMap.mouth;

    if (["wander", "look", "sniff"].includes(action) && Math.floor(time / 130) % 46 < 2) {
      rect(ctx, x, y, s, c.body, eyeX, eyeY, eyeW + 2, eyeH);
      rect(ctx, x, y, s, c.light, eyeX + 1, eyeY + 1, Math.max(1, eyeW - 1), 1);
      rect(ctx, x, y, s, "#171717", eyeX, eyeY + Math.floor(eyeH / 2), eyeW + 2, 1);
    }

    if (["pet", "play", "selfplay", "sleep"].includes(action)) {
      const [patchX, patchY, patchW, patchH] = faceMap.bodyPatch;
      rect(ctx, x, y, s, c.body, patchX, patchY, patchW, patchH);
      rect(ctx, x, y, s, c.light, patchX + 1, patchY + 1, Math.max(1, patchW - 4), 1);
      rect(ctx, x, y, s, "#171717", eyeX, eyeY + Math.floor(eyeH / 2), eyeW + 2, 1);
      rect(ctx, x, y, s, "#171717", mouthX + 2, mouthY + 2, 5, 1);
      rect(ctx, x, y, s, c.cheek, faceMap.cheek[0], faceMap.cheek[1], 2, 2);
    }

    if (action === "feed" || action === "drink") {
      rect(ctx, x, y, s, "#171717", mouthX + 1, mouthY, 5, 4);
      rect(ctx, x, y, s, action === "feed" ? "#ef8a87" : "#76c8f2", mouthX + 2, mouthY + 2, 3, 1);
      rect(ctx, x, y, s, "#171717", mouthX + 6, mouthY + 3, 3, 1);
    }

    if (action === "clean") {
      for (let i = 0; i < 4; i += 1) {
        const bx = faceMap.cheek[0] + i * 3;
        const by = faceMap.cheek[1] + ((Math.floor(time / 100) + i) % 3);
        rect(ctx, x, y, s, "#e8f6ff", bx, by, 2, 2);
        rect(ctx, x, y, s, "#76c8f2", bx + 1, by + 1, 1, 1);
      }
    }

    if (action === "evolve" || action === "hatch") {
      rect(ctx, x, y, s, "#fff0a3", eyeX + eyeW + 2, eyeY - 2, 2, 2);
      rect(ctx, x, y, s, "#fff0a3", mouthX + 8, mouthY - 5, 1, 4);
      rect(ctx, x, y, s, "#fff0a3", mouthX + 7, mouthY - 4, 3, 1);
    }
  }

  function drawFacingDino(ctx, stage, x, y, width, s, colors, action, time, facing) {
    // The procedural sprite is authored facing left; flip it when walking right.
    if (facing === -1) {
      drawPixelDino(ctx, stage, x, y, s, colors, action, time);
      return;
    }

    ctx.save();
    ctx.translate(Math.round(x + width), 0);
    ctx.scale(-1, 1);
    drawPixelDino(ctx, stage, 0, y, s, colors, action, time);
    ctx.restore();
  }

  function drawBabyDino(ctx, x, y, s, c, action, time) {
    const pose = dinoPose(action, time);
    tail(ctx, x, y, s, c, 20, 13 + pose.tail, 4);
    box(ctx, x, y, s, c, 10, 12, 13, 10);
    box(ctx, x, y, s, c, 2, 4, 16, 10);
    box(ctx, x, y, s, c, 0, 9, 13, 7);
    belly(ctx, x, y, s, c, 12, 15, 6, 7);
    leg(ctx, x, y, s, c, 8, 21, pose.backLeg, -pose.stepShift);
    leg(ctx, x, y, s, c, 18, 21, pose.frontLeg, pose.stepShift);
    arm(ctx, x, y, s, c, 19 + pose.armX, 15 + pose.armY);
    face(ctx, x, y, s, c, 9, 7, 3, 5, 3, 12);
    spikes(ctx, x, y, s, c, [[9, 1], [15, 3], [20, 8], [21, 12]]);
    dinoDetails(ctx, x, y, s, c, "baby");
  }

  function drawTeenDino(ctx, x, y, s, c, action, time) {
    const pose = dinoPose(action, time);
    tail(ctx, x, y, s, c, 30, 18 + pose.tail, 6);
    box(ctx, x, y, s, c, 15, 15, 18, 13);
    box(ctx, x, y, s, c, 4, 5, 22, 13);
    box(ctx, x, y, s, c, 0, 12, 18, 9);
    belly(ctx, x, y, s, c, 17, 19, 8, 10);
    leg(ctx, x, y, s, c, 14, 28, pose.backLeg, -pose.stepShift);
    leg(ctx, x, y, s, c, 27, 28, pose.frontLeg, pose.stepShift);
    arm(ctx, x, y, s, c, 29 + pose.armX, 19 + pose.armY);
    face(ctx, x, y, s, c, 14, 9, 4, 6, 4, 16);
    spikes(ctx, x, y, s, c, [[14, 1], [21, 4], [27, 9], [31, 15]]);
    dinoDetails(ctx, x, y, s, c, "teen");
  }

  function drawAdultDino(ctx, x, y, s, c, action, time) {
    const pose = dinoPose(action, time);
    tail(ctx, x, y, s, c, 40, 21 + pose.tail, 8);
    box(ctx, x, y, s, c, 20, 17, 23, 17);
    box(ctx, x, y, s, c, 6, 5, 26, 15);
    box(ctx, x, y, s, c, 0, 13, 21, 10);
    belly(ctx, x, y, s, c, 22, 22, 10, 14);
    leg(ctx, x, y, s, c, 18, 35, pose.backLeg, -pose.stepShift);
    leg(ctx, x, y, s, c, 34, 35, pose.frontLeg, pose.stepShift);
    arm(ctx, x, y, s, c, 35 + pose.armX, 22 + pose.armY);
    face(ctx, x, y, s, c, 17, 10, 4, 7, 5, 18);
    spikes(ctx, x, y, s, c, [[17, 0], [25, 3], [32, 8], [38, 15], [41, 22]]);
    dinoDetails(ctx, x, y, s, c, "adult");
  }

  function dinoPose(action, time) {
    const step = Math.sin(time / 120);
    const slow = Math.sin(time / 210);
    const pose = { frontLeg: 0, backLeg: 0, stepShift: 0, armX: 0, armY: 0, tail: 0 };

    if (["wander", "sniff"].includes(action)) {
      pose.frontLeg = step > 0 ? 1 : 0;
      pose.backLeg = step > 0 ? 0 : 1;
      pose.stepShift = step > 0 ? 1 : -1;
      pose.tail = slow > 0 ? -1 : 1;
    } else if (["play", "selfplay", "hop"].includes(action)) {
      pose.frontLeg = 1;
      pose.backLeg = 1;
      pose.armX = -1;
      pose.armY = -3;
      pose.tail = Math.sin(time / 80) > 0 ? -2 : 1;
    } else if (action === "pet") {
      pose.armY = -2;
      pose.tail = Math.sin(time / 70) > 0 ? -2 : 2;
    } else if (action === "feed" || action === "drink") {
      pose.armX = -2;
      pose.armY = -1;
      pose.tail = 1;
    } else if (action === "clean") {
      pose.frontLeg = Math.sin(time / 90) > 0 ? 1 : 0;
      pose.backLeg = pose.frontLeg ? 0 : 1;
      pose.tail = Math.sin(time / 80) > 0 ? -1 : 1;
    } else if (action === "tired" || action === "sad") {
      pose.armY = 1;
      pose.tail = 2;
    } else if (action === "sleep") {
      pose.frontLeg = 1;
      pose.backLeg = 1;
      pose.armY = 1;
      pose.tail = 2;
    }

    return pose;
  }

  function dinoDetails(ctx, x, y, s, c, stage) {
    const details = {
      baby: {
        light: [[6, 6, 3, 1], [12, 13, 4, 1], [13, 16, 2, 1], [17, 13, 3, 1]],
        dark: [[10, 20, 5, 1], [18, 19, 3, 1], [21, 14, 2, 1], [5, 14, 5, 1]],
        skin: [[7, 11, 1, 1], [10, 12, 1, 1], [15, 8, 1, 1]],
        claws: [[9, 24], [19, 24]]
      },
      teen: {
        light: [[8, 7, 6, 1], [11, 10, 4, 1], [19, 17, 6, 1], [20, 21, 3, 1], [27, 17, 3, 1]],
        dark: [[12, 26, 8, 1], [26, 26, 5, 1], [31, 20, 2, 2], [5, 20, 8, 1], [22, 12, 4, 1]],
        skin: [[9, 14, 1, 1], [13, 16, 1, 1], [20, 11, 1, 1], [25, 22, 1, 1]],
        claws: [[15, 31], [28, 31]]
      },
      adult: {
        light: [[10, 7, 7, 1], [13, 11, 5, 1], [24, 19, 8, 1], [24, 25, 4, 1], [33, 18, 5, 1], [39, 23, 3, 1]],
        dark: [[18, 33, 10, 1], [33, 33, 8, 1], [38, 25, 3, 2], [7, 22, 9, 1], [27, 14, 5, 1], [41, 21, 3, 1]],
        skin: [[10, 17, 1, 1], [14, 19, 1, 1], [23, 13, 1, 1], [31, 27, 1, 1], [36, 20, 1, 1]],
        claws: [[19, 38], [35, 38]]
      }
    }[stage];

    details.light.forEach(([rx, ry, rw, rh]) => rect(ctx, x, y, s, c.light, rx, ry, rw, rh));
    details.dark.forEach(([rx, ry, rw, rh]) => rect(ctx, x, y, s, c.dark, rx, ry, rw, rh));
    details.skin.forEach(([rx, ry, rw, rh]) => rect(ctx, x, y, s, c.light, rx, ry, rw, rh));
    details.claws.forEach(([rx, ry]) => {
      rect(ctx, x, y, s, "#171717", rx, ry, 6, 1);
      rect(ctx, x, y, s, "#fff8df", rx + 1, ry, 4, 1);
    });
  }

  function box(ctx, x, y, s, c, rx, ry, rw, rh) {
    roundedPixelRect(ctx, x, y, s, "#171717", rx, ry, rw, rh);
    roundedPixelRect(ctx, x, y, s, c.body, rx + 1, ry + 1, rw - 2, rh - 2);
    rect(ctx, x, y, s, c.light, rx + 3, ry + 2, Math.max(1, Math.floor(rw / 3)), 2);
    rect(ctx, x, y, s, c.dark, rx + rw - 5, ry + rh - 4, 3, 2);
  }

  function belly(ctx, x, y, s, c, rx, ry, rw, rh) {
    roundedPixelRect(ctx, x, y, s, "#171717", rx - 1, ry - 1, rw + 2, rh + 2);
    roundedPixelRect(ctx, x, y, s, c.belly, rx, ry, rw, rh);
    rect(ctx, x, y, s, "#f6ead0", rx + rw - 3, ry + 2, 2, rh - 4);
  }

  function leg(ctx, x, y, s, c, rx, ry, lift = 0, shift = 0) {
    rect(ctx, x, y, s, "#171717", rx + shift, ry - lift, 6, 4);
    rect(ctx, x, y, s, c.body, rx + shift + 1, ry - lift, 4, 3);
    rect(ctx, x, y, s, c.belly, rx + shift + 1, ry + 3 - lift, 5, 1);
  }

  function arm(ctx, x, y, s, c, rx, ry) {
    rect(ctx, x, y, s, "#171717", rx, ry, 5, 8);
    rect(ctx, x, y, s, c.body, rx + 1, ry + 1, 3, 6);
  }

  function tail(ctx, x, y, s, c, rx, ry, size) {
    roundedPixelRect(ctx, x, y, s, "#171717", rx, ry + 1, size + 5, 6);
    roundedPixelRect(ctx, x, y, s, c.body, rx + 1, ry + 2, size + 3, 4);
    rect(ctx, x, y, s, "#171717", rx + size + 2, ry, 4, 8);
    rect(ctx, x, y, s, c.body, rx + size + 2, ry + 1, 3, 6);
    rect(ctx, x, y, s, c.light, rx + size + 3, ry + 2, 1, 2);
  }

  function face(ctx, x, y, s, c, eyeX, eyeY, eyeW, eyeH, noseX, mouthY) {
    rect(ctx, x, y, s, "#171717", eyeX, eyeY, eyeW, eyeH);
    rect(ctx, x, y, s, "#ffffff", eyeX + eyeW - 1, eyeY, 1, eyeH);
    rect(ctx, x, y, s, "#171717", noseX, mouthY - 3, 1, 1);
    rect(ctx, x, y, s, "#171717", noseX + 2, mouthY + 2, 6, 1);
    rect(ctx, x, y, s, c.cheek, eyeX + 6, mouthY - 1, 2, 2);
    rect(ctx, x, y, s, "#ffffff", eyeX + eyeW, eyeY + 1, 1, Math.max(1, eyeH - 2));
  }

  function spikes(ctx, x, y, s, c, points) {
    points.forEach(([rx, ry]) => {
      rect(ctx, x, y, s, "#171717", rx + 1, ry, 3, 1);
      rect(ctx, x, y, s, "#171717", rx, ry + 1, 5, 4);
      rect(ctx, x, y, s, c.spine, rx + 1, ry + 1, 3, 3);
      rect(ctx, x, y, s, "#f3aaa4", rx + 2, ry + 1, 1, 1);
    });
  }

  function roundedPixelRect(ctx, x, y, s, color, rx, ry, rw, rh) {
    for (let row = 0; row < rh; row += 1) {
      const corner = row === 0 || row === rh - 1 ? 2 : row === 1 || row === rh - 2 ? 1 : 0;
      const width = Math.max(1, rw - corner * 2);
      rect(ctx, x, y, s, color, rx + corner, ry + row, width, 1);
    }
  }

  function rect(ctx, x, y, s, color, rx, ry, rw, rh) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x + rx * s), Math.round(y + ry * s), rw * s, rh * s);
  }

  function drawPixel(ctx, x, y, color, size) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), size, size);
  }

  function drawOutlinedRect(ctx, x, y, width, height, color) {
    ctx.fillStyle = "#171717";
    ctx.fillRect(Math.round(x), Math.round(y), width, height);
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x + 3), Math.round(y + 3), width - 6, height - 6);
  }

  function drawBubble(ctx, x, y, size) {
    ctx.fillStyle = "#171717";
    ctx.fillRect(Math.round(x), Math.round(y), size, size);
    ctx.fillStyle = "#e8f6ff";
    ctx.fillRect(Math.round(x + 2), Math.round(y + 2), size - 4, size - 4);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(Math.round(x + 3), Math.round(y + 3), Math.max(2, size - 7), 2);
  }

  function drawHeart(ctx, x, y, color) {
    ctx.fillStyle = "#171717";
    ctx.fillRect(Math.round(x), Math.round(y + 4), 16, 14);
    ctx.fillRect(Math.round(x + 4), Math.round(y), 4, 4);
    ctx.fillRect(Math.round(x + 12), Math.round(y), 4, 4);
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x + 3), Math.round(y + 5), 10, 8);
    ctx.fillRect(Math.round(x + 5), Math.round(y + 2), 3, 3);
    ctx.fillRect(Math.round(x + 11), Math.round(y + 2), 3, 3);
    ctx.fillStyle = "#f8b9c8";
    ctx.fillRect(Math.round(x + 5), Math.round(y + 6), 3, 3);
  }

  function drawSparkle(ctx, x, y, color) {
    ctx.fillStyle = "#171717";
    ctx.fillRect(Math.round(x), Math.round(y - 6), 6, 18);
    ctx.fillRect(Math.round(x - 6), Math.round(y), 18, 6);
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x + 2), Math.round(y - 4), 2, 14);
    ctx.fillRect(Math.round(x - 4), Math.round(y + 2), 14, 2);
  }

  function drawSprite(ctx, rows, x, y, scale, colors) {
    rows.forEach((row, rowIndex) => {
      [...row].forEach((char, colIndex) => {
        const color = colors[char];
        if (!color) return;
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x + colIndex * scale), Math.round(y + rowIndex * scale), scale, scale);
      });
    });
  }

  function dinoColors(game) {
    const palette = LG.Assets.palettes[game.paletteIndex % LG.Assets.palettes.length];
    return {
      body: palette.body,
      light: palette.light,
      dark: palette.dark,
      belly: palette.belly,
      spine: palette.spine,
      cheek: "#ef9c8f",
      B: "#171717",
      K: "#171717",
      G: palette.body,
      L: palette.light,
      D: palette.dark,
      W: palette.belly,
      P: palette.spine,
      C: "#ef9c8f"
    };
  }

  function maxRow(rows) {
    return Math.max(...rows.map((row) => row.length));
  }

  LG.Renderer = { create };
})();
