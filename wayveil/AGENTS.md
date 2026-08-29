# WayVeil Public Website Agent Notes

This subtree owns the public WayVeil marketing and Alpha-information experience at `/wayveil/`.

## Execution boundary

- Public visual/frontend work may be developed here independently from WayVeil product-runtime work.
- Do not modify entitlement Worker/D1 behavior, product-runtime release state, PWA start-URL binding, or road-test authorization from this subtree.
- Keep the public site static: HTML, explicit CSS, and minimal vanilla JavaScript.
- Preserve existing functional Alpha/portal preview behavior unless a separate accepted package changes it.

## Visual North Star

- Canonical composition reference: `assets/reference/wayveil-homepage-north-star-v1.jpg`.
- WayVeil uses a cinematic night-driving visual language: near-black/navy surfaces, cool white type, WayVeil mint/teal accent, subtle cyan glow, restrained purple/red only where product semantics require it.
- The product should read as a premium navigation company first, privacy technology second.
- Favor real WayVeil product renders, road imagery, surveillance-context imagery, clear typography hierarchy, thin geometric line icons, subtle bordered panels, and generous negative space.
- Avoid generic SaaS cards, stock-dashboard aesthetics, hacker/cyberpunk theater, loud neon overload, placeholder art, or unrelated Meranor brass/stone styling.
- Keep major copy, CTAs, statistics, geographic claims, and release claims in live HTML/CSS rather than baked into raster assets.

## Truth / claims

- Consumer route choices are `Fastest`, `Balanced`, and `Zero Known ALPR`; when zero-known is unavailable, use truthful `Best Available` behavior.
- `0 known` never means camera-free, surveillance-free, anonymous, invisible, untraceable, or guaranteed avoidance.
- Unknown cameras can exist and surveillance data can be incomplete or stale.
- Farmington/Missouri may be a proof region but is not the product geography.
- WayVeil is architected for North America through accepted versioned regional packages; do not claim complete North American coverage.
- Keep Alpha entitlement, regional navigation-package availability, and ALPR intelligence quality as separate concepts.
- Do not publish fake metrics, fake coverage totals, fake launch claims, or fake tester counts.

## Asset rules

- Production homepage assets live under `assets/img/home/`.
- Generated/marketing phone renders are illustrative product renders, not exact product-UI authority.
- Coverage artwork must be labeled illustrative unless it is generated from accepted real coverage data.
- Do not publish raster art containing claims that violate the truth rules above.
- Provide meaningful alt text for informative images and empty alt text for decorative duplicates.
- Optimize raster assets for web delivery; prefer WebP where practical.

## Accessibility / performance

- Maintain keyboard access, visible focus states, readable contrast, reduced-motion support, and mobile-first behavior.
- The homepage must remain useful when images fail to load.
- Avoid autoplay media until a separate performance/accessibility pass explicitly accepts it.
