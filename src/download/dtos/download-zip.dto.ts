import { IsNotEmpty } from 'class-validator';
export class DownloadZipDto {

    @IsNotEmpty({
        message: 'queueId is required',
    })
    queueId: string;

    @IsNotEmpty({
        message: 'userId is required',
    })
    userId: string
}