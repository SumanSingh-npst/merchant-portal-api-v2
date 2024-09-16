import { Injectable } from '@nestjs/common';
import {  VerificationDto, verifyAadhaarOTP } from './dto/create-verification.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class VerificationService {
  constructor(private readonly httpService: HttpService) {}
  surePass: string = 'https://kyc-api.surepass.io';
  bearerToken: string =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcyMzExMDgyOCwianRpIjoiNjhhZmUwZjAtYzQwOC00MGVlLWE1YTMtMmYyMzE2NTFhZWY1IiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2Lm5wc3R4QHN1cmVwYXNzLmlvIiwibmJmIjoxNzIzMTEwODI4LCJleHAiOjIwMzg0NzA4MjgsImVtYWlsIjoibnBzdHhAc3VyZXBhc3MuaW8iLCJ0ZW5hbnRfaWQiOiJtYWluIiwidXNlcl9jbGFpbXMiOnsic2NvcGVzIjpbInVzZXIiXX19.WxlRslnSL0YPpX6TcS2th4TzTdNI_zZx0jvvcUaEOcI';



  async verifyPan(body: VerificationDto): Promise<any> {
    const url = `${this.surePass}/api/v1/pan/pan-comprehensive`;
    console.log(body);

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, body, {
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
          },
        }),
      );
      return response.data;
    } catch (error) {
      throw new Error('Error verifying PAN');
    }
  }
  async verifyGST(body: VerificationDto): Promise<any> {
    const url = `${this.surePass}/api/v1/corporate/gstin`;

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, body, {
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
          },
        }),
      );
      return response.data;
    } catch (error) {
      throw new Error('Error verifying PAN');
    }
  }
  async generateAadhaarOTP(body: VerificationDto): Promise<any> {
    const url = `${this.surePass}/api/v1/aadhaar-v2/generate-otp`;

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, body, {
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
          },
        }),
      );
      return response.data;
    } catch (error) {
      throw new Error('Error verifying PAN');
    }
  }
  async verifyAadhaarOTP(body: verifyAadhaarOTP): Promise<any> {
    const url = `${this.surePass}/api/v1/aadhaar-v2/submit-otp`;

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, body, {
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
          },
        }),
      );
      return response.data;
    } catch (error) {
      throw new Error('Error verifying PAN');
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
