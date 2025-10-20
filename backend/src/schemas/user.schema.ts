import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  name: string;

  @Prop()
  picture: string;

  @Prop({ required: true })
  googleId: string;

  @Prop({ default: 'viewer' })
  role: 'admin' | 'analyst' | 'viewer';

  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: false })
  tenant?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
