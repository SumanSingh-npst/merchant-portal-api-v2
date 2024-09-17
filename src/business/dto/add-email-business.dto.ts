export class createBusiness {
  public readonly businessEmail: string;

  public readonly userId: string;
  public createdOn?: any;
}

export class documentDto {
  documentNo: string;
  documentStatus: string;
  documentRawData: string;
  documentType: string;
  businessId: string;
  verifiedOn?: any;
  KYCProvider?: KYCPROVIDERS;
}

export enum KYCPROVIDERS {
  SUREPASS = 'SUREPASS',
  DECENTRO = 'DECENTRO',
}
