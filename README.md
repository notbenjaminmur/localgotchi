# Localgotchi

Localgotchi est un petit jeu type Tamagotchi en pixel art, construit pour tourner entièrement dans une page web. Il n'y a pas de backend, pas de compte utilisateur et pas de base de données : toute la partie est sauvegardée dans le `localStorage` du navigateur.

## Fonctionnalites

- Dyno local avec trois stades d'evolution : bebe, ado, adulte.
- Eclosion depuis un oeuf, couleur et evenements bases sur une seed de partie.
- Besoins a gerer : faim, soif, bonheur, energie, hygiene et sante.
- Actions principales : manger, boire, laver, jouer, caliner, dormir, changer de decor et lancer un mini-jeu.
- Progression hors session calculee avec des timestamps.
- Sauvegarde automatique periodique, plus sauvegarde lors des actions et de la fermeture de page.
- PWA installable avec manifest et service worker.

## Lancer le jeu

Ouvre directement le fichier :

```bash
open index.html
```

Le projet est aussi pret pour GitHub Pages : il suffit de servir la racine du depot. Aucun build, serveur applicatif ou dependance npm n'est necessaire.

## Structure

```text
index.html                  Page principale
style.css                   Interface fullscreen et responsive
main.js                     Point d'entree
src/config.js               Constantes de gameplay
src/simulation.js           Regles de temps, besoins, evolution et mort
src/storage.js              Sauvegarde localStorage
src/renderer.js             Rendu canvas pixel art et animations
src/ui.js                   Boutons, HUD et interactions
assets/icons/               Icône PWA
assets/sprites/             Assets/procedures de sprites
manifest.webmanifest        Configuration PWA
sw.js                       Cache offline
```

## Notes de gameplay

Localgotchi reste volontairement indulgent : le temps continue entre deux sessions, mais le dyno peut generalement etre recupere si le joueur revient s'en occuper. La mort n'arrive qu'apres une longue negligence.

Le bouton `Reset` lance une nouvelle partie et affiche un avertissement, car cela supprime le dyno actuel.

## Developpement

Le code est en HTML, CSS et JavaScript vanilla. Les scripts ne sont pas en modules ES afin que le jeu puisse aussi fonctionner via une ouverture directe du fichier HTML.

Apres modification d'assets ou de fichiers caches par la PWA, pense a incrementer la version de cache dans `sw.js`.
