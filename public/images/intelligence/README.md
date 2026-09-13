# Intelligence artwork

Document pages for every dossier category are configured through `pages` in `lib/dossier.ts`. Add images in reading order with an `id`, `title`, `image` path, `width`, `height`, and descriptive `alt` text (see `lib/field-reports.ts`). Field Reports, Known Movements, Weapon Systems, Supply / Origin, and Known Personnel all use the same viewer: tap/click the left half for the previous page and the right half for the next. Arrow buttons and keyboard arrows also work; navigation stops at the first and last pages. Sections without pages retain their pending content.

`dossier-cover.png` is an unchanged copy of the supplied 1672 × 941 homepage concept. The `.dossier-cover img` framing in `app/intelligence.css` isolates its original folder without regenerating the mark, stamp, or texture. Next Image optimizes the PNG and preloads it.

To replace it with an approved standalone transparent folder PNG, keep this filename, update the Image dimensions in `components/intelligence/dossier.tsx`, and replace the framing rule with `inset: 0; width: 100%; height: 100%; object-fit: contain; clip-path: none;`. Adjust the stage aspect ratio to the new artwork. No CSS folder illustration is used for the closed cover.

`intelligence-background-corrected.png` is the full concept edited with the built-in imagegen tool. Its WebP sibling is the optimized source used by the small header insignia, framed in CSS. The folder on the actual homepage always comes from the original unedited asset above.

Imagegen prompt: “Only change the two eyes in the small grey upper-left emblem to solid pale-grey angular rectangular quadrilaterals matching the eyes on the red flags in the supplied inspecting-the-troops reference. Preserve its arrow, face outline, ears, nose and mouth, and preserve the entire rest of the concept, especially the manila folder and its black insignia.”

An attempted transparent folder extraction returned an opaque checkerboard and was rejected. It is not used by this project.
