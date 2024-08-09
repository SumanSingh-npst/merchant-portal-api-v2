import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';
import { MulterError } from 'multer';

@Catch(MulterError)
export class FileUploadExceptionFilter implements ExceptionFilter {
    catch(exception: MulterError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        // Handle specific Multer error
        if (exception.code === 'LIMIT_UNEXPECTED_FILE') {
            console.log('too many files uploaded...');
            response
                .status(400)
                .json({
                    statusCode: 400,
                    message: 'Too many files uploaded. Maximum of 4 files are allowed per upload.',
                    error: 'Bad Request'
                });
        } else {
            response
                .status(400)
                .json({
                    statusCode: 400,
                    message: exception.message,
                    error: 'Bad Request'
                });
        }
    }
}
