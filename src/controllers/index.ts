/**
 * 控制器模塊索引
 * 統一導出所有控制器
 */

import resourceController from './resource-controller';
import resourceReviewController from './resource-review-controller';
import tagController from './tag-controller';

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
