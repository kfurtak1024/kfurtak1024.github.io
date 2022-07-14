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
      let email = atob('Y29udGFjdEBrcnp5c3p0b2ZmdXJ0YWsuZGV2Cg==')
      let link = select('#email-button')
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

  let myFullpage = new fullpage('#fullpage', {
    licenseKey:'YOUR_KEY_HERE',
    slidesNavigation: true,
    navigation: true,
    navigationPosition: 'right',
    navigationTooltips: ['HOME', 'CONTACT'],
    onLeave: function(origin, destination, direction) {
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
            })
        })
      toggleNavItem(0)
    }
  })

})()
