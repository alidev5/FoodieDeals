import { dealTypeSchema } from "@foodiedeals/shared";
import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";

import { RestaurantsService } from "./restaurants.service";

@ApiTags("restaurants")
@Controller("restaurants")
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @ApiOperation({ summary: "List restaurants, optionally filtered by deal type" })
  @ApiQuery({ name: "dealType", required: false })
  @ApiOkResponse({ description: "Restaurants matching the filter" })
  async list(@Query("dealType") dealType?: string) {
    if (dealType === undefined) {
      return this.restaurantsService.list();
    }

    const parsed = dealTypeSchema.safeParse(dealType);
    if (!parsed.success) {
      throw new BadRequestException(`Invalid dealType: ${dealType}`);
    }

    return this.restaurantsService.list(parsed.data);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single restaurant by id" })
  @ApiOkResponse({ description: "The restaurant" })
  async getById(@Param("id") id: string) {
    const restaurant = await this.restaurantsService.getById(id);
    if (!restaurant) {
      throw new NotFoundException(`Restaurant ${id} not found`);
    }
    return restaurant;
  }
}
