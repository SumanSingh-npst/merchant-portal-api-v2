import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  AadhaarVerificationDto,
  GstVerificationDto,
  PanVerificationDto,
  verifyAadhaarOTP,
} from './dto/create-verification.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import {
  aadhaarDummyData,
  generateAadhaarOTP,
  GSTDummyData,
  panDummyData,
} from './dto/surePass.dummy';

@Injectable()
export class VerificationService {
  constructor(
    private readonly httpService: HttpService,
    private configSvc: ConfigService,
  ) {}
  surePass: string = 'https://kyc-api.surepass.io';
  bearerToken = this.configSvc.get('surePassToken');

  async verifyPan(body: PanVerificationDto): Promise<any> {
    const url = `${this.surePass}/api/v1/pan/pan-comprehensive`;
    console.log(body, this.bearerToken);

    // return panDummyData;
    try {
      const response = await lastValueFrom(
        this.httpService.post(url, body, {
          headers: { Authorization: `Bearer ${this.bearerToken}` },
        }),
      );
      return response.data;
    } catch (error) {
      console.error(
        'Error verifying PAN:',
        error.response?.data || error.message,
      );

      return {
        success: false,
        status: error.response?.status || 500,
        message:
          error.response?.data?.message ||
          'Service unavailable, try again later',
      };
    }
  }

  async verifyGST(body: GstVerificationDto): Promise<any> {
    const url = `${this.surePass}/api/v1/corporate/gstin`;
    console.log(body, this.bearerToken);

    // return GSTDummyData;
    try {
      const response = await lastValueFrom(
        this.httpService.post(url, body, {
          headers: { Authorization: `Bearer ${this.bearerToken}` },
        }),
      );
      return response.data;
    } catch (error) {
      console.error(
        'Error verifying GST:',
        error.response?.data || error.message,
      );

      return {
        success: false,
        status: error.response?.status || 500,
        message:
          error.response?.data?.message ||
          'Service unavailable, try again later',
      };
    }
  }

  async generateAadhaarOTP(body: AadhaarVerificationDto): Promise<any> {
    const url = `${this.surePass}/api/v1/aadhaar-v2/generate-otp`;
    console.log(body, this.bearerToken);

    // return generateAadhaarOTP;
    try {
      const response = await lastValueFrom(
        this.httpService.post(url, body, {
          headers: { Authorization: `Bearer ${this.bearerToken}` },
        }),
      );
      return response.data;
    } catch (error) {
      console.error(
        'Error verifying Aadhaar:',
        error.response?.data || error.message,
      );

      return {
        success: false,
        status: error.response?.status || 500,
        message:
          error.response?.data?.message ||
          'Service unavailable, try again later',
      };
    }
  }

  async verifyAadhaarOTP(body: verifyAadhaarOTP): Promise<any> {
    const url = `${this.surePass}/api/v1/aadhaar-v2/submit-otp`;
    console.log(body, this.bearerToken);

    // return aadhaarDummyData;
    try {
      const response = await lastValueFrom(
        this.httpService.post(url, body, {
          headers: { Authorization: `Bearer ${this.bearerToken}` },
        }),
      );
      return response.data;
    } catch (error) {
      console.error(
        'Error verifying Aadhaar:',
        error.response?.data || error.message,
      );


      
      return {
        success: false,
        status: error.response?.status || 500,
        message:
          error.response?.data?.message ||
          'Service unavailable, try again later',
      };
    }
  }

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
