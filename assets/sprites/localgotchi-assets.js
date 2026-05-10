(() => {
  "use strict";

  const LG = window.Localgotchi = window.Localgotchi || {};

  LG.Assets = {
    palettes: [
      { body: "#78bd56", light: "#a7d979", dark: "#4e8e38", belly: "#fff8df", spine: "#ef8a87" },
      { body: "#5fb4d8", light: "#94d8ee", dark: "#367fa1", belly: "#fff8df", spine: "#f2c35b" },
      { body: "#c884de", light: "#dfb2ef", dark: "#8c55ad", belly: "#fff8df", spine: "#83c76f" },
      { body: "#e6a84f", light: "#f5cf75", dark: "#ad7430", belly: "#fff8df", spine: "#7bb8df" },
      { body: "#ef7f8f", light: "#f3a8b3", dark: "#b84d61", belly: "#fff8df", spine: "#ad92d6" }
    ],
    dinoStages: {
      baby: { scale: 3, width: 27, height: 25, ground: 208 },
      teen: { scale: 3, width: 37, height: 32, ground: 209 },
      adult: { scale: 3, width: 48, height: 39, ground: 210 }
    },
    sprites: {
      egg: [
        "......BBBBBB......",
        "....BBEEEEEEBB....",
        "...BEEEEELEEEEB...",
        "..BEEEEELLEEEEEB..",
        ".BEEEEEEEEEEEEEEB.",
        ".BEEEPEEEEEPEEEEB.",
        "BEEEEPPPEEEEEEEEQB",
        "BEEEEEEEEEEQEEEEEQB",
        "BEEEEEEEQQQEEEEEEB",
        ".BEEEEEEEEEEEEEEB.",
        ".BEEEEEEPEEEEEEEB.",
        "..BEEEEPPPEEEEEB..",
        "...BBEEEEEEEEBB...",
        ".....BBBBBBBB....."
      ],
      baby: [
        "...........PPP........",
        "..........PGGGP.......",
        ".......BBBBGGGGB......",
        ".....BBGGGGGGGGGB.....",
        "....BGGGGGGGGGGGGB....",
        "...BGGGKWWGGGGGGGGB...",
        "...BGGGGGGGGWWGGGGB...",
        "...BGGGGGGGWWWWWGGBB..",
        "....BGGGGGGWWWWGBBGB..",
        ".....BBBBGGGWWGBBGB...",
        "......BGGGGGGGGBB.....",
        ".....BGGGGBBGGB.......",
        "....BGGGGB..BGGB......",
        "...BGGBB....BGB.......",
        "...BB.......BB........"
      ],
      teen: [
        "..............PPP...........",
        ".............PGGGP..........",
        "...........BBGGGGGB.........",
        "........BBBBGGGGGGGB........",
        "......BBGGGGGGGGGGGGB.......",
        ".....BGGGGGGGGGGGGGGGB......",
        "....BGGGGKWGGGGGGGGGGB......",
        "....BGGGGGGGGGWWGGGGGBB.....",
        ".....BGGGGGGGWWWWWWGGGB.....",
        "......BGGGGGGWWWWWWGGBB.....",
        ".......BBBBGGGWWWWGBBGB.....",
        "....BBBBGGGGGGGGGGGBBGB.....",
        "...BGGGGGGGGGGGGGGGGGB......",
        "..BGGGGGGGGGGGGGGGGGB.......",
        ".BGGGGBBGGGGGGGGGGBB........",
        ".BGGBB..BGGGGBBGGGB.........",
        ".BB.....BGGB...BGGB.........",
        "........BGB.....BGB.........",
        "........BB......BB.........."
      ],
      adult: [
        "................PPPP.............",
        "...............PGGGGP............",
        ".............BBGGGGGGB...........",
        "...........BBGGGGGGGGGB..........",
        ".........BBGGGGGGGGGGGGB.........",
        "........BGGGGGGGGGGGGGGGB........",
        ".......BGGGGKWGGGGGGGGGGGB.......",
        ".......BGGGGGGGGGWWGGGGGGBB......",
        "........BGGGGGGGWWWWWWGGGGB......",
        ".........BGGGGGGWWWWWWGGGBB......",
        "..........BBBBGGGWWWWWGBBGB......",
        ".....BBBBBGGGGGGGWWWWGGBBGB......",
        "...BBGGGGGGGGGGGGGGGGGGGGB.......",
        "..BGGGGGGGGGGGGGGGGGGGGGBB.......",
        ".BGGGGGGGGGGGGGGGGGGGGGB.........",
        ".BGGGGBBGGGGGGGGGGGGGGB..........",
        "..BGGB..BGGGGGGGGBBGGB...........",
        "...BB...BGGGGBBGB..BGGB..........",
        "........BGGB..BB....BGB..........",
        "........BGB.........BGB..........",
        "........BB..........BB..........."
      ]
    },
    eggColors: { B: "#171717", E: "#fff8df", L: "#ffffff", Q: "#f1dfb7", P: "#ef8a87" }
  };
})();
