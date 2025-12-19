
import { z } from 'zod';
import { insertConfigSchema, config, sessions, metrics, logs, health } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  config: {
    get: {
      method: 'GET' as const,
      path: '/api/config',
      responses: {
        200: z.custom<typeof config.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/config',
      input: insertConfigSchema.partial(),
      responses: {
        200: z.custom<typeof config.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats',
      responses: {
        200: z.object({
          status: z.enum(['running', 'paused', 'stopped']),
          earningsToday: z.number(),
          totalDataToday: z.number(),
          reputationScore: z.number(),
          uptimeSeconds: z.number(),
          health: z.object({
            coordinatorReachable: z.boolean(),
            internalProxyHealthy: z.boolean(),
            probeExecutorHealthy: z.boolean(),
            policyViolationDetected: z.boolean(),
            autoRecoveryActive: z.boolean(),
            alerts: z.array(z.object({
              level: z.enum(['error', 'warning', 'info']),
              message: z.string(),
              timestamp: z.string(),
            })),
          }),
        }),
      },
    },
  },
  health: {
    get: {
      method: 'GET' as const,
      path: '/api/health',
      responses: {
        200: z.custom<typeof health.$inferSelect>(),
      },
    },
  },
  control: {
    post: {
      method: 'POST' as const,
      path: '/api/control/:action',
      input: z.object({}).optional(), // No body needed usually
      responses: {
        200: z.object({ success: z.boolean(), newState: z.string() }),
        400: errorSchemas.validation,
      },
    },
  },
  sessions: {
    list: {
      method: 'GET' as const,
      path: '/api/sessions',
      responses: {
        200: z.array(z.custom<typeof sessions.$inferSelect>()),
      },
    },
  },
  metrics: {
    list: {
      method: 'GET' as const,
      path: '/api/metrics',
      input: z.object({ limit: z.string().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof metrics.$inferSelect>()),
      },
    },
  },
  logs: {
    list: {
      method: 'GET' as const,
      path: '/api/logs',
      input: z.object({ limit: z.string().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof logs.$inferSelect>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
