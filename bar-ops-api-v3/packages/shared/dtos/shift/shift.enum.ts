export enum ShiftRole {
  BARTENDER = "bartender",
  WAITER = "waiter",
  RUNNER = "runner",
  BAR_MANAGER = "barmanger",
  WAITER_MANAGER = "waitermanger",
}

// Staffing decision, separate from `approved` (hours correctness)
export enum ShiftRegistration {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}
