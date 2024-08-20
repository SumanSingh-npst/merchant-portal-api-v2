import { isEnum, IsIn, IsNumber, isNumber, Matches, Min } from 'class-validator';
export class GetTXNCountDTO {
    @Matches(/^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/)
    startDate: string;
    @Matches(/^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/)
    endDate: string;
    @IsIn(['NPCI_TXN', 'SWITCH_TXN', 'RECON_TXN', 'DUPLICATE_TXN', 'INVALID_TXN', 'NON_RECON_TXN'], { message: 'tableName must be one of NPCI_TXN, SWITCH_TXN, RECON_TXN, DUPLICATE_TXN, NON_RECON_TXN or INVALID_TXN' })
    txnType: string;
}


