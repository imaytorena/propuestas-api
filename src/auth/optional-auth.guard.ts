import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { jwtConstants } from './constants';

interface JwtPayload {
  id: number;
  email: string;
  iat?: number;
  exp?: number;
}

export interface RequestMaybeUser extends Request {
  user?: JwtPayload;
}

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestMaybeUser>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      // No token provided; allow request to proceed without user
      return true;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: jwtConstants.jwt,
      });
      request.user = payload;
    } catch {
      // Invalid token: continue as anonymous (do not block)
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
