import { Controller, Post, Body, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';

interface AdminLoginDto {
  username: string;
  password: string;
}

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('create-default')
  @ApiOperation({ summary: '기본 관리자 계정 생성 (admin:1234)' })
  @ApiResponse({ status: 201, description: '관리자 계정이 성공적으로 생성되었습니다.' })
  async createDefaultAdmin() {
    const admin = await this.adminService.createDefaultAdmin();
    return {
      message: 'Default admin account created successfully',
      username: admin.username,
      created: true,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '관리자 로그인' })
  @ApiResponse({ status: 200, description: '로그인이 성공적으로 완료되었습니다.' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(@Body() loginDto: AdminLoginDto) {
    return this.adminService.login(loginDto.username, loginDto.password);
  }

  @Get('users')
  @ApiOperation({ summary: '관리자 목록 조회' })
  @ApiResponse({ status: 200, description: '관리자 목록이 성공적으로 조회되었습니다.' })
  async findAll() {
    return this.adminService.findAll();
  }
}
