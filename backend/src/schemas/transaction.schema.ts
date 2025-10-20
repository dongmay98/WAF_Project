import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenant: Types.ObjectId;

  @Prop({ required: true })
  type: 'charge' | 'usage' | 'refund'; // 충전, 사용, 환불

  @Prop({ required: true })
  amount: number; // 금액 (KRW)

  @Prop({ required: true })
  description: string; // 거래 설명

  @Prop()
  reference?: string; // 참조 ID (로그 ID, 결제 ID 등)

  // 충전 관련 정보
  @Prop()
  charge_method?: 'card' | 'bank' | 'virtual' | 'admin'; // 결제 방법

  @Prop()
  charge_reference?: string; // 결제 시스템 참조 ID

  // 사용량 관련 정보
  @Prop()
  usage_type?: 'log' | 'request' | 'monthly_fee'; // 사용 유형

  @Prop()
  usage_count?: number; // 사용량 개수

  @Prop({ default: 'completed' })
  status: 'pending' | 'completed' | 'failed' | 'cancelled';

  @Prop()
  processed_at: Date;

  @Prop({ type: Object })
  metadata?: Record<string, any>; // 추가 메타데이터
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
