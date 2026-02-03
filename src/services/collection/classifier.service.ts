/**
 * AI 分類服務
 * 使用 AI 判斷收集到的內容是否為學習資源，並進行分類
 */

import {
  AI_PROVIDERS,
  AIProvider,
  ClassificationInput,
  ClassificationResult,
  BatchClassificationResult,
  ClassifierConfig,
  ClassifierService,
} from '@/types/classifier.types';
import { RESOURCE_TYPES, LEVEL_TYPES } from '@/constants/mappings';

// ============================================
// 分類 Prompt 模板
// ============================================

const CLASSIFICATION_SYSTEM_PROMPT = `你是一個專業的學習資源分類助手。你的任務是分析內容並判斷它是否為有價值的學習資源。

## 學習資源的定義
學習資源是指能夠幫助使用者學習新知識、技能或概念的內容，包括但不限於：
- 教學影片、課程
- 技術文章、教程
- 開源專案 (有教育價值)
- 書籍推薦、閱讀筆記
- 工具介紹與使用教學
- 職涯發展、軟技能分享
- 學習方法、生產力技巧

## 不是學習資源的內容
- 純娛樂內容 (搞笑、遊戲實況等)
- 新聞報導 (除非有教育性質)
- 產品廣告、行銷內容
- 個人日常分享 (除非包含學習心得)
- 政治、宗教相關內容

## 資源類型
- learning_platform_app: 學習平台/App
- learning_tools: 學習工具
- books_articles: 書籍/文章
- video_content: 影片內容
- podcast_content: Podcast
- workshops_courses: 工作坊/課程
- professional_certificates: 專業證照
- community_organization: 社群/組織
- other: 其他

## 難度等級
- beginner: 初學者
- intermediate: 中級
- expert: 專家
- all_levels: 適合所有程度

請以 JSON 格式回應，包含以下欄位：
{
  "isLearningContent": boolean,
  "confidenceScore": number (0.0-1.0),
  "suggestedType": string,
  "suggestedLevel": string,
  "suggestedTags": string[] (最多 5 個標籤),
  "suggestedCategory": string | null (主要學習領域，如「程式設計」、「語言學習」等),
  "reasoning": string (簡短說明判斷理由),
  "optimizedTitle": string (優化後的標題，更清楚描述學習內容),
  "optimizedDescription": string (優化後的描述，100字以內)
}`;

/**
 * 建立分類請求的 prompt
 */
const createClassificationPrompt = (input: ClassificationInput): string => {
  const parts: string[] = [];

  parts.push('請分析以下內容並進行分類：\n');
  parts.push(`平台: ${input.platform}`);

  if (input.title) {
    parts.push(`標題: ${input.title}`);
  }

  if (input.description) {
    // 截斷過長的描述
    const desc = input.description.length > 2000
      ? input.description.substring(0, 2000) + '...'
      : input.description;
    parts.push(`描述: ${desc}`);
  }

  if (input.authorName) {
    parts.push(`作者: ${input.authorName}`);
  }

  if (input.durationSeconds) {
    const minutes = Math.round(input.durationSeconds / 60);
    parts.push(`時長: ${minutes} 分鐘`);
  }

  if (input.engagementCount > 0) {
    parts.push(`互動數: ${input.engagementCount.toLocaleString()}`);
  }

  parts.push(`連結: ${input.originalUrl}`);

  return parts.join('\n');
};

/**
 * 解析 AI 回應為 ClassificationResult
 */
const parseClassificationResponse = (response: string): ClassificationResult => {
  try {
    // 嘗試從回應中提取 JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // 驗證必要欄位
    const result: ClassificationResult = {
      isLearningContent: Boolean(parsed.isLearningContent),
      confidenceScore: Math.min(1, Math.max(0, Number(parsed.confidenceScore) || 0.5)),
      suggestedType: validateResourceType(parsed.suggestedType),
      suggestedLevel: validateLevel(parsed.suggestedLevel),
      suggestedTags: Array.isArray(parsed.suggestedTags)
        ? parsed.suggestedTags.slice(0, 5).map(String)
        : [],
      suggestedCategory: parsed.suggestedCategory || null,
      reasoning: String(parsed.reasoning || ''),
      optimizedTitle: parsed.optimizedTitle || undefined,
      optimizedDescription: parsed.optimizedDescription || undefined,
    };

    return result;
  } catch (error) {
    console.error('[Classifier] Failed to parse response:', error);
    // 返回預設結果
    return {
      isLearningContent: false,
      confidenceScore: 0.3,
      suggestedType: RESOURCE_TYPES.OTHER,
      suggestedLevel: LEVEL_TYPES.ALL_LEVELS,
      suggestedTags: [],
      suggestedCategory: null,
      reasoning: 'Failed to parse AI response',
    };
  }
};

/**
 * 驗證資源類型
 */
const validateResourceType = (type: unknown): string => {
  const validTypes = Object.values(RESOURCE_TYPES);
  if (typeof type === 'string' && validTypes.includes(type)) {
    return type;
  }
  return RESOURCE_TYPES.OTHER;
};

