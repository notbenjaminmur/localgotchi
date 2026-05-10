# Repository Guidelines

## Project Vision

Localgotchi is a browser-only Tamagotchi-style game for GitHub Pages. There is no backend, login, remote database, or required build service. The player hatches an egg, gets a small pixel-art dyno, and cares for it across sessions. Time away matters, but the game stays gentle: recovery is usually possible unless the dyno has been neglected for a long time.

## Project Structure & Module Organization

Keep the app simple and local-first:

- `index.html` for the page shell and root UI.
- `style.css` for layout, pixel-art styling, and responsive rules.
- `main.js` only starts the app after the DOM is ready.
- `manifest.webmanifest` and `sw.js` for PWA install/offline support.
- `src/` for classic browser scripts: `config.js`, `utils.js`, `storage.js`, `simulation.js`, `renderer.js`, `ui.js`, `app.js`.
- `assets/` for local sprites, icons, sounds, and fixtures. Sprite maps live in `assets/sprites/localgotchi-assets.js`.

Avoid frameworks and heavy dependencies that compromise static hosting.

## Build, Test, and Development Commands

Use vanilla HTML, CSS, and JavaScript. Opening `index.html` in a browser should work. Use ordered classic scripts instead of ES module imports so direct file opening stays compatible. No backend or app server is required.

## Gameplay & Persistence Rules

Persist all state in `localStorage`. Store at least `createdAt`, `lastSavedAt`, `lastTickAt`, `seed`, dyno color, evolution stage, needs, health, active events, and minigame progress. Save after player actions, on page hide/unload, and periodically every few seconds so abrupt closes keep a recent save point. Use timestamps to calculate elapsed time between sessions and apply hunger, thirst, energy, hygiene, happiness, poop, sleep, growth, illness, and death rules.

Each new game must generate a seed for deterministic variation in events, personality, timing, and dyno color.

## Visual & Interaction Direction

Use pixel art inspired by the reference: Yoshi-like dyno, thick black outlines, limited palette, simple shading, and three stages: baby, teen, adult. UI uses pixel-style panels, icons, and gauges.

Prefer Canvas 2D for animated sprites, side-scrolling scenery, movement, and minigames. SVG is fine for simple icons. The dyno should idle, walk, sleep, eat, play, react to being pet, and show state changes.

## Coding Style & Testing Guidelines

Use plain, readable JavaScript with small functions and explicit state transitions. Keep simulation logic separate from rendering so time calculations can be tested. Add focused tests for timestamp decay, seeded randomness, evolution, death, and recovery rules when a test setup exists.

## Commit & Pull Request Guidelines

This directory has no Git history yet. Use concise imperative commits such as `Add localStorage save state` or `Implement hunger decay`. PRs should summarize gameplay changes, list manual tests, and include screenshots or recordings for visual updates.
