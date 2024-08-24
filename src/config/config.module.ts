import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService, ConfigFactory } from '@nestjs/config';
import developmentConfig from './development.config';
import productionConfig from './production.config';
const env = process.env.NODE_ENV || 'development';

const configFactory: ConfigFactory = () => {
    switch (env) {
        case 'production':
            return productionConfig;
        case 'development':
        default:
            return developmentConfig;
    }
};

@Global()
@Module({
    imports: [NestConfigModule.forRoot({ load: [configFactory] })],
    providers: [ConfigService],
    exports: [ConfigService],
})
export class ConfigModule { }
