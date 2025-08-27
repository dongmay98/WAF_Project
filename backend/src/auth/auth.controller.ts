import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import express from 'express';
import { AuthService } from './auth.service';

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth 로그인 시작' })
  @ApiResponse({ status: 200, description: 'Google OAuth 인증 페이지로 리다이렉트됩니다.' })
  async googleAuth() {
    // Google OAuth 인증 시작
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth 콜백 처리' })
  @ApiResponse({ status: 200, description: '로그인 성공 후 JWT 토큰을 반환합니다.' })
  async googleAuthRedirect(@Req() req: express.Request, @Res() res: express.Response) {
    const result = await this.authService.login(req.user);
    
    // 프론트엔드로 리다이렉트하면서 토큰 전달
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${result.access_token}`;
    res.redirect(redirectUrl);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '사용자 프로필 조회' })
  @ApiResponse({ status: 200, description: '현재 로그인한 사용자의 프로필을 반환합니다.' })
  getProfile(@Req() req: express.Request) {
    return req.user;
  }
}
