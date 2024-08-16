import { Body, Controller, Delete, Get, Param, Post, UploadedFiles, UseFilters, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer'
import { FileUploadExceptionFilter } from './fileupload-exception.filter';
import { FileUploadService } from './file-upload.service';
@Controller('recon/file-upload')
export class FileUploadController {
    constructor(private readonly fileUploadService: FileUploadService) { }
    @Post('/npciUploads')
    @UseInterceptors(FilesInterceptor('files', 8))
    @UseFilters(FileUploadExceptionFilter)
    async uploadNPCIFiles(@UploadedFiles() files: Multer.File[]) {
        console.log('npci upload starts.');
        return await this.fileUploadService.validateAndStoreFiles(files, false);
    }
    @Post('/switchUploads')
    @UseInterceptors(FilesInterceptor('files', 8))
    async uploadSwitchFile(@UploadedFiles() files: Multer.File[]) {
        console.log('switch upload starts...');
        return await this.fileUploadService.validateAndStoreFiles(files, true);
    }


    @Get('/history')
    async getUploadedFileHistory() {
        return await this.fileUploadService.getFileUploadedHistory();
    }

    @Post('/checkDuplicateUploads')
    @UseInterceptors(FilesInterceptor('files', 50))
    async uploadForDuplicate(@UploadedFiles() files: Multer.File[]) {
        console.log('duplicate check starts....')
        return await this.fileUploadService.checkDuplicateUploads(files, false);
    }

    @Post('/deleteHistory')
    async deleteFileHistory(@Body() body: { fileName: string, uploadId: number, fileType: string }) {
        const { fileName, uploadId } = body;
        return await this.fileUploadService.deleteFileHistory(fileName, uploadId, body.fileType);
    }
}
