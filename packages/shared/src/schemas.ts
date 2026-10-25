import { z } from "zod";

import { ORDER_STATUSES } from "./orders";

export const orderStatusSchema = z.enum(ORDER_STATUSES);
