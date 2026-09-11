export const LIGHTHOUSE_AUDIT_ACTIONS = {
  ORGANIZATION_CREATED: 'lighthouse.organization_created',
  ORGANIZATION_STATUS_CHANGED: 'lighthouse.organization_status_changed',
  ORGANIZATION_MEMBER_ADDED: 'lighthouse.organization_member_added',
  ORGANIZATION_MEMBER_REMOVED: 'lighthouse.organization_member_removed',
  COHORT_INVITATION_UPLOADED: 'lighthouse.cohort_invitation_uploaded',
  COHORT_MEMBER_REMOVED: 'lighthouse.cohort_member_removed',
  COHORT_OUTCOME_EXPORTED: 'lighthouse.cohort_outcome_exported',
  COHORT_JOIN_TOKEN_ROTATED: 'lighthouse.cohort_join_token_rotated',
  COHORT_JOIN_PAUSED: 'lighthouse.cohort_join_paused',
  COHORT_JOIN_RESUMED: 'lighthouse.cohort_join_resumed',
  COHORT_DUPLICATED: 'lighthouse.cohort_duplicated',
  COHORT_MESSAGE_SENT: 'lighthouse.cohort_message_sent',
  COHORT_PRIVACY_TOGGLED: 'lighthouse.cohort_privacy_toggled',
  PROGRAM_DUPLICATED: 'lighthouse.program_duplicated',
  PROGRAM_ARCHIVED_CASCADE: 'lighthouse.program_archived_cascade',
  PROGRAM_RESTORED: 'lighthouse.program_restored',
  COHORT_ARCHIVED: 'lighthouse.cohort_archived',
  COHORT_RESTORED: 'lighthouse.cohort_restored',
  TEMPLATE_DUPLICATED: 'lighthouse.template_duplicated',
  TEMPLATE_ARCHIVED: 'lighthouse.template_archived',
  TEMPLATE_RESTORED: 'lighthouse.template_restored',
  TEMPLATE_DELETED: 'lighthouse.template_deleted',
  ARCHIVE_ITEM_DELETED: 'lighthouse.archive_item_deleted'
} as const;

export type LighthouseAuditAction = (typeof LIGHTHOUSE_AUDIT_ACTIONS)[keyof typeof LIGHTHOUSE_AUDIT_ACTIONS];
