import { z } from "zod";

export const orderActionSchema = z.object({
  action: z.enum(["ACCEPT", "MARK_READY", "PICKED_UP"]),
});
export type OrderActionDto = z.infer<typeof orderActionSchema>;

export const setAvailabilitySchema = z.object({
  isOpen: z.boolean(),
});
export type SetAvailabilityDto = z.infer<typeof setAvailabilitySchema>;

export const orderStatusQuerySchema = z.object({
  status: z.enum(["WAITING", "ACCEPTED", "READY", "PICKED_UP"]).optional(),
});
