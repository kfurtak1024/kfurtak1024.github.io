import '../css/main.css'

const select = (el, all = false) =>
  all ? [...document.querySelectorAll(el)] : document.querySelector(el)

/* -----------------------------------------------------------------------------
 Contact email
 The address is public once it reaches the browser; base64 only avoids putting
 it verbatim in the source. Make the primary contact action direct instead of
 adding an unnecessary reveal click.
----------------------------------------------------------------------------- */
function getEmail() {
  try {
    const email = atob(import.meta.env.VITE_SITE_EMAIL_BASE64).trim()
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
  } catch {
    return null
  }
}

const email = getEmail()
const emailLink = select('#email-button')
const copyEmailButton = select('#copy-email')
const emailCopyStatus = select('#email-copy-status')

if (email) {
  select('#email').textContent = email
  emailLink.href = `mailto:${email}`
  copyEmailButton.classList.remove('hidden')
}

async function copyEmailAddress(value) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      // Clipboard access is restricted on some HTTP and embedded contexts.
    }
  }

  const field = document.createElement('textarea')
  field.value = value
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.append(field)
  field.select()
  const copied = document.execCommand('copy')
  field.remove()
  return copied
}

copyEmailButton.addEventListener('click', async () => {
  if (!email) return

  if (await copyEmailAddress(email)) {
    select('.copy-icon').classList.add('hidden')
    select('.check-icon').classList.remove('hidden')
    copyEmailButton.setAttribute('aria-label', 'Email address copied')
    emailCopyStatus.textContent = 'Email address copied to clipboard.'
    window.setTimeout(() => {
      select('.copy-icon').classList.remove('hidden')
      select('.check-icon').classList.add('hidden')
      copyEmailButton.setAttribute('aria-label', 'Copy email address')
    }, 2000)
  } else {
    emailCopyStatus.textContent = 'Could not copy the email address.'
  }
})

/* -----------------------------------------------------------------------------
 Mobile menu
----------------------------------------------------------------------------- */
const navbar = select('#navbar')
const toggle = select('.mobile-nav-toggle')

// Everything the open menu covers. The overlay hides these from the pointer,
// but not from the keyboard: tabbing past the last link in the menu walked
// straight out into the page underneath, where the focus ring is invisible
// behind an opaque lime panel. `inert` takes the subtrees out of the tab order
// and out of the accessibility tree for exactly as long as the menu is up.
// The toggle itself is inside .navbar, so it stays reachable.
const behindMenu = [select('#main'), select('#footer'), select('.logo')]

function setMobileMenu(open) {
  navbar.classList.toggle('navbar-mobile', open)
  toggle.setAttribute('aria-expanded', String(open))
  select('.mobile-nav-toggle .icon', true)
    .forEach((icon, index) => icon.classList.toggle('hidden', index === (open ? 0 : 1)))
  for (const part of behindMenu) part.toggleAttribute('inert', open)
  // Without this the page scrolls behind the overlay, so closing the menu
  // returns you somewhere other than where you opened it.
  document.body.classList.toggle('menu-is-open', open)
}

toggle.addEventListener('click', () => {
  setMobileMenu(!navbar.classList.contains('navbar-mobile'))
})

// A full-screen overlay that only closes by pointing at the right control is a
// trap for keyboard users; Escape is the expected way out, and focus belongs
// back on the button that opened it.
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navbar.classList.contains('navbar-mobile')) {
    setMobileMenu(false)
    toggle.focus()
  }
})

/* -----------------------------------------------------------------------------
 Scroll spy
 Marks the section currently in view as active in the header menu. Replaces
 fullPage.js's onLeave/afterRender callbacks; scrolling itself is now the
 browser's, driven by the anchors in the markup.
----------------------------------------------------------------------------- */
const sections = select('main .section', true)
const navLinks = select('#nav-menu a.nav-menu-item', true)

function setActiveSection(id) {
  for (const link of navLinks) {
    const target = link.getAttribute('href') === `#${id}`
    link.parentElement.classList.toggle('active', target)
    if (target) {
      link.setAttribute('aria-current', 'true')
    } else {
      link.removeAttribute('aria-current')
    }
  }
}

// The active section is whichever one covers a band just below the header.
// Measured directly rather than via IntersectionObserver: an observer only
// fires when an element CROSSES a threshold, so once two sections both overlap
// the band it stops reporting, and the stored figures go stale mid-scroll --
// which left the previous section highlighted after navigating. Reading the
// rects on each frame is a few microseconds and is always correct.
const BAND_TOP = 0.10
const BAND_BOTTOM = 0.20

