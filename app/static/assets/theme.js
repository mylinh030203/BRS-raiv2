/* Pre-paint theme restore. Loaded as a classic script in <head> so the saved
   display mode is applied before the first paint (CSP `script-src 'self'`
   forbids an inline script). */
(function () {
  "use strict";
  var theme = "light";
  try {
    var saved = window.localStorage.getItem("bsr.theme");
    if (saved === "dark" || saved === "light") {
      theme = saved;
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    }
  } catch (error) {
    theme = "light";
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
