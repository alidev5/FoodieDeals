import { z } from "zod";

export const createCustomerSchema = z.object({
  deviceId: z.string().min(1),
  pickupName: z.string().min(1).max(80),
});

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
