import { Injectable } from '@nestjs/common';

@Injectable()
export class FileValidationService {
  payeeVpa = `^[a-zA-Z0-9]+\.[a-zA-Z0-9]+@timecosmos$`;

  public validPayeeVPAs: string[] = [];

  mapData(data: any, isSwitchFile: boolean, uploadId: number) {
    let rows: any = {};
    rows['UPLOAD_ID'] = uploadId;
    rows['UPI_TXN_ID'] = data['UPI_TXN_ID'];
    rows['UPICODE'] = data['UPICODE'];
    rows['AMOUNT'] = data['AMOUNT'];
    rows['RRN'] = data['RRN'];
    rows['PAYEE_VPA'] = data['PAYEE_VPA'];
    rows['PAYER_VPA'] = data['PAYER_VPA'];
    rows['MCC'] = data['MCC'];
    if (isSwitchFile) {
      try {
        let txnDateTime = data['TXN_DATE'].split(' '); // 2024-07-16 or 16-07-2024
        rows['TXN_DATE'] = this.convertSwitchDateFormat(txnDateTime[0]);
        rows['TXN_TIME'] = txnDateTime[1]; // Time part
      } catch (err) {
        rows['TXN_DATE'] = null;
        rows['TXN_TIME'] = null;
      }
      rows['STATUS'] = data['STATUS'];
      rows['NOTE'] = data['NOTE'];
    } else {
      rows['TX_TYPE'] = data['TX_TYPE'];
      rows['TXN_DATE'] = this.convertNPCIDate(data['TXN_DATE']);
      rows['TXN_TIME'] = data['TXN_TIME']; // This might not be necessary anymore if TXN_TIME is already set
      rows['PAYER_CODE'] = data['PAYER_CODE'];
      rows['PAYEE_CODE'] = data['PAYEE_CODE'];
      rows['REM_CODE'] = data['REM_CODE'];
      rows['REM_IFSC_CODE'] = data['REM_IFSC_CODE'];
      rows['REM_ACC_TYPE'] = data['REM_ACC_TYPE'];
      rows['REM_ACC_NUMBER'] = data['REM_ACC_NUMBER'];
      rows['BEN_CODE'] = data['BEN_CODE'];
      rows['BEN_IFSC_CODE'] = data['BEN_IFSC_CODE'];
      rows['BEN_ACC_TYPE'] = data['BEN_ACC_TYPE'];
      rows['BEN_ACC_NUMBER'] = data['BEN_ACC_NUMBER'];
    }

    try {
      !isSwitchFile
        ? (rows['AMOUNT'] = parseFloat(data['AMOUNT']) / 100)
        : null;
    } catch (error) {
      console.log(error);
      rows['AMOUNT'] = 0;
      rows['RRN'] = '';
    }

    return rows;
  }
  validateRow(row: any) {
    let isValid = true;
    const clickhouseFormat = /^\d{4}-\d{2}-\d{2}$/;
    const payeeIsNotTimecosmos =
      /^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+){1,2}@timecosmos$/;
    const amount = /^\d+(?:\.\d{1,2})?$/;
    const startsWithNumber = /^\d/;
    // Removing the first row into invalid txn
    if (row.UPICODE == '2.0') {
      isValid = false;
    } else if (!payeeIsNotTimecosmos.test(row.PAYEE_VPA)) {
      isValid = false;
    } else if (!amount.test(row.AMOUNT)) {
      isValid = false;
    } else if (!clickhouseFormat.test(row.TXN_DATE)) {
      isValid = false;
    } else if (startsWithNumber.test(row.PAYEE_VPA)) {
      isValid = false;
    } else if (!this.validPayeeVPAs.includes(row.PAYEE_VPA)) {
      console.log('is invalid' ,row.PAYEE_VPA)
      isValid = false;
    }
    return isValid;
  }

  isHeaderOrFooter(row: any) {
    if (row['PAYEE_VPA']) return true;
  }
  convertNPCIDate(dateStr) {
    //npci date from psp is mmddyy eg 071624
    //check using regex if it has 6 digits
    if (dateStr == undefined || dateStr == null) {
      return null;
    }
    const dateRegex = /^(\d{2})(\d{2})(\d{2})$/; //
    let match = dateStr.match(dateRegex);
    if (match) {
      //split the date into 3 parts
      let [_, month, day, year] = match;
      year = '20' + year;
      return `${year}-${month}-${day}`;
    } else {
      return null;
    }
  }

  convertSwitchDateFormat(dateString: string): string {
    const isoFormat = /^\d{4}-\d{2}-\d{2}$/;
    if (isoFormat.test(dateString)) {
      return dateString;
    }

    // Check if the date is in DD-MM-YYYY format or YYYY-DD-MM format
    const europeanFormat = /^\d{2}-\d{2}-\d{4}$/;
    const yyyymmddFormat = /^\d{4}-\d{2}-\d{2}$/;
    if (europeanFormat.test(dateString)) {
      const [day, month, year] = dateString.split('-');
      return `${year}-${month}-${day}`;
    } else if (yyyymmddFormat.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${year}-${month}-${day}`;
    }
    throw new Error('Invalid date format');
  }

  removeDuplicates(arr, key) {
    const seen = new Set();
    return arr.filter((item) => {
      const keyValue = item[key];
      if (seen.has(keyValue)) {
        return false;
      } else {
        seen.add(keyValue);
        return true;
      }
    });
  }
}
