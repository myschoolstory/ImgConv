// Import jest-dom matchers to extend Vitest's expect
import '@testing-library/jest-dom/vitest';

// Any other global setup can go here
// For example, mocking global objects or setting up MSW

// Example: Mocking matchMedia (often needed for UI components)
// Object.defineProperty(window, 'matchMedia', {
//   writable: true,
//   value: vi.fn().mockImplementation(query => ({
//     matches: false,
//     media: query,
//     onchange: null,
//     addListener: vi.fn(), // deprecated
//     removeListener: vi.fn(), // deprecated
//     addEventListener: vi.fn(),
//     removeEventListener: vi.fn(),
//     dispatchEvent: vi.fn(),
//   })),
// });

console.log('Vitest setup file loaded.');
