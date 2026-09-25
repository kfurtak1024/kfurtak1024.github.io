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

// Everything the open menu covers. `inert` keeps keyboard focus from walking out
// of the menu into the page hidden behind it. The toggle is inside .navbar, so
// it stays reachable.
const behindMenu = [select('#main'), select('#footer'), select('.logo')]

function setMobileMenu(open) {
  navbar.classList.toggle('navbar-mobile', open)
  toggle.setAttribute('aria-expanded', String(open))
  select('.mobile-nav-toggle .icon', true)
    .forEach((icon, index) => icon.classList.toggle('hidden', index === (open ? 0 : 1)))
  for (const part of behindMenu) part.toggleAttribute('inert', open)
  // Stops the page scrolling behind the overlay.
  document.body.classList.toggle('menu-is-open', open)
}

toggle.addEventListener('click', () => {
  setMobileMenu(!navbar.classList.contains('navbar-mobile'))
})

// Escape closes the menu and returns focus to the button that opened it.
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navbar.classList.contains('navbar-mobile')) {
    setMobileMenu(false)
    toggle.focus()
  }
})

/* -----------------------------------------------------------------------------
 Scroll spy
 Marks the section currently in view as active in the header menu. Scrolling
 itself is the browser's, driven by the anchors in the markup.
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

// The active section is whichever one covers most of a band just below the
// header. Measured on each frame rather than with an IntersectionObserver,
// which only reports threshold crossings and goes stale when two sections both
// overlap the band.
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
 The last section leaves exactly enough room for the footer, so arriving at
 Contact puts the footer's bottom edge on the viewport's. The footer's height
 changes with the viewport and when the webfont loads, so it is measured and
 published as --footer-height. The CSS carries a fallback for the no-JS case.
----------------------------------------------------------------------------- */
const footer = select('#footer')

function publishFooterHeight() {
  document.documentElement.style.setProperty('--footer-height', `${footer.offsetHeight}px`)
}

publishFooterHeight()

// Catches viewport changes and the reflow after the webfont swaps in.
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
 A short fade up as a block enters the viewport, once. The hidden state is
 applied from here (via .has-reveal on <html>) rather than by the stylesheet,
 so the content stays visible if this script never runs. The hero is left out:
 it is above the fold and would only fade in over its own first paint.
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

// With reduced motion the elements are never hidden in the first place.
if ('IntersectionObserver' in window &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const targets = select(REVEALED, true)

  if (targets.length) {
    document.documentElement.classList.add('has-reveal')

    for (const el of targets) el.classList.add('reveal')

    // Only the cards stagger, against each other.
    select('.project-card', true)
      .forEach((card, i) => card.style.setProperty('--reveal-index', i))

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-revealed')
        // One-way: nothing re-hides on the way back up.
        observer.unobserve(entry.target)
      }
    }, { rootMargin: '0px 0px -8% 0px' })

    for (const el of targets) observer.observe(el)
  }
}

select('#copyright-year').textContent = new Date().getFullYear().toString()
