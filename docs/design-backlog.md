# Homepage design backlog

An aesthetics review of the page as it stood on the `redesign-drop-fullpage`
branch, 2026-08-20, plus what has been done about it since.

Items keep their original numbering throughout, so "item 20" means the same
thing here as it does in any later conversation.

## Overall read

Technically clean -- sensible tokens, real responsive work, an accessible
skeleton -- but visually it read as a well-executed 2016 template: pure black,
lime green, flat two-tone split buttons, square hairline cards, hard slab
section transitions, no motion anywhere. The craft was in the CSS rather than
in the design decisions.

---

## Done

**3. Paragraph sizes.** `.section p` carried `font-size: clamp(…, 1.5rem)`,
which sits one specificity step above `.project-desc`, `.project-stars` and
`.project-links` and was silently overriding all three -- every project
description, star count and card link rendered at the clamp size rather than
the `1.05rem`/`.95rem` those rules asked for. Clamp removed; body base is now
17px (`1.0625rem`) at `line-height: 1.6`, and `.lead` carries its own smaller
clamp.

**4. Measure.** `max-width: 62ch` on `.section p`. The Contact copy had been
running the full 1140px.

**5. Surfaces.** `#000` → `--color-surface: #0c0e10`; contact and card media
panels → `--color-surface-raised: #14181b`; the flat `#e0e0e0` Projects band →
`--color-paper: #f6f5f1` (warm off-white). `--color-black` had been doing
double duty as both *dark background* and *ink on light*, so it was split:
`--color-ink-strong: #14181b` now handles text on the light surface.

**6. Hero.** Two columns from 992px -- copy left, a CSS terminal card right --
with the scrim rebalanced (93% → 80% → 58%) so the photograph reads across the
frame instead of being crushed flat. The card is translucent with a
`backdrop-filter` blur behind an `@supports` guard. Every line in it restates
copy already on the page, so it is `aria-hidden`. Its blinking cursor gets an
explicit `animation: none` under reduced motion, because the global rule
collapses durations to `.01ms` and would otherwise turn a blink into a strobe.
Capped at `34rem` when stacked, or it stretched to ~850px on a tablet and
marooned its short lines against an empty right edge.

**18/19. The card pass.** Items 20 and 21 were attempted in the same batch and
both reverted -- see Rejected.

- *18.* `border-radius: 12px` plus `overflow: hidden`, which rounds the media
  panel too -- it uses negative margins to meet the card edges, so it is clipped
  to the padding box for free. Tag chips are now pills with a 6% tinted fill
  instead of square outlined boxes.
- *19.* The two footer links were black-on-black-underline and green-on-green,
  a hierarchy that was never intended. They are peers now: same ink, same
  underline, told apart by an icon (GitHub / external-link, the latter a new
  sprite symbol) and both turning green on hover.

**24. Card metadata.** Settled 2026-08-26. Every card now carries its year in a
`.project-meta` cluster beside the title, so the head row has the same shape on
all three -- previously only bansoko had anything to the right of its title. The
star count stays bansoko's alone by decision: real figures from the GitHub API
are 17 / 0 / 0, and printing two zeros would advertise the absence rather than
the presence. Years are creation years (2019, 2026, 2026); a "last updated"
field was considered and dropped, because a static page has no runtime API call
and the value would rot in the markup.

**9/10. Contrast failures.** Fixed 2026-08-26. Both were measurable WCAG
failures rather than matters of taste, which is why they were taken ahead of
the rest of the polish list.

*9.* `.night-begins-to-shine` ran `#fc40ff -> #543fff`. Measured against the
real composited background -- the hero photograph under its scrim, sampled from
a canvas rather than assumed flat -- the indigo end came out worse than the
review recorded:

| viewport | text | old `#543fff` | new violet | required |
|---|---|---|---|---|
| 1440px | 20.8px bold | 3.25:1 | 7.11:1 | 3:1 (large) |
| 390px | 17.6px bold | **2.68:1** | 5.86:1 | 4.5:1 |
| 320px | 17.6px bold | **2.87:1** | 6.28:1 | 4.5:1 |

At 390px the photo shows through more of the scrim, so the background is
rgb(32,34,36) rather than the flat `#0c0e10` -- and the old value failed even
the 3:1 large-text floor, which the original review did not catch. Bold only
counts as large text from 18.66px, and the clamp floor puts these words at
17.6px, so 4.5:1 is the real requirement.

*Superseded 2026-09-04.* The gradient is gone; the phrase is now flat
`--color-violet: #a78bfa`, the token the hero terminal already used for these
exact words, and `--color-pink` is retired. This is item 7 arriving: the
gradient needed two colours and a third technique to say what one token says,
and the measured contrast is the same either way -- the table's "new violet"
column is the violet end, which is what now carries the whole phrase. Re-measured
on the composited hero: 7.11:1 at 1440px, 5.86:1 at 390px, both passing.

*Bug, fixed the same day.* The swap was written as a bare
`.night-begins-to-shine { color: … }`, and for two weeks the phrase did not
render violet at all -- it rendered lime, identical to the ordinary `<strong>`
in the sentence above it, which is the one thing the line exists to contrast
with. `.lead strong` (0,1,1) already sets the lime and outranks a lone class
(0,1,0). The gradient never hit this because `background-clip` and
`-webkit-text-fill-color` are properties nothing else in the cascade touches;
moving to `color` moved the rule into a contest it was not written for. The
selector is `strong.night-begins-to-shine` now. Worth remembering when replacing
any other decorative text effect with a plain colour.

*10.* Footer text `#6a6f72` was 3.80:1. Now `--color-grey` -- the existing body
token, so the fix removed a magic hex rather than adding one. The review had
suggested `#8a9095` (5.99:1); the token was preferred for consistency, and the
difference is not perceptible. *(The token has since been retuned from `#8c8c8c`
to `#8a9399`; the footer measures 6.22:1 at that value.)*

