import '../css/main.css'

const select = (el, all = false) =>
  all ? [...document.querySelectorAll(el)] : document.querySelector(el)

/* -----------------------------------------------------------------------------
 Contact email
 The address is injected at build time as base64 -- obfuscation against
 scrapers, not a secret, since it is public on the page once revealed.
----------------------------------------------------------------------------- */
function revealEmail(e) {
  const link = select('#email-button')
  if (link.classList.contains('email-visible')) {
    return
  }

  e.preventDefault()

  let email
  try {
    email = atob(import.meta.env.VITE_SITE_EMAIL_BASE64)
  } catch {
    // Missing or malformed value: leave the button reading "Show email"
    // rather than revealing something broken.
    return
  }

  select('#email').textContent = email
  link.href = `mailto:${email}`
  link.classList.add('email-visible')
}

select('#email-button').addEventListener('click', revealEmail)

/* -----------------------------------------------------------------------------
 Mobile menu
----------------------------------------------------------------------------- */
const navbar = select('#navbar')
const toggle = select('.mobile-nav-toggle')

function setMobileMenu(open) {
  navbar.classList.toggle('navbar-mobile', open)
  toggle.setAttribute('aria-expanded', String(open))
  select('.mobile-nav-toggle .icon', true)
    .forEach((icon, index) => icon.classList.toggle('hidden', index === (open ? 0 : 1)))
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
 Marks the section currently in view as active, in the header menu and in the
 desktop dot navigation. Replaces fullPage.js's onLeave/afterRender callbacks;
 scrolling itself is now the browser's, driven by the anchors in the markup.
----------------------------------------------------------------------------- */
const sections = select('main .section', true)
const navLinks = select('#nav-menu a.nav-menu-item, .section-nav a', true)

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

let scrollQueued = false
window.addEventListener('scroll', () => {
  if (scrollQueued) return
  scrollQueued = true
  window.requestAnimationFrame(() => {
    scrollQueued = false
    updateActiveSection()
  })
}, { passive: true })

window.addEventListener('resize', updateActiveSection, { passive: true })
updateActiveSection()

// Choosing a destination closes the mobile menu.
select('#nav-menu a.nav-menu-item', true)
  .forEach((link) => link.addEventListener('click', () => setMobileMenu(false)))

select('#copyright-year').textContent = new Date().getFullYear().toString()
