/**
 * 服務層索引文件
 * 統一導出所有服務
 */

import transformService from '@/services/transform-service';
import resourceService from '@/services/resource-service';
import resourceReviewService from '@/services/resource-review-service';
import tagService from '@/services/tag-service';

export {
  transformService,
  resourceService,
  resourceReviewService,
  tagService
};

// 預設導出所有服務
export default {
  transformService,
  resourceService,
  resourceReviewService,
  tagService
};
