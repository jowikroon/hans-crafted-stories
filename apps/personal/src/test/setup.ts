import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => { /* empty */ },
    removeListener: () => { /* empty */ },
    addEventListener: () => { /* empty */ },
    removeEventListener: () => { /* empty */ },
    dispatchEvent: () => { /* empty */ },
  }),
});
