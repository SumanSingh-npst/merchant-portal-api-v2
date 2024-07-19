import { Injectable } from "@nestjs/common";

@Injectable()
export class FileValidationService {
    mapData(data: any, isSwitchFile: boolean) {
        let rows = {};
        rows["TXN_DATE"] = data["TXN_DATE"];
        rows['UPI_TXN_ID'] = data['UPI_TXN_ID']
        rows['UPI_CODE'] = data['UPI_CODE'];
        rows['AMOUNT'] = data['AMOUNT'];
        rows['RRN'] = data['RRN'];
        rows['PAYEE_VPA'] = data['Payee vpa'] || data['Payee VPA'];
        rows['PAYER_VPA'] = data['Payer vpa'] || data['Payer VPA'];
        rows['MCC'] = data['MCC'];

        if (isSwitchFile) {
            rows['STATUS'] = data['STATUS'];
            rows['NOTE'] = data['NOTE'];
        } else {
            rows['PAYER_PSP'] = data['PAYER_PSP'];
            rows['PAYEE_PSP'] = data['PAYEE_PSP'];
            rows['REM_BANK'] = data['REM_BANK'];
            rows['BEN_BANK'] = data['BEN_BANK'];
        }
        return rows;
    }

    hasInvalidFields(row: any): boolean {
        console.log(row);
        if (!row.UPI_TXN_ID || !row.RRN || !row.UPICODE || !row.TXN_DATE || !row.Amount || !row.PAYER_VPA || !row.PAYEE_VPA) {
            return false;
        }
        return true;
    }
}