// Navigation is native HTML. This only sets the menu's default for screen size.
const sectionMenu = document.getElementById('sectionMenu');
const smallScreen = window.matchMedia('(max-width: 960px)');
function setMenuLayout() {
  sectionMenu.open = !smallScreen.matches;
}
setMenuLayout();
smallScreen.addEventListener('change', setMenuLayout);

// Keep mouse-wheel / trackpad scrolling from incrementing a focused number.
// Blurring before the browser's default action lets the page keep scrolling.
document.addEventListener('wheel', event => {
  const field = event.target;
  if (field?.matches?.('input[type="number"]') && document.activeElement === field) {
    field.blur();
  }
}, { capture: true, passive: true });
