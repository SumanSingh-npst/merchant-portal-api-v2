import { Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile, BadRequestException, Res, HttpStatus } from '@nestjs/common';
import { DownloadService } from './download.service';
import { QueueService } from './queue.service';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { DownloadZipDto } from './dtos/download-zip.dto';

@Controller('download')
export class DownloadController {
    constructor(private queueSvc: QueueService) {

    }


    @Post('/zipfile')
    async downloadZipFile(@Body() body: DownloadZipDto, @Res() res: Response) {
        try {
            // Get the stored download URL from the database
            const downloadUrl = await this.queueSvc.getZipFile(body.queueId, body.userId);
            console.log('downloadUrl is ', downloadUrl);
            if (!downloadUrl) {
                return res.status(HttpStatus.NOT_FOUND).json({ message: 'no download url found' });
            }
            // Convert the stored URL to a file system path
            const zipFilePath = path.join(__dirname, 'downloads', path.basename(downloadUrl));
            console.log(`zipFilePath is ${zipFilePath}`);

            if (!fs.existsSync(zipFilePath)) {
                return res.status(HttpStatus.NOT_FOUND).json({ message: 'File not found' });
            }

            // Send the file to the client
            return res.sendFile(zipFilePath);
        } catch (error) {
            console.error('Error retrieving file:', error);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error retrieving file', error: error.message });
        }
    }

}