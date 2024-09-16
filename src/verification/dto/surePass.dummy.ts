export const panDummyData = {
  data: {
    client_id: 'pan_comprehensive_MTOguvJYqbuAkUzXNLsi',
    pan_number: 'AAECN4770H',
    full_name: 'NETWORK PEOPLE SERVICES TECHNOLOGIES LIMITED',
    full_name_split: ['NETWORK PEOPLE SERVICES TECHNOLOGIES LIMITED', '', ''],
    masked_aadhaar: null,
    address: {
      line_1: '427-428-429, A WING, NSIL LODHA SUPERMUS II',
      line_2: 'NEAR PASSPORT OFFICE, RAOD NO 22, WAGLE IND ESTATE',
      street_name: 'Wagle I.E. S.O',
      zip: '400604',
      city: 'Thane',
      state: 'MAHARASHTRA',
      country: 'INDIA',
      full: '427-428-429, A WING, NSIL LODHA SUPERMUS II NEAR PASSPORT OFFICE, RAOD NO 22, WAGLE IND ESTATE Wagle I.E. S.O 400604 Thane MAHARASHTRA INDIA',
    },
    email: 'inder.naugai@npstx.com',
    phone_number: '9818294768',
    gender: '',
    dob: '2013-10-04',
    input_dob: null,
    aadhaar_linked: null,
    dob_verified: false,
    dob_check: false,
    category: 'company',
    less_info: false,
  },
  status_code: 200,
  success: true,
  message: null,
  message_code: 'success',
};

export const GSTDummyData = {
  data: {
    address_details: {},
    einvoice_status: true,
    client_id: 'corporate_gstin_FjaWiOSlZsruckoMEnts',
    gstin: '06AAECN4770H1ZE',
    pan_number: 'AAECN4770H',
    business_name: 'NETWORK PEOPLE SERVICES TECHNOLOGIES PVT LTD.',
    legal_name: 'NETWORK PEOPLE SERVICES TECHNOLOGIES PRIVATE LIMITED',
    center_jurisdiction:
      'State - CBIC,Zone - PANCHKULA,Commissionerate - GURUGRAM,Division - DIVISION-SOUTH-1,Range - R-18',
    state_jurisdiction:
      'State - Haryana,Range - Gurgaon,District - Gurgaon (North),Ward - Gurgaon (North) Ward 7 (Jurisdictional Office)',
    date_of_registration: '2017-07-01',
    constitution_of_business: 'Private Limited Company',
    taxpayer_type: 'Regular',
    gstin_status: 'Cancelled on application of Taxpayer',
    date_of_cancellation: '2019-12-31',
    field_visit_conducted: 'No',
    nature_bus_activities: ['Service Provision', 'Retail Business'],
    nature_of_core_business_activity_code: 'SPO',
    nature_of_core_business_activity_description: 'Service Provider and Others',
    aadhaar_validation: 'No',
    aadhaar_validation_date: '1800-01-01',
    filing_status: [],
    address:
      '14/2, SANJAY COLONY, OPP SHEETAL HOSPITAL, NEW RLY ROAD, GURGAON, Gurugram, Haryana, 122001',
    hsn_info: {
      goods: [
        {
          description:
            'AUTOMATIC DATA PROCESSING MACHINES AND UNITS THEREOF; MAGNETIC OR OPTICAL READERS, MACHINES FOR TRANSCRIBING DATA ON TO DATA MEDIA IN CODED FORM AND MACHINES FOR PROCESSING SUCH DATA, NOT ELSEWHERE SPECIFIED OR INCLUDED ANALOGUE OR HYBRID AUTOMATIC DATA PROCESSING MACHINES',
          hsn: '84711000',
        },
        {
          description:
            'AUTOMATIC DATA PROCESSING MACHINES AND UNITS THEREOF; MAGNETIC OR OPTICAL READERS, MACHINES FOR TRANSCRIBING DATA ON TO DATA MEDIA IN CODED FORM AND MACHINES FOR PROCESSING SUCH DATA, NOT ELSEWHERE SPECIFIED OR INCLUDED - OTHER DIGITAL AUTOMATIC DATA PROCESSING MACHINES - COMPRISING IN THE SAME HOUSING AT LEAST A CENTRAL PROCESSING UNIT AND AN INPUT AND OUTPUT UNIT, WHETHER OR NOT COMBINED :MICRO COMPUTER',
          hsn: '84714110',
        },
        {
          description:
            'DIODES, TRANSISTORS AND SIMILAR SEMI-CONDUCTOR DEVICES; PHOTOSENSITIVE SEMI-CONDUCTOR DEVICES, INCLUDING PHOTOVOLTAIC CELLS WHETHER OR NOT ASSEMBLED IN MODULES OR MADE UP INTO PANELS; LIGHT EMITTING DIODES; MOUNTED PIEZO-ELECTRIC CRYSTALS PARTS',
          hsn: '85419000',
        },
        {
          description:
            'SOAP; ORGANIC SURFACE-ACTIVE PRODUCTS AND PREPARATIONS FOR USE AS SOAP, IN THE FORM OF BARS,CAKES, MOULDED PIECES OR SHAPES, WHETHER OR NOT CONTAINING SOAP; ORGANIC SURFACE-ACTIVE PRODUCTS AND PREPARATIONS FOR WASHING THE SKIN, IN THE FORM OF LIQUID OR CREAM AND PUT UP FOR RETAIL SALE, WHETHER OR NOT CONTAINING SOAP; PAPER, WADDING, FELT AND NONWOVENS, IMPREGNATED, COATED OR COVERED WITH SOAP OR DETERGENT ORGANIC SURFACE-ACTIVE PRODUCTS AND PREPARATIONS FOR WASHING THE SKIN, IN THE FORM OF LIQUID OR CREAM AND PUT UP FOR RETAIL SALE,WHETHER OR NOT CONTAINING SOAP : OTHER',
          hsn: '34013090',
        },
      ],
      services: [
        {
          description: 'BUSINESS AUXILIARY SERVICES',
          hsn: '00440225',
        },
        {
          description: 'FRANCHISE SERVICES',
          hsn: '00440237',
        },
        {
          description: 'BUSINESS SUPPORT SERVICES',
          hsn: '00440366',
        },
        {
          description: 'MANAGEMENT CONSULTANTS',
          hsn: '00440116',
        },
        {
          description: 'MANPOWER RECRUITMENT AGENCY',
          hsn: '00440060',
        },
      ],
    },
    filing_frequency: [],
  },
  status_code: 200,
  success: true,
  message: null,
  message_code: 'success',
};

