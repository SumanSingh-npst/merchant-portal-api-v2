import { IsIn, Matches } from 'class-validator';
export class GetTXNCountDTO {
  @Matches(/^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/)
  public readonly startDate: string;
  @Matches(/^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/)
  public readonly endDate: string;
  @IsIn(
    [
      'NPCI_TXN',
      'SWITCH_TXN',
      'RECON_TXN',
      'DUPLICATE_TXN',
      'INVALID_TXN',
      'NON_RECON_TXN',
    ],
    {
      message:
        'tableName must be one of NPCI_TXN, SWITCH_TXN, RECON_TXN, DUPLICATE_TXN, NON_RECON_TXN or INVALID_TXN',
    },
  )
  public readonly txnType: string;
}
