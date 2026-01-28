/**
 * 服務層索引文件
 * 統一導出所有服務
 */

import transformService from '@/services/transform.service';
import resourceService from '@/services/resource.service';
import resourceReviewService from '@/services/resource-review.service';
import tagService from '@/services/tag.service';
import { milestoneService } from '@/services/milestone.service';
import { noteService } from '@/services/note.service';
import { outcomeService } from '@/services/outcome.service';
import { reviewService } from '@/services/review.service';
import { mentorService } from '@/services/mentor.service';

export {
  transformService,
  resourceService,
  resourceReviewService,
  tagService,
  milestoneService,
  noteService,
  outcomeService,
  reviewService,
  mentorService
};

// 預設導出所有服務
export default {
  transformService,
  resourceService,
  resourceReviewService,
  tagService,
  milestoneService,
  noteService,
  outcomeService,
  reviewService,
  mentorService
};
