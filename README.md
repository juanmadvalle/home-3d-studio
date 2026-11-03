# Home 3D Studio v2.0.0

Parametric home geometry engine and interactive viewer. All bundled floorplans and furniture are synthetic fixtures, not real properties.

## Run

Open `index.html` or `dist/index.html`. Keep the `vendor` directory beside `dist` when copying the project. Three.js r128 and OrbitControls are bundled locally with their MIT license, so viewing does not require a CDN or internet access.

The viewer includes three-bedroom, irregular courtyard and pitched-roof house fixtures. It supports orbit/plan views, roof visibility, opening/closing doors, keyboard walking with collisions, and furniture editing. Furniture layouts can be saved in the browser or exported/imported as JSON. Storage is isolated per model. Unsupported or conflicting layouts are rejected.

The fullscreen studio uses a floating model header and bottom navigation: **Vista** for camera and visibility controls, **Muebles** for placement, and **Ajustes** for theme and layout files. Tap a tab again or the close button to dismiss its panel. The frame button resets the camera; the roof button toggles the covering. Touch movement and look buttons appear in walk mode. Interface colors follow the system or an explicit light/dark preference.

Walking: W/S or up/down to move, A/D to strafe, left/right to turn, Escape to return to orbit. Walking is currently limited to the first level, without stairs or vertical transitions. Open doors before crossing doorways. The furniture editor uses numeric positions and rotation; drag-and-drop is not implemented.

## Build and test

Requires Node.js 22 or newer. No package installation is needed.

```sh
node build.mjs
node --check src/viewer.js
node --test tests/*.test.mjs
node scripts/validate-model.mjs src/models/irregular-patio.json
```

The build validates geometry and diagnostics before bundling only the explicitly listed synthetic models. GitHub Actions repeats build, syntax and tests on push and pull requests.

## Contract and architecture

`schemas/model-v2.schema.json` defines metre coordinates with X right, Y up, Z down. Each level contains spaces, walls, wall-linked openings, roofs and optional furniture. The application version and contract version are independent.

- `src/engine/validate.js`: structural and semantic validation.
- `geometry.js`: rings, areas and wall splitting at openings.
- `generate.js`: deterministic renderer-independent primitives.
- `roof.js`: closed triangular gable meshes; flat roofs support polygon holes.
- `three-adapter.js`: real Three.js mesh generation with injected runtime.
- `diagnostics.js`: room overlap and furniture placement diagnostics.
- `navigation.js`: oriented-box collisions, floor boundaries and substepped movement.
- `layout.js`: validated, model-scoped furniture layout persistence.

To add a model, follow the JSON contract, validate it, and list its id in `build.mjs`. Public build inputs must be synthetic fixtures licensed CC0-1.0. Gable roofs currently require axis-aligned rectangular contours without holes, with ridge axis and rise specified explicitly. Unsupported shapes fail validation rather than being approximated.

The fixture and schema generators are `scripts/create-benchmarks.mjs` and `scripts/create-schema.mjs`. See `docs/STATUS.md` for verified coverage and current limits. See `THIRD_PARTY.md` for dependency provenance.
