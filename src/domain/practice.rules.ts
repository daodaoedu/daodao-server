/**
 * Practice 領域規則
 *
 * 集中管理實踐活動的狀態流轉與進度計算邏輯。
 * 所有函式皆為 pure function，無副作用、無 DB 存取。
 *
 * 狀態流程：
 * draft → not_started → active → completed
 *           ↓            ↓          ↓
 *        archived ← archived ← archived
 */

// === 狀態流轉 ===
export {
  type PracticeStatusType,
  type StatusTransitionContext,
  STATUS_PRIORITY,
  VALID_TRANSITIONS,
  isValidTransition,
  determineNewStatus,
  getStatusDisplayName,
  isTerminalStatus,
  canCheckIn,
  canEdit,
  canDelete,
  isValidStatus,
  checkHasPassedEndDate,
  initialStatusForStartDate,
  StatusTransitionError,
} from '../utils/practice-status';

// === 進度計算 ===
export {
  type PracticeProgressConfig,
  type ProgressResult,
  INITIAL_PROGRESS,
  FIRST_CHECKIN_PROGRESS,
  COMPLETED_PROGRESS,
  calculateMinTargetCheckIns,
  calculateProgress,
  calculateRemainingCheckIns,
  isValidProgress,
  formatProgress,
} from '../utils/practice-progress';