**12/13/15. Header and rhythm.** Done 2026-08-26. Item 11 is the one left in
this group, and 12 has made it urgent -- see its note under Remaining.

*12.* Half kept, half reverted -- see Rejected for the blur. What stands: the
header's bottom rule is transparent until `#header.is-scrolled`, set from the
existing rAF-throttled scroll handler in `app.js` at a 4px threshold so an
overscroll bounce cannot flicker it. The border stays 1px wide in both states --
animating the width would move every anchor landing by a pixel, since
`--header-offset` counts it. At the top of the page the hero runs under the bar
and a rule there would cut it in half for no reason.

*13.* The active item was a solid white block with black text. Both hover and
active are now carried by a 2px rule under the word and never by recolouring
the label. At the 72% the header first used, lime over the light band fell to
3.83:1 -- passing as large text at 20px bold and only just -- which is what put
the colour on the rule; at 90% it would be 7.17:1 and pass outright, so the
choice is no longer forced by contrast. It stands because the bar is
translucent either way, and this keeps the label's contrast independent of
whatever scrolls behind it. Hover
is a 45% white rule, active is lime, and the active rule outranks the hover one
so pointing at the current section does not dim its own marker. Nav links and
social icons had no hover state at all before this.

*Corrected 2026-08-27.* The rule was first written as `.navbar a::after`, which
also matched the social icons -- they sit inside `.navbar` too -- so a hovered
icon got the colour change AND a rule that, inset 10px inside a 44px box, came
out as a 24px white dash under a 20px glyph, underlining nothing. Scoped to
`.nav-menu-item`. The icons now take a filled target instead: an 8% white
rounded square, which suits an icon button, shows how big the 44px target
actually is, and avoids lime -- which in this header already means "the section
you are on", so using it for hover made one colour carry two meanings in one
row.

*15.* A kicker over each H2 (`01 - Selected work`, `02 - Get in touch`), sharing
the hero eyebrow's proportions with a short rule after it. On the paper band the
lime is 1.97:1, so the Projects kicker takes `--color-green-ink` (4.66:1); on
Contact's dark surface the lime is 8.31:1 and stays.

**24b/25/26/27. The Contact cluster.** Done 2026-08-27. Item 23 is only
partly closed -- see its note under Remaining.

*27.* The split two-tone buttons are gone. One fill, `border-radius: 8px`, icon
inline on a `--space-2` (8px) gap. The hero CTA uses the same classes and was
converted with them, so the two views agree. There is deliberately no hover
lift: that was tried on the project cards and rejected, so the feedback is
colour only. `.button-primary` is the lime fill, ink label, darkening to
`--color-green-dark` on hover.

The outlined-at-24%-white companion is `.icon-button` -- the copy-to-clipboard
control -- not a `.button-secondary`. No such class was ever written, and the
LinkedIn and GitHub links beside the email button are plain text links rather
than buttons, so there is exactly one filled control in the section.

*25.* Solved by 27 rather than separately. The email button was a grey slab
because it was the unfilled half of a two-tone pair; as a primary lime control
there is nothing left to read as disabled. Worth repeating that it was never a
contrast failure -- the label passed at 6.79:1 throughout.

*26.* Three paragraphs -- a lead plus two lines of "If you want to contact me
directly, send me an email:" scaffolding -- collapsed to one sentence over a
single email action and a row of two profile links. The lead takes
`max-width: 34ch` and `text-wrap: balance`, or it ran the full column and
dropped a two-character orphan onto its second line.

The "Show email" reveal went with it. The address is decoded from base64 into
the button's own label on load, the button is a real `mailto:` from the first
paint, and a `.icon-button` beside it copies the address to the clipboard with
an `aria-live` confirmation. The base64 was only ever scraper obfuscation, and
it still is -- what went is the click that stood between a visitor and the one
thing the section is for.

*24b.* "Feel free to leave me a message!" promised a form that does not exist.
The copy changed rather than the form being built: this is a static page on
GitHub Pages with no backend, so a working form would mean adding a third-party
service, which is a bigger decision than a copy fix and was not asked for. The
line now describes what the buttons actually do.

*Added in passing.* GitHub joined the row. It was previously reachable only
from a header icon, and item 26 called for a row rather than a single link.

*Added in passing.* An "At a glance" definition list beside the copy -- Work /
After hours -- on a hairline rule, two columns from 992px. It is the first
answer to item 23's remaining half: not more CSS on an empty section, but two
lines of actual content. It does not close 28, which still wants years, role and
domain.

**34/35. Spacing scale and hairline.** Done 2026-08-27.

*35.* `--color-hairline` went from `#c9cdc4` to `#c9c8c5`. The old value had
green above both red and blue, which is what read as muddy; the paper it sits on
is warm (R>G>B), so the hairline now follows that bias instead of opposing it,
at the same lightness. The review suggested `#d7d7d4`, which was not taken: it
drops the mean distance from the paper from 43 to 30 and would have lightened
the card border by a third, when the complaint was the cast rather than the
strength. Also worth noting the token is now used in exactly ONE place -- the
card border -- because the card pass replaced the tag-chip borders with fills.

*34.* A `--space-1..8` scale on a 4px base, replacing 2, 3, 6, 7, 10, 12, 15,
16, 20, 22 and 24px plus `.6rem`, `.65rem`, `.75rem`, `.85rem`, `.9rem`,
`1.15rem`, `1.25rem` and `1.35rem` -- 31 declarations in all.

