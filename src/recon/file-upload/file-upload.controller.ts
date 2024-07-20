import { Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer'
import { FileUploadService } from './file-upload.service';
@Controller('recon/file-upload')
export class FileUploadController {
    constructor(private readonly fileUploadService: FileUploadService) { }

    @Post('/npciUploads')
    @UseInterceptors(FilesInterceptor('files', 21))
    async uploadNPCIFiles(@UploadedFiles() files: Multer.File[]) {
        return await this.fileUploadService.validateAndStoreFiles(files, false);
    }

    @Post('/switchUploads')
    @UseInterceptors(FilesInterceptor('files', 3))
    async uploadSwitchFile(@UploadedFiles() files: Multer.File[]) {
        return await this.fileUploadService.validateAndStoreFiles(files, true);
    }

}
