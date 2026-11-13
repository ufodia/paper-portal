# Cards, rules and core reference

This reference describes Paper Portal 0.1.0. The source contracts are in src/core.ts and src/markers.ts. There is no application HTTP API.

## Version-1 project

| Field       | Type and bounds                             |
| ----------- | ------------------------------------------- |
| version     | Exactly 1                                   |
| name        | 1–120 readable characters                   |
| description | 0–800 readable characters                   |
| cards       | 3–8 Card objects                            |
| stages      | 1–8 Stage objects, evaluated in array order |
| holdMs      | Integer from 200 to 3,000 milliseconds      |

Validation returns a copied project, trims text, lowercases colors and discards unknown fields. Authored JSON cannot supply a runtime script. Text rejects unsupported control characters.

A Card has **id**, **label** and **color**. IDs are unique integers from 0 to 7, labels contain 1–32 readable characters, and colors use a six-digit hexadecimal form such as #bfa7f4.

A Stage has **id**, **title**, **instruction**, **successText**, **scene** and **rule**. Stage IDs are unique 1–48-character strings containing only letters, numbers, underscores and dashes. Title, instruction and success text limits are 80, 500 and 200 characters respectively, all nonempty. Scene is night, console, gate or portal.

The studio additionally limits imported JSON files to 2 MiB.

## Rule objects

| Rule     | Shape                                                      | Meaning                                                                                                 |
| -------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Visible  | kind: visible; ids: number[]                               | All selected cards must be visible together.                                                            |
| Hidden   | kind: hidden; target: number; witness: number              | Acquire the target in this stage, then confirm its absence while the specified witness remains visible. |
| Order    | kind: order; ids: number[]                                 | Selected cards must appear in the specified left-to-right order and a roughly shared row.               |
| Rotation | kind: rotation; id: number; quarterTurn: 0, 90, 180 or 270 | The target's clockwise orientation must match the requested quarter turn.                               |

Visible rules reference 1–8 cards; order rules reference 2–8. References must be unique and belong to this project's deck. A hidden target and witness must differ. Additional known cards may be visible without invalidating a visible, order or rotation rule; unknown or duplicate detections invalidate the frame.

A complete minimal project:

```json
{
  "version": 1,
  "name": "A paper doorway",
  "description": "Show the key to wake the console.",
  "holdMs": 650,
  "cards": [
    { "id": 0, "label": "Sun", "color": "#f2cb75" },
    { "id": 1, "label": "Key", "color": "#bfa7f4" },
    { "id": 2, "label": "Moon", "color": "#8fd0da" }
  ],
  "stages": [
    {
      "id": "wake",
      "title": "Wake the console",
      "instruction": "Show Key and hold it steady.",
      "successText": "The console is awake.",
      "scene": "console",
      "rule": { "kind": "visible", "ids": [1] }
    }
  ]
}
```

Save it as a JSON file and choose **Open project** in the studio.

## Observation contract

A Detection contains **id**, **x**, **y**, **width**, **height** and **angle**. Coordinates and dimensions are in camera-image space; angles are clockwise degrees from the printed upright orientation. Dimensions must be positive and all geometric values finite.

A Frame contains **at**, **sequence** and **detections**:

- **at:** finite nonnegative observation time in milliseconds.
- **sequence:** nonnegative integer, strictly increasing.
- **detections:** up to eight valid project-card observations with no repeated IDs.

Both time and sequence must increase strictly for fresh evidence. Rule progress is calculated from observations, not from a wall-clock timer continuing over a frozen frame.

## Timing and physical conditions

| Condition          | Engine behavior                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| Normal hold        | A satisfied rule must remain satisfied for holdMs.                                                        |
| Frame gap          | A gap above 300 ms clears pending progress and hidden-target acquisition.                                 |
| Hidden acquisition | At least two target-visible frames spanning 100 ms during the current stage.                              |
| Hidden absence     | Target absent with the authored witness continuously visible for 500 ms, then the normal holdMs interval. |
| Rotation tolerance | Within 20° of the selected quarter turn, including circular wraparound at 0°/360°.                        |
| Order spacing      | Adjacent selected card centers differ horizontally by at least 0.4 × the selected cards' median width.    |
| Order row          | Vertical center spread is at most the selected cards' median height.                                      |

