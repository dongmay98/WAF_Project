import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-key',
    });
  }

  async validate(payload: any) {
    // Passport.js는 이 값을 req.user에 첨부합니다.
    return { 
      sub: payload.sub, 
      email: payload.email, 
      role: payload.role,
      tenant: payload.tenant,
      name: payload.name,
      picture: payload.picture,
    };
  }
}
