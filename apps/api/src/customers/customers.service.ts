import { Injectable } from "@nestjs/common";
import type { Customer } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

import type { CreateCustomerDto } from "./customers.dto";

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(dto: CreateCustomerDto): Promise<Customer> {
    return this.prisma.customer.upsert({
      where: { deviceId: dto.deviceId },
      create: { deviceId: dto.deviceId, pickupName: dto.pickupName },
      update: { pickupName: dto.pickupName },
    });
  }
}
