import { Injectable } from '@nestjs/common';
import { Multer } from 'multer'
@Injectable()
export class ReconService {




    async initiate2WayRecon(switchFiles, npciFiles) {
        // Logic to read the CSV file data and perform recon here
        // Read and store data in SWITCH_TXNS and NPCI_TXNS

        // Example for CSV reading and processing
        const switchData = await this.readCSV(switchFiles);
        const npciData = await this.readCSV(npciFiles);

        // Store data in databases
        await this.storeDataInDB('SWITCH_TXNS', switchData);
        await this.storeDataInDB('NPCI_TXNS', npciData);

        // Perform reconciliation
        const twoWayReconData = await this.performInnerJoin();
        const nonReconData = await this.findNonMatchingRecords();

        // Store reconciliation results
        await this.storeDataInDB('TWO_WAY_RECON', twoWayReconData);
        await this.storeDataInDB('NON_RECON_TXNS', nonReconData);
    }

    // Helper functions (example implementations)
    async readCSV(files) {
        // Logic to read CSV files and return data
    }

    async storeDataInDB(tableName, data) {
        // Logic to store data in database
    }

    async performInnerJoin() {
        // Logic to perform inner join on Txn id and UPI Txn id
    }

    async findNonMatchingRecords() {
        // Logic to find non-matching records
    }
}
