export class DisoundError extends Error {
  constructor(error: { type: string; message: string; code?: number }) {
    super(error.message)
  }
}
