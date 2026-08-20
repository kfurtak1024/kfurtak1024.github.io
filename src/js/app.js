import fullpage from 'fullpage.js'
import 'fullpage.js/dist/fullpage.css'
import '../css/main.css'

(function() {
  "use strict";

  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)
    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  const toggleNavItem = (index) => {
    const navItemAt = (index) => {
      if (index === undefined) {
        return undefined
      }

      let a = select('#nav-menu a.nav-menu-item', true)[index]
      return a ? a.parentNode : undefined
    }

    let navItem = navItemAt(index)
    if (navItem) {
      navItem.classList.toggle('active')
    }
  }

  function changeEmailVisibility() {
    var emailDisplayed = false
    return function(e) {
      if (emailDisplayed === true) {
        return
      }

      e.preventDefault();

      let link = select('#email-button')
      let email
      try {
        email = atob(import.meta.env.VITE_SITE_EMAIL_BASE64)
      } catch {
        // The value is missing or not valid base64. Leave the button in its
        // "Show email" state rather than revealing a broken address -- the old
        // code decoded in a try/finally and so rendered the literal text
        // "undefined" with href="mailto:undefined".
        return
      }

      select('#email').textContent = email
      link.href = 'mailto:' + email
      link.classList.add('email-visible')
      emailDisplayed = true
    }
  }

  on('click', '#email-button', changeEmailVisibility())

  const toggleMobileMenu = () => {
    select('#navbar .mobile-nav-toggle .icon', true).forEach(el => {
      el.classList.toggle('hidden')
    })
    select('#navbar').classList.toggle('navbar-mobile')
  }

  on('click', '.mobile-nav-toggle', () => toggleMobileMenu())

  new fullpage('#fullpage', {
    licenseKey: import.meta.env.VITE_FULLPAGE_LICENSE_KEY,
    slidesNavigation: true,
    navigation: true,
    navigationPosition: 'right',
    navigationTooltips: ['HOME', 'PROJECTS', 'CONTACT'],
    onLeave: function(origin, destination) {
      toggleNavItem(origin.index)
      toggleNavItem(destination.index)

      if (select('#navbar').classList.contains('navbar-mobile')) {
        toggleMobileMenu()
      }
    },
    afterRender: function() {
      select('#nav-menu a.nav-menu-item', true)
        .forEach(function(menuItem, index) {
          menuItem.addEventListener(
            'click',
            function(e) {
              e.preventDefault()
              fullpage_api.moveTo(index + 1)
              if (select('#navbar').classList.contains('navbar-mobile')) {
                toggleMobileMenu()
              }
            })
        })
      toggleNavItem(0)
    }
  })

  select('#copyright-year').textContent = new Date().getFullYear().toString()
})()
