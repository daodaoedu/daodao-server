/**
 * 服務層索引文件
 * 統一導出所有服務
 */

import transformService from '@/services/transformService';
import resourceService from '@/services/resourceService';
import resourceReviewService from '@/services/resourceReviewService';
import tagService from '@/services/tagService';

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
