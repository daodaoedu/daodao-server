/**
 * 控制器模塊索引
 * 統一導出所有控制器
 */

import resourceController from './resourceController';
import resourceReviewController from './resourceReviewController';
import tagController from './tagController';

export {
  resourceController,
  resourceReviewController,
  tagController
};

// 導出默認對象
export default {
  resourceController,
  resourceReviewController,
  tagController
};
