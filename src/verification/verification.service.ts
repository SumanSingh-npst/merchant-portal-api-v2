import { Injectable } from '@nestjs/common';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class VerificationService {
  constructor(private readonly httpService: HttpService) {}
  surePass: string = 'https://kyc-api.surepass.io';
  bearerToken: string =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcyMzExMDgyOCwianRpIjoiNjhhZmUwZjAtYzQwOC00MGVlLWE1YTMtMmYyMzE2NTFhZWY1IiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2Lm5wc3R4QHN1cmVwYXNzLmlvIiwibmJmIjoxNzIzMTEwODI4LCJleHAiOjIwMzg0NzA4MjgsImVtYWlsIjoibnBzdHhAc3VyZXBhc3MuaW8iLCJ0ZW5hbnRfaWQiOiJtYWluIiwidXNlcl9jbGFpbXMiOnsic2NvcGVzIjpbInVzZXIiXX19.WxlRslnSL0YPpX6TcS2th4TzTdNI_zZx0jvvcUaEOcI';

  create(createVerificationDto: CreateVerificationDto) {
    return 'This action adds a new verification';
  }

  async verifyPan(body: any): Promise<any> {
    console.log(body.panNo)
    const url = `${this.surePass}/api/v1/pan/pan-comprehensive`;

    const mybody = { id_number: body.panNo };
    console.log(mybody)

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, mybody, {
          headers: {
            Authorization: `Bearer ${this.bearerToken}`, // Bearer token in headers
          },
        }),
      );
      return response.data;
    } catch (error) {
      throw new Error('Error verifying PAN');
    }
  }

  //   async verifyGST(gstNo: string) {
  //     return new Promise<any>(async (resolve, reject) => {
  //         try {
  //             const checkGstFormate = validateGst(gstNo);

  //             if (!checkGstFormate) {
  //                 // throw new Error('Invalid GST number');
  //                 return resolve(new NpstResp({ data: false, msg: "Invalid GST number", status: false }));
  //             }

  //             /**
  //              * check if GST is already present in DB
  //              */

  //             const data = JSON.stringify({
  //                 "id_number": `${gstNo}`
  //             })

  //             let url = `${this.configService.get('SUREPASS_BASE_URL')}/api/v1/corporate-otp/gstin/init`

  //             const gstData = await firstValueFrom(this.httpService.post(
  //                 url,
  //                 // "https://sandbox.surepass.io/api/v1/corporate-otp/gstin/init",
  //                 data,
  //                 {
  //                     headers: {
  //                         'Content-Type': 'application/json',
  //                         'Authorization': `Bearer ${this.configService.get('SUREPASS_TOKEN')}`
  //                     }
  //                 }
  //             ));
  //             this.logger.log("Surepass GST Response : " + gstData.data);

  //             /**
  //              * Save this response in DB for avoide calling API again
  //              */

  //             return resolve(new NpstResp(
  //                 {
  //                     data: gstData.data.data
  //                 }
  //             ));
  //         } catch (error) {
  //             console.log("🚀 ~ ValidationService ~ returnnewPromise<NpstResp> ~ error:", error)
  //             // this.logger.error(error);

  //             // throw new Error(`GST verification failed: ${error.message}`);
  //             return resolve(new NpstResp({ data: null, msg: error.message, status: false }))
  //         }
  //     })

  // }

  findAll() {
    return `This action returns all verification`;
  }

  findOne(id: number) {
    return `This action returns a #${id} verification`;
  }

  update(id: number, updateVerificationDto: UpdateVerificationDto) {
    return `This action updates a #${id} verification`;
  }

  remove(id: number) {
    return `This action removes a #${id} verification`;
  }
}
