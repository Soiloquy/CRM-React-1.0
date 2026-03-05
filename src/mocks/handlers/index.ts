import { productHandlers } from './productHandlers'
import { clientHandlers } from './clientHandlers'
import { dashboardHandlers } from './dashboardHandlers'
import { authHandlers } from './authHandlers'

export const handlers = [
  ...productHandlers,
  ...clientHandlers,
  ...dashboardHandlers,
  ...authHandlers,
]
