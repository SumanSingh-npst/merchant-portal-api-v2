import { Body, Controller, Post } from '@nestjs/common';
import { SharedResourceService } from './shared-resource.service';
import { update, Find } from './dtos/update.dto';

@Controller('shared-resource')
export class SharedResourceController {
  constructor(private readonly sharedResourceService: SharedResourceService) {}

  @Post('/update')
  async update(@Body() body: update) {
    return await this.sharedResourceService.update(body);
  }

  @Post('/find')
  async find(@Body() body: Find) {
    return await this.sharedResourceService.findByValue(body);
  }
}
