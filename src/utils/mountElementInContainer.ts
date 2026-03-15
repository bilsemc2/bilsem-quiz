export const attachElementToContainer = (
  container: HTMLElement,
  element: HTMLElement,
): void => {
  if (element.parentElement !== container) {
    container.appendChild(element);
  }
};

export const detachElementFromContainer = (
  container: HTMLElement,
  element: HTMLElement,
): void => {
  if (element.parentElement === container) {
    container.removeChild(element);
  }
};
