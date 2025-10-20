import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Admin, AdminDocument } from '../schemas/admin.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    private jwtService: JwtService,
  ) {}

  async createDefaultAdmin(): Promise<AdminDocument> {
    // 기존 admin 계정이 있는지 확인
    const existingAdmin = await this.adminModel.findOne({ username: 'admin' });
    if (existingAdmin) {
      return existingAdmin;
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash('1234', 10);

    // admin 계정 생성
    const admin = await this.adminModel.create({
      username: 'admin',
      password: hashedPassword,
      isActive: true,
    });

    return admin;
  }

  async validateAdmin(username: string, password: string): Promise<AdminDocument | null> {
    const admin = await this.adminModel.findOne({ username, isActive: true });
    if (!admin) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return null;
    }

    // 마지막 로그인 시간 업데이트
    admin.lastLoginAt = new Date();
    await admin.save();

    return admin;
  }

  async login(username: string, password: string) {
    const admin = await this.validateAdmin(username, password);
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: (admin as any)._id.toString(),
      username: admin.username,
      role: 'admin',
      type: 'admin', // 일반 사용자와 구분
    };

    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: (admin as any)._id.toString(),
        username: admin.username,
        lastLoginAt: admin.lastLoginAt,
      },
    };
  }

  async findAll(): Promise<Admin[]> {
    return this.adminModel.find({ isActive: true }).select('-password');
  }
}