function updateActiveSection() {
  if (!sections.length) return

  const top = window.innerHeight * BAND_TOP
  const bottom = window.innerHeight * BAND_BOTTOM

  let winner = null
  let mostCovered = 0
  for (const section of sections) {
    const rect = section.getBoundingClientRect()
    const covered = Math.min(rect.bottom, bottom) - Math.max(rect.top, top)
    if (covered > mostCovered) {
      mostCovered = covered
      winner = section.id
    }
  }

  // Past the end of the document the band can fall below the last section;
  // keep the last section marked rather than clearing the highlight.
  if (!winner && window.scrollY > 0) {
    winner = sections[sections.length - 1].id
  }
  if (winner) setActiveSection(winner)
}

/* -----------------------------------------------------------------------------
 Footer height
 The last section is sized to leave exactly enough room for the footer, so that
 arriving at Contact puts the footer's bottom edge on the viewport's. That means
 the stylesheet needs the footer's real height, which no constant can predict --
 it changes with the viewport, with where the colophon wraps, and once more when
 the webfont loads. Measured and published instead. The CSS carries fallback
 values for the no-JS case.
----------------------------------------------------------------------------- */
const footer = select('#footer')

function publishFooterHeight() {
  document.documentElement.style.setProperty('--footer-height', `${footer.offsetHeight}px`)
}

publishFooterHeight()

// Catches viewport changes, reflow when the colophon rewraps, and the reflow
// after the webfont swaps in -- all of which a one-shot measurement misses.
if ('ResizeObserver' in window) {
  new ResizeObserver(publishFooterHeight).observe(footer)
}

// The header's bottom rule only earns its keep once something is passing under
// it; at the top of the page it would cut the hero in half. The threshold is a
// few pixels rather than 0 so a rubber-band overscroll does not flicker it.
const header = select('#header')

function updateHeaderState() {
  header.classList.toggle('is-scrolled', window.scrollY > 4)
}

let scrollQueued = false
window.addEventListener('scroll', () => {
  if (scrollQueued) return
  scrollQueued = true
  window.requestAnimationFrame(() => {
    scrollQueued = false
    updateActiveSection()
    updateHeaderState()
  })
}, { passive: true })

window.addEventListener('resize', updateActiveSection, { passive: true })
updateActiveSection()
updateHeaderState()

// Choosing a destination closes the mobile menu.
select('#nav-menu a.nav-menu-item', true)
  .forEach((link) => link.addEventListener('click', () => setMobileMenu(false)))

/* -----------------------------------------------------------------------------
 Reveal on scroll
 The page had no motion of any kind. This is the restrained version: a short
 fade up as a block enters the viewport, once, and never again.

 The hidden state is applied from HERE rather than from the stylesheet -- app.js
 adds .has-reveal to <html> before marking anything. A stylesheet that hid these
 blocks on its own would leave them permanently invisible if the bundle failed
 to load, which trades a missing animation for a missing page.

 The hero is deliberately not in the list: it is above the fold, so it would
 only ever be seen fading in over its own first paint.
----------------------------------------------------------------------------- */
const REVEALED = [
  '.section-projects .section-kicker',
  '.section-projects h2',
  '.project-card',
  '.section-contact .section-kicker',
  '.section-contact h2',
  '.contact-primary',
  '.contact-status'
].join(', ')

// Read once at load. The global reduced-motion rule in the stylesheet collapses
// transition-duration to .01ms, which would technically do the job -- but not
// adding the class at all means the elements are never hidden in the first
// place, so there is no window in which a mis-fired observer could leave one
// blank.
if ('IntersectionObserver' in window &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const targets = select(REVEALED, true)

  if (targets.length) {
    document.documentElement.classList.add('has-reveal')

    for (const el of targets) el.classList.add('reveal')

    // Only the cards stagger, and only against their own row. Indexing every
    // target instead would hand the Contact block a delay measured from the top
    // of the Projects section, so it would still be fading in well after it had
    // finished arriving.
    select('.project-card', true)
      .forEach((card, i) => card.style.setProperty('--reveal-index', i))

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-revealed')
        // One-way: nothing re-hides on the way back up, and each element stops
        // being watched the moment it has played.
        observer.unobserve(entry.target)
      }
    }, { rootMargin: '0px 0px -8% 0px' })

    for (const el of targets) observer.observe(el)
  }
}

select('#copyright-year').textContent = new Date().getFullYear().toString()