For a hidden stage, the target can be acquired without the witness initially appearing. The witness is required during the absence confirmation and final hold. If the target reappears, absence/hold progress resets. If the witness disappears, absence/hold progress resets. A previously acquired target remains acquired in that stage unless a stronger reset below clears it.

The sample project uses a 650 ms hold. Its hidden stage therefore needs the 500 ms absence confirmation followed by that hold after target acquisition, with fresh frames throughout.

## Reset and transition cases

| Event                                                      | Result                                                                                                                                                |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Condition becomes false                                    | Current hold progress returns to zero.                                                                                                                |
| Malformed, duplicate, unknown or excessive detections      | Pending hold, absence confirmation and consecutive acquisition counts reset; an already acquired hidden target remains latched for the current stage. |
| Repeated/backward time or sequence, or invalid frame clock | Pending progress and hidden-target acquisition clear; the frame cannot advance a stage.                                                               |
| Gap above 300 ms                                           | Pending progress and hidden-target acquisition clear before evaluating the new frame.                                                                 |
| Stage solved                                               | At most one stage advances per frame; the solved scene latches and stage-local evidence clears.                                                       |
| Pause                                                      | Pending evidence and acquisition clear; completed stages and the latched scene remain.                                                                |
| Restart                                                    | Return to stage zero, night scene and incomplete state; all pending evidence clears.                                                                  |
| Game complete                                              | Later frames do not advance it further.                                                                                                               |

The player invokes pause behavior when stopping camera input, changing source, hiding/leaving the page or losing the stream. Source changes do not restart solved stages. **Restart game** does.

In the studio, removing a card repairs affected rule references to the remaining deck. Review those beats after removal. Editing creates a new authored project for the next opened/exported player; it does not patch an already distributed HTML file.

## Core interfaces

| Export                                 | Result or effect                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| sampleProject()                        | The included three-card, three-stage observatory project.                      |
| validateProject(unknown)               | A copied validated Project, or a readable Error.                               |
| new PuzzleEngine(project)              | A validated independent progression engine.                                    |
| engine.update(frame)                   | An EngineView for the new observation.                                         |
| engine.getState()                      | Current state without a transition event.                                      |
| engine.pause()                         | State after clearing pending evidence while keeping solved stages.             |
| engine.restart()                       | Initial state for the project.                                                 |
| printCardsHtml(project)                | Standalone printable A4 HTML with markers and upstream notices.                |
| exportGameHtml(project, runtimeScript) | Standalone HTML with project data, trusted built runtime and upstream notices. |
| markerSvg(id)                          | SVG for ARUCO ID 0–7 using the same dictionary as detection.                   |
| detectMarkers(image)                   | Real marker observations from a bounded RGBA image.                            |

EngineView contains zero-based **stageIndex**, **completed**, **holding** from 0 to 1, **message** and **scene**. An update that solves a stage additionally returns **solvedStageTitle**; that transition event is not retained by getState().

The scene starts at night and changes only when a stage completes. The selected editor scene is a preview of that beat's result.

## Detector boundary

Marker generation and detection use js-aruco2's **ARUCO** dictionary with a zero-Hamming-distance detector setting. Colored simulator rectangles are observations, not actual printed markers.

detectMarkers accepts a Uint8ClampedArray RGBA buffer with exactly width × height × 4 values, dimensions at most 1920 × 1080 and at most 2,073,600 pixels. The player downsizes camera analysis within 960 × 720 and processes fresh frames no more often than every 100 ms.

The shared compatibility bridge adapts the pinned upstream legacy module exports without replacing the recognition algorithms or using eval. Real-card recognition still depends on physical print and camera conditions.

## Print and player exports

Print documents use A4 portrait with 10 mm margins, 90 × 80 mm cards and a 55 × 55 mm marker area, up to six cards per sheet. Cut the outer card boundary and preserve the marker quiet zone.

The exported game embeds a validated project and the generated player runtime. runtimeScript is a trusted build artifact, not an author-editable project field; the export function requires a nontrivial bundle no longer than 4 × 1024 × 1024 characters. Project text is escaped for its JSON/HTML context.

The optional serve:player helper accepts one HTML file up to 4 MiB, serves only that file at its root route, and binds to loopback. Browser camera permission still requires a supported context. See [the guide](guide.md) for its command.

Keep the full [third-party notices](../THIRD_PARTY_NOTICES.md) with redistributed runtime material. Preserve a copy of your original JSON when trying later application versions.
