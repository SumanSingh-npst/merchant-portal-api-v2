import { Test, TestingModule } from '@nestjs/testing';
import { SharedResourceService } from './shared-resource.service';

describe('SharedResourceService', () => {
  let service: SharedResourceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharedResourceService],
    }).compile();

    service = module.get<SharedResourceService>(SharedResourceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