Deliberately left off the scale: fluid `clamp()` section padding and hero gaps,
which answer to the viewport rather than to a grid; `margin: 0 0 .75em` and
`margin-bottom: 1.5em`, which are em-relative so they track their own font size;
and `.highlight`'s `padding-left: 2px`, which is optical kerning between the two
halves of the wordmark, not layout. That last one is commented in place so it
does not read as an oversight.

This was NOT invisible, and was described as "mechanical" beforehand, which
undersold it. Snapping to the grid moved things:

| element | before | after | delta |
|---|---|---|---|
| nav link | 69 x 44 | 73 x 48 | +4 / +4 |
| project card | 366.7 x 492.8 | 366.7 x 496.8 | 0 / +4 |
| tag chip | 69.6 x 26.5 | 73.6 x 28.5 | +4 / +2 |
| button | 185.6 x 54.8 | 184 x 54.8 | -1.6 / 0 |
| footer | 1440 x 69.6 | 1440 x 73.6 | 0 / +4 |
| hero terminal | 511.1 x 330 | 511.1 x 337.2 | 0 / +7.2 |

The footer growing by 4px would have broken the Contact landing under the old
hand-written constant; it did not, because `app.js` measures and republishes
`--footer-height`. The card's `.project-media` negative margin is now
`calc(var(--space-6) * -1)`, tied to the same token as the card's padding, so
the two cannot drift apart.

**Scroll landing.** Two bugs, found while looking at the Contact section.
Arriving at Contact left the footer just past the fold, because the last
section was sized to fill the viewport on its own. It now subtracts a
`--footer-height` token that `#footer` holds itself to. Then the seam showed a
sliver of the Projects paper under the header: Chromium rounds the maximum
scroll offset DOWN to a whole pixel, so a document with a fractional height
(2537.1875px here, from the projects grid) can never reach its end and stops up
to 1px short. `--header-offset` is therefore 1px *inside* what the header
covers, hiding a residue that is always < 1px by construction. This closes half
of item 12 -- the sliver -- leaving only the translucent header itself.

**Bug found in passing.** At 320px the avatar plus wordmark overflowed the
header row and pushed the menu button entirely off-screen where it could not
be tapped. Pre-existing, not introduced by any of the above. The wordmark is
now fluid below the desktop breakpoint (`clamp(.78rem, 3.6vw, 1.25rem)`), back
to full size from ~560px up. *Obsolete 2026-09-25:* the wordmark went back to Roboto
Condensed at `-1px`, which fits at 320px at full size (right edge 223px, menu
button from 252px), so the clamp was removed with it.

**Payload. Found and fixed 2026-09-04.** The build had reached 7.3 MB, 7.1 MB
of it images, against a 15 KB CSS bundle and a 3.3 KB JS one. Three separate
problems, all invisible to a green build:

| file | was | now |
|---|---|---|
| `intro-background-abstract.webp` + `@2x` | 3.85 MB | deleted -- referenced by nothing |
| `contact-background@2x.webp` | 2.1 MB | deleted |
| `contact-background.webp` | 856 KB | 14 KB |

The two abstract files were never referenced from any stylesheet or document.
The `@2x` was worse than dead weight: it was offered through an `image-set()`
with `1x`/`2x` **density** descriptors, so every retina laptop downloaded the
2.1 MB copy in preference to the 856 KB one. And the 856 KB itself was a
maximum-quality export of a near-black, low-detail texture -- re-encoded to
1920px at WebP q72 it is 14 KB at 42.8 dB PSNR, better fidelity than the hero's
AVIF (42.4 dB) and 61x smaller. Total: **7.3 MB → 536 KB.**

No AVIF companion for it, deliberately. The hero offers three formats because
its JPEG is 96 KB and the AVIF saves 76 of them; at 14 KB the same switch saves
single-digit kilobytes and costs a second file that has to be re-exported every
time the first one is.

*The guard, which is the actual fix.* `scripts/verify.mjs` already failed on a
reference with no file. It now also fails on a file with no reference --
`checkOrphanAssets`, with a small allowlist for the things reached by convention
rather than by markup (`index.html`, `404.html`, `CNAME`, `robots.txt`,
`sitemap.xml`, `favicon.ico`). Nothing about an orphan is visible from outside:
no 404, no console error, no failing test. Only `du dist/`.

Writing it immediately caught a hole in the older half of the same check:
`checkReferences` scanned `src` and `href` but not `srcset`, so both project
`.avif` files came up as orphans. They are referenced -- from `<source srcset>`,
which is how every `<picture>` on the page offers its modern format. The scanner
was blind to exactly the file a browser prefers, so a broken or no-longer-copied
AVIF would have shipped silently. Both halves now see the same set of files.

**8. The green. Decided 2026-09-04: it stays.** Asked directly and answered
directly -- the lime family is wanted. `--color-light-green: #9acd4a`,
`--color-green-dark: #84b43d`, `--color-green-ink: #4d701d`, all measured and
passing. The item is closed, not deferred: do not re-propose emerald, teal or
amber.

**21b. Media panel weight.** Done 2026-09-04. The three screenshots are 1:1
pixel art, a 0.71:1 portrait and a 2.53:1 terminal, and `contain` left each a
different amount of bare panel -- bansoko bled to the edges, t0d0 sat in wide
pillarbox bars, and zecret, which happens to be *exactly* 16:10, filled its
frame completely. So the panels read as three treatments rather than one.

All three are now inset by the same `--space-4`, over a top-down light on a
per-project tint (`--project-tint`: bansoko `#131627`, t0d0 `#111c25` -- the
value it already had -- zecret `#191720`), with a 4px radius on the image. The
screenshot now sits ON the panel instead of one of them being it. bansoko gained
a `.project-card-bansoko` class so all three cards are named the same way; the
old `.project-card-t0d0 .project-media` background override went with it.

