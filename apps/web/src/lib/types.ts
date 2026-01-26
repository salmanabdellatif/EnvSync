export type ActionState<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string };
