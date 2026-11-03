# Engine status

## Delivered

Three synthetic fixtures exercise conventional partitions, irregular diagonal walls, a courtyard with an uncovered roof opening, and a gable roof. Floors, wall opening solids, doors, windows, roofs and basic furniture boxes derive from the normalized contract. Multiple levels have explicit elevations.

The viewer edits furniture position and rotation, checks placement, stores per-model layouts, supports JSON export/import and resets to published data. Walk mode uses substepped oriented-box collision and floor boundaries on the first level. These are visualization controls, not architectural or safety certification.

## Automated checks

Tests cover dimensions, references, polygon validation, opening volume conservation, deterministic generation, multiple levels, malformed layouts, model-isolated storage keys, diagonal collisions, wall tunneling prevention, room overlaps and invalid furniture placement. Gable triangles are checked for finite coordinates, nonzero area, closed manifold edges and expected solid volume for both ridge directions.

Mesh tests execute the bundled real Three.js r128 runtime. They build all fixture meshes and raycast through the courtyard roof to verify that the opening is retained while nearby roof surfaces remain solid. The compiled viewer script is parsed before delivery.

## Limits

A manual visual check in a real browser was reported as passing by the maintainer on 2026-11-03. It is not automated and no screenshots are kept in the repository; the geometry and mesh tests do not constitute visual approval on their own.

Pitched roofs are currently rectangular gables only. No arbitrary pitched contours, dormers, stairs, PDF/CAD interpretation, automatic plan recognition, furniture catalog or structural validation is implemented. Furniture is represented by simple boxes. Polygon overlap diagnostics cover common intersections, containment and coincident boundaries, but are not a full Boolean CAD/topology solver. Collision uses a circular player footprint and static geometry; no physics engine is used.

The main viewer supports local operation. Browser-local storage behavior for file URLs depends on the browser; export JSON when durable portability matters. CDN outages do not affect the bundled runtime.