**31. OG image.** Done 2026-09-04. Was `avatar.png`, a 1:1 square that LinkedIn
and X both letterbox -- cropping the top and bottom off the face that was the
entire point of it. Now a real 1200x630 card at `/images/og-image.jpg`, 58 kB.

It is *generated*, by `scripts/make-og-image.mjs`, so it cannot drift away from
the site: it pulls the real Orbitron and Roboto Condensed out of `node_modules`,
the real avatar, and a copy of the tokens. Deliberately NOT wired into
`npm run build` -- the output is committed, because a deploy should not depend on
shelling out to a headless browser.

Two things learned writing it, both of which produced a plausible-looking wrong
card that still exited 0:

- A page built with `setContent()` has no real origin, so Chromium refuses to
  load `file://` subresources into it -- silently, as a failed request. The first
  version linked the woff2 files and rendered the whole card in fallback faces.
  Everything is a `data:` URI now, and the script asserts
  `document.fonts` reports exactly two loaded faces before it screenshots.
- JPEG, not PNG. The card is soft gradients over near-black, PNG's worst case:
  lossless it was 176 kB, larger than anything else in the build. At quality 92
  it is 58 kB and measures 46 dB PSNR against the lossless render -- better
  fidelity than the hero image already ships at.

`og:image` is also absolute now (`https://krzysztoffurtak.dev/...`) because the
spec asks for it and several scrapers will not resolve a relative one, with
`og:image:width/height/alt` and `twitter:card=summary_large_image` alongside --
without that last one X shows the small square card and ignores the wide image.

**33. Motion.** Done 2026-09-04. The page had none at all. This is the whole of
it: a 12px fade up as a block first enters the viewport, once, via
IntersectionObserver, staggered 80ms across the project cards only. Targets are
the two section headings, the three cards, and the two Contact columns. The hero
is deliberately excluded -- it is above the fold, so it would only ever be seen
fading in over its own first paint.

The hidden state is installed from `app.js` (which adds `.has-reveal` to
`<html>`), never from the stylesheet alone. A stylesheet that hid these blocks on
its own authority would leave them invisible for good if the bundle failed to
load, trading a missing animation for a missing page. Under
`prefers-reduced-motion` the class is not added at all, so nothing is ever
hidden -- rather than relying on the global rule collapsing the transition to
.01ms.

Both halves are asserted in the smoke suite. Note the reduced-motion test sets
the media via `page.emulateMedia()`, not `test.use({ reducedMotion })`: the
latter does not reach the project contexts in the Playwright version here, and a
test written that way reported `no-preference` and asserted nothing.

**The Contact background. Replaced 2026-09-04.** Offered as three worked
candidates -- a blueprint grid, a night sky, and a constellation -- and the night
sky was chosen.

What went: a 14 kB raster of a stock dark polygonal abstract whose own faint
accent was olive-gold, a fourth colour on a page that had just finished reducing
itself to two. (Earlier the same file had been 856 kB with a 2.1 MB `@2x`.)

What arrived: four layers -- scrim, violet wash, lime wash, starfield. The
subject is not arbitrary. The hero says "...and when the night begins to shine I
become a solo game developer", and Contact is the one section that names both
halves of that, in the "At a glance" list beside the copy. The violet is
`--color-violet`, already the after-hours token; the lime is the day half, kept
much quieter. Item 7's accent count is unchanged.

The starfield is generated by `scripts/make-contact-starfield.mjs` --
deterministic from a seed, 260 stars, 9.4 kB of SVG that gzips to **2.0 kB**,
smaller than the raster it replaces. Being vector it can never reacquire the
`@2x` problem, and its density and palette are inputs rather than pixels.
Opacity is quantised into six buckets so the circles can share a `<g opacity>`,
which is what keeps it small.

*Two lessons about measuring contrast over it,* both of which produced a wrong
answer first:

- **Measure the rects the text occupies** (`Range.getClientRects()`), not the
  element box. `dt` is a block in a 495px grid column and its box runs on for
  ~430px of empty space past the word "WORK". Sampling the box reported artwork
  in the far right of the section as though it were behind a glyph, and produced
  a spurious 2.81:1 "failure" that three rounds of scrim tuning could not shift,
  because nothing was actually wrong.
- **Average over a small neighbourhood**, not the single worst pixel. A
  starfield's worst pixel is a star, and a 1px dot under a 12px glyph is not what
  the eye integrates. The figures below are the worst 5x5 window mean.

Measured at 1440 / 1280 / 390px, text hidden and the composite sampled from a
canvas: lead 17.6:1, h2 17.7:1, dd 16.1:1, kicker 9.5:1, social links 9.5:1,
footer 6.2:1, **dt 5.5:1**. Floor is 4.5:1 (3:1 for h2 and the lead). `dt` is the
tightest by a distance -- `--color-grey` at 12px, the smallest and faintest thing
on the page -- and is the one to re-measure if this artwork is ever retuned.

The scrim's stops were also re-derived, because the comment on `--contact-scrim`
had gone stale: it said the copy column ends at 41% and "At a glance" at 73%.
Measured, they are 52% and 90%. What matters is where the *glyphs* stop -- dt at
61%, dd at 71%, the lead at 37% -- so the ramp holds near-opaque to ~62%, eases
to 76%, and opens up over the last quarter, which carries no text at any
viewport. The mobile `background-position` override is gone: it nudged the focal
point of a photographic texture that had a subject to keep in frame, and a
starfield has none.

