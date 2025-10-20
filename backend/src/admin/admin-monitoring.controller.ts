import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { WafLogsService } from '../waf-logs/waf-logs.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Tenant, TenantDocument } from '../schemas/tenant.schema';

@ApiTags('Admin Monitoring')
@Controller('admin/monitoring')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth()
export class AdminMonitoringController {
  constructor(
    private readonly wafLogsService: WafLogsService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: '관리자 대시보드 통계' })
  @ApiResponse({ status: 200, description: '관리자 대시보드 데이터' })
  async getAdminDashboard() {
    // 전체 시스템 통계
    const totalUsers = await this.userModel.countDocuments();
    const totalTenants = await this.tenantModel.countDocuments();
    const activeUsers = await this.userModel.countDocuments({ 
      lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
    });

    // WAF 통계 (전체 테넌트)
    const wafStats = await this.wafLogsService.getStats({});

    // 테넌트별 사용량
    const tenantUsage = await this.userModel.aggregate([
      {
        $group: {
          _id: '$tenant',
          userCount: { $sum: 1 },
          lastActive: { $max: '$lastLoginAt' }
        }
      },
      {
        $lookup: {
          from: 'tenants',
          localField: '_id',
          foreignField: '_id',
          as: 'tenant'
        }
      },
      { $unwind: '$tenant' },
      {
        $project: {
          tenantName: '$tenant.name',
          tenantSlug: '$tenant.slug',
          userCount: 1,
          lastActive: 1,
          plan: '$tenant.subscription.plan'
        }
      }
    ]);

    return {
      systemStats: {
        totalUsers,
        totalTenants,
        activeUsers,
        systemUptime: process.uptime(),
      },
      wafStats,
      tenantUsage,
    };
  }

  @Get('users')
  @ApiOperation({ summary: '전체 사용자 목록' })
  @ApiResponse({ status: 200, description: '사용자 목록' })
  async getAllUsers(@Query('page') page = '1', @Query('limit') limit = '20') {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const users = await this.userModel
      .find()
      .populate('tenant', 'name slug subscription.plan')
      .select('-googleId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await this.userModel.countDocuments();

    return {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @Get('tenants')
  @ApiOperation({ summary: '전체 테넌트 목록' })
  @ApiResponse({ status: 200, description: '테넌트 목록' })
  async getAllTenants() {
    return this.tenantModel.find().sort({ createdAt: -1 });
  }

  @Get('waf-logs')
  @ApiOperation({ summary: '전체 WAF 로그 (관리자용)' })
  @ApiResponse({ status: 200, description: 'WAF 로그 목록' })
  async getAllWafLogs(@Query() query: any) {
    // 관리자는 모든 테넌트의 로그를 볼 수 있음
    return this.wafLogsService.findAll(query, true); // admin flag
  }

  @Get('system-health')
  @ApiOperation({ summary: '시스템 상태 확인' })
  @ApiResponse({ status: 200, description: '시스템 상태' })
  async getSystemHealth() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB',
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      nodeVersion: process.version,
      platform: process.platform,
    };
  }
}
