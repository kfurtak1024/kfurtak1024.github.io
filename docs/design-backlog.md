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
17.6px, so 4.5:1 is the real requirement. New stops are `--color-pink: #f472b6`
and the existing `--color-violet: #a78bfa`, the latter already used by the hero
terminal for this exact phrase.

*10.* Footer text `#6a6f72` was 3.80:1. Now `--color-grey` (`#8c8c8c`) at
5.75:1 -- the existing body token, so the fix removed a magic hex rather than
adding one. The review had suggested `#8a9095` (5.99:1); the token was
preferred for consistency, and the difference is not perceptible.

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
to full size from ~560px up.

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
| Logo | `-1px` (`-.05em` at 20px) | `.01em` |
| Eyebrow | `.08em` | `.14em`, smaller |

---

## Remaining

Rough order of impact. Nothing below has been started.

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
- **21b. Media panels have uneven weight.** bansoko fills edge to edge, t0d0
  sits in wide pillarbox bars, zecret is letterboxed. `contain` is the right
  call (cropping would ruin the portrait shot), but ~16px of padding and a
  per-project tinted gradient would make the matting read as intentional.

### Header and section rhythm

- **12. Translucent header** -- `rgb(12 14 16 / 72%)` + `backdrop-filter:
  blur(12px)`, bottom border appearing only after scroll. *(The sliver of the
  previous section this also mentioned is fixed -- see Done.)*
- **13. Active nav state.** A solid white block with black text is heavy and
  reads like a 2010 button. Prefer a 2px accent underline or a low-opacity
  pill. Nav links also have no hover state at all.
- **11. Soften the slab transitions.** Three hard cuts between the dark hero,
  the paper Projects band and the dark Contact section. Either commit to
  all-dark, or keep one light band and add a transitional element at the seam.
- **15. Give each H2 a companion** -- a small kicker (`01 — Selected work`)
  and/or a one-line subtitle plus an accent rule. Bare headings float alone.

### Contact

- **23. Mostly empty.** Content occupies the top third of a full-viewport
  section.
- **24b. "Feel free to leave me a message!"** -- there is no message form.
  Either add one or change the copy.
- **25. "Show email" looks disabled** -- grey-on-grey `#424242`/`#5b5b5b`.
  *Checked 2026-08-26: this is NOT a contrast failure. The white label is
  6.79:1 on `#5b5b5b` and 10.05:1 on `#424242`, both passing. The problem is
  that a dark grey fill on a dark surface reads as a disabled control, which
  makes this an appearance fix entangled with item 27, not a defect.*
- **26. The instructional sentences read like form help text.** Replace with
  one human line and a row of icon buttons.
- **27. Retire the split two-tone buttons.** The darker icon block beside a
  lighter label block is a 2015 flat-design pattern. Single fill, radius, hover
  lift, icon inline with a `gap`.

### Missing content -- largest professional gain per unit of effort

- **28. No About section.** No years, role, company or domain. The biggest
  credibility gap for a software engineer's homepage.
- **29. No tech-stack strip.** A quiet row of technology chips gives a
  recruiter their two-second scan.
- **30. No résumé/CV link.**
- **31. OG image is `avatar.png`,** a square avatar that crops badly in
  LinkedIn and X cards. Wants a proper 1200×630.
- **32. Footer is one copyright line.** Social icons plus a quiet "Built with
  Vite · deployed on GitHub Pages" would read as engineer-confident and fill an
  empty bar.

### Colour and polish

- **7. One accent, not four.** Lime, the magenta→indigo gradient, LinkedIn
  blue, Gmail red and three card top-borders all compete. The full-bleed brand
  colours in particular look like pasted-in third-party chrome.
- **8. Consider shifting the green.** `#86c232` is the signature colour of a
  specific era of free portfolio templates. Emerald, teal or amber would read
  more current. *(Offered and not taken -- the green stays for now.)*
- **33. No motion anywhere.** A reveal-on-scroll (opacity + 12px translateY via
  IntersectionObserver, gated on `prefers-reduced-motion`, which the stylesheet
  already handles) plus hover transitions is the cheapest modernity available.
- **34. Ad-hoc spacing scale** -- 12px, 20px, 22px, 24px, `.75em` and `2rem`
  all coexist. A `--space-1..8` scale on a 4px base would tighten the rhythm.
- **35. `--color-hairline: #c9cdc4` is green-tinted** and looks muddy against
  neutral greys. Prefer a neutral `#d7d7d4` or black at 12% alpha.
