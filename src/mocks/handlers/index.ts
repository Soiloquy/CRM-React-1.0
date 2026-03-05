import { productHandlers } from './productHandlers'
import { clientHandlers } from './clientHandlers'
import { dashboardHandlers } from './dashboardHandlers'

export const handlers = [
  ...productHandlers,
  ...clientHandlers,
  ...dashboardHandlers,
]
