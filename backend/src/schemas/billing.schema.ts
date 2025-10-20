import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BillingDocument = Billing & Document;

@Schema({ timestamps: true })
export class Billing {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, unique: true })
  tenant: Types.ObjectId;

  // 잔액 정보
  @Prop({ type: Number, default: 0 })
  balance: number; // 현재 잔액 (KRW)

  @Prop({ type: Number, default: 0 })
  totalCharged: number; // 총 충전 금액

  @Prop({ type: Number, default: 0 })
  totalUsed: number; // 총 사용 금액

  // 이번 달 사용량 및 요금
  @Prop({
    type: {
      logs_count: { type: Number, default: 0 },
      requests_count: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
      reset_date: { type: Date, default: Date.now },
    },
    default: {
      logs_count: 0,
      requests_count: 0,
      amount: 0,
      reset_date: new Date(),
    },
  })
  monthly_usage: {
    logs_count: number;
    requests_count: number;
    amount: number; // 이번 달 사용 금액
    reset_date: Date;
  };

  // 요금 정책
  @Prop({
    type: {
      per_log: { type: Number, default: 1 }, // 로그 1개당 1원
      per_request: { type: Number, default: 0.5 }, // 요청 1개당 0.5원
      monthly_base: { type: Number, default: 0 }, // 월 기본료
    },
    default: {
      per_log: 1,
      per_request: 0.5,
      monthly_base: 0,
    },
  })
  pricing: {
    per_log: number;
    per_request: number;
    monthly_base: number;
  };

  @Prop({ default: 'active' })
  status: 'active' | 'suspended' | 'overdue';
}

export const BillingSchema = SchemaFactory.createForClass(Billing);
