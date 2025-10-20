import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface CreateTenantRequest {
  name: string;
  slug: string;
  description?: string;
}

interface UpdateTenantRequest {
  name?: string;
  description?: string;
  waf_config?: {
    paranoia_level?: number;
    anomaly_threshold?: number;
    protected_domains?: string[];
  };
  subscription?: {
    plan?: 'free' | 'pro';
  };
}

@ApiTags('Tenant')
@Controller('api/tenant')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @ApiOperation({ summary: '새 테넌트 생성 (온보딩)' })
  @ApiResponse({ status: 201, description: '테넌트 생성 성공' })
  async createTenant(@Request() req: any, @Body() body: CreateTenantRequest) {
    const user = req.user;
    
    const { tenant, user: newUser } = await this.tenantService.createTenant({
      name: body.name,
      slug: body.slug,
      description: body.description,
      ownerEmail: user.email,
      ownerName: user.name,
      ownerGoogleId: user.sub,
      ownerPicture: user.picture,
    });

    return {
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        description: tenant.description,
        subscription: tenant.subscription,
        waf_config: tenant.waf_config,
      },
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    };
  }

  @Get('current')
  @ApiOperation({ summary: '현재 사용자의 테넌트 정보 조회' })
  @ApiResponse({ status: 200, description: '테넌트 정보 조회 성공' })
  async getCurrentTenant(@Request() req: any) {
    const user = req.user;
    const tenant = await this.tenantService.findById(user.tenant);
    
    return {
      id: tenant._id,
      name: tenant.name,
      slug: tenant.slug,
      description: tenant.description,
      subscription: tenant.subscription,
      waf_config: tenant.waf_config,
      status: tenant.status,
    };
  }

  @Put('current')
  @ApiOperation({ summary: '현재 테넌트 설정 업데이트' })
  @ApiResponse({ status: 200, description: '테넌트 설정 업데이트 성공' })
  async updateCurrentTenant(@Request() req: any, @Body() body: UpdateTenantRequest) {
    const user = req.user;
    
    // Only admin can update tenant settings
    if (user.role !== 'admin') {
      throw new Error('Only tenant admins can update settings');
    }

    const tenant = await this.tenantService.updateTenant(user.tenant, body);
    
    return {
      id: tenant._id,
      name: tenant.name,
      slug: tenant.slug,
      description: tenant.description,
      subscription: tenant.subscription,
      waf_config: tenant.waf_config,
    };
  }

  @Get('usage')
  @ApiOperation({ summary: '현재 테넌트 사용량 통계' })
  @ApiResponse({ status: 200, description: '사용량 통계 조회 성공' })
  async getUsageStats(@Request() req: any) {
    const user = req.user;
    return this.tenantService.getUsageStats(user.tenant);
  }

  @Get('users')
  @ApiOperation({ summary: '테넌트 사용자 목록' })
  @ApiResponse({ status: 200, description: '사용자 목록 조회 성공' })
  async getTenantUsers(@Request() req: any) {
    const user = req.user;
    const users = await this.tenantService.getTenantUsers(user.tenant);
    
    return users.map(u => ({
      id: u._id,
      email: u.email,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
    }));
  }
}