**404.html had drifted off the palette entirely.** Found and fixed 2026-09-04.
It lives in `public/` and cannot link the hashed CSS bundle, so it carries its
own copy of the tokens -- and every one of them was still the pre-redesign value:
`#000` for the surface (site: `#0b0d0f`), `#86c232` for the lime (`#9acd4a`),
`#8c8c8c` for the muted grey (`#8a9399`), plus a dead `--dark-grey: #222629`.
`theme-color` said `#000`. It also carried `border-radius: 3px` against the
site's 8px, and `letter-spacing: -.03em` on its numeral -- the exact negative
tracking the type pass had removed everywhere else. All aligned, `color-scheme:
dark` added, and the copy is now commented as a hand-maintained duplicate so the
next palette change has a reason to visit it.

**The mobile menu did not contain focus.** Fixed 2026-09-04. `.navbar-mobile` is
an opaque full-screen panel, but the page underneath stayed in the tab order:
tabbing past the last link walked straight into content the visitor cannot see,
with the focus ring invisible behind the overlay. `app.js` now sets `inert` on
`#main`, `#footer` and `.logo` for exactly as long as the menu is open (the
toggle is inside `.navbar`, so it stays reachable), and `body.menu-is-open`
locks the scroll -- without which the document scrolled behind the overlay and
closing the menu dropped you somewhere else. Asserted in the mobile suite.

**verify.mjs now resolves absolute self-references.** An `https://krzysztoffurtak.dev/...`
URL in the site's own markup used to fall through *both* halves of the check:
`checkReferences` skipped it as external, and `checkOrphanAssets` then reported
the file it named as unreferenced. Making `og:image` absolute is what forced the
issue. `SITE_ORIGIN` is mapped back onto `dist/`, so the canonical link is now
checked too.

**36-40. A second aesthetics pass. Done 2026-09-16.** Five findings, all of
them measured on the built page rather than read off the source, and all five
invisible to a green build.

**36. `.section p` was still overriding every paragraph rule in the sheet.**
This is item 3's other half. That item removed the `font-size` clamp and left
`margin: 0 0 .75em` in place, and at (0,1,1) the selector outranks every
single-class paragraph rule written since. Eight were losing:

| rule | asked for | rendered |
|---|---|---|
| `.eyebrow` | `margin: 0` | `margin-bottom: 10.8px` |
| `.hero-cta` | `margin-top: 12px` | `0` |
| `.section-kicker` | `margin-bottom: 12px` | `9.6px` |
| `.contact-status-kicker` | `margin-bottom: 16px` | `9.6px` |
| `.project-meta` | `margin: 0` | `11.4px` |
| `.project-desc` | `margin: 0` | `12.6px` |
| `.project-links` | `margin: 0` | `11.4px` |
| `.contact-actions` | `margin-top: 32px` | `0` |

Only `#footer p` survived, because it carries an id. So item 34 put 31
declarations on a 4px grid and this rule quietly knocked a third of them back
off it: the hero rendered 22.8 / 12 / 27.6 / 27.6px between its five blocks --
with the eyebrow sitting further from the heading it labels than that heading
sat from the copy -- and the card body rendered a 24px rhythm out of a 12px gap
plus ~12px of phantom margin.

The fix is a bare `p { margin: 0 }` in the base. The value is the same one
`.section p` was setting; what changes is the specificity, from (0,1,1) to
(0,0,1), so it loses to a class rather than beating one. `.section p` keeps the
62ch measure and nothing else. Note the *value* was never the bug -- writing
`margin: 0` on `.section p` would have left the trap exactly where it was.

Spacing that was previously accidental is now stated: `.hero-copy` is a 16px
gap with `.lead` taking +4 and `.hero-cta` +16, giving 16 / 20 / 20 / 32; the
project card's gap goes 12 -> 24, which is what it already rendered and also
puts the title the same distance below the media panel as the card's own side
padding. Card height moved 496.8 -> 511.4px.

**37. The card-link rule was 14.2px clear of its own word.** `.project-links a`
is a 44px touch target with `align-items: center`, so a `border-bottom` lands at
the bottom of the target and not under the text -- a detached dash rather than
an underline, on all six links. The target is worth keeping, so the rule came
off the box: an `::after` at `top: calc(50% + .75em)`, which is half the line
box plus a descender and holds at any size the link is set at. Measured gap is
now 2.5px. Hover moved from `border-bottom-color` to the pseudo-element's
background; the two links are still peers told apart by their icon (item 19).

**38. The copy-email control hung from the top of a taller row.**
`.email-controls` had no `align-items`, and `.icon-button` carries an explicit
`height: 44px` so it cannot stretch to match the 54.8px button beside it. It sat
10.8px short at desktop and 39.6px short at 320px, where the button's label
wraps to two lines. `align-items: center`.

**39. The mobile menu was white on lime, with an active marker that did
nothing.** The panel is the one place the page still uses the accent as a full
field rather than as an accent, and white measured **1.87:1** on it -- under the
floor even at the 40px these labels are set at. Worse, `.navbar a` is already
white, so the white `.navbar-mobile li.active > a` set was a no-op: the current
section was indistinguishable from the other two, and the comment claiming the
white text *was* the marker had never been true.

Labels, toggle and social icons are all `--color-ink-strong` now (9.52:1), and
the active item takes the same rule-under-the-word the desktop header uses, in
ink because lime cannot show on lime. The rule had to be repositioned to get
there -- the shared `::after` sits at the bottom of the link box, which suits
the header's 48px row but falls 40px clear of a 40px label on a doubled line
height, so it is measured from the text the way item 37's is. The two 8px
constants on the toggle went onto the scale while it was open.

**40. The focus ring only worked on the dark two-thirds of the page.** One lime
`:focus-visible` for everything: 10.39:1 on `--color-surface`, but **1.87:1** on
a white card and 1.74:1 on the paper band, under the 3:1 a focus indicator has
to make against what it sits on. The six card links are the only focusable text
the page puts on light, and they were the ones it failed. This is item 15's
problem with the kicker exactly, and the same token answers it:
`.section-projects :focus-visible` takes `--color-green-ink` (4.66:1). The skip
link was checked and is fine -- `outline-offset: 3px` puts its ring on the dark
header rather than on its own lime chip.

