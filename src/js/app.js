function updateNavItem(index, active) {
  function getNavItem(index) {
    if (index === undefined) {
      return undefined;
    }
    var a = document.querySelectorAll('#nav-menu a.nav-menu-item')[index - 1];
    return a ? a.parentNode : undefined;
  }
  var navItem = getNavItem(index);
  if (navItem) {
    if (active) {
      navItem.classList.add('active');
    } else {
      navItem.classList.remove('active');
    }
  }
}

var myFullpage = new fullpage('#fullpage', {
  licenseKey:'YOUR_KEY_HERE',
  slidesNavigation: true,
  navigation: true,
  navigationPosition: 'right',
  navigationTooltips: ['HOME', 'CONTACT'],
  onLeave: function(origin, destination, direction) {
    updateNavItem(origin.index + 1, false);
    updateNavItem(destination.index + 1, true);
  },
  afterRender: function() {
    document.querySelectorAll('#nav-menu a.nav-menu-item')
      .forEach(function(menuItem, index) {
        menuItem.addEventListener(
          'click',
          function(e) {
            e.preventDefault();
            fullpage_api.moveTo(index + 1);
          });
      });
    updateNavItem(1, true);
  }
});

function changeEmailVisibility() {
  var emailDisplayed = false;
  return function(e) {
    if (emailDisplayed === true) {
      return;
    }

    e.preventDefault();
    var email = atob('Y29udGFjdEBrcnp5c3p0b2ZmdXJ0YWsuZGV2Cg==');
    document.querySelector('#email').textContent = email;
    var link = document.querySelector('#email-button');
    link.href='mailto:' + email;
    link.classList.add('email-visible');
    emailDisplayed = true;
  }
}

document.querySelector('#email-button').addEventListener(
  'click', changeEmailVisibility()
);
