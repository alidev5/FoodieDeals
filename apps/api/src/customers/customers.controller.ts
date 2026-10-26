import { Body, Controller, Get, Param, Post, UsePipes } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";

import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { createCustomerSchema } from "./customers.dto";
import { CustomersService } from "./customers.service";

@ApiTags("customers")
@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: "Create or update a customer identified by device id" })
  @ApiCreatedResponse({ description: "The customer record" })
  @UsePipes(new ZodValidationPipe(createCustomerSchema))
  async create(@Body() body: ReturnType<typeof createCustomerSchema.parse>) {
    return this.customersService.upsert(body);
  }

  @Get(":deviceId/summary")
  @ApiOperation({ summary: "Monthly savings and recently ordered restaurants for a device" })
  @ApiOkResponse({ description: "Savings totals and recent restaurants, newest first" })
  async summary(@Param("deviceId") deviceId: string) {
    return this.customersService.getSummary(deviceId);
  }
}
