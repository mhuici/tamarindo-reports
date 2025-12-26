// Re-export Prisma client
export { prisma, default } from './client'

// Re-export Prisma types
export type {
  Tenant,
  User,
  Client,
  DataSource,
  PlatformAccount,
  ClientAccount,
  Metric,
  ReportTemplate,
  Report,
  Dashboard,
  Job,
} from '@prisma/client'

export {
  Plan,
  Role,
  DataSourceType,
  ReportStatus,
  ReportType,
} from '@prisma/client'
