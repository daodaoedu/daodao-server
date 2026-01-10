/**
 * Logging 服務模組導出
 */

export { loggerService, LOG_LEVELS } from './logger.service';
export type { LogLevel } from './logger.service';

// 便利導出
import { loggerService } from './logger.service';
export const logger = loggerService;
export default loggerService;