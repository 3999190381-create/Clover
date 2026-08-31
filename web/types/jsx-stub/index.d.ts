// Stub type declaration for the `react` module.
// Satisfies TS without requiring node_modules/@types/react to be installed.
// Once @types/react is present, this stub is shadowed by typeRoots ordering.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: Record<string, unknown>;
    }
  }
  export type { JSX };
}

declare module "react/jsx-runtime" {
  export {};
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: Record<string, unknown>;
    }
  }
}

export {};

