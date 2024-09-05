import { IsIn, IsNumber, Matches, Min } from 'class-validator';

export class GetTXNDTO {
  @Matches(/^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/)
  public readonly startDate: string;

  @Matches(/^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/)
  public readonly endDate: string;

  @IsNumber({}, { message: 'startPosition must be a number' })
  @Min(0, { message: 'startPosition must be greater than or equal to 0' })
  public readonly startPosition: number;

  @IsNumber({}, { message: 'offset must be a number' })
  @Min(5, { message: 'offset must be greater than or equal to 5' })
  public readonly offset: number;

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
        'txnType must be one of NPCI_TXN, SWITCH_TXN, RECON_TXN, DUPLICATE_TXN, NON_RECON_TXN or INVALID_TXN',
    },
  )
  public readonly txnType: string;
}
