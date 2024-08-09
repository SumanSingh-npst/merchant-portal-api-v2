import { Body, Controller, Get, Param, Post, UploadedFiles, UseFilters, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer'
import { FileUploadService } from './file-upload.service';
import { FileUploadExceptionFilter } from './fileupload-exception.filter';
@Controller('recon/file-upload')
export class FileUploadController {
    constructor(private readonly fileUploadService: FileUploadService) { }
    @Post('/npciUploads')
    @UseInterceptors(FilesInterceptor('files', 4))
    @UseFilters(FileUploadExceptionFilter)
    async uploadNPCIFiles(@UploadedFiles() files: Multer.File[]) {
        console.log('npci upload starts.');
        return await this.fileUploadService.validateAndStoreFiles(files, false);
    }
    @Post('/switchUploads')
    @UseInterceptors(FilesInterceptor('files', 4, { limits: { fileSize: 2 * 1024 * 1024 * 1024 } }))
    async uploadSwitchFile(@UploadedFiles() files: Multer.File[]) {
        console.log('switch upload starts..');
        return await this.fileUploadService.validateAndStoreFiles(files, true);
    }

    @Get('/fileExists/:fileName')
    async checkFileExists(@Param('fileName') fileName: string) {
        return await this.fileUploadService.checkFileExist(fileName);
    }

    @Get('/history')
    async getUploadedFileHistory() {
        return await this.fileUploadService.getUploadedFileHistory();

    }

    @Post('/checkDuplicateUploads')
    @UseInterceptors(FilesInterceptor('files', 50))
    async uploadForDuplicate(@UploadedFiles() files: Multer.File[]) {
        console.log('duplicate check starts....')
        return await this.fileUploadService.checkDuplicateUploads(files, false);
    }

    @Post('/checkDuplicateSwitchUploads')
    async forceDeleteHistory(@Body() body: { fileName: string, uploadType: string, uploadDate: string, txnDate: string }) {
        return await this.fileUploadService.forceDeleteHistory(body);
    }

}
