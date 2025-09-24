import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TenantDocument = Tenant & Document;

@Schema({ timestamps: true })
export class Tenant {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string; // URL-friendly identifier

  @Prop()
  description?: string;

  @Prop({ default: 'active' })
  status: 'active' | 'suspended' | 'cancelled';

  @Prop({ default: Date.now })
  created_at: Date;

  @Prop({
    type: {
      plan: { type: String, enum: ['free', 'pro'], default: 'free' },
      status: { type: String, enum: ['active', 'suspended', 'cancelled'], default: 'active' },
      created_at: { type: Date, default: Date.now },
      limits: {
        logs_per_month: { type: Number, default: 10000 },
        requests_per_month: { type: Number, default: 1000 },
        custom_rules: { type: Number, default: 5 },
        users: { type: Number, default: 1 },
      },
    },
    default: {
      plan: 'free',
      status: 'active',
      created_at: new Date(),
      limits: {
        logs_per_month: 10000,
        requests_per_month: 1000,
        custom_rules: 5,
        users: 1,
      },
    },
  })
  subscription: {
    plan: 'free' | 'pro';
    status: 'active' | 'suspended' | 'cancelled';
    created_at: Date;
    limits: {
      logs_per_month: number;
      requests_per_month: number;
      custom_rules: number;
      users: number;
    };
  };

  @Prop({
    type: {
      paranoia_level: { type: Number, default: 1 },
      blocking_mode: { type: Boolean, default: true },
      custom_rules: [String],
      anomaly_threshold: { type: Number, default: 5 },
      protected_domains: [String],
      updated_at: { type: Date, default: Date.now },
    },
    default: {
      paranoia_level: 1,
      blocking_mode: true,
      custom_rules: [],
      anomaly_threshold: 5,
      protected_domains: [],
      updated_at: new Date(),
    },
  })
  waf_config: {
    paranoia_level: number;
    blocking_mode: boolean;
    custom_rules: string[];
    anomaly_threshold: number;
    protected_domains: string[];
    updated_at: Date;
  };

  @Prop({
    type: {
      requests_this_month: { type: Number, default: 0 },
      last_reset: { type: Date, default: Date.now },
    },
    default: {
      requests_this_month: 0,
      last_reset: new Date(),
    },
  })
  usage: {
    requests_this_month: number;
    last_reset: Date;
  };
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