export const generateAadhaarOTP = {
  data: {
    client_id: 'aadhaar_v2_KhaVeWxhwwThwkVEUrwb',
    otp_sent: true,
    if_number: true,
    valid_aadhaar: true,
    status: 'generate_otp_success',
  },
  status_code: 200,
  message_code: 'success',
  message: 'OTP Sent.',
  success: true,
};
export const aadhaarDummyData = {
  data: {
    client_id: 'aadhaar_v2_KhaVeWxhwwThwkVEUrwb',
    full_name: 'Abcde',
    aadhaar_number: '691710839487',
    dob: '2024-08-01',
    gender: 'M',
    address: {
      country: 'India',
      dist: 'Mumbai',
      state: 'Maharashtra',
      po: '',
      loc: 'Premier',
      vtc: 'Kurla West',
      subdist: '',
      street: 'Father Peter Pereira Road',
      house: 'House No 105/B, Room No 3, First Floor',
      landmark: '',
    },
    face_status: false,
    face_score: -1,
    zip: '400070',
    profile_image:
      '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',
    has_image: true,
    email_hash: '',
    mobile_hash:
      '8f0271fce2a6d1bd667ce561f2b16f582b5033306d345184582de8d70f0',
    raw_xml:
      'https://aadhaar-kyc-docs.s3.amazonaws.com/npstx/aadhaar_xml/94872024091612998/9440916123535998-2024-09-16-070536176289.xml?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAY5K35FYWPQJEB%2F20240916%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20240916T070536Z&X-Amz-Expires=432000&X-Amz-SignedHeaders=host&X-Amz-Signature=96204e7b903968c5a63226a522beea6bec4617899b126a55fe9d9667249d35e2',
    zip_data:
      'https://aadhaar-kyc-docs.s3.amazonaws.com/npstx/aadhaar_xml/94872024091612358/94872024091635998-2024-09-16-070536105754.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAY5K3QRYWPQJEB%2F20240916%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20240916T070536Z&X-Amz-Expires=432000&X-Amz-SignedHeaders=host&X-Amz-Signature=c770e81ae1a4f47e80b8b22e4127a701e47a0a9ee13be453dbfa451a98d58168',
    care_of: 'S/O Efgh',
    share_code: '8421',
    mobile_verified: false,
    reference_id: '948720240916123535998',
    aadhaar_pdf: null,
    status: 'success_aadhaar',
    uniqueness_id:
      '8a9d68ed3f337ac56ce3a25397b425aec3250e6c78351f7e85e22cbd0e5',
  },
  status_code: 200,
  success: true,
  message: null,
  message_code: 'success',
};