*Three guards added to the smoke suite,* because 36, 39 and 40 all rendered a
page that looked plausible and asserted nothing. `paragraph spacing is the
spacing the stylesheet asks for` pins all eight values from the table above;
`the focus ring stays visible on the light band` and `labels are readable on the
lime panel` compute real contrast from the composited colours through a shared
`contrast()` helper. All three were confirmed to FAIL against the old CSS before
being kept -- at 1.87:1 in both contrast cases -- rather than merely passing
against the new.

---

**41. The hero background. Replaced 2026-09-16; reverted to the photograph 2026-09-25.** Krzysztof asked for the original background back, so `intro_background.{jpg,webp,avif}` and its `@supports image-set()` ladder are restored and `hero-facade.svg` and its generator are gone. The notes below are kept as a record of what was tried. Raised by Krzysztof, who
noticed the hero and Contact did not look like they belonged to the same site.
They did not, and on four counts at once:

| | hero | Contact |
|---|---|---|
| medium | stock photograph, 3 raster formats (94/41/20 kB) | generated SVG, 2.0 kB gzipped |
| register | literal -- a real glass office facade | abstract |
| palette | pure neutral greyscale, contributes nothing | the page's own violet and lime |
| meaning | generic corporate tech | the hero's own sentence, made visible |
| provenance | cannot be regenerated | seed and palette are inputs |

The giveaway is the second-to-last row: **Contact was carrying the hero's
metaphor, and the hero was carrying stock.** The starfield exists because the
hero says "when the night begins to shine", and the hero then illustrated that
line with a photograph of an office block. The three arguments in
`make-contact-starfield.mjs`'s header applied to the photo word for word; it was
simply the last stock raster on the page and had never been revisited.

*What shipped is `hero-facade.svg`* -- the photograph's own subject, drawn. A
glass curtain wall seen obliquely, near-black, with light raking across it. The
geometry is two-point perspective: verticals converge on one vanishing point far
above the frame, horizontals on another far to the left, and every panel corner
is the intersection of a column line with a row line. So the viewing angle is
two constants rather than a re-shoot, and the facade cannot drift out of
agreement with itself. Lit panels catch a hard specular line down their leading
edge, which is the one genuinely sharp thing in the original and what stops a
drawn version reading as flat shapes. 6.3 kB of SVG, **1.7 kB gzipped**, against
155 kB of rasters in the repo and ~20 kB of AVIF on the wire.

Colour is almost entirely absent, as it was in the photograph: the panels are
neutral and the only tint is the violet wash the page already uses.

**Three versions were built and rejected before this one.** Each was built out
fully -- generator, CSS, tests, verify, the lot -- and rejected on sight, which
is the cheapest way this has ever gone: the whole swap is one generator, one
`url()`, one line in `verify.mjs` and one in the README. Worth noting where it
landed: back on the subject the page started with. The photograph was never the
problem -- its medium was.

*First, a representational one.* Three candidates were worked up and rendered in
place, the way the Contact artwork's were: (A) the towers of the day job under
the night sky of the after-hours one, (B) the starfield with different inputs,
(C) the facade kept as a subject but drawn rather than photographed. A was
chosen, built, and then rejected for wanting something abstract and subtle
instead. Recorded because the reasons generalise:

- **The hero already has a subject: the terminal card.** A background that
  depicts something competes with it, and that is one thing too many in a
  composition that also carries an H1, two leads and a button.
- **Anything with a silhouette has to put it somewhere, and there is nowhere.**
  The terminal card covers roughly y 310-690 of the 1600x1000 viewBox at the
  desktop breakpoint and y 560-1000 at 390px; between them they leave only the
  top strip uncovered at both. There is no roofline height that reads on a phone
  AND on a laptop. The first skyline arrangement put the roofs at y 508-726 and
  hid the silhouette behind the card and the lead paragraphs; moving them down
  to y 748-866 fixed the desktop and put them behind the card on mobile.

A uniform field has neither problem, and `cover` can take any slice of it at any
viewport and get the same thing -- so, like the starfield, it needs no mobile
`background-position` override. (The registration marks do get cropped at 390px,
where the visible slice is roughly x 575-1025 of 1600; the ruled field carries
it alone there, which is the intended behaviour rather than a regression.)

*Then an abstract one that was too soft.* A lattice at a 50-unit pitch, drawn
nearly invisibly and then drawn again under two soft radial masks so the light
appeared to move across it. Abstract, quiet, and rejected for not being sharp:
**the masks that lit it also blurred it.** The geometry faded rather than
stopped, so the whole thing read as haze rather than as structure. The lesson is
worth keeping -- *subtle is not the same as soft.* What replaced it is drawn at a
flat opacity from end to end, and is quiet because each mark is faint and there
are few of them, never because anything fades out.

Three other sharp-edged candidates were rendered alongside it and dropped as
unreadable under the scrim: a fine diagonal hatch, an isometric hairline grid,
and large drifting planes. At the opacities that kept them subtle they came out
as vague streaks or as nothing at all. A wide pitch with few, more definite
marks was the way to be quiet and still legible -- not many faint things, but a
few faint things with space around them.

*Then a drafting field, which was sharp but was the wrong idiom.* Crosshairs on
a wide grid with registration marks, and it did answer "subtle but sharp"
literally. It was rejected for being a different language from the photograph
the hero had always had, which is the point at which the brief clarified: what
was wanted was the ORIGINAL's style, done properly.

