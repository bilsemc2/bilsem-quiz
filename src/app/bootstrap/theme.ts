export function applyInitialTheme(): void {
  const rootElement = document.documentElement;
  const prefersDark =
    localStorage.theme === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (prefersDark) {
    rootElement.classList.add('dark');
    return;
  }

  rootElement.classList.remove('dark');
}