/**
 * 驗證難度等級
 */
const validateLevel = (level: unknown): string => {
  const validLevels = Object.values(LEVEL_TYPES);
  if (typeof level === 'string' && validLevels.includes(level)) {
    return level;
  }
  return LEVEL_TYPES.ALL_LEVELS;
};

// ============================================
// OpenAI 分類器
// ============================================

class OpenAIClassifier implements ClassifierService {
  private apiKey: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: ClassifierConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4o-mini';
    this.maxTokens = config.maxTokens || 1000;
    this.temperature = config.temperature || 0.3;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async classify(input: ClassificationInput): Promise<ClassificationResult> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key is not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: CLASSIFICATION_SYSTEM_PROMPT },
          { role: 'user', content: createClassificationPrompt(input) },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return parseClassificationResponse(content);
  }

  async classifyBatch(
    inputs: Array<{ id: string; input: ClassificationInput }>
  ): Promise<BatchClassificationResult> {
    const results: BatchClassificationResult['results'] = [];
    let success = 0;
    let failed = 0;

    // 依序處理，避免 rate limit
    for (const { id, input } of inputs) {
      try {
        const result = await this.classify(input);
        results.push({ contentId: id, success: true, result });
        success++;
        // 簡單的 rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        results.push({
          contentId: id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failed++;
      }
    }

    return { success, failed, results };
  }
}

// ============================================
// Claude 分類器
// ============================================