**Which is what shipped, and the lesson is the one worth keeping from all of
it.** The stock photograph's subject was right for this page all along -- a dark
glass facade, raked by light, is exactly the register a Java enterprise
engineer's homepage wants. What was wrong with it was that it was a photograph:
unlicensed-looking stock, three raster formats, 155 kB, no relationship to the
palette, and nothing about it that could be changed. Drawing the same subject
keeps everything that worked and fixes everything that did not. Four rounds
established that by elimination; the first instinct had the subject right.

*Two things made the drawn facade work where an earlier attempt at the very same
subject had failed:*

- **A vector has no speculars.** The first facade was built with a photograph's
  tonal range and vanished under the scrim. A photo survives 93% -> 80% -> 58%
  because it has near-white highlights to give away; a flat-ish vector has
  nothing left afterwards. The lit end of the ramp has to be far brighter than a
  panel ever looks unlit.
- **Several broad lights, not one narrow one.** The earlier version had a single
  specular band at 38% across, and `cover` on a 390px viewport crops straight
  past it to flat near-black. Three wide bands mean any slice still catches one
  -- which is what lets a composition with a subject keep the starfield's freedom
  from a mobile `background-position` override.

*Two things learned building the rejected one,* both of which will apply to any
future vector artwork on this page:

- **A vector has no speculars.** The first draft was built with a photograph's
  tonal range and vanished under the scrim entirely. `--hero-scrim` runs
  93% -> 80% -> 58%; a photo survives that because it has near-white highlights
  to give away, and a flat-ish vector has nothing left afterwards. The fix is
  range at source, not a lighter scrim -- which also leaves the measured text
  contrast alone.
- **A skyline needs a sky to be seen against.** The second draft had near-black
  towers on a near-black sky and read as lit windows floating in the dark, with
  no silhouette at all. A night skyline is legible because the sky is *brighter*
  than the mass in front of it, not because the mass is lit.

*Contrast, measured the way item 9 established* -- artwork and scrim
recomposited in a canvas, sampled on the rects the glyphs occupy, worst 5x5
window mean, at 1440 / 1280 / 390. Every candidate along the way cleared its
floor comfortably, the photograph included, so contrast never decided anything
here. It is worth recording anyway that the thing which won on taste also
measures best, and by the widest margin on the phone:

| | h1 | lead | eyebrow | violet phrase |
|---|---|---|---|---|
| old photograph | 18.4 / – / 17.2 | 9.6 / – / 8.9 | 10.2 / – / 9.7 | 7.1 / – / 6.2 |
| lattice | 19.2 / 19.2 / 18.8 | 10.3 / 10.3 / 9.9 | 10.4 / 10.4 / 10.2 | 7.1 / 7.1 / 7.1 |

The figures barely move across viewports, which is the uniform field showing up
in the measurements: there is no part of it that is brighter than another for a
crop to land on. The violet phrase -- the tightest thing in the hero, and item
9's own subject -- goes from 6.2 to 7.1 at 390px.

Worth noting that measuring the hero CTA this way is meaningless: it is an
opaque lime fill, so what is behind it never shows.

*The `@supports image-set()` ladder went with the photograph.* An SVG needs no
format negotiation, and that ladder was also a place where a missing file could
degrade quietly to the next format. A `the hero artwork resolves` test asserts
the declared background, a 200, and that no `image-set` survives.

---

## Rejected -- do not re-propose

**20. Hover lift and media zoom.** Implemented (3px lift, brightened border,
soft shadow, `scale(1.03)` on the screenshot, with bansoko's pixel art excluded
from the scale) and reverted on review, 2026-08-26. Do not re-propose the lift
or the zoom. The dead `transition: border-color .2s` was removed along with it,
so the card declares no transition at all rather than leaving behind the same
dead code the item originally complained about.

**21. Make the whole card clickable.** Implemented (title link plus a stretched
`::after`, footer links raised above it, focus ring on the card) and reverted
on review, 2026-08-26. Do not re-propose it.

The stated benefit was a larger hit target, particularly on touch. Against it:
each card has two plausible destinations -- the repository and the live site --
and an invisible overlay picks one silently, so a click anywhere on the card
gives no clue where it lands; the overlay blocks text selection across the whole
card body; and the title duplicates a footer link, so tabbing hits the same URL
twice. The card's only targets are its two footer links, as before.

**12 (the blur half). Translucent header.** Implemented as
`rgb(12 14 16 / 90%)` with a 12px `backdrop-filter`, and reverted on review,
2026-08-27. The header is solid `--color-surface` again. Do not re-propose the
translucency while the page still has a full-width light band.

It looked right over the hero and over the project screenshots. It failed at the
Contact landing: the last section parks the whole Projects paper band behind the
bar, so the header arrived at Contact as a grey slab rather than as glass. It
was tried at 72% (composite `#4e4f4f`, 66 points off the surface) and again at
90% (`#232526`, +23); the second was a real improvement and still not dark.
Raising it further does not resolve the tension -- at 96% the composite is
`#151719`, near enough to the surface, but the blur is then imperceptible and
the filter is machinery doing nothing. Solid is the honest end of that line.

Options offered and not taken along the way: committing to all-dark (item 11),
fading the paper band's edges into its neighbours, and a header that switches to
solid over light content. Any of those would let the blur come back; none was
wanted for the blur's sake alone.

The scroll-triggered bottom rule was the half of item 12 that worked and it
stays -- see Done.

**32. Footer social icons and colophon.** Implemented (copyright left, GitHub
and LinkedIn centre, "Built with Vite - deployed on GitHub Pages" right) and
reverted on review, 2026-08-27. The footer is one centred copyright line again.
Do not re-propose either half.

The icons were redundant: both profiles are already in the header, which is
`position: fixed` and therefore on screen at every scroll position. The usual
argument for footer socials -- people look for links at the end of a long page
-- does not apply to a single page whose header never leaves. The colophon
described the site rather than the person, and its actual job was filling an
empty bar, which is not a reason to add words.

