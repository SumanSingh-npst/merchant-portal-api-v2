import { Injectable } from "@nestjs/common";

@Injectable()
export class FileValidationService {
    mapData(data: any, isSwitchFile: boolean) {
        let rows: any = {};

        // Split TXN_DATE to get date and time separately

        // let txnDateTime = data["TXN_DATE"].split(" ");

        //rows["TXN_DATE"] = txnDateTime[0]; // Date part
        //rows["TXN_TIME"] = txnDateTime[1]; // Time part
        rows['UPI_TXN_ID'] = data['UPI_TXN_ID'];
        rows['UPICODE'] = data['UPICODE'];
        rows['AMOUNT'] = data['AMOUNT'];
        rows['RRN'] = data['RRN'];
        rows['PAYEE_VPA'] = data['PAYEE_VPA'];
        rows['PAYER_VPA'] = data['PAYER_VPA'];
        rows['MCC'] = data['MCC'];

        if (isSwitchFile) {

            let txnDateTime = data["TXN_DATE"].split(" "); // 2024-07-16 or 16-07-2024

            rows["TXN_DATE"] = this.convertSwitchDateFormat(txnDateTime[0]);
            rows["TXN_TIME"] = txnDateTime[1]; // Time part
            rows['STATUS'] = data['STATUS'];
            rows['NOTE'] = data['NOTE'];
        } else {
            rows['TX_TYPE'] = data['TX_TYPE'];
            rows["TXN_DATE"] = data['TXN_DATE'];
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
            !isSwitchFile ? rows['AMOUNT'] = parseFloat(data['AMOUNT']) / 100 : null;
        } catch (error) {
            console.log(error);
            rows['AMOUNT'] = 0;
            rows['RRN'] = '';
        }

        return rows;
    }


    hasMissingFields(row: any, isSwitchFile: boolean): boolean {
        return !row.UPI_TXN_ID || row.UPI_TXN_ID === '' ||
            !row.RRN || row.RRN === '' ||
            !row.UPICODE || row.UPICODE === '' ||
            !row.TXN_DATE || row.TXN_DATE === '' ||
            !row.AMOUNT || row.AMOUNT === '' ||
            !row.PAYER_VPA || row.PAYER_VPA === '' ||
            !row.PAYEE_VPA || row.PAYEE_VPA === '';
    }


    convertNPCIDate(dateStr) {

        const month = dateStr.slice(0, 2);
        const day = dateStr.slice(2, 4);
        const year = '20' + dateStr.slice(4, 6);
        return `${year}-${month}-${day}`;
    }

    convertSwitchDateFormat(dateString: string): string {
        // Split the input date string into an array [day, month, year]
        const [day, month, year] = dateString.split('-');
        const isoFormat = /^\d{4}-\d{2}-\d{2}$/;
        if (isoFormat.test(dateString)) {
            return dateString;
        }

        // Check if the date is in DD-MM-YYYY format
        const europeanFormat = /^\d{2}-\d{2}-\d{4}$/;
        if (europeanFormat.test(dateString)) {
            const [day, month, year] = dateString.split('-');
            return `${year}-${month}-${day}`;
        }

        throw new Error('Invalid date format');
        // Return the formatted date string in YYYY-MM-DD format
        return `${year}-${month}-${day}`;
    }
}