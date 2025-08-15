import { z } from 'zod';

export const GetWafLogsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  clientIp: z.string().ip().optional(),
  ruleId: z.string().optional(),
  severity: z.number().int().min(0).max(5).optional(),
});
export type GetWafLogsDto = z.infer<typeof GetWafLogsSchema>;

export const CreateWafRuleSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  ruleContent: z.string().min(10), // ModSecurity rule syntax
  isActive: z.boolean().default(true),
});
export type CreateWafRuleDto = z.infer<typeof CreateWafRuleSchema>;

export const UpdateWafRuleSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  ruleContent: z.string().min(10).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateWafRuleDto = z.infer<typeof UpdateWafRuleSchema>;

export const DeleteWafRuleSchema = z.object({
  id: z.string(),
});
export type DeleteWafRuleDto = z.infer<typeof DeleteWafRuleSchema>;

export const WafStatsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
export type WafStatsDto = z.infer<typeof WafStatsSchema>;