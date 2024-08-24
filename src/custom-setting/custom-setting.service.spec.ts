import { Test, TestingModule } from '@nestjs/testing';
import { CustomSettingService } from './custom-setting.service';

describe('CustomSettingService', () => {
  let service: CustomSettingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomSettingService],
    }).compile();

    service = module.get<CustomSettingService>(CustomSettingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
