export function hideLoaderAfterRender(): void {
  const hideLoader = () => {
    const loader = document.getElementById('app-loader');
    if (!loader) {
      return;
    }

    loader.classList.add('hidden');
    window.setTimeout(() => loader.remove(), 400);
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(hideLoader);
  });
}
