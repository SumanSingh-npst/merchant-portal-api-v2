import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    UnauthorizedException
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenValidationInterceptor implements NestInterceptor {
    constructor(private readonly jwtService: JwtService) { }

    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const url = request.url;

        // Allow requests to registration and login endpoints without a token
        if (url.startsWith('/auth') || url.startsWith('/audit')) {
            return next.handle();
        }

        // Check for the presence of a token
        const authHeader = request.headers.authorization;
        const token = authHeader?.split(' ')[1];

        if (!authHeader || !token) {
            throw new UnauthorizedException('Authorization token is missing');
        }

        try {
            // Verify the token using JwtService
            const decodedToken = this.jwtService.verify(token);

            // Attach the decoded token to the request object
            request.user = decodedToken;
            console.log('Decoded token:', decodedToken);

        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        return next.handle();
    }
}
