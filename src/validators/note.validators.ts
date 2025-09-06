/**
 * Note Validators
 * 便利貼驗證器 - 使用 Zod 進行資料驗證
 */

import { z } from 'zod';

// 可見性選項
const VISIBILITY_OPTIONS = ['private', 'public'] as const;

// 可見性 schema 定義
const visibilitySchema = z.enum(VISIBILITY_OPTIONS)
  .describe("便利貼的可見性設定")
  .meta({
    title: "可見性",
    examples: ['private', 'public'],
    enumDescriptions: {
      "private": "私人可見，僅作者可查看",
      "public": "公開可見，所有人可查看"
    }
  });

// URL 驗證正則表達式
const URL_REGEX = /^https?:\/\/.+/;

/**
 * 創建便利貼驗證模式
 */
export const createNoteSchema = z.object({
  week: z.number({
    message: '週數必須是數字'
  }).int('週數必須是整數').min(1, '週數必須大於0')
    .describe("便利貼所屬的學習週數")
    .meta({
      title: "學習週數",
      examples: [1, 2, 4, 8, 12]
    }),
  
  title: z.string({
    message: '標題為必填項目'
  }).min(1, '標題不能為空').max(100, '標題不可超過100字')
    .describe("便利貼的標題或主題")
    .meta({
      title: "便利貼標題",
      examples: ["React 學習筆記", "今日學習心得", "JavaScript 重點整理"]
    }),
  
  date: z.string({
    message: '日期為必填項目'
  }).regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須為 YYYY-MM-DD')
    .describe("便利貼創建的日期")
    .meta({
      title: "創建日期",
      examples: ["2024-03-15", "2024-12-01", "2025-01-20"]
    }),
  
  content: z.string({
    message: '內容為必填項目'
  }).min(1, '內容不能為空').max(5000, '內容不可超過5000字')
    .describe("便利貼的主要內容或筆記")
    .meta({
      title: "便利貼內容",
      examples: [
        "今天學習了 React 的 useState 和 useEffect，需要注意相依陣列的設定。",
        "JavaScript 的事件迴圈機制需要深入理解，特別是 Promise 和 async/await。",
        "今日完成了 CSS Grid 的學習，能夠輕鬆實現複雜的布局設計。"
      ]
    }),
  
  imgUrls: z.array(
    z.string().regex(URL_REGEX, '圖片URL格式不正確')
      .describe("便利貼相關的圖片或截圖網址")
      .meta({
        title: "圖片網址",
        examples: [
          "https://example.com/notes/react-notes.png",
          "https://cloudinary.com/images/study-diagram.jpg"
        ]
      })
  ).optional()
    .describe("便利貼相關的圖片網址列表")
    .meta({
      title: "筆記圖片",
      examples: [[
        "https://example.com/notes/react-notes.png",
        "https://example.com/notes/js-concepts.png"
      ]]
    }),
  
  videoUrls: z.array(
    z.string().regex(URL_REGEX, '影片URL格式不正確')
      .describe("便利貼相關的影片或演示網址")
      .meta({
        title: "影片網址",
        examples: [
          "https://youtube.com/watch?v=study-session",
          "https://vimeo.com/note-explanation"
        ]
      })
  ).optional()
    .describe("便利貼相關的影片網址列表")
    .meta({
      title: "筆記影片",
      examples: [[
        "https://youtube.com/watch?v=study-session1",
        "https://youtube.com/watch?v=study-session2"
      ]]
    }),
  
  visibility: visibilitySchema.optional().default('private')
}).describe("創建新便利貼筆記的請求資料").meta({
  title: "創建便利貼",
  examples: [{
    week: 4,
    title: "React 學習筆記",
    date: "2024-03-15",
    content: "今天學習了 React 的 useState 和 useEffect，需要注意相依陣列的設定。",
    imgUrls: ["https://example.com/notes/react-notes.png"],
    visibility: "private"
  }]
});

/**
 * 更新便利貼驗證模式
 */
