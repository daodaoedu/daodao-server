/**
 * 控制器模塊索引
 * 統一導出所有控制器
 */

import resourceController from './resource.controller';
import resourceReviewController from './resource-review.controller';
import tagController from './tag.controller';
import { milestoneController } from './milestone.controller';
import * as noteController from './note.controller';
import * as outcomeController from './outcome.controller';
import * as reviewController from './review.controller';
import * as mentorController from './mentor.controller';

export {
  resourceController,
  resourceReviewController,
  tagController,
  milestoneController,
  noteController,
  outcomeController,
  reviewController,
  mentorController
};

// 導出默認對象
export default {
  resourceController,
  resourceReviewController,
  tagController,
  milestoneController,
  noteController,
  outcomeController,
  reviewController,
  mentorController
};
