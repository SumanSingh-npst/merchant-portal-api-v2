import { Controller } from '@nestjs/common';
import { CustomSettingService } from './custom-setting.service';

@Controller('custom-setting')
export class CustomSettingController {
  constructor(private readonly customSettingService: CustomSettingService) {}
}
