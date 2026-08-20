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

if (sections.length) {
  // Bias the observation band towards the upper half of the viewport so the
  // section whose heading you are reading is the one that lights up.
  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
    if (visible) {
      setActiveSection(visible.target.id)
    }
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 })

  sections.forEach((section) => observer.observe(section))
  setActiveSection(sections[0].id)
}

// Choosing a destination closes the mobile menu.
select('#nav-menu a.nav-menu-item', true)
  .forEach((link) => link.addEventListener('click', () => setMobileMenu(false)))

select('#copyright-year').textContent = new Date().getFullYear().toString()
