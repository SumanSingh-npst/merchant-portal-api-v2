import { Test, TestingModule } from '@nestjs/testing';
import { DownloadGateway } from './download.gateway';
import { DownloadService } from './download.service';

describe('DownloadGateway', () => {
  let gateway: DownloadGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DownloadGateway, DownloadService],
    }).compile();

    gateway = module.get<DownloadGateway>(DownloadGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
