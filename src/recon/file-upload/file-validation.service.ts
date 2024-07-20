import { Injectable } from "@nestjs/common";

@Injectable()
export class FileValidationService {
    mapData(data: any, isSwitchFile: boolean) {
        let rows = {};
        rows["TXN_DATE"] = data["TXN_DATE"];
        rows['UPI_TXN_ID'] = data['UPI_TXN_ID']
        rows['UPICODE'] = data['UPICODE'];
        rows['AMOUNT'] = data['AMOUNT'];
        rows['RRN'] = data['RRN'];
        rows['PAYEE_VPA'] = data['PAYEE_VPA'];
        rows['PAYER_VPA'] = data['PAYER_VPA'];
        rows['MCC'] = data['MCC'];
        if (isSwitchFile) {
            rows['STATUS'] = data['STATUS'];
            rows['NOTE'] = data['NOTE'];
        } else {
            rows['TX_TYPE'] = data['TX_TYPE'];
            rows['TXN_TIME'] = data['TXN_TIME'];
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


    convertDate(dateStr) {
        const day = dateStr.slice(0, 2);
        const month = dateStr.slice(2, 4);
        const year = '20' + dateStr.slice(4, 6);
        return `${year}-${month}-${day}`;
    }
}