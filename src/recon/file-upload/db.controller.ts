import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { DBService } from "./db.service";

@Controller('db')
export class DbController {

    constructor(private dbSvc: DBService) {

    }

    @Get('/truncateAll')
    async truncateAll() {
        return await this.dbSvc.truncateAll();
    }

    @Get('/allCount')
    async getAllCount() {
        return await this.dbSvc.getAllCount();
    }

    @Get('/selectAll/:tableName')
    async getAllByTableName(@Param('tableName') tableName: string) {
        return await this.dbSvc.selectAllByTableName(tableName);
    }

    @Get('/allTableSchema')
    async getAllTableSchema() {
        return await this.dbSvc.getAllTableSchema();
    }
}