class ClaudeClassifier implements ClassifierService {
  private apiKey: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: ClassifierConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'claude-3-haiku-20240307';
    this.maxTokens = config.maxTokens || 1000;
    this.temperature = config.temperature || 0.3;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async classify(input: ClassificationInput): Promise<ClassificationResult> {
    if (!this.isAvailable()) {
      throw new Error('Anthropic API key is not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        system: CLASSIFICATION_SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: createClassificationPrompt(input) },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API error: ${response.status} - ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    return parseClassificationResponse(content);
  }

  async classifyBatch(
    inputs: Array<{ id: string; input: ClassificationInput }>
  ): Promise<BatchClassificationResult> {
    const results: BatchClassificationResult['results'] = [];
    let success = 0;
    let failed = 0;

    for (const { id, input } of inputs) {
      try {
        const result = await this.classify(input);
        results.push({ contentId: id, success: true, result });
        success++;
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        results.push({
          contentId: id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failed++;
      }
    }

    return { success, failed, results };
  }
}

// ============================================
// Gemini 分類器
// ============================================

class GeminiClassifier implements ClassifierService {
  private apiKey: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: ClassifierConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'gemini-1.5-flash';
    this.maxTokens = config.maxTokens || 1000;
    this.temperature = config.temperature || 0.3;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async classify(input: ClassificationInput): Promise<ClassificationResult> {
    if (!this.isAvailable()) {
      throw new Error('Google AI API key is not configured');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${CLASSIFICATION_SYSTEM_PROMPT}\n\n${createClassificationPrompt(input)}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: this.temperature,
          maxOutputTokens: this.maxTokens,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return parseClassificationResponse(content);
  }

  async classifyBatch(
    inputs: Array<{ id: string; input: ClassificationInput }>
  ): Promise<BatchClassificationResult> {
    const results: BatchClassificationResult['results'] = [];
    let success = 0;
    let failed = 0;

    for (const { id, input } of inputs) {
      try {
        const result = await this.classify(input);
        results.push({ contentId: id, success: true, result });
        success++;
        await new Promise((resolve) => setTimeout(resolve, 100)); // Gemini 較快
      } catch (error) {
        results.push({
          contentId: id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failed++;
      }
    }

    return { success, failed, results };
  }
}

// ============================================
// 簡單規則分類器 (備用)
// ============================================

class RuleBasedClassifier implements ClassifierService {
  // 學習相關關鍵字
  private readonly learningKeywords = [
    '教學', '教程', 'tutorial', 'course', '課程', '學習', 'learn',
    'how to', '如何', '入門', 'beginner', '進階', 'advanced',
    '實作', 'practice', '練習', 'exercise', '技巧', 'tips',
    '指南', 'guide', '完整', 'complete', '從零開始',
    '程式', 'coding', 'programming', '開發', 'development',
    'javascript', 'python', 'react', 'vue', 'node',
    '設計', 'design', 'ui', 'ux', 'figma',
    '資料', 'data', 'sql', 'database', 'api',
    '英文', 'english', '日文', 'japanese', '語言',
    '理財', '投資', '職涯', 'career', '面試',
  ];

  // 非學習內容關鍵字
  private readonly nonLearningKeywords = [
    '遊戲實況', 'gameplay', 'vlog', '開箱', 'unboxing',
    '八卦', 'gossip', '搞笑', 'funny', 'meme',
    '新聞', 'news', '政治', 'politics',
    '廣告', 'ad', 'sponsored', '業配',
  ];

  isAvailable(): boolean {
    return true;
  }

  async classify(input: ClassificationInput): Promise<ClassificationResult> {
    const text = `${input.title || ''} ${input.description || ''}`.toLowerCase();

    // 計算學習關鍵字匹配數
    const learningMatches = this.learningKeywords.filter(
      (kw) => text.includes(kw.toLowerCase())
    ).length;

    // 計算非學習關鍵字匹配數
    const nonLearningMatches = this.nonLearningKeywords.filter(
      (kw) => text.includes(kw.toLowerCase())
    ).length;

    // 簡單評分
    const score = (learningMatches * 0.15) - (nonLearningMatches * 0.2);
    const isLearning = score > 0.1 || learningMatches >= 2;
    const confidence = Math.min(0.8, Math.max(0.3, 0.5 + score));

    // 推測類型
    let suggestedType = RESOURCE_TYPES.OTHER;
    if (input.platform === 'youtube') {
      suggestedType = RESOURCE_TYPES.VIDEO_CONTENT;
    } else if (input.platform === 'github') {
      suggestedType = RESOURCE_TYPES.LEARNING_TOOLS;
    } else if (text.includes('podcast') || text.includes('音頻')) {
      suggestedType = RESOURCE_TYPES.PODCAST_CONTENT;
    } else if (text.includes('文章') || text.includes('article') || text.includes('blog')) {
      suggestedType = RESOURCE_TYPES.BOOKS_ARTICLES;
    }

    // 推測難度
    let suggestedLevel = LEVEL_TYPES.ALL_LEVELS;
    if (text.includes('beginner') || text.includes('入門') || text.includes('初學')) {
      suggestedLevel = LEVEL_TYPES.BEGINNER;
    } else if (text.includes('advanced') || text.includes('進階') || text.includes('高級')) {
      suggestedLevel = LEVEL_TYPES.EXPERT;
    } else if (text.includes('intermediate') || text.includes('中級')) {
      suggestedLevel = LEVEL_TYPES.INTERMEDIATE;
    }

    // 提取標籤
    const suggestedTags = this.learningKeywords
      .filter((kw) => text.includes(kw.toLowerCase()))
      .slice(0, 5);

    return {
      isLearningContent: isLearning,
      confidenceScore: confidence,
      suggestedType,
      suggestedLevel,
      suggestedTags,
      suggestedCategory: null,
      reasoning: `Rule-based classification: ${learningMatches} learning keywords, ${nonLearningMatches} non-learning keywords`,
    };
  }

  async classifyBatch(
    inputs: Array<{ id: string; input: ClassificationInput }>
  ): Promise<BatchClassificationResult> {
    const results: BatchClassificationResult['results'] = [];

    for (const { id, input } of inputs) {
      try {
        const result = await this.classify(input);
        results.push({ contentId: id, success: true, result });
      } catch (error) {
        results.push({
          contentId: id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }
}

// ============================================
// 分類器工廠
// ============================================

/**
 * 建立分類器
 */
export const createClassifier = (provider?: AIProvider): ClassifierService => {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  // 如果指定了 provider
  if (provider === AI_PROVIDERS.OPENAI && openaiKey) {
    return new OpenAIClassifier({ provider: AI_PROVIDERS.OPENAI, apiKey: openaiKey });
  }

  if (provider === AI_PROVIDERS.CLAUDE && anthropicKey) {
    return new ClaudeClassifier({ provider: AI_PROVIDERS.CLAUDE, apiKey: anthropicKey });
  }

  if (provider === AI_PROVIDERS.GEMINI && geminiKey) {
    return new GeminiClassifier({ provider: AI_PROVIDERS.GEMINI, apiKey: geminiKey });
  }

  // 自動選擇可用的 provider (優先使用 Gemini，因為成本較低)
  if (geminiKey) {
    console.log('[Classifier] Using Gemini classifier');
    return new GeminiClassifier({ provider: AI_PROVIDERS.GEMINI, apiKey: geminiKey });
  }

  if (openaiKey) {
    console.log('[Classifier] Using OpenAI classifier');
    return new OpenAIClassifier({ provider: AI_PROVIDERS.OPENAI, apiKey: openaiKey });
  }

  if (anthropicKey) {
    console.log('[Classifier] Using Claude classifier');
    return new ClaudeClassifier({ provider: AI_PROVIDERS.CLAUDE, apiKey: anthropicKey });
  }

  // 回退到規則分類器
  console.warn('[Classifier] No AI API key configured, using rule-based classifier');
  return new RuleBasedClassifier();
};

/**
 * 取得預設分類器實例
 */
let defaultClassifier: ClassifierService | null = null;

export const getClassifier = (): ClassifierService => {
  if (!defaultClassifier) {
    defaultClassifier = createClassifier();
  }
  return defaultClassifier;
};

/**
 * 分類單一內容
 */
export const classifyContent = async (
  input: ClassificationInput
): Promise<ClassificationResult> => {
  const classifier = getClassifier();
  return classifier.classify(input);
};

/**
 * 批次分類內容
 */
export const classifyContentBatch = async (
  inputs: Array<{ id: string; input: ClassificationInput }>
): Promise<BatchClassificationResult> => {
  const classifier = getClassifier();
  return classifier.classifyBatch(inputs);
};
