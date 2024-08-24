import { ClickHouseClient } from '@clickhouse/client';
import { InjectClickHouse } from '@md03/nestjs-clickhouse';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';
import { createObjectCsvWriter } from 'csv-writer';
import { CustomSettingService } from 'src/custom-setting/custom-setting.service';
import { v4 as uuidv4 } from 'uuid';
import { QueueService } from './queue.service';


@Injectable()
export class DownloadService {
    private outputDir = path.join(__dirname, 'downloads');  // Directory for storing CSV and zip files

    constructor(private queueSvc: QueueService, private settingSvc: CustomSettingService, @InjectClickHouse() private readonly clickdb: ClickHouseClient,
    ) {

    }

    async initiateDownload(tableName: string, startDate: string, endDate: string, userId: string) {
        const uuid = uuidv4();
        const exists = await this.queueSvc.checkQueueExists(tableName, userId, startDate, endDate);
        if (exists) {
            console.log('Request already exists in queue');
            return 'Request already in queue';
        }
        const count = await this.getDownloadCount(tableName, startDate, endDate);
        console.log(count);
        if (count > 0) {
            //1 : check if the request is already in the queue
            if (!fs.existsSync(this.outputDir)) {
                fs.mkdirSync(this.outputDir, { recursive: true });
            }
            // Insert the request into DOWNLOAD_QUEUE
            await this.queueSvc.enqueueDownloadRequest(tableName, uuid, startDate, endDate, userId);
            // Step 2: Determine the chunk size (default to 10000 if not set in DB)
            const chunkSize = this.settingSvc.getSetting('DOWNLOAD_CHUNK_SIZE') || 10000;
            console.log('Chunk size:', chunkSize);
            // Step 3: Calculate all chunks (start and end positions)
            const chunkCount = Math.ceil(count / chunkSize);
            console.log('Total chunks:', chunkCount);
            await this.queueSvc.updateQueue(uuid, chunkCount, count, 'PROCESSING');
            const chunks: { start: number, end: number }[] = [];
            for (let i = 0; i < chunkCount; i++) {
                const chunkStart = i * chunkSize;
                const chunkEnd = chunkSize;  // This is the limit for each chunk
                chunks.push({ start: chunkStart, end: chunkEnd });
            }

            // Step 4: Process chunks in parallel (e.g., 4-32 at a time)
            let maxParallelChunks;
            if (chunkCount <= 10) {
                maxParallelChunks = 4;
            } else if (chunkCount <= 50) {
                maxParallelChunks = 8;
            } else if (chunkCount <= 100) {
                maxParallelChunks = 16;
            } else {
                maxParallelChunks = 32;
            }
            console.log('Max parallel chunks:', maxParallelChunks);
            const csvFiles: string[] = [];  // To keep track of all generated CSV files

            for (let i = 0; i < chunks.length; i += maxParallelChunks) {
                const chunkPromises = chunks.slice(i, i + maxParallelChunks).map(async (chunk, index) => {
                    const csvFile = await this.processChunk(tableName, startDate, endDate, chunk.start, chunk.end, i + index + 1);
                    csvFiles.push(csvFile);
                }
                );
                await Promise.all(chunkPromises);  // Wait for all parallel chunks to complete
            }

            // Step 5: After processing all chunks, perform any necessary post-processing
            console.log('All chunks processed, now zipping and sending the files...');
            const zipFile = await this.zipFiles(csvFiles);
            const downloadUrl = await this.generateDownloadLink(zipFile);
            await this.queueSvc.updateQueue(uuid, chunkCount, count, 'COMPLETED', downloadUrl);
            return 'Download request processed successfully';
        } else {
            console.log('No records found for the given date range.');
            return 'no records found for the given date range for table ' + tableName;
        }

    }

    // async checkRequestExists(tableName: string, senderId: string, startDate: string, endDate: string): Promise<boolean> {
    //     const query = `SELECT * FROM DOWNLOAD_QUEUE WHERE USER_ID='${senderId}'AND TABLE_NAME = '${tableName}' AND RANGE_START='${startDate}' AND RANGE_END='${endDate}' AND STATUS = 'PENDING' LIMIT 1;`;
    //     const result = await this.clickdb.query({ query });
    //     const jsonResponse = await result.json();
    //     if ((jsonResponse as any).data.length > 0) {
    //         return true;
    //     }
    //     return false;
    // }
    async getDownloadCount(tableName: string, startDate: string, endDate: string) {
        console.log(startDate, endDate, tableName);
        try {
            const r = await this.clickdb.query({ query: `SELECT COUNT(*) AS count FROM ${tableName} WHERE TXN_DATE BETWEEN '${startDate}' AND '${endDate}'` });
            const res = await r.json();
            return (res as any).data.length && (res as any).data[0].count;
        } catch (error) {
            console.log(error);
            return 0;
        }
    }

    async processChunk(tableName: string, startDate: string, endDate: string, chunkStart: number, chunkEnd: number, chunkIndex: number): Promise<string> {
        console.log(`SELECT * from ${tableName} where TXN_DATE BETWEEN '${startDate}' AND '${endDate}' LIMIT ${chunkEnd} OFFSET ${chunkStart};`);
        const query = `SELECT * from ${tableName} where TXN_DATE BETWEEN '${startDate}' AND '${endDate}' LIMIT ${chunkEnd} OFFSET ${chunkStart};`;
        const result = await this.clickdb.query({ query });
        const jsonResponse = await result.json();
        const data = (jsonResponse as any).data;

        if (!Array.isArray(data)) {
            throw new Error('Expected an array of objects from the query response');
        }

        const csvFileName = path.join(this.outputDir, `chunk_${chunkIndex}.csv`);
        const csvWriter = createObjectCsvWriter({
            path: csvFileName,
            header: Object.keys(data[0]).map((key) => ({ id: key, title: key })),
        });

        await csvWriter.writeRecords(data);
        console.log(`CSV file created: ${csvFileName}`);
        return csvFileName;
    }


    async zipFiles(files: string[]): Promise<string> {
        const zipFileName = path.join(this.outputDir, `download_${Date.now()}.zip`);
        const output = fs.createWriteStream(zipFileName);
        const archive = archiver('zip', { zlib: { level: 9 } });

        return new Promise((resolve, reject) => {
            archive.on('error', (err) => reject(err));
            output.on('close', () => resolve(zipFileName));

            archive.pipe(output);

            files.forEach((file) => {
                archive.file(file, { name: path.basename(file) });
            });

            archive.finalize();
        });
    }

    generateDownloadLink(zipFile: string): string {
        const downloadUrl = `/downloads/${path.basename(zipFile)}`;
        return downloadUrl;
    }

    async getZipFile(queueId: string,) {
        const query = `SELECT DOWNLOAD_URL FROM DOWNLOAD_QUEUE WHERE QUEUE_ID = '${queueId}'`;
        const result = await this.clickdb.query({ query });
        const jsonResponse = await result.json();
        if ((jsonResponse as any).data.length > 0) {
            return (jsonResponse as any).data[0].DOWNLOAD_URL;
        }
        return 'No download URL found';

    }
}
