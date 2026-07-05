/**
 * Icons — the design system's single icon door.
 *
 * The app imports every icon from `@ramps/ui/icons`, never from `lucide-react`
 * directly: the provider stays an implementation detail of the kit, so swapping
 * icon sets (or hand-drawing a few) is a one-file change here rather than a
 * find-and-replace across the app.
 *
 * For now this is a full pass-through of Lucide. Once the product's icon set has
 * settled we'll swap this for a curated barrel that names only the icons we use
 * (smaller surface, tree-shakeable, and a typo becomes a compile error).
 */
export * from 'lucide-react';