export const updateNoteSchema = z.object({
  week: z.number({
    message: '週數必須是數字'
  }).int('週數必須是整數').min(1, '週數必須大於0').optional()
    .describe("更新後的學習週數")
    .meta({
      title: "學習週數",
      examples: [1, 2, 4, 8, 12]
    }),
  
  title: z.string().min(1, '標題不能為空').max(100, '標題不可超過100字').optional()
    .describe("更新後的便利貼標題")
    .meta({
      title: "便利貼標題",
      examples: ["React 學習筆記 - 更新", "新增內容：Hooks 使用技巧"]
    }),
  
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必須為 YYYY-MM-DD').optional()
    .describe("更新後的日期")
    .meta({
      title: "更新日期",
      examples: ["2024-03-20", "2024-12-05"]
    }),
  
  content: z.string().min(1, '內容不能為空').max(5000, '內容不可超過5000字').optional()
    .describe("更新後的便利貼內容")
    .meta({
      title: "便利貼內容",
      examples: [
        "更新：新增了 useContext 的學習筆記。",
        "修正：補充了 useEffect 的清理函數說明。"
      ]
    }),
  
  imgUrls: z.array(
    z.string().regex(URL_REGEX, '圖片URL格式不正確')
      .describe("更新後的便利貼圖片網址")
      .meta({
        title: "圖片網址",
        examples: ["https://example.com/notes/updated-diagram.png"]
      })
  ).optional()
    .describe("更新後的便利貼圖片列表")
    .meta({
      title: "筆記圖片",
      examples: [[
        "https://example.com/notes/updated-react.png",
        "https://example.com/notes/updated-hooks.png"
      ]]
    }),
  
  videoUrls: z.array(
    z.string().regex(URL_REGEX, '影片URL格式不正確')
      .describe("更新後的便利貼影片網址")
      .meta({
        title: "影片網址",
        examples: ["https://youtube.com/watch?v=updated-notes"]
      })
  ).optional()
    .describe("更新後的便利貼影片列表")
    .meta({
      title: "筆記影片",
      examples: [[
        "https://youtube.com/watch?v=updated-tutorial1",
        "https://youtube.com/watch?v=updated-tutorial2"
      ]]
    }),
  
  visibility: visibilitySchema.optional()
}).describe("更新現有便利貼筆記的請求資料").meta({
  title: "更新便利貼",
  examples: [{
    title: "React 學習筆記 - 更新",
    content: "更新：新增了 useContext 的學習筆記。",
    visibility: "public"
  }]
});

/**
 * 便利貼查詢參數驗證模式
 */
export const noteQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, '頁數必須是正整數').transform(Number).optional()
    .describe("便利貼列表的頁碼")
    .meta({
      title: "頁碼",
      examples: ["1", "2", "5"]
    }),
  pageSize: z.string().regex(/^\d+$/, '每頁數量必須是正整數').transform(Number).optional()
    .describe("每頁顯示的便利貼數量")
    .meta({
      title: "每頁數量",
      examples: ["10", "20", "50"]
    }),
  visibility: visibilitySchema.optional()
    .describe("按可見性篩選便利貼")
    .meta({
      title: "可見性篩選",
      examples: ["private", "public"]
    }),
  week: z.string().regex(/^\d+$/, '週數必須是正整數').transform(Number).optional()
    .describe("按學習週數篩選便利貼")
    .meta({
      title: "週數篩選",
      examples: ["1", "4", "8", "12"]
    })
}).describe("便利貼列表查詢的參數設定").meta({
  title: "便利貼查詢參數",
  examples: [{
    page: "1",
    pageSize: "10",
    visibility: "private",
    week: "4"
  }]
});

/**
 * 便利貼路徑參數驗證模式
 */
export const noteParamsSchema = z.object({
  projectId: z.string({
    message: '專案ID為必填項目'
  }).min(1, '專案ID不能為空')
    .describe("便利貼所屬的專案唯一識別ID")
    .meta({
      title: "專案ID",
      examples: ["project_123", "my-study-notes", "learning-journey-2024"]
    }),
  
  noteId: z.string({
    message: '便利貼ID為必填項目'
  }).regex(/^\d+$/, '便利貼ID必須是數字').transform(Number)
    .describe("便利貼的唯一識別ID")
    .meta({
      title: "便利貼ID",
      examples: ["123", "456", "789"]
    })
}).describe("包含專案ID和便利貼ID的路徑參數").meta({
  title: "便利貼路徑參數",
  examples: [{
    projectId: "project_123",
    noteId: "456"
  }]
});

/**
 * 專案路徑參數驗證模式 (for note context)
 */
export const noteProjectParamsSchema = z.object({
  projectId: z.string({
    message: '專案ID為必填項目'
  }).min(1, '專案ID不能為空')
    .describe("查詢便利貼所屬的專案唯一識別ID")
    .meta({
      title: "專案ID",
      examples: ["project_123", "my-study-notes", "learning-journey-2024"]
    })
}).describe("包含專案ID的路徑參數（用於查詢便利貼）").meta({
  title: "專案ID路徑參數",
  examples: [{
    projectId: "project_123"
  }]
});

/**
 * 公開便利貼查詢參數驗證模式
 */
export const publicNotesQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, '頁數必須是正整數').transform(Number).optional().default(1)
    .describe("公開便利貼列表的頁碼")
    .meta({
      title: "頁碼",
      examples: ["1", "2", "3"]
    }),
  pageSize: z.string().regex(/^\d+$/, '每頁數量必須是正整數').transform(Number).optional().default(10)
    .describe("每頁顯示的公開便利貼數量")
    .meta({
      title: "每頁數量",
      examples: ["10", "20", "30"]
    })
}).describe("公開便利貼列表查詢的參數設定").meta({
  title: "公開便利貼查詢參數",
  examples: [{
    page: "1",
    pageSize: "10"
  }]
});

// 導出驗證類型
export type CreateNoteData = z.infer<typeof createNoteSchema>;
export type UpdateNoteData = z.infer<typeof updateNoteSchema>;
export type NoteQueryParams = z.infer<typeof noteQuerySchema>;
export type NoteParamsData = z.infer<typeof noteParamsSchema>;
export type NoteProjectParamsData = z.infer<typeof noteProjectParamsSchema>;
export type PublicNotesQueryData = z.infer<typeof publicNotesQuerySchema>;