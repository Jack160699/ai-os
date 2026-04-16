export const ADMIN_THEME_KEY = "stratxcel-admin-theme";
export const ADMIN_THEME_DARK = "dark";
export const ADMIN_THEME_LIGHT = "light";

export function normalizeTheme(value) {
  return value === ADMIN_THEME_LIGHT ? ADMIN_THEME_LIGHT : ADMIN_THEME_DARK;
}

export function getInitialThemeScript() {
  return `
    (function () {
      try {
        var key = "${ADMIN_THEME_KEY}";
        var stored = localStorage.getItem(key);
        var theme = stored === "${ADMIN_THEME_LIGHT}" ? "${ADMIN_THEME_LIGHT}" : "${ADMIN_THEME_DARK}";
        document.documentElement.dataset.adminTheme = theme;
      } catch (e) {
        document.documentElement.dataset.adminTheme = "${ADMIN_THEME_DARK}";
      }
    })();
  `;
}

