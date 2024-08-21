// zip.service.ts
import { Injectable } from '@nestjs/common';
import * as Archiver from 'archiver';
import { PassThrough } from 'stream';

@Injectable()
export class ZipService {
    private zipStream: PassThrough;
    private archive: Archiver.Archiver;

    constructor() {
        this.zipStream = new PassThrough();
        this.archive = Archiver('zip', { zlib: { level: 9 } });
        this.archive.pipe(this.zipStream);
    }

    addToZip(data: Buffer, fileName: string) {
        this.archive.append(data, { name: fileName });
    }

    finalizeZip() {
        this.archive.finalize();
    }

    getZipStream(): PassThrough {
        return this.zipStream;
    }
}
