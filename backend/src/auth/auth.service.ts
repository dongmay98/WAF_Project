import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(profile: any): Promise<any> {
    const { id, emails, displayName, photos } = profile;
    const email = emails[0].value;

    let user = await this.userModel.findOne({ googleId: id });

    if (!user) {
      user = await this.userModel.create({
        googleId: id,
        email,
        name: displayName,
        picture: photos[0]?.value,
        lastLoginAt: new Date(),
      });
    } else {
      user.lastLoginAt = new Date();
      await user.save();
    }

    return user;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
      },
    };
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }
}
