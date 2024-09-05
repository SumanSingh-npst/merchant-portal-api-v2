import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  constructor(private configSvc: ConfigService) {}
  private readonly ENCRYPTION_KEY =
    this.configSvc.get<string>('ENCRYPTION_KEY') ||
    crypto.randomBytes(32).toString('hex'); // Should be 32 bytes for AES-256
  private readonly IV_LENGTH = 16; // For AES, this is always 16

  // Hashing with bcrypt (for passwords)
  async hashData(data: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(data, salt);
  }

  // Compare hashed data with a plain text (for passwords)
  async compareHash(data: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(data, hashed);
  }

  // Encrypt data
  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.ENCRYPTION_KEY, 'hex'),
      iv,
    );
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  // Decrypt data
  decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.ENCRYPTION_KEY, 'hex'),
      iv,
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
