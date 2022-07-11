function updateNavItem(index, active) {
  function getNavItem(index) {
    if (index === undefined) {
      return undefined;
    }
    var a = document.querySelector(
      '#nav-menu :nth-child(' + index + ') a.nav-menu-item');
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
  licenseKey:"YOUR_KEY_HERE",
  slidesNavigation: true,
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
