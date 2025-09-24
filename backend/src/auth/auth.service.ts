import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Tenant, TenantDocument } from '../schemas/tenant.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(profile: any): Promise<any> {
    const { id, emails, displayName, photos } = profile;
    const email = emails[0].value;

    let user = await this.userModel.findOne({ googleId: id });

    if (!user) {
      user = await this.createNewUserWithTenant(profile);
    } else {
      user.lastLoginAt = new Date();
      await user.save();
    }

    // Ensure tenant is populated before returning
    if (user && !user.populated('tenant')) {
      await user.populate('tenant');
    }

    return user!;
  }
  
  private async createNewUserWithTenant(profile: any): Promise<any> {
    const { id, emails, displayName, photos } = profile;
    const email = emails[0].value;

    // 1. Create Tenant
    const baseSlug = email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const timestamp = Date.now().toString().slice(-6); // Increased uniqueness
    const tenantSlug = `${baseSlug}-${timestamp}`;
    const emailPrefix = email.split('@')[0];
    const tenantName = `${displayName}'s Organization (${emailPrefix})`;
    
    const newTenant = await this.tenantModel.create({
      name: tenantName,
      slug: tenantSlug,
      subscription: { plan: 'free' },
    });

    // 2. Determine Role
    let role: 'admin' | 'analyst' | 'viewer' = 'analyst';
    if (email.includes('admin') || email.includes('ceo')) {
      role = 'admin';
    }

    // 3. Create User
    const newUser = await this.userModel.create({
      googleId: id,
      email,
      name: displayName,
      picture: photos?.[0]?.value,
      role,
      tenant: newTenant._id,
    });
    
    return newUser;
  }

  generateJwt(user: any) {
    const tenant = user.populated('tenant') ? (user.tenant as any as TenantDocument) : null;
    
    const payload = { 
      email: user.email, 
      sub: user._id, 
      role: user.role,
      tenant: tenant ? {
        _id: (tenant._id as any).toString(),
        name: tenant.name,
        slug: tenant.slug,
      } : null,
      name: user.name,
      picture: user.picture,
    };

    return this.jwtService.sign(payload);
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).populate('tenant').exec();
  }
}
