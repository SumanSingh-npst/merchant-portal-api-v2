export class create_business {
  public readonly businessRegistrationName: string;
  public readonly isGstPresent: boolean;
  public readonly isTurnoverLessThanLimit: boolean;
  public readonly isBusinessCategoryExempted: boolean;
  public readonly businessName: string;
  public readonly businessType: string;
  public readonly businessModel: string;
  public readonly businessCategoryCode: string;
  public readonly businessSubcategory: string;
  public readonly categoryCode: string;
  public readonly businessDescription: string;
  public readonly businessWebsite: string;
  public readonly appStoreLink: string;
  public readonly contactUs: string;
  public readonly termsConditions: string;
  public readonly refundPolicy: string;
  public readonly businessEmail: string;
  public readonly businessId: string;
}

// ? businessId (public key) : public key for joining.
// * schema for business table.
// CREATE TABLE BUSINESS
// (
//   businessRegistrationName String,
//   isGstPresent Boolean,
//   isTurnoverLessThanLimit Boolean,
//   isBusinessCategoryExempted Boolean,
//   businessName String,
//   businessType String,
//   businessModel String,
//   businessCategoryCode String,
//   businessSubcategory String,
//   categoryCode String,
//   businessDescription String,
//   businessWebsite String,
//   appStoreLink String,
//   contactUs String,
//   termsConditions String,
//   refundPolicy String,
//   businessEmail String,
//   businessId UUID DEFAULT generateUUIDv4()
// )
// ENGINE = ReplacingMergeTree()
// ORDER BY businessId;
