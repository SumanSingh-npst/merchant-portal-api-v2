import { Action } from '../enum/action.enum';
import { DocumentType } from '../enum/documentType.enum';

export class CreateDocumentDTO {
  public readonly documentId: string;
  public readonly documentNumber: string;
  public readonly documentStatus: string;
  public readonly verifiedOn: string;
  public readonly documentRawData: string;
  public readonly documentType: DocumentType;
  public readonly documentReferenceId: string;
  public readonly documentUrl: string;
  public readonly createdOn: string;
  public readonly isCurrent: boolean;
  public readonly legalActionStatus: Action;
  public readonly adminActionStatus: Action;
  public readonly adminRemarks: string;
  public readonly legalRemarks: string;
  public readonly adminLastActivity: string;
  public readonly legalLastActivity: string;
}

// ! document type enum remaining here
// ? documentReferenceId is businessId
