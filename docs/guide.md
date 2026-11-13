# Author, print and play a paper puzzle

This guide describes Paper Portal 0.1.0. Start with the simulator to understand your rules, then verify your own physical cards and camera setup.

## Open the studio

From a checkout with Node.js 24 LTS installed:

```sh
npm ci
npm run dev
```

Open the printed local address. The startup command builds the embedded player runtime automatically before starting Vite.

## Explore a project in the simulator

Choose **Play puzzle** in the studio, then select **Use simulator** in the player. The **In view** checkboxes control card presence, **Place** controls horizontal position, and **Turn ↻** controls clockwise rotation. Inspect the active stage's condition and keep it stable until the progress bar completes. A solved stage applies its authored scene and advances to the next beat.

For the included **The midnight observatory** sample:

1. Select **Key** as visible and keep it visible until **Wake the console** completes.
2. Show **Sun**, **Key** and **Moon** together at positions 1, 2 and 3. Hold this left-to-right order until **Align the sky keys** completes.
3. In the final stage, first keep **Key** visible long enough to be recognized in that stage. Then hide **Key** while keeping **Sun** visible continuously. After absence confirmation and the stage hold, the portal opens.

The simulator is an authoring input source. It reports simulated observations and is labelled accordingly. Completing a simulated game is not camera-detection evidence.

Use **Restart game** when you want to return to the first stage. **Stop camera**, source changes and hiding the page clear pending evidence while preserving already solved beats. There is no separate Pause button. If the page becomes hidden while simulating, toggle **Use simulator** to resume or choose **Restart game** to begin again.

## Define your cards

In **Your paper keys**, use **Add card** to build a deck of 3–8 cards. Give each a short, distinguishable label and choose its display color. The black-and-white ARUCO marker identifies a card; its decorative label and color help a person recognize it. Only one copy of each card ID should appear in view.

Removing a referenced card automatically adjusts affected rules to the remaining deck. Review every affected story beat after a removal.

Keep the marker code, its black border and surrounding white area unobstructed when printing or decorating a card. A changed or partly covered marker may no longer be recognizable.

## Author the stages

A project contains 1–8 stages. Use **Add a story beat**, select a beat under **Story beats**, and edit **Stage title**, **Player instruction**, **Success message**, **Scene** and **Unlock condition**. The scene presets are **Night observatory**, **Signal console**, **Sealed gate** and **Open portal**. The player starts at night and applies a beat's scene when that beat is solved; the editor's illustration is a preview, not progression evidence.

| Rule                     | Physical action                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Show cards together      | Keep all selected cards visible at the same time.                                                                  |
| Hide one, keep a witness | First show the target stably during this stage, then remove it while the selected different witness stays visible. |
| Arrange left to right    | Arrange the selected cards in the authored order, in a roughly shared row with clear horizontal spacing.           |
| Rotate a card            | Hold the selected card at 0°, 90°, 180° or 270° clockwise from its printed upright direction.                      |

Use the sequence arrows to adjust an order rule. Set **HOLD TO CONFIRM** between 200 and 3,000 milliseconds. Test one condition at a time while authoring. Choose labels that help a player understand the action without printing the solution on the marker itself.

### Why hiding needs a witness

An empty frame can mean a hidden card, a covered lens, a stopped stream or a lost camera. Paper Portal therefore requires the authored target to appear in at least two fresh frames spanning 100 ms in the current stage. After it disappears, the authored witness must remain visible for a 500 ms absence confirmation and then the project's hold duration. Simply switching off the camera cannot complete a hidden stage.

Frame gaps and ambiguous observations reset pending progress. If a condition almost completes and then drops, re-establish a clear stable view rather than leaving the camera stopped.

## Print the deck

Choose **Print cards** in the studio, allow its print pop-up, then choose **Print cards** in that view. Use A4 portrait at **100% / Actual size**. Cards are 90 × 80 mm with a 55 × 55 mm marker area; six cards fit on a sheet. Keep the marker's black-and-white contrast clear. Cut around the outer dashed card border, keeping the marker's white surround intact. Print one test page before preparing a full activity.

Check the resulting cards with the actual camera and intended lighting. A clean-looking preview does not guarantee recognition from a distant or out-of-focus webcam.

## Start the real camera

Choose **Play puzzle**, then **Start camera**, and accept the browser permission prompt if you want to play that way. The application requests video, not microphone audio. Place printed cards flat in a well-lit view; avoid glare and heavy shadows. The view is unmirrored: order and clockwise turns are interpreted as shown in the camera preview.

Use a secure context: HTTPS or a local address such as localhost. Camera behavior from a downloaded file can vary by browser policy. If opening an exported HTML file directly does not permit a camera, serve it over a local HTTP address or use the simulator; do not assume file-based camera access works everywhere.

**Stop camera** releases its media tracks. Switching sources, hiding/leaving the page, closing the embedded player and completing a camera-driven game also stop the relevant camera session. Re-establish the current stage's evidence after a stop or source change, or choose **Restart game** for a fresh sequence.

## Save and reopen the project

Choose **Save project** while authoring and **Open project** to reopen its JSON. The project describes cards, stages and scenes; it is not a video recording or a saved camera stream. The studio accepts project files up to 2 MiB.

Save before refreshing or leaving the page. Keep your own copy of projects you want to retain; GitHub backs up the application source, not your unsaved studio session.

## Export an independent player

Choose **Download game** when your rules are ready. The player includes the project and runtime, so it does not need a detector CDN or a running studio to present the game. Share the card printout along with the player so the recipient has the matching physical deck.

Review the game's wording before sharing. The exported file contains the authored content. Camera permission remains controlled by the recipient's browser and the context where they open the file.

### Serve the exported file on localhost

The repository includes a small helper for browsers that require a local HTTP context for camera access. From the project checkout, pass the path to the exported HTML file:

```sh
npm run serve:player -- "path/to/game.html"
```

Replace the quoted path with your actual downloaded file. Open `http://127.0.0.1:4180/`, or the address printed by the helper. It serves only that selected file at `/`, accepts no uploads, and does not start the studio. Stop it with Ctrl+C when you finish.

To choose another port, supply a second positional argument:

```sh
npm run serve:player -- "path/to/game.html" 4181
```

The helper accepts HTML files up to 4 MiB and requires Node.js. Camera permission still belongs to the browser. You can also use the exported player's simulator without a camera.

## Troubleshooting

| What happens                            | What to check                                                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Camera controls are unavailable         | Check secure-context support and browser permission. Use localhost/HTTPS rather than assuming direct-file access. |
| A marker is not recognized              | Improve lighting/focus, reduce glare, move the card closer, and verify its border and white surround are intact.  |
| A hidden-card stage will not advance    | First establish the target stably in that stage, then remove it while a different card remains clearly visible.   |
| Progress resets                         | Check for a frame gap, duplicate/ambiguous markers, changing orientation or a source change.                      |
| Simulator works but the camera does not | Simulated observations bypass image recognition. Verify the real printed deck and camera independently.           |
| JSON import is rejected                 | Use a supported Paper Portal project and inspect the readable validation error.                                   |
| Export build fails in a fresh checkout  | Run npm ci and the normal dev/build command; the tracked player build script creates the ignored runtime.         |

For a reproducible issue, see [CONTRIBUTING.md](../CONTRIBUTING.md). Use synthetic cards and observations for public reports whenever possible.
