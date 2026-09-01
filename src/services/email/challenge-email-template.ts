/**
 * 共同挑戰信件模板（CE01-CE05）
 *
 * 六節點中的五個 email 節點；Weekly Summary 併入既有週報，不在此列。
 * 文案來源：FRD 連結的「共同挑戰 Email」文件（docs/product/challenge/共同挑戰 FRD.md §3.5）。
 */

import type { EmailTemplateContent } from '../../types/email';
import { generateStandardEmail } from './base-template';

/** 共同挑戰信件共用變數 */
export interface ChallengeEmailVariables {
  /** 收件人暱稱 */
  userName: string;
  /** 挑戰名稱（cohort display_name） */
  challengeName: string;
  /** 開始日（YYYY-MM-DD） */
  startDate: string;
  /** 結束日（YYYY-MM-DD） */
  endDate: string;
  /** 挑戰天數（含頭尾） */
  durationDays: number;
  /** 挑戰頁連結 */
  challengeUrl: string;
  /** 使用者的挑戰實踐連結（打卡入口）；尚無實踐時退回挑戰頁 */
  practiceUrl: string;
}

/** 日期字串（YYYY-MM-DD）對應的星期字樣；直接以日曆日推算，與時區無關 */
export const formatWeekday = (isoDate: string): string => {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `星期${weekdays[new Date(`${isoDate}T00:00:00Z`).getUTCDay()]}`;
};

const paragraph = (text: string): string => `<p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7; color: #333333;">${text}</p>`;

const ctaLink = (url: string, label: string): string =>
  `<p style="margin: 24px 0 0;"><a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #16966f; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px;">${label}</a></p>`;

/** CE01 Welcome：加入後立即寄送 */
export const generateChallengeWelcomeEmail = (v: ChallengeEmailVariables): EmailTemplateContent =>
  generateStandardEmail({
    title: `歡迎你加入「${v.challengeName}」`,
    subject: `歡迎你加入「${v.challengeName}」`,
    preheader: `開始日：${v.startDate}，一起走過這 ${v.durationDays} 天`,
    content: `
      ${paragraph(`Hello ${v.userName}，`)}
      ${paragraph(`歡迎你加入「${v.challengeName}」！`)}
      ${paragraph(`開始日：${v.startDate}（${formatWeekday(v.startDate)}）<br/>天數：${v.durationDays} 天`)}
      ${paragraph('現在你可以在「我的」看到這個共同挑戰的實踐，除了實踐開始日及天數外，其他欄位皆可依照你的需求編輯。')}
      ${paragraph(`${v.startDate} 起你就能進行打卡，我們鼓勵你在打卡時留下文字紀錄，有助於你在最後獲得摘要和與其他參與者的互動。`)}
      ${paragraph('也歡迎你在開始前到「靈感」逛逛！')}
      ${ctaLink(v.practiceUrl, '查看我的挑戰')}
    `
  });

/** CE02 T-48h：開始前 48 小時，敘事語氣、不用倒數樣式 */
export const generateChallengeT48hEmail = (v: ChallengeEmailVariables): EmailTemplateContent =>
  generateStandardEmail({
    title: `「${v.challengeName}」48 小時後開始`,
    subject: `「${v.challengeName}」48 小時後開始`,
    preheader: '還有兩天，先讓你知道那個空間長什麼樣',
    content: `
      ${paragraph(`「${v.challengeName}」在 ${v.startDate}（${formatWeekday(v.startDate)}）開始。`)}
      ${paragraph('還有兩天。這封信不是要你準備什麼，只是想在開始前，先讓你知道那個空間長什麼樣。')}
      ${paragraph(`從那天起到 ${v.endDate}，會有一群人和你在同一段時間裡練習同一件事。沒有人帶著誰走，也不會有人盯著誰的進度。你會看到別人留下的紀錄，別人也會看到你的，但那是互相鼓勵的入口，不是比較。`)}
      ${paragraph('開始日當天你會再收到一封提醒信！')}
    `
  });

/** CE03 Day 1：開始日當天 06:00 */
export const generateChallengeDay1Email = (v: ChallengeEmailVariables): EmailTemplateContent =>
  generateStandardEmail({
    title: `今天，${v.challengeName} 開始了`,
    subject: `今天，${v.challengeName} 開始了`,
    preheader: '從最小的開始，一句話也是一則紀錄',
    content: `
      ${paragraph(`從今天起到 ${v.endDate}，有一群人和你在做同一件事。`)}
      ${paragraph('如果你不知道要從哪裡開始，就從最小的開始，一句話、一個念頭、今天想到什麼，都是一則紀錄。第一則紀錄的重點不在內容，在你走進去這個動作本身。之後想寫長一點、想寫短一點，都由你決定。')}
      ${ctaLink(v.practiceUrl, '打開你的挑戰，寫下第一次打卡')}
    `
  });

/** CE04 First Check-in：首次打卡隔日 08:00 */
export const generateChallengeFirstCheckinEmail = (v: ChallengeEmailVariables): EmailTemplateContent =>
  generateStandardEmail({
    title: '你昨天的第一次打卡',
    subject: '你昨天的第一次打卡',
    preheader: `你在「${v.challengeName}」留下了第一則紀錄`,
    content: `
      ${paragraph(`你昨天在「${v.challengeName}」裡留下了第一則打卡紀錄。`)}
      ${paragraph('你已經踏出第一步，接下來就按照自己預定的頻率進行，我們期待看到你的分享和跟其他參與者的交流。')}
      ${ctaLink(v.practiceUrl, '回到你的挑戰')}
    `
  });

/** CE05 End：結束日隔日 06:00 */
export const generateChallengeEndEmail = (v: ChallengeEmailVariables): EmailTemplateContent =>
  generateStandardEmail({
    title: `「${v.challengeName}」走到終點了`,
    subject: `「${v.challengeName}」走到終點了`,
    preheader: '來看看這段時間的努力成果吧',
    content: `
      ${paragraph(`${v.durationDays} 天前你加入了「${v.challengeName}」，現在這個挑戰走到終點。`)}
      ${paragraph('來看看這段時間的努力成果吧！')}
      ${paragraph('我們也邀請你在「我的反思」分享這段時間的努力和想法！')}
      ${ctaLink(v.practiceUrl, '打開實踐總結頁')}
    `
  });
