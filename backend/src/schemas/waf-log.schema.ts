import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WafLogDocument = WafLog & Document;

@Schema({ timestamps: true })
export class WafLog {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenant: Types.ObjectId;
  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true })
  clientIp: string;

  @Prop({ required: true })
  requestMethod: string;

  @Prop({ required: true })
  requestUri: string;

  @Prop({ required: true })
  responseCode: number;

  @Prop()
  ruleId?: string;

  @Prop()
  message?: string;

  @Prop({ min: 0, max: 5 })
  severity?: number;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ required: true })
  fullLog: string;

  @Prop()
  userAgent?: string;

  @Prop({ type: Object })
  requestHeaders?: Record<string, string>;

  @Prop({ type: Object })
  responseHeaders?: Record<string, string>;

  @Prop()
  requestBody?: string;

  @Prop()
  attackType?: string;

  @Prop({ default: false })
  isBlocked: boolean;
}

export const WafLogSchema = SchemaFactory.createForClass(WafLog);

