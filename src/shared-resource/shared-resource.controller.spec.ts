import { Test, TestingModule } from '@nestjs/testing';
import { SharedResourceController } from './shared-resource.controller';
import { SharedResourceService } from './shared-resource.service';

describe('SharedResourceController', () => {
  let controller: SharedResourceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SharedResourceController],
      providers: [SharedResourceService],
    }).compile();

    controller = module.get<SharedResourceController>(SharedResourceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
