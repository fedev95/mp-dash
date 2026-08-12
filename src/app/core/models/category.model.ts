/** A user-defined transaction category. */
export interface Category {
  id: string;
  name: string;
  /** Hex color (e.g. "#3b82f6"), used for badges and the expense breakdown chart. */
  color: string;
}