What was kept from the attempt is the footer-height measurement, which is
unrelated to the content and fixes a real fragility. `#footer` has no
`min-height`; it takes its natural height, and `app.js` publishes that into
`--footer-height` through a `ResizeObserver` so the last section always subtracts
the true value -- including after the webfont swaps in, which shifts it by a
fraction of a pixel. The measured value for the one-line footer is 69.6px, where
the old hand-written constant said 72px.

**1. Retire Orbitron from headings** and **2. replace Roboto Condensed for
body.** Both were implemented (Space Grotesk + Inter), reviewed, and
deliberately reverted. The Orbitron/Roboto Condensed pairing stays.

What was kept from the attempt is the *tracking*, which had never suited
either face:

| | before | now |
|---|---|---|
| H1 | `-.01em` | `0` — Orbitron's sidebearings are part of the design; tightening only makes letters touch |
| H2 | `-.01em`, uppercase | `.04em`, uppercase — caps always need opening up |
| H3 | none | `.01em` |
| Logo | `-1px` (`-.05em` at 20px) | `-1px` -- reverted 2026-09-25 to Roboto Condensed and its original tracking; Orbitron in the wordmark was not wanted |
| Eyebrow | `.08em` | `.14em`, smaller |

---

## Remaining

Rough order of impact. Everything below is open except where a note says
otherwise.

### Cards

- **20b/22. Uneven card bodies.** *Mostly done -- only zecret's copy is left.*
  Addressed 2026-08-26, by copy rather than by CSS.

  The original suggestion -- that a metadata line would even the bodies out --
  did not hold: the year line was added (see Done, item 24) and the gaps did not
  move by a pixel, because a short field in the head row adds nothing to the
  card body. The gap was a copy-length problem all along.

  Equal-height cards were kept (`align-items: start` was rendered as an
  alternative and rejected: no hole, but ragged bottoms and links off a shared
  baseline). Instead t0d0's four-line description was trimmed to two -- it drove
  the row height, so shortening it pulled every card in:

  | | before | after |
  |---|---|---|
  | row height | 542px | 493px |
  | bansoko | 82px | 28px |
  | t0d0 | 28px | 28px |
  | zecret | 109px | 55px |

  What remains is zecret's 55px, from a one-line description. A second sentence
  would close it; that is copy, so Krzysztof's to write.
- **Screenshot quality.** *New, 2026-09-04.* `zecret.webp` is itself cropped:
  the terminal text runs off the right edge mid-sentence ("The lane past the",
  "moving north agai") and the help bar is cut mid-word. Nothing catches this --
  the image happens to be exactly 16:10, so it fits its panel perfectly and the
  smoke test that asserts as much passes. It needs re-capturing at a width that
  fits its own content; that is a run of the app, so it is Krzysztof's.

### Header and section rhythm

- **11. Soften the slab transitions.** Three hard cuts between the dark hero,
  the paper Projects band and the dark Contact section. Either commit to
  all-dark, or keep one light band and add a transitional element at the seam.

  *Was briefly coupled to item 12; no longer, 2026-08-27.* A translucent header
  parked on Contact sits over the whole paper band, and at 72% it flattened to a
  grey slab. Raising the alpha to 90% fixed that on its own, so 11 is back to
  being judged on its own merits -- do the hard cuts actually bother anyone --
  rather than forced by the header.

### Contact

- **23. Mostly empty.** *Half closed, 2026-08-27.* The original complaint --
  content sitting in the top third -- no longer holds: the section centres its
  content, and it now measures 367px of a 768px section with exactly 200px of
  air above and below. What remains is that 48% fill is still sparse, and the
  copy collapse in item 26 made the block shorter, not longer. Filling it
  honestly needs more to say, which is items 28-32, not more CSS. Note the
  full-viewport `min-height` cannot simply be dropped: without it the section
  cannot be scrolled to the top and the nav link appears to do nothing.

  *Two additions since, 2026-09-04.* The "At a glance" list (see item 26) is the
  content half. The other is artwork under a scrim -- the same
  scrim-over-image construction as the hero, so the page has one technique for
  this rather than two. It is honest about being decoration: it carries no
  information and sits behind everything, which is why it does not close the
  item. It does mean the remaining sparseness now reads as space rather than as
  a section that failed to load. *(The artwork was replaced later the same day --
  the stock raster is gone and it is a generated night sky now; see Done. That
  changed what is behind the section, not how full it is, so this item is
  unmoved.)*

### Missing content -- largest professional gain per unit of effort

- **28. No About section.** No years, role, company or domain. The biggest
  credibility gap for a software engineer's homepage.
- **29. No tech-stack strip.** A quiet row of technology chips gives a
  recruiter their two-second scan.
- **30. No résumé/CV link.**

### Colour and polish

*Nothing open here. Both items in this group are settled: 7 below, and 8 --
whether to leave the lime family -- was asked and answered on 2026-09-04 and is
recorded under Done. Kept for the record rather than deleted.*

- **7. One accent, not four.** *Done 2026-09-04.* All four competitors are gone.
  The two coloured card top-borders (`#15ace5` on t0d0, `#fc40ff` on zecret)
  are lime like bansoko's, so the row has one edge colour. LinkedIn blue and
  Gmail red went with the two-tone buttons in item 27 -- those were the
  full-bleed brand fills, and the profile links are plain text now. The
  violet→pink gradient collapsed to flat `--color-violet`; see item 9.

  What is left is deliberate and is two colours, not four: lime is the
  interaction colour, violet is the after-hours thread, and violet appears in
  exactly two places that say the same thing -- the hero phrase and the terminal
  line that echoes it.
