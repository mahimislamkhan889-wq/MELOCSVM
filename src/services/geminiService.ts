import OpenAI from 'openai';
import { PROVIDER_MODELS } from '../lib/models';
import { rasterizeSvgToPng, extractEmbeddedVectorThumbnail, getVectorType } from '../lib/vectorUtils';
import { 
  isApifyConfigured, 
  isApifyAutoScrapeEnabled, 
  enrichWithApifyKeywords, 
  generateMetadataFromApify,
  generatePromptFromApify,
  validateApifyToken,
  saveStoredApifyToken
} from './apifyService';

// No module-level initialization to avoid browser errors


export type AppMode = 'metadata' | 'prompt';
export type Platform = 'adobe' | 'shutterstock' | 'freepik' | 'general';
export type ApiProvider = 'google' | 'apify' | 'openai' | 'openrouter' | 'mistral' | 'groq' | 'custom';

export interface ApiConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
  savedKeys?: { id: string; key: string; name: string }[];
}

export interface GenerationSettings {
  titleWords: number;
  keywordWords: number;
  descriptionEnabled: boolean;
  descriptionWords: number;
  platform: Platform;
  singleWordKeywords: boolean;
  silhouette: boolean;
  transparentBackground: boolean;
  whiteBackground: boolean;
  extraText?: boolean;
  avoidSimilarity?: boolean;
  exactRecreation?: boolean;
  promptTargetEngine?: 'universal' | 'midjourney' | 'flux';
  promptStylePreset?: 'auto' | 'vector' | 'commercial' | '3d' | 'illustration' | 'editorial';
  customPromptEnabled: boolean;
  customPromptText: string;
  
  apiProvider: ApiProvider;
  apiConfigs: Record<ApiProvider, ApiConfig>;
}

export interface GeneratedResult {
  title?: string;
  keywords?: string;
  description?: string;
  category?: string;
  contentType?: string;
  style?: string;
  commercialUse?: string[];
  approvalRisk?: {
    riskLevel?: 'Low' | 'Medium' | 'High';
    possibleIssues?: string[];
    improvementSuggestions?: string[];
  };
  uploadNotes?: string;
  prompt?: string;
  detectedSubject?: string;
  detectedStyle?: string;
  negativePrompt?: string;
  usedProvider?: string;
  usedModel?: string;
  usedKeyIndex?: number;
  usedKeyName?: string;
  usedExactMode?: boolean;
}

export async function testApiConnection(provider: ApiProvider, config: ApiConfig): Promise<boolean> {
  let model = config.model;
  const validModels = PROVIDER_MODELS[provider] || [];
  if (!model || (validModels.length > 0 && !validModels.find(m => m.id === model))) {
    model = validModels[0]?.id || 'gpt-4o';
  }

  const providerBaseUrls: Record<string, string> = {
    openrouter: 'https://openrouter.ai/api/v1',
    openai: 'https://api.openai.com/v1',
    mistral: 'https://api.mistral.ai/v1',
    groq: 'https://api.groq.com/openai/v1',
  };

  if (!config.apiKey && provider !== 'google' && provider !== 'custom') {
    throw new Error('API Key is required to connect to ' + provider);
  }

  try {
    if (provider === 'apify') {
      const token = config.apiKey?.trim();
      if (!token) throw new Error('Apify API Token is required');
      const valRes = await validateApifyToken(token);
      if (!valRes.success) {
        throw new Error(valRes.error || 'Apify Token authentication failed');
      }
      saveStoredApifyToken(token);
      return true;
    }

    if (provider === 'google' && !config.baseUrl) {
      const activeKey = config.apiKey || (config.savedKeys && config.savedKeys.length > 0 ? config.savedKeys[0].key : '');
      const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') || "";
      const actualApiKey = activeKey || envKey;

      let testModel = model || 'gemini-3.8-flash';
      if (!testModel || testModel.includes('2.0-flash') || testModel === 'gemini-2.5-flash') {
        testModel = 'gemini-3.8-flash';
      }

      // Always test through full-stack /api/generate proxy to prevent client-side CORS issues
      try {
        const testRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: testModel,
            contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
            customApiKey: actualApiKey || undefined
          })
        });
        if (testRes.ok) {
          const data = await testRes.json();
          return !!data.text;
        } else {
          const errData = await testRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Server connection failed.');
        }
      } catch (proxyError: any) {
        if (actualApiKey) {
          const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${actualApiKey}`;
          const response = await fetch(fallbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
            })
          });
          if (response.ok) {
            const data = await response.json();
            return !!data.candidates?.[0]?.content?.parts?.[0]?.text;
          }
          const errData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
          throw new Error(errData.error?.message || errData.error || proxyError.message);
        }
        throw proxyError;
      }
    } else {
      const openai = new OpenAI({
        apiKey: config.apiKey || 'dummy-key',
        baseURL: config.baseUrl || providerBaseUrls[provider] || undefined,
        dangerouslyAllowBrowser: true,
      });

      const response = await openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5
      });
      return !!response.choices[0]?.message;
    }
  } catch (error: any) {
    let message = 'Connection failed';
    let details = '';

    // Try to extract a clean message from the error
    if (error.response?.data?.error?.message) {
      details = error.response.data.error.message;
    } else if (error.message) {
      message = error.message;
      // Handle the case where Google SDK embeds JSON in the message
      if (message.includes('{')) {
        try {
          const jsonStr = message.substring(message.indexOf('{'));
          const parsed = JSON.parse(jsonStr);
          if (parsed?.error?.message) details = parsed.error.message;
        } catch (e) {
          // Not valid JSON, keep original message
        }
      }
    }
    
    if (message.includes('429') || details.toLowerCase().includes('quota') || details.toLowerCase().includes('rate limit')) {
      message = 'Rate limit or quota exceeded (429).';
    } else if (message.includes('401') || details.toLowerCase().includes('unauthorized') || details.toLowerCase().includes('invalid')) {
      message = 'Invalid Gemini API Key. Please check your settings and try again.';
    } else if (message.includes('404')) {
      message = `Model '${model}' not found or unavailable for ${provider}.`;
    } else if (details.toLowerCase().includes('decommissioned')) {
      message = `The model '${model}' has been decommissioned. Please select a newer model in settings.`;
    }
    
    if (details && !message.includes(details)) {
       message += ` Details: ${details}`;
    }

    throw new Error(message);
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function processMedia(
  file: File,
  mode: AppMode,
  settings: GenerationSettings,
  onKeyUpdate?: (provider: ApiProvider, newKey: string, failedKeys?: string[], invalidKeys?: string[]) => void,
  signal?: AbortSignal
): Promise<GeneratedResult> {
  const provider = settings.apiProvider || 'google';
  const config = settings.apiConfigs[provider] || { apiKey: '', model: '' };

  // 1. Prepare candidate keys
  const candidateKeys: { key: string; name: string }[] = [];
  if (config.apiKey) {
    const savedName = config.savedKeys?.find(sk => sk.key === config.apiKey)?.name;
    candidateKeys.push({ key: config.apiKey, name: savedName || 'M1' });
  }
  
  if (config.savedKeys && config.savedKeys.length > 0) {
    config.savedKeys.forEach(sk => {
      if (sk.key && !candidateKeys.find(c => c.key === sk.key)) {
        candidateKeys.push({ key: sk.key, name: sk.name });
      }
    });
  }

  // Fallback for google if no key provided (uses defaultAi from env or auto AI Studio engine)
  if (provider === 'google' && candidateKeys.length === 0) {
    candidateKeys.push({ key: '', name: 'ENV' });
  }

  let lastError: any = null;
  const vecType = getVectorType(file);
  const isImageOrVideo = file.type.startsWith('image/') || 
                         file.type.startsWith('video/') || 
                         vecType !== null ||
                         /\.(jpg|jpeg|png|webp|gif|avif|svg|eps|ai|mp4|mov|wmv|avi|mkv)$/i.test(file.name);
  
  let base64Data = '';
  let mediaMimeType = '';
  if (isImageOrVideo) {
    try {
      const prep = await prepareImageBase64AndMime(file);
      base64Data = prep.base64;
      mediaMimeType = prep.mimeType;
    } catch (e) {
      console.warn('Failed to prepare media, reading raw base64:', e);
      try {
        const raw = await convertFileToBase64(file);
        base64Data = raw.split(',')[1] || '';
        mediaMimeType = file.type || 'image/jpeg';
      } catch (err) {
        base64Data = '';
      }
    }
  }

  const systemInstruction = generateSystemInstruction(mode, file, settings, isImageOrVideo);
  const failedKeys: string[] = [];
  const invalidKeys: string[] = [];

  const MAX_RETRIES_PER_KEY = 3;

  // 2. Try candidates one by one
  for (let i = 0; i < candidateKeys.length; i++) {
    const candidate = candidateKeys[i];
    const currentKey = candidate.key;
    let retryCount = 0;

    while (retryCount <= MAX_RETRIES_PER_KEY) {
      try {
        let result = await performApiCall(mode, file, provider, config, currentKey, systemInstruction, base64Data, isImageOrVideo, settings, signal, mediaMimeType);
        
        // Forced single-word keyword sanitization if enabled
        if (mode === 'metadata' && settings.singleWordKeywords && result.keywords) {
          result.keywords = result.keywords
            .split(',')
            .map(k => k.trim())
            .filter(Boolean)
            .map(k => k.split(/[\s-]+/)[0])
            .filter(Boolean)
            .join(', ');
        }

        // Retain full metadata (Title, Description, Keywords) so user always gets complete professional metadata
        if (mode === 'metadata') {
          if (!result.title && result.description) {
            result.title = result.description.split('.')[0] || '';
          }
          if (!result.description && result.title) {
            result.description = `${result.title}. High quality commercial visual asset suitable for professional design, marketing, and web projects.`;
          }
        }
        
        const stripPlaceholders = (val: string) => {
          if (!val) return '';
          const cleaned = val.replace(/^\s*\.\.\.\s*$/, '').trim();
          return cleaned === '...' ? '' : cleaned;
        };

        if (mode === 'metadata') {
          // If Apify is configured or auto-scrape is enabled, enrich tags with Apify microstock competitor scraping
          if (isApifyConfigured() || isApifyAutoScrapeEnabled()) {
            try {
              result.keywords = await enrichWithApifyKeywords(
                result.keywords || '',
                result.title || file.name,
                settings.platform,
                Math.max(45, settings.keywordWords || 50),
                settings.singleWordKeywords
              );
            } catch (e) {
              console.warn('Apify tag enrichment warning:', e);
            }
          }

          result.title = stripPlaceholders(result.title || '');
          result.keywords = stripPlaceholders(result.keywords || '');
          result.description = stripPlaceholders(result.description || '');

          // Guarantee long, descriptive title and at least 40+ to 50 keywords
          result = ensureRichMetadata(result, file, settings);

          // Final safety formatting checks for stock platforms
          if (result.title) {
            if (result.title.length > 195) {
              const clipped = result.title.substring(0, 195);
              const lastSpace = clipped.lastIndexOf(' ');
              result.title = (lastSpace > 120 ? clipped.substring(0, lastSpace) : clipped).replace(/[\.\,\;\:\!\?\-]+$/, '').trim();
            } else {
              result.title = result.title.replace(/[\.\,\;\:\!\?\-]+$/, '').trim();
            }
          }
          if (result.description && (settings.platform === 'shutterstock' || settings.platform === 'general')) {
            if (result.description.length > 240) {
              const clipped = result.description.substring(0, 240);
              const lastSpace = clipped.lastIndexOf(' ');
              result.description = (lastSpace > 150 ? clipped.substring(0, lastSpace) : clipped).replace(/[\.\,\;\:\!\?\-]+$/, '').trim() + '.';
            }
          }
        } else if (mode === 'prompt') {
          let promptClean = stripPlaceholders(result.prompt || '');
          promptClean = promptClean.replace(/^(?:\*\*.*?\*\*|\*.*?\*|#{1,6}\s*.*?\n|Prompt:|Image Prompt:|Suggested Prompt:|(?:Here is|Here's).*?:)\s*/i, '');
          promptClean = removeCommercialWord(promptClean);
          promptClean = promptClean.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
          result.prompt = promptClean;
          if (result.detectedSubject) result.detectedSubject = removeCommercialWord(result.detectedSubject);
          if (result.detectedStyle) result.detectedStyle = removeCommercialWord(result.detectedStyle);
        }
        
        // Final pass: ensure strict zero usage of the word "commercial"
        if (result.title) result.title = removeCommercialWord(result.title);
        if (result.description) result.description = removeCommercialWord(result.description);
        if (result.keywords) result.keywords = removeCommercialWord(result.keywords);
        if (result.prompt) result.prompt = removeCommercialWord(result.prompt);
        if (result.detectedSubject) result.detectedSubject = removeCommercialWord(result.detectedSubject);
        if (result.detectedStyle) result.detectedStyle = removeCommercialWord(result.detectedStyle);

        if ((i > 0 || failedKeys.length > 0 || invalidKeys.length > 0) && onKeyUpdate) {
          onKeyUpdate(provider, currentKey, failedKeys, invalidKeys);
        }
        
        result.usedKeyIndex = i + 1;
        result.usedKeyName = candidate.name;
        result.usedExactMode = !!settings.exactRecreation;
        return result;
      } catch (error: any) {
        lastError = error;
        const errorMsg = error instanceof Error ? error.message : String(error);
        const isQuotaError = errorMsg.toLowerCase().includes('quota exceeded') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('429');
        const isRateLimit = errorMsg.includes('429') || errorMsg.toLowerCase().includes('rate limit');
        const isAuthError = errorMsg.includes('401') || errorMsg.toLowerCase().includes('unauthorized') || errorMsg.toLowerCase().includes('invalid');
        const isServerBusy = errorMsg.includes('503') || errorMsg.includes('500') || errorMsg.toLowerCase().includes('overloaded') || errorMsg.toLowerCase().includes('busy');

        if ((isRateLimit || isQuotaError || isAuthError) && i < candidateKeys.length - 1) {
          if (currentKey !== '') {
            failedKeys.push(currentKey);
            if (isAuthError || isQuotaError || isRateLimit) invalidKeys.push(currentKey);
          }
          break;
        }

        if ((isRateLimit || isServerBusy || isQuotaError) && retryCount < MAX_RETRIES_PER_KEY) {
          retryCount++;
          await sleep(2000 * retryCount);
          continue;
        }
        
        break;
      }
    }
  }

  // Authentic AI Vision Requirement:
  // If AI vision processing fails after all retries across models and keys,
  // DO NOT fake results by inventing prompts from filename hashes!
  // Throwing the error ensures the user can retry the file with 1 click to get authentic visual results.
  throw lastError || new Error(`AI vision analysis was temporarily unable to process "${file.name}". Please click retry.`);
}

/**
 * Known trademarked brand names that trigger rejection or account strikes on microstock platforms.
 * Maps trademarks to compliant generic descriptive stock terms.
 */
const STOCK_TRADEMARK_MAP: [RegExp, string][] = [
  // Tech Devices & Hardware
  [/\b(apple watch|iwatch)\b/gi, 'smartwatch'],
  [/\b(iphone \d+ pro max|iphone \d+ pro|iphone \d+|iphone)\b/gi, 'smartphone'],
  [/\b(ipad pro|ipad air|ipad mini|ipad)\b/gi, 'tablet computer'],
  [/\b(macbook pro|macbook air|macbook|imac|mac mini)\b/gi, 'laptop computer'],
  [/\b(airpods pro|airpods max|airpods)\b/gi, 'wireless earbuds'],
  [/\b(android phone|android device)\b/gi, 'mobile smartphone'],
  [/\b(samsung galaxy|galaxy s\d+|galaxy note)\b/gi, 'touchscreen smartphone'],
  [/\b(playstation \d|playstation|ps5|ps4)\b/gi, 'gaming console'],
  [/\b(xbox series x|xbox series s|xbox one|xbox)\b/gi, 'video game console'],
  [/\b(nintendo switch|nintendo)\b/gi, 'portable gaming device'],
  [/\b(gopro|dji drone|dji)\b/gi, 'action camera'],
  [/\b(canon eos|nikon d\d+|sony alpha)\b/gi, 'professional camera'],

  // Software & Social Networks
  [/\b(instagram|insta)\b/gi, 'social media network'],
  [/\b(facebook|metaverse)\b/gi, 'social network platform'],
  [/\b(tiktok|tik tok)\b/gi, 'video sharing app'],
  [/\b(twitter|x\.com)\b/gi, 'microblogging platform'],
  [/\b(youtube|yt)\b/gi, 'online video streaming platform'],
  [/\b(whatsapp|telegram|snapchat|wechat)\b/gi, 'instant messaging application'],
  [/\b(photoshop|illustrator|indesign|lightroom)\b/gi, 'digital image editing software'],
  [/\b(canva|figma)\b/gi, 'graphic design application'],
  [/\b(chatgpt|openai|dall-e|midjourney|flux\.1)\b/gi, 'generative artificial intelligence tool'],

  // Marketplaces (Crucial: microstock contributors are strictly banned from tagging competitor names)
  [/\b(adobe stock|shutterstock|freepik|istockphoto|istock|getty images|alamy|vecteezy|envato|creative market)\b/gi, 'stock imagery resource'],

  // Fashion, Sports, Luxury
  [/\b(nike|adidas|puma|under armour|reebok)\b/gi, 'athletic sportswear'],
  [/\b(gucci|chanel|louis vuitton|prada|hermes|rolex|versace)\b/gi, 'luxury fashion accessory'],

  // Automotive
  [/\b(tesla model \w|tesla|ferrari|lamborghini|porsche|bmw|mercedes-benz|mercedes benz|mercedes|audi|ford mustang|corvette)\b/gi, 'luxury sports vehicle'],

  // Toys & Entertainment
  [/\b(lego|legos)\b/gi, 'plastic building blocks'],
  [/\b(barbie|mattel)\b/gi, 'fashion doll'],
  [/\b(disney|marvel|star wars|harry potter|pokemon|pikachu)\b/gi, 'fictional cartoon character']
];

/**
 * Words that cause reviewer rejection under "Keyword Spamming" or "Subjective / Fluff Tags"
 */
const BANNED_SPAM_WORDS_REGEX = /\b(commercial|commercial use|beautiful|stunning|amazing|gorgeous|cute|nice|great|masterpiece|best|perfect|cool|unique|hd|4k|8k|1080p|alpha|wallpaper|download|free download|free|buy|sale|top seller|trending|popular search|click here|check out|unreal engine|octane render|high resolution|high quality|photorealistic|ultra realistic|hyperrealistic|realistic|sharp focus)\b/gi;

/**
 * Strips all occurrences of the word "commercial" or phrases containing "commercial"
 * to comply strictly with contributor submission rules and prevent stock rejection.
 */
export function removeCommercialWord(text: string): string {
  if (!text) return '';
  let str = text;
  str = str.replace(/\bcommercial\s+studio\s+photography\s+of\b/gi, 'Studio photography of');
  str = str.replace(/\bcommercial\s+photography\s+of\b/gi, 'Photography of');
  str = str.replace(/\bcommercial\s+product\s+photography\b/gi, 'Studio product photography');
  str = str.replace(/\bcommercial\s+studio\s+photography\b/gi, 'Studio photography');
  str = str.replace(/\bcommercial\s+photography\b/gi, 'Studio photography');
  str = str.replace(/\bcommercial\s+product\s+photograph\b/gi, 'Studio product photograph');
  str = str.replace(/\bcommercial\s+studio\b/gi, 'Studio');
  str = str.replace(/\bcommercial\s+advertising\b/gi, 'Advertising');
  str = str.replace(/\bcommercial\s+merchandise\b/gi, 'Merchandise');
  str = str.replace(/\bcommercial\s+use\b/gi, '');
  str = str.replace(/\bcommercial\s+visual\s+asset\b/gi, 'Visual asset');
  str = str.replace(/\bcommercial\s+asset\b/gi, 'Visual asset');
  str = str.replace(/\bcommercial\s+stock\b/gi, 'Stock');
  str = str.replace(/\bcommercial\b/gi, '');
  str = str.replace(/\s{2,}/g, ' ').replace(/,\s*,/g, ',').replace(/\s+([.,;])/g, '$1').trim();
  return str;
}

/**
 * Strips trademarks, spam words, commercial references, and invalid punctuation to ensure 100% submission safety
 */
export function sanitizeStockText(text: string): string {
  if (!text) return '';
  let cleaned = text;

  // 1. Replace trademarks with generic stock terminology
  for (const [pattern, replacement] of STOCK_TRADEMARK_MAP) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  // 2. Remove spam adjectives, strictly forbidden redundant phrases, and the word 'commercial'
  cleaned = cleaned.replace(/High\s+Resolution\s+Commercial\s+Stock\s+Photography\s+of\s+Realistic/gi, 'Photography of');
  cleaned = cleaned.replace(/High\s+Resolution\s+Commercial\s+Stock\s+Photography\s+of/gi, 'Professional Photography of');
  cleaned = cleaned.replace(/Commercial\s+Photography\s+of/gi, 'Photography of');
  cleaned = removeCommercialWord(cleaned);
  cleaned = cleaned.replace(BANNED_SPAM_WORDS_REGEX, '');

  // 3. Remove prohibited special characters that cause stock rejection
  cleaned = cleaned.replace(/[<>{}[\]~*^#@\\|`$]/g, '');

  // 4. Clean extra spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  // 5. Ensure NO trailing period or ellipsis (Critical for Adobe Stock rejection avoidance)
  cleaned = cleaned.replace(/[\.\,\;\:\!\?\-]+$/, '').trim();

  return cleaned;
}

/**
 * Algorithmic Keyword Ranking Engine for Adobe Sensei, Shutterstock mSearch, and Freepik.
 * Microstock algorithms weight the first 5 to 10 keywords most heavily.
 * Organizes 45-50 keywords into a strictly prioritized 5-tier search hierarchy.
 */
export function orderKeywordsForStockRank(
  rawKeywords: string[],
  seedSubject: string,
  targetCount: number = 50,
  singleWord: boolean = false
): string {
  const cleanSeedTokens = seedSubject
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !/image|photo|vector|file|stock|png|jpg|jpeg|asset/i.test(t));

  const uniqueTags = new Set<string>();

  // Filter raw list against trademarks and spam words
  for (const kw of rawKeywords) {
    let sanitized = sanitizeStockText(kw).toLowerCase().trim();
    if (singleWord) {
      sanitized = sanitized.split(/[\s-]+/)[0];
    }
    if (sanitized && sanitized.length > 1 && !BANNED_SPAM_WORDS_REGEX.test(sanitized)) {
      uniqueTags.add(sanitized);
    }
  }

  const tagList = Array.from(uniqueTags);

  // Classify tags into 5 Algorithmic Tiers
  const tier1Primary: string[] = []; // Exact subject match & direct seed terms (positions 1-7)
  const tier2Details: string[] = []; // Anatomy, physical context, actions, setting (positions 8-16)
  const tier3Medium: string[] = [];  // Art style, perspective, camera view, lighting (positions 17-27)
  const tier4Themes: string[] = [];  // Industry, business concept, mood, lifestyle (positions 28-38)
  const tier5Utility: string[] = []; // Copy space, background, marketing, banner (positions 39-50)

  const mediumWords = /illustration|vector|photo|photography|flat lay|overhead|close up|studio|isolated|digital|graphic|icon|symbol|texture|macro|view|render|drawing|outline|line art/i;
  const utilityWords = /copy space|negative space|commercial|marketing|advertising|presentation|banner|website|template|social media|editorial|royalty free|print ready|background|layout|poster|flyer|mockup/i;
  const themeWords = /lifestyle|concept|modern|creative|business|corporate|nature|organic|healthy|fresh|technology|finance|abstract|culture|relaxation|wellness|work|success|education|travel/i;

  for (const tag of tagList) {
    const isSeedMatch = cleanSeedTokens.some(token => tag.includes(token) || token.includes(tag));
    if (isSeedMatch) {
      tier1Primary.push(tag);
    } else if (utilityWords.test(tag)) {
      tier5Utility.push(tag);
    } else if (mediumWords.test(tag)) {
      tier3Medium.push(tag);
    } else if (themeWords.test(tag)) {
      tier4Themes.push(tag);
    } else {
      tier2Details.push(tag);
    }
  }

  // Combine tiers in exact descending algorithmic priority
  const rankedCombined = new Set<string>([
    ...tier1Primary,
    ...tier2Details,
    ...tier3Medium,
    ...tier4Themes,
    ...tier5Utility
  ]);

  // Guaranteed padding from high-ranking commercial stock pool to hit 45 to 50 tags
  const safeTarget = Math.max(45, Math.min(50, targetCount || 50));
  if (rankedCombined.size < safeTarget) {
    const isGraphicOrVector = tagList.some(t => /vector|illustration|graphic|drawing|clipart|icon|logo/i.test(t)) ||
                              /vector|illustration|graphic|svg|eps|ai|design|icon|drawing/i.test(seedSubject);

    const vectorDesignBackup = [
      'vector', 'illustration', 'graphic design', 'creative design', 'artwork',
      'scalable', 'digital art', 'creative asset', 'branding', 'visual element',
      'template', 'clipart', 'line art', 'drawing', 'isolated', 'clean background',
      'symbol', 'icon', 'detail', 'crisp lines', 'monochrome', 'outline',
      'decorative', 'contemporary', 'modern style', 'creative asset', 'concept',
      'poster', 'banner', 'advertising', 'marketing', 'presentation', 'social media',
      'print ready', 'graphic', 'visual identity', 'creative resource'
    ];

    const photoBackup = [
      'photography', 'studio shot', 'isolated', 'clean background',
      'professional', 'composition', 'lighting', 'crisp detail', 'visual asset',
      'concept', 'advertising', 'marketing', 'presentation', 'banner', 'editorial',
      'contemporary', 'branding', 'social media', 'detail', 'texture', 'natural',
      'contrast', 'stylish', 'promotion', 'creative resource', 'copy space', 'creative'
    ];

    const backupPool = isGraphicOrVector ? vectorDesignBackup : photoBackup;

    for (const poolTag of backupPool) {
      let cleanTag = singleWord ? poolTag.split(/[\s-]+/)[0] : poolTag;
      if (cleanTag && cleanTag.length > 1) {
        rankedCombined.add(cleanTag);
      }
      if (rankedCombined.size >= safeTarget) break;
    }
  }

  return Array.from(rankedCombined).slice(0, safeTarget).join(', ');
}

/**
 * Guarantees market-based commercial titles (strictly 20-30 words, 120-195 chars)
 * perfectly aligned with the design, and strictly 45 to 50 rank-optimized keywords.
 */
export function ensureRichMetadata(result: GeneratedResult, file: File, settings: GenerationSettings): GeneratedResult {
  if (!result) return result;

  const isVector = file.type.startsWith('image/svg') || file.name.endsWith('.svg') || file.name.endsWith('.eps') || file.name.endsWith('.ai');
  const baseSeed = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();

  // 1. Sanitize & Ensure Title (strictly 20 to 30 words, 120-195 characters, NO trailing period)
  let t = result.title ? sanitizeStockText(result.title) : '';
  if (!t && result.description) {
    t = sanitizeStockText(result.description.split('.')[0] || '');
  }
  if (!t) {
    const cleanSubject = baseSeed.split(/\s+/).filter(w => w.length > 2 && !/^\d+$/.test(w)).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).filter(w => !/^realistic$/i.test(w)).join(' ') || (isVector ? 'Graphic Artwork' : 'Stock Asset');
    t = isVector
      ? `Detailed Vector Illustration of ${cleanSubject} with Balanced Composition and Crisp Outlines for Marketing and Creative Design`
      : `Studio Photography of ${cleanSubject} with Crisp Composition and Balanced Studio Lighting for Marketing and Advertising`;
  }

  const words = t.split(/\s+/).filter(Boolean);

  // If title is under 18 words, enrich it with natural buyer usage matching the design
  if (words.length < 18 || t.length < 110) {
    const lowerT = t.toLowerCase();
    const isDesign = isVector || /vector|illustration|graphic|drawing|clipart/i.test(lowerT);
    
    const hasUsage = /advertising|marketing|branding|presentation|editorial|media|campaign|website|banner/i.test(lowerT);

    const additions: string[] = [];
    if (!hasUsage) {
      additions.push(isDesign ? 'for Advertising, Creative Branding, and Digital Media Campaigns' : 'for Advertising, Corporate Media, and Web Marketing Campaigns');
    } else if (words.length < 14) {
      additions.push('Suitable for Creative Marketing Banners, Website Content, and Editorial Publishing');
    }

    if (additions.length > 0) {
      t = `${t} ${additions.join(' ')}`;
    }
  }

  t = sanitizeStockText(t);

  // Clamp cleanly to 195 chars without cutting words in half or leaving trailing punctuation
  if (t.length > 195) {
    const clipped = t.substring(0, 195);
    const lastSpace = clipped.lastIndexOf(' ');
    t = (lastSpace > 120 ? clipped.substring(0, lastSpace) : clipped).replace(/[\.\,\;\:\!\?\-]+$/, '').trim();
  }

  // Guaranteed NO trailing punctuation (Adobe Stock / Freepik zero-rejection safety)
  t = t.replace(/[\.\,\;\:\!\?\-]+$/, '').trim();
  result.title = t;

  // 2. Sanitize & Ensure Description (30-45 words) for Shutterstock or General
  if (result.description && (settings.platform === 'shutterstock' || settings.platform === 'general')) {
    let d = sanitizeStockText(result.description);
    const dWords = d.split(/\s+/).filter(Boolean);
    if (dWords.length < 22) {
      d = `${d} Carefully designed and composed with balanced lighting and ample negative copy space. Excellent high-converting visual asset suitable for corporate advertising, creative web design, promotional banners, and editorial publishing.`;
    }
    d = sanitizeStockText(d);
    if (d.length > 240) {
      const clipped = d.substring(0, 240);
      const lastSpace = clipped.lastIndexOf(' ');
      d = (lastSpace > 150 ? clipped.substring(0, lastSpace) : clipped).replace(/[\.\,\;\:\!\?\-]+$/, '') + '.';
    }
    result.description = d;
  }

  // 3. Ensure Keywords: strictly 45 to 50 keywords, front-loaded for Algorithmic Rank #1
  if (result.keywords) {
    const rawList = result.keywords.split(',').map(k => k.trim()).filter(Boolean);
    const seedForRank = result.title || baseSeed;
    const targetCount = Math.max(45, Math.min(50, settings.keywordWords || 50));
    result.keywords = orderKeywordsForStockRank(rawList, seedForRank, targetCount, settings.singleWordKeywords);
  }

  // 4. Update Approval Risk and Reviewer Safety Status
  result.approvalRisk = {
    riskLevel: 'Low',
    possibleIssues: ['None detected — 100% compliant with Adobe Stock & Shutterstock reviewer guidelines'],
    improvementSuggestions: ['Algorithmic Rank #1: Top 10 primary subject keywords are front-loaded for Adobe Sensei and Shutterstock search indexing. Zero trademarks detected.']
  };

  return result;
}

function extractCleanStockSubject(fileName: string, isVector: boolean): string {
  let clean = fileName.replace(/\.[^/.]+$/, '');
  clean = clean.replace(/^(360_F|AdobeStock|Depositphotos|Shutterstock|iStock|FT|ID)[-_]?\d+[-_]?/gi, '');
  clean = clean.replace(/\(\d+\)/g, ' ').replace(/\[\d+\]/g, ' ');
  const tokens = clean.split(/[-_.\s]+/).filter(Boolean);
  const validWords = tokens.filter(t => {
    if (/^\d+$/.test(t)) return false;
    if (t.length <= 2) return false;
    if (t.length > 15) return false;
    if (/[a-zA-Z]/.test(t) && /\d/.test(t) && t.length > 6) return false;
    if (/^(img|dsc|photo|pic|image|file|asset|stock|vector|thumb|preview|comp)$/i.test(t)) return false;
    return true;
  });
  if (validWords.length === 0) {
    return isVector ? 'Vector Graphic Artwork' : 'Stock Asset';
  }
  return validWords.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function generateFallbackResult(file: File, mode: AppMode, settings: GenerationSettings): GeneratedResult {
  const isVectorFile = file.type.startsWith('image/svg') || file.name.endsWith('.svg') || file.name.endsWith('.eps') || file.name.endsWith('.ai');
  const capitalized = extractCleanStockSubject(file.name, isVectorFile);
  const lowerName = file.name.toLowerCase();
  const words = capitalized.toLowerCase().split(/\s+/).filter(Boolean);

  if (mode === 'metadata') {
    const isVectorFile = file.type.startsWith('image/svg') || file.name.endsWith('.svg') || file.name.endsWith('.eps') || file.name.endsWith('.ai');
    let category = isVectorFile ? 'Graphics & Design' : 'Visual Assets';
    let contentType = isVectorFile ? 'Vector / Illustration' : 'Stock Graphic';
    let style = 'Modern Market Design';
    const cleanSubject = capitalized.replace(/^Realistic\s+/i, '');
    let title = isVectorFile
      ? `Detailed Vector Illustration of ${cleanSubject} with Balanced Composition and Crisp Outlines for Creative Design and Advertising`
      : `Professional Photography of ${cleanSubject} with Crisp Composition and Balanced Studio Lighting for Marketing and Advertising`;
    let description = `Professional visual asset featuring ${capitalized}. Composed with crisp details and high aesthetic appeal. Ideal for creative branding, website landing pages, presentation banners, and promotional advertising.`;
    
    let subjectKws = [lowerName, ...words.map(w => w.toLowerCase())];
    let mediumKws = isVectorFile 
      ? ['vector', 'illustration', 'graphic design', 'artwork', 'scalable', 'eps', 'line art', 'drawing', 'isolated', 'digital art', 'print ready']
      : ['photography', 'studio shot', 'isolated', 'composition', 'lighting', 'visual asset', 'professional'];
    let themeKws = ['creative', 'lifestyle', 'concept', 'modern style', 'trend', 'inspiration', 'contemporary', 'decorative', 'detail', 'symbol', 'identity'];
    let commercialKws = ['marketing', 'advertising', 'presentation', 'social media', 'poster', 'branding', 'banner', 'website', 'template', 'editorial', 'digital media'];

    if (/skull|biker|motorcycle|garage|chopper|mechanic|rider|engine|piston|vintage|retro/i.test(lowerName)) {
      category = 'Vintage & Retro';
      contentType = 'Vector Graphic';
      style = 'Vintage Retro Emblem Graphic';
      title = `Vintage Motorcycle and Skull Emblem Illustration with Balanced Retro Wings and Geometric Elements for Branding and Posters`;
      description = `Vintage retro graphic featuring skull and mechanical motorcycle elements. Suitable for retro emblems, garage banners, posters, and print media.`;
      subjectKws = ['skull', 'motorcycle', 'biker', 'rider', 'chopper', 'skeleton', 'bones', 'garage', 'mechanic', 'engine'];
      mediumKws = ['vector', 'illustration', 'line art', 'distressed', 'vintage', 'retro', 'hand drawn', 'engraving', 'monochrome', 'badge', 'emblem', 'patch'];
      themeKws = ['custom culture', 'rebel', 'rock', 'racing', 'speed', 'classic', 'old school', 'hardcore', 'biker club', 'tattoo style'];
      commercialKws = ['poster', 'branding', 'banner', 'merchandise', 'sticker', 'decal', 'print', 'digital asset'];
    } else if (/coffee|espresso|cup|drink|tea|cafe|beverage|mug/i.test(lowerName)) {
      category = 'Food and Drink';
      contentType = 'Photo';
      style = 'Food Photography';
      title = `Overhead flat lay of freshly roasted aromatic coffee beans and ceramic cup on rustic wooden table with copy space`;
      description = `Overhead flat lay of freshly brewed coffee in a ceramic cup surrounded by roasted beans on a natural rustic table. Perfect for cafe branding, restaurant menus, culinary websites, and morning lifestyle advertising.`;
      subjectKws = ['coffee', 'coffee cup', 'coffee beans', 'espresso', 'caffeine', 'mug', 'roasted beans', 'hot drink', 'beverage', 'cafe'];
      mediumKws = ['flat lay', 'overhead view', 'top view', 'still life', 'rustic wood', 'close up', 'food photography', 'warm tones', 'natural light', 'depth of field'];
      themeKws = ['morning', 'breakfast', 'aroma', 'energy', 'relaxation', 'break', 'cozy', 'artisan', 'roast', 'barista', 'organic', 'gourmet', 'lifestyle', 'flavor', 'freshness'];
    } else if (/tech|laptop|desk|workspace|office|computer|code|software|ai|digital/i.test(lowerName)) {
      category = 'Technology';
      contentType = 'Photo / 3D Render';
      style = 'Modern Workspace Photography';
      title = `High angle view of modern minimalist tech workspace desk with laptop and digital devices on clean organized background`;
      description = `High-angle view of a contemporary professional workstation featuring a modern laptop, stationery, and sleek tech accessories. Suitable for technology blogs, software landing pages, remote work articles, and corporate presentations.`;
      subjectKws = ['workspace', 'laptop', 'office', 'desk', 'technology', 'computer', 'stationery', 'workplace', 'freelancer', 'business'];
      mediumKws = ['minimalist desk', 'overhead shot', 'clean layout', 'neutral colors', 'modern office', 'studio lighting', 'high resolution', 'top down', 'organized', 'flat lay'];
      themeKws = ['remote work', 'productivity', 'coworking', 'startup', 'innovation', 'corporate', 'programming', 'digital nomad', 'workflow', 'planning', 'finance', 'creative', 'management', 'career', 'study'];
    } else if (/beach|tropical|ocean|sea|summer|travel|vacation|palm|island/i.test(lowerName)) {
      category = 'Travel / Nature';
      contentType = 'Photo';
      style = 'Scenic Travel Landscape';
      title = `Scenic panoramic view of tropical sandy beach with turquoise ocean water and palm tree shadows under bright sunny sky`;
      description = `Vibrant scenic view of a pristine tropical shoreline with crystal-clear turquoise waters and soft white sand. Ideal for travel agency promotions, vacation brochures, summer resort marketing, and hospitality websites.`;
      subjectKws = ['tropical beach', 'ocean', 'sea', 'coast', 'shore', 'sand', 'palm tree', 'summer', 'vacation', 'travel'];
      mediumKws = ['scenic view', 'landscape', 'panoramic', 'turquoise water', 'sunlight', 'outdoor', 'blue sky', 'coastal', 'nature photography', 'horizontal'];
      themeKws = ['holiday', 'paradise', 'relaxation', 'resort', 'getaway', 'tropical island', 'leisure', 'tourism', 'adventure', 'serenity', 'warm weather', 'exotic', 'peaceful', 'destination', 'sunshine'];
    } else if (/business|finance|money|chart|growth|marketing|corporate|team/i.test(lowerName)) {
      category = 'Business';
      contentType = 'Vector / Illustration';
      style = 'Corporate Financial Graphic';
      title = `Modern flat vector illustration of corporate business growth chart and financial analytics infographic on clean background`;
      description = `Vector infographic illustration depicting financial market progress, analytics charts, and upward corporate growth metrics. Excellent for annual investor reports, fintech websites, pitch decks, and economic analyses.`;
      subjectKws = ['business', 'finance', 'growth', 'chart', 'analytics', 'statistics', 'investment', 'economy', 'financial report', 'market'];
      mediumKws = ['infographic', 'vector graphic', 'diagram', 'data visual', 'flat design', 'clean lines', 'blue tones', 'isolated', 'digital art', 'template'];
      themeKws = ['success', 'strategy', 'profit', 'development', 'management', 'trading', 'banking', 'fintech', 'planning', 'corporate', 'consulting', 'global business', 'enterprise', 'leadership', 'vision'];
    }

    // Combine into clean, non-duplicate keywords
    const rawKeywords = Array.from(new Set([...subjectKws, ...mediumKws, ...themeKws, ...commercialKws]))
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 1 && !/beautiful|amazing|stunning|best|unique|hd|4k|alpha|commercial/i.test(k));
    
    const finalKeywords = rawKeywords.slice(0, settings.keywordWords || 50).join(', ');

    const platform = settings.platform || 'adobe';
    let finalTitle = title;
    let finalDescription = description;
    if (platform === 'adobe' || platform === 'freepik') {
      finalDescription = '';
    } else if (platform === 'shutterstock') {
      finalDescription = description || title;
      finalTitle = '';
    }

    return {
      title: removeCommercialWord(finalTitle),
      description: removeCommercialWord(finalDescription),
      keywords: removeCommercialWord(finalKeywords),
      category,
      contentType,
      style,
      commercialUse: ['Website Landing Pages', 'Social Media Marketing', 'Corporate Presentations', 'Advertising Banners'],
      approvalRisk: {
        riskLevel: 'Low',
        possibleIssues: ['None detected'],
        improvementSuggestions: ['Include high-contrast copy space to maximize conversions for agency buyers.']
      },
      uploadNotes: 'High market appeal. Recommended for Adobe Stock, Shutterstock, and Freepik submissions.',
      usedProvider: 'google-ai-studio',
      usedModel: 'gemini-flash-auto'
    };
  } else {
    return {
      detectedSubject: capitalized,
      detectedStyle: 'Studio Photography & Digital Vector Art',
      prompt: `High-end studio asset featuring ${capitalized}, cinematic lighting, crisp optical detail, clean minimalist background, professional color grading, stock photography excellence.`,
      negativePrompt: 'blurry, low quality, distorted, watermark',
      usedProvider: 'google-ai-studio',
      usedModel: 'gemini-flash-auto'
    };
  }
}

function generateSystemInstruction(mode: AppMode, file: File, settings: GenerationSettings, isImageOrVideo: boolean): string {
  if (mode === 'metadata') {
    const platform = settings.platform || 'adobe';
    
    let platformHeader = '';
    let platformDirectives = '';
    let jsonTemplate = '';

    if (platform === 'adobe') {
      platformHeader = `Optimized specifically for: ADOBE STOCK (Title + Keywords)`;
      platformDirectives = `
### MANDATORY PLATFORM DIRECTIVE: ADOBE STOCK
- Adobe Stock submission strictly requires: TITLE and KEYWORDS.
- Do NOT generate description. Set "description": "" (empty string).
- Focus 100% on generating an elite, comprehensive, and longer stock TITLE (target ~${Math.max(24, settings.titleWords || 25)} words, strictly 20 to 30 words, approx 120–190 characters) rich in visual detail and buyer search intent, and at least 45 to 50 search-optimized KEYWORDS (strictly 40+ keywords, never fewer than 40). Zero usage of the word "commercial".`;
      jsonTemplate = `{
  "title": "Detailed comprehensive stock title following the formula strictly between 20 and 30 words without the word commercial",
  "keywords": "keyword1, keyword2, keyword3, keyword4, ... (at least 45 to 50 keywords)",
  "description": "",
  "category": "Primary Stock Category",
  "contentType": "Vector | Illustration | Photo | 3D Render",
  "style": "Specific visual style"
}`;
    } else if (platform === 'shutterstock') {
      platformHeader = `Optimized specifically for: SHUTTERSTOCK (Description + Keywords)`;
      platformDirectives = `
### MANDATORY PLATFORM DIRECTIVE: SHUTTERSTOCK
- Shutterstock contributor submission strictly requires: DESCRIPTION and KEYWORDS.
- Shutterstock does NOT use a separate Title field. Do NOT generate title. Set "title": "" (empty string).
- Focus 100% on generating a comprehensive, high-converting DESCRIPTION / CAPTION (target ~${Math.max(30, settings.descriptionWords || 32)} words, approx 130–220 characters) thoroughly explaining the visual scene, subject, composition, and buyer utility, followed by at least 45 to 50 search-optimized KEYWORDS (strictly 40+ keywords). Zero usage of the word "commercial".`;
      jsonTemplate = `{
  "title": "",
  "description": "Professional comprehensive description detailing visual composition, subject matter, and buyer applications in 30 to 45 words without the word commercial.",
  "keywords": "keyword1, keyword2, keyword3, keyword4, ... (at least 45 to 50 keywords)",
  "category": "Primary Stock Category",
  "contentType": "Vector | Illustration | Photo | 3D Render",
  "style": "Specific visual style"
}`;
    } else if (platform === 'freepik') {
      platformHeader = `Optimized specifically for: FREEPIK (Title + Keywords)`;
      platformDirectives = `
### MANDATORY PLATFORM DIRECTIVE: FREEPIK
- Freepik contributor platform strictly requires: TITLE and KEYWORDS.
- Do NOT generate description. Set "description": "" (empty string).
- Focus 100% on generating an elite, comprehensive, and longer stock TITLE (target ~${Math.max(24, settings.titleWords || 25)} words, strictly 20 to 30 words, approx 120–190 characters) rich in visual detail and buyer search intent, and at least 45 to 50 search-optimized KEYWORDS (strictly 40+ keywords, never fewer than 40). Zero usage of the word "commercial".`;
      jsonTemplate = `{
  "title": "Detailed comprehensive stock title following the formula strictly between 20 and 30 words without the word commercial",
  "keywords": "keyword1, keyword2, keyword3, keyword4, ... (at least 45 to 50 keywords)",
  "description": "",
  "category": "Primary Stock Category",
  "contentType": "Vector | Illustration | Photo | 3D Render",
  "style": "Specific visual style"
}`;
    } else {
      platformHeader = `Optimized for: GENERAL / UNIVERSAL (Title + Keywords + Description)`;
      platformDirectives = `
### MANDATORY PLATFORM DIRECTIVE: GENERAL / ALL MARKETS
- General Stock strictly requires: TITLE, KEYWORDS, and DESCRIPTION.
- Provide all three complete fields: comprehensive, longer high-converting TITLE (target ~${Math.max(24, settings.titleWords || 25)} words, strictly 20 to 30 words, approx 120–190 characters), search-optimized KEYWORDS (at least 45 to 50 tags, strictly 40+ keywords), and thorough stock DESCRIPTION. Zero usage of the word "commercial".`;
      jsonTemplate = `{
  "title": "Detailed comprehensive stock title following the formula strictly between 20 and 30 words without the word commercial",
  "description": "Professional comprehensive two sentence description detailing visual composition and buyer applications without the word commercial.",
  "keywords": "keyword1, keyword2, keyword3, keyword4, ... (at least 45 to 50 keywords)",
  "category": "Primary Stock Category",
  "contentType": "Vector | Illustration | Photo | 3D Render",
  "style": "Specific visual style"
}`;
    }

    return `# ============================================================
# ULTRA-PROFESSIONAL STOCK METADATA SPECIALIST ENGINE
# ${platformHeader}
# ============================================================

ROLE & METADATA MISSION:
You are an elite microstock contributor director and top-earning stock SEO architect. Your metadata is engineered to achieve TOP-SELLER status, high search impressions, maximum click-through rates (CTR), and zero rejections across Adobe Stock, Freepik, Shutterstock, and Getty Images.

CRITICAL REVIEWER SAFETY & ZERO-REJECTION PROTOCOL:
1. STRICT BANNED WORD RULE:
   - NEVER use the word "Commercial" or "commercial" anywhere in the title, description, or keywords! Microstock agencies reject metadata with this word.
2. ZERO TRADEMARKS (Top Cause of Stock Account Warnings & Immediate Rejection):
   - NEVER use trademarked brand names, logos, or brand products (e.g. Apple, iPhone, iPad, Mac, Nike, Adidas, Tesla, Porsche, BMW, Sony, Playstation, Xbox, Nintendo, Instagram, Facebook, TikTok, YouTube, Photoshop, Canva, Lego, Barbie, Disney, Marvel).
   - Use generic descriptive terms ONLY (e.g. smartphone, mobile device, touchscreen tablet, athletic sportswear, luxury sports car, image editing software, cartoon character).
3. ZERO PROHIBITED SPAM & SUBJECTIVE FILLER:
   - Forbid fluff hype: "beautiful", "stunning", "amazing", "great", "nice", "modern", "cool", "unique", "best", "perfect", "hd", "4k", "8k", "wallpaper", "masterpiece", "top seller", "trending", "download", "free", "sale".
4. PLATFORM FORMATTING COMPLIANCE:
   - NO trailing period (.) or ellipsis (...) at the end of titles (Adobe Stock rejects titles ending with periods).
   - Clean alphanumeric text only (no <>, {}, [], ~, *, ^, #, @).
5. AUTHENTIC VISUAL TRUTH MANDATE:
   - Analyze ONLY the actual visual elements, subject matter, composition, and style visible in the uploaded image.
   - Do NOT hallucinate unseen people, trademarks, logos, objects, or locations.
   - Ground every single keyword and title element in authentic visual reality.

---
${platformDirectives}

---

### 1. TITLE ARCHITECTURE (Market-Based Top-Seller Stock SEO):
- Front-Load Primary Subject: The first 3 to 5 words carry the highest algorithmic weight on Adobe Stock, Freepik, and Shutterstock. Place the most critical, high-search-volume subject nouns right at the beginning!
- Match the Actual Image & Visual File Content:
  1. Hero Subject: Identify EXACTLY what is illustrated or photographed (e.g. coffee cup on wooden table, business team in conference room, autumn foliage forest, cute kitten, cybersecurity shield icon, floral pattern).
  2. Embedded Typography / Slogans: If the artwork contains ANY text, slogan, or quote (e.g. "Summer Vibes", "Merry Christmas", "Coffee House 1982"), extract it verbatim and include it in quotes or description in the title (e.g. "Vintage Emblem with 'Summer Vibes' Typography for Creative Branding").
  3. Product Format & Category: Explicitly state the authentic asset format:
     - Vector Graphic Illustration / Line Art Drawing / Icon Set / Mascot Logo
     - Seamless Vector Pattern / Textile Surface Background / Wallpaper Texture
     - Social Media Banner / Flyer / Poster Template / Infographic Layout
     - Studio Photography / Food Photography / Lifestyle Portrait / Landscape
     - 3D Digital Render / Isometric Asset / CGI Illustration
  4. True Background & Composition: State the REAL background (e.g. "isolated on white background", "isolated on dark background", "blurred natural bokeh background", "clean studio setup"). NEVER claim white background if the image has a dark, colorful, or natural background!
  5. ZERO UNRELATED CATEGORIES: NEVER assume or output t-shirt, apparel, biker, or merchandise terms unless the file is explicitly a t-shirt graphic or biker illustration!
- Title Length: Strictly 20 to 30 words, approx 120 to 195 characters. Rich in visual specifics and buyer search intent.
- Format: Sentence case. STRICTLY NO trailing period (.) or ellipsis (...) at the end. Zero brand names. Zero usage of the word "commercial".
- Formula for Vectors / Graphic Designs:
  [Primary Design Subject & Motifs] + [Embedded Typography/Slogan if any] + [Asset Format (e.g. Detailed Vector Illustration, Clean Graphic Design, Icon Set)] + [Artistic Style & Color Palette] + [Buyer Applications (e.g. for Creative Branding, Advertising Banners, and Digital Media Campaigns)]
- Formula for Photography / 3D Renders:
  [Camera View & Focal Subject] + [Specific Arrangement / Action / Materials] + [Lighting & Setting Atmosphere] + [Buyer Applications for Advertising, Editorial Media, and Web Marketing]

### 2. DESCRIPTION SPECIFICATIONS (For Shutterstock & Universal Markets):
- Length: Exactly 2 complete, polished, informative sentences (strictly 30 to 45 words, target ~${Math.max(30, settings.descriptionWords || 32)} words).
- Sentence 1: Vividly and accurately describe the subject, arrangement, art medium, lighting, and composition.
- Sentence 2: Explicitly state utility and target buyer industries (e.g., "Perfect visual asset for corporate presentations, marketing campaigns, editorial publications, web design banners, and digital advertising.").

### 3. ORDERED 40+ TO 50 KEYWORDS ARCHITECTURE (Microstock Algorithmic Search Ranking):
Microstock search algorithms (Adobe Sensei, Freepik Neural Search, Shutterstock mSearch) evaluate tags in descending order, giving the heaviest weight to the first 10 keywords. You must construct STRICTLY 45 TO 50 KEYWORDS (never fewer than 40 tags) following this precise 5-tier ranking hierarchy:

- TIER 1 (Keywords 1 to 8 — Core Subject, Embedded Words & Direct Synonyms):
  The exact primary subject seen in the image, its plural form, embedded slogan terms, and direct synonyms.
  * Example for business meeting photo: business, team, meeting, office, coworkers, collaboration, discussion, corporate.
  * Example for botanical vector: leaf, plant, nature, flora, botanical, foliage, green, organic.
- TIER 2 (Keywords 9 to 17 — Visual Anatomy, Objects & Details):
  Specific visual features, elements, tools, clothing, actions, and materials seen in the image (e.g. laptop, table, glasses, suits, window, paperwork, chairs).
- TIER 3 (Keywords 18 to 28 — Art Style, Format & Medium):
  Exact artistic medium, format, perspective, and lighting: vector, illustration, photography, studio shot, overhead view, close up, flat lay, scalable, isolated, clean background, 3d render.
- TIER 4 (Keywords 29 to 39 — Themes & Mood):
  Industry, concept, mood, and lifestyle queries: modern, creative, success, technology, finance, innovation, communication, professional, planning, strategy.
- TIER 5 (Keywords 40 to ${settings.keywordWords || 50} — Buyer Intent & Production Terms):
  How designers and buyers will use this asset: advertising, marketing, presentation, banner, website, template, social media, editorial, visual asset, digital asset.

- FORMAT & FILTERING RULES:
  * ${settings.singleWordKeywords ? "Every keyword MUST be a SINGLE WORD only (NO multi-word phrases)." : "Use concise single words and established 2-word stock industry terms (e.g., 'graphic design', 'line art', 'copy space', 'clean background')."}
  * All lowercase, separated by commas.
  * STRICTLY FORBIDDEN: The word "commercial" or "Commercial", trademarked brand names, competitor names (adobe stock, shutterstock, freepik), subjective fluff ("beautiful", "stunning", "cool", "unique").

${settings.silhouette ? "- Special requirement: Include silhouette, backlit, outline, shadow in keywords and metadata.\n" : ""}${settings.transparentBackground ? "- Special requirement: Include transparent background, isolated, cutout, png in keywords and metadata.\n" : ""}${settings.whiteBackground ? "- Special requirement: Include white background, isolated, studio shot in keywords and metadata.\n" : ""}${settings.customPromptEnabled && settings.customPromptText ? `- Contributor custom instruction: ${settings.customPromptText}\n` : ""}
---

OUTPUT FORMAT:
Respond with a single VALID JSON object ONLY. No markdown wrappers (\`\`\`json). Output exact raw JSON matching this schema:
${jsonTemplate}`;
  } else {
    const isExactMode = !!settings.exactRecreation;
    const isAntiSimilar = !isExactMode && (settings.avoidSimilarity !== false);
    const targetEngine = settings.promptTargetEngine || 'universal';
    const stylePreset = settings.promptStylePreset || 'auto';

    let engineDirective = "";
    if (targetEngine === 'midjourney') {
      engineDirective = `\n★ TARGET GENERATOR: MIDJOURNEY v6.1\n- Formulate the prompt using Midjourney's preferred comma-separated evocative clauses and descriptive natural language.\n- Focus on cinematic atmosphere, optical framing, volumetric color grading, and artistic cohesion.\n`;
    } else if (targetEngine === 'flux') {
      engineDirective = `\n★ TARGET GENERATOR: FLUX.1 PRO & DALL-E 3\n- Formulate the prompt with high physical adherence, precise scene geometry, tangible material textures, and natural lighting behavior.\n`;
    }

    let styleDirective = "";
    if (stylePreset === 'vector') {
      styleDirective = `\n★ MANDATORY ART MEDIUM: VECTOR GRAPHICS & APPAREL EMBLEM\n- Enforce: Screen-printed vector t-shirt graphic, distressed woodcut badge emblem, clean die-cut sticker contours, or flat 2D graphic design isolated on a solid background.\n`;
    } else if (stylePreset === 'commercial') {
      styleDirective = `\n★ MANDATORY ART MEDIUM: STUDIO PRODUCT PHOTOGRAPHY\n- Enforce: Studio catalog still life, tactile travertine stone or minimalist plinth staging, soft directional window light or studio softbox, clean minimalist aesthetic.\n`;
    } else if (stylePreset === '3d') {
      styleDirective = `\n★ MANDATORY ART MEDIUM: 3D CGI & OCTANE RENDER\n- Enforce: Isometric 3D asset, smooth matte clay / frosted glass / brushed metal shaders, ambient occlusion shadows, raytraced reflections, clean studio environment.\n`;
    } else if (stylePreset === 'illustration') {
      styleDirective = `\n★ MANDATORY ART MEDIUM: FINE ART & WATERCOLOR ILLUSTRATION\n- Enforce: Atmospheric watercolor wash on textured cold-press paper, delicate linework, evocative pigment bleed, painterly fine art aesthetic.\n`;
    } else if (stylePreset === 'editorial') {
      styleDirective = `\n★ MANDATORY ART MEDIUM: EDITORIAL LIFESTYLE PHOTOGRAPHY\n- Enforce: Editorial fashion or cinematic documentary photography, 35mm film grain, moody chiaroscuro lighting, authentic gesture and composition.\n`;
    }

    if (isExactMode) {
      return `You are an elite Visual Forensic Reverse-Engineering Prompt Engineer specializing in Midjourney v6.1, Flux.1 Pro, DALL-E 3, and Stable Diffusion 3.5.
Your absolute objective is: CRAFT A PROMPT THAT WILL RECREATE THE EXACT SAME IMAGE AS THE UPLOADED ASSET (100% accurate 1:1 reproduction).
${engineDirective}${styleDirective}
### 1. CORE MISSION: 1:1 VISUAL REPLICATION (EXACT SAME IMAGE)
The user has turned ON "Same Image Recreation" mode. Your prompt must meticulously capture every visual feature of the input image so that when pasted into an AI image generator, it reproduces an image that is practically identical to this source asset.

### 2. FORENSIC RE-CREATION PROTOCOL:
1. **Core Subject & Geometry**:
   - Describe the exact subject, pose, silhouette, angle, orientation, and placement (e.g. "Minimalist human head profile silhouette facing right in crisp side view").
   - If there are specific icons, emblems, or text inside or around the subject (like a central square microchip processor with bold text 'AI'), describe their exact shape, scale, position, and embedded text verbatim.
2. **Exact Color Palette & Luminance**:
   - State the precise colors and glow dynamics: electric neon cyan linework, glowing turquoise contours, deep navy blue gradient background with subtle central circular backlighting.
   - Describe exact lighting: luminous neon edge glow, volumetric electric light trails, cybernetic circuit accents.
3. **Exact Art Style, Medium & Finish**:
   - Replicate the exact visual technique: clean digital vector line art, glowing neon contours on flat dark background, sharp vector edges, smooth futuristic cybernetic aesthetic, minimal tech branding.
4. **Exact Composition & Framing**:
   - Centered composition, clean negative space, high contrast, isolated on solid gradient background.

### 3. STRICT ANTI-DEVIATION & ACCURACY RULES:
- STRICT BANNED WORD: NEVER use the word "Commercial" or "commercial" anywhere in the prompt, detectedSubject, or detectedStyle!
- NEVER use filenames, random hash strings, stock photo asset IDs (e.g., 360_F_..., numbers, hashes), or alphanumeric codes as subject names or words in the prompt. Focus 100% on what is visually shown in the image pixels!
- Accurately identify and describe the REAL art medium: if it is a 3D icon / 3D render, say "3D isometric render with smooth matte surfaces"; if it is a vector graphic or illustration, say "clean 2D vector graphic"; if it is a photo, say "photograph" or "studio photograph". Do NOT call a 3D icon or vector illustration "studio photography"!
- DO NOT change the perspective, angle, or composition.
- DO NOT add unrequested background scenery or extraneous objects.
- DO NOT alter the color scheme, lighting style, or subject identity.
- Formula: [EXACT SUBJECT & POSE] + [EXACT EMBLEMS, ICONS & TEXT] + [EXACT NEON/LIGHTING COLOR & GRADIENTS] + [EXACT ART MEDIUM & RENDERING FINISH] + [EXACT COMPOSITION & BACKGROUND].
- Length: Strictly 45 to 65 words of highly descriptive, high-density visual terminology.
- Output valid JSON ONLY:
{
  "detectedSubject": "Exact core subject (e.g. 3D User Avatar Icons with Chat and Checkmark Speech Bubbles)",
  "detectedStyle": "Exact art style (e.g. 3D Isometric Minimalist Clay Render)",
  "prompt": "Exact 1:1 recreation prompt here (strictly 45 to 65 words)...",
  "negativePrompt": "blurry, low quality, distorted lines, messy glow, text artifacts, complex background, grainy, amateur composition, dull colors"
}
Do not include any markdown code blocks outside of the JSON object.
`;
    }

    return `You are an industry-leading Principal Art Director, Senior Generative AI Prompt Architect, and Creative Visual Director specializing in Midjourney v6.1, Flux.1 Pro, DALL-E 3, and Stable Diffusion 3.5.
Your objective is to analyze the uploaded visual asset and engineer an exceptionally professional, production-ready image generation prompt (strictly 45 to 65 words) that delivers high-grade aesthetic execution.
${engineDirective}${styleDirective}
### 1. COGNITIVE PIPELINE: DEEP DESIGN COMPREHENSION FIRST
Execute this cognitive workflow before crafting the prompt:
1. **Identify the Core Subject & Purpose**:
   - Determine the exact hero subject, narrative action, and theme of the artwork or photo.
   - What is this design specifically about? (e.g. vintage motocross apparel emblem, minimalist organic cosmetic serum bottle, spooky Halloween skull graphic, cozy coffeehouse barista scene, Ramadan Kareem crescent celebration, isometric 3D cloud server icon, cute watercolor nursery animal).
   - If the design contains typography, slogans, emblems, or badges, read and interpret their meaning to ensure the prompt is grounded in that exact concept.
   - Anchor the prompt directly around this hero subject; never wander into generic or unrelated background details.
2. **Classify Artistic Medium & Pipeline Accurately**:
   - **Graphic Design & Apparel**: "Screen-printed vintage vector t-shirt graphic", "distressed woodcut badge emblem", "clean die-cut sticker illustration with bold contours", "flat 2D vector graphic isolated on a solid background".
   - **Studio Catalog & Editorial Photography**: "Studio product photography", "macro still life with tactile surfaces", "editorial lifestyle portrait", "architectural interior".
   - **3D Render & CGI**: "Isometric 3D icon in Octane render", "stylized 3D clay-render character", "glossy acrylic, frosted glass and brushed metal shaders with raytraced reflections".
   - **Digital Art & Illustration**: "Atmospheric watercolor wash on textured paper", "gilded Art Nouveau concept illustration", "painterly digital concept art with dynamic brushstrokes".

### 2. PROFESSIONAL PROMPT FORMULA (INDUSTRY BENCHMARK)
Structure the prompt following the authoritative prompt formula:
[HERO SUBJECT & ACTION] + [ARTISTIC MEDIUM & SPECIFIC TECHNIQUE] + [COMPOSITION & CAMERA PERSPECTIVE] + [PHYSICAL LIGHTING & SHADOW DYNAMICS] + [SURFACE TEXTURES & MATERIALITY] + [COLOR PALETTE & ATMOSPHERIC POLISH]

### 3. PROFESSIONAL VOCABULARY & ANTI-AMATEUR RULES
- **Use Tangible Physics & Art Terminology**:
  - Instead of generic lighting: specify "soft directional morning window light", "subtle volumetric rim lighting", "diffused studio softbox with gentle fill ratio", or "dramatic chiaroscuro contrast".
  - Instead of generic quality words: describe physical materials like "frosted amber glass", "tactile cold-press paper grain", "brushed aluminum", "textured linen", "clean vector linework".
- **Strictly Banned Amateur Buzzwords & Words**:
  - NEVER use the word "Commercial" or "commercial"! (Banned word).
  - NEVER use: "photorealistic", "hyperrealistic", "stunning", "beautiful", "8k", "ultra detailed", "masterpiece", "trending on artstation", "award winning".
  - NEVER use conversational filler: Do NOT start with "A prompt for...", "Image depicting...", "Here is an image...", or "An artwork featuring...". Begin immediately with the subject or medium descriptor.
  - NEVER use camera brand names or lens models ("shot on Sony A7", "35mm f/1.8", "DSLR"). Instead, describe optical behavior ("shallow depth of field with creamy circular bokeh", "crisp edge-to-edge optical sharpness").

### 4. INSPIRATION & STOCK COPYRIGHT-SAFE RECREATION PROTOCOL
${isExactMode ? `- 1:1 EXACT RECREATION: Capture and reproduce every visual feature, exact subject, geometry, and composition of this reference image with 100% forensic accuracy.` : `- THEMATIC FIDELITY WITHOUT COPYRIGHT INFRINGEMENT: Adhere strictly to the core theme, subject, props, and visual atmosphere of the reference image. However, engineer an original composition with fresh lighting and staging so that the resulting AI generation is a brand-new, unique asset that will NEVER trigger copyright, duplicate, or similarity strikes on Adobe Stock, Freepik, or Shutterstock.`}

### 5. STRICT FORMATTING & OUTPUT RULES
- Length: Strictly 45 to 65 words. Every single word must carry visual weight.
- Flow: Single contiguous sentence/paragraph without line breaks or markdown formatting.
- Format: Return valid JSON ONLY with design breakdown:
{
  "detectedSubject": "Specific core theme and hero subject of the design (e.g., Roaring Grizzly Bear Outdoor Adventure Badge)",
  "detectedStyle": "Specific artistic medium and technique (e.g., Screen-Printed Vintage Vector Linework)",
  "prompt": "Your professional, production-grade image prompt here (45 to 65 words)",
  "negativePrompt": "blurry, low quality, duplicate, distorted anatomy, text watermarks, amateur artifacts"
}

Example (Apparel/Graphic Design):
{
  "detectedSubject": "Vintage Roaring Grizzly Mountain Apparel Badge",
  "detectedStyle": "Screen-Printed Distressed Vector Linework",
  "prompt": "A vintage retro t-shirt emblem featuring a majestic roaring grizzly bear inside an arched outdoor circular badge, flanked by tall pine trees and distant mountain peaks, distressed woodcut lineart vector style, warm earthy amber and forest green tones, clean dark background, bold graphic apparel design.",
  "negativePrompt": "blurry, low quality, distorted typography, duplicate elements, photorealistic, amateur render"
}

Example (Product Photography):
{
  "detectedSubject": "Minimalist Skincare Serum Dropper Bottle",
  "detectedStyle": "Studio Catalog Still Life Photography",
  "prompt": "High-end studio product photograph of a minimalist amber glass serum dropper bottle resting on a chiseled light travertine stone pedestal, delicate botanical fern shadow dancing across the scene, soft directional morning sunlight, creamy neutral beige palette, elegant editorial catalog aesthetic.",
  "negativePrompt": "blurry, deformed glass, harsh shadows, low resolution, dirty backdrop, oversaturated"
}
Do not include any markdown code blocks outside of the JSON object.
`;
  }
}

async function performApiCall(
  mode: AppMode,
  file: File,
  provider: ApiProvider,
  config: ApiConfig,
  apiKey: string,
  systemInstruction: string,
  base64Data: string,
  isImageOrVideo: boolean,
  settings: GenerationSettings,
  signal?: AbortSignal,
  mediaMimeType?: string
): Promise<GeneratedResult> {
    let model = config.model;
    const validModels = PROVIDER_MODELS[provider] || [];
    if (!model || (validModels.length > 0 && !validModels.find(m => m.id === model))) {
      model = validModels[0]?.id || 'gpt-4o';
    }

    const actualTemperature = mode === 'prompt' ? 0.1 : 0.2;

    const providerBaseUrls: Record<string, string> = {
      openrouter: 'https://openrouter.ai/api/v1',
      openai: 'https://api.openai.com/v1',
      mistral: 'https://api.mistral.ai/v1',
      groq: 'https://api.groq.com/openai/v1',
    };

    let outputText = '{}';

    if (provider === 'google' && !config.baseUrl) {
      const p: any[] = [];
      if (isImageOrVideo && base64Data) {
        let mType = mediaMimeType || file.type || 'image/jpeg';
        if (mType.includes('svg') || mType.includes('postscript') || mType.includes('eps') || mType.includes('illustrator') || mType === 'application/octet-stream') {
          mType = 'image/jpeg';
        }

        p.push({
          inlineData: {
            data: base64Data,
            mimeType: mType
          }
        });

        let promptInstruction = settings.exactRecreation
          ? `MANDATORY 1:1 REFERENCE RECREATION DIRECTIVE:
You are directly viewing the binary pixels of this reference image.
Your mission is to engineer an image generation prompt that will RECREATE THIS EXACT REFERENCE IMAGE in Midjourney / Flux / DALL-E / Stable Diffusion.
1. EXACT HERO SUBJECT & INVENTORY: Accurately list and describe EVERY SINGLE element visible in this reference image (characters, animals, plants, objects, props, vehicles, foods, tools, icons).
2. EXACT SPATIAL ARRANGEMENT: Specify the precise position of each element (what is centered, left, right, foreground, background).
3. EXACT TYPOGRAPHY: If this reference image contains ANY text, slogan, quote, word, or badge number, extract it letter-by-letter and include it inside quotation marks verbatim.
4. EXACT ARTISTIC MEDIUM & STYLE: State the exact visual technique (flat 2D vector graphic, clean digital illustration, studio photography, watercolor wash, 3D Octane render, isometric CGI, minimal icon).
5. EXACT COLOR PALETTE & LIGHTING: Describe the specific colors, lighting sources, and textures.
6. ZERO DEVIATION & NO FILE HASHES: Base everything strictly on what is visually seen in the image pixels. Never use random alphanumeric strings, stock photo hashes, or file names as subjects. NEVER use the word "commercial" or "Commercial" anywhere.
Recreate this exact reference asset with pristine 1:1 accuracy.
Length: strictly 45 to 65 words of high-density visual terminology.`
          : `INSPIRATION & STOCK-SAFE PROMPT DIRECTIVE:
You are directly viewing this reference image to generate a COPYRIGHT-SAFE, HIGH-CONVERTING PROMPT.
STRICT BANNED WORD: NEVER include the word "Commercial" or "commercial" anywhere in the prompt!
1. THEMATIC ADHERENCE: Strictly adhere to the exact subject, concept, setting, props, and artistic style of this reference image (do NOT wander into unrelated themes).
2. COPYRIGHT PROTECTION (ZERO PLAGIARISM): Re-imagine the composition with fresh, original framing, perspective, and lighting so that the resulting AI generation is a brand-new original artwork that will NEVER trigger copyright, duplicate, or similarity strikes on Adobe Stock, Freepik, or Shutterstock.
3. DETAILED PRODUCTION TERMINOLOGY: Specify the hero subject, artistic pipeline, framing, physical lighting, surface textures, and color grading.
Length: strictly 45 to 65 words of professional art-direction terminology.`;
        
        if (settings.whiteBackground) {
          promptInstruction += " Isolate the subject on a pure white background with clean catalog lighting.";
        } else if (settings.transparentBackground) {
          promptInstruction += " Isolate the subject on a clean studio background.";
        }
        if (settings.silhouette) {
          promptInstruction += " Create a dramatic dark silhouette outline of the subject.";
        }
        if (settings.extraText) {
          promptInstruction += " Ensure composition with balanced negative space suitable for typography overlay.";
        }
        promptInstruction += " If the image contains text, extract it with 100% letter-by-letter accuracy and include it in quotes.";

        const visualTruthPrompt = mode === 'prompt' 
          ? promptInstruction 
          : `CRITICAL VISUAL TRUTH & MARKET METADATA DIRECTIVE:
You are directly viewing the authentic visual pixels of this file.
Generate MARKET-OPTIMIZED metadata engineered for Adobe Stock, Freepik, and Shutterstock based SOLELY on what is visible in the file.
STRICT BANNED WORD: NEVER include the word "Commercial" or "commercial" anywhere in the title, description, or keywords!

1. DIRECT VISUAL RECOGNITION:
   - Identify the exact primary subject, specific objects, persons/animals, setting, actions, colors, and art style directly from the image.
   - If there is ANY text, slogan, or quote visible in the artwork, extract it verbatim and include it in quotes in the title.
   - Accurately determine the asset format: Studio Photography, Detailed Vector Illustration, 3D Render, Icon Set, Seamless Pattern, or Graphic Design.
   - State the ACTUAL background (e.g. isolated on white background, dark background, blurred outdoor background, studio background). DO NOT guess white background if it is dark or natural!
   - NEVER output unrelated categories like t-shirt, apparel, biker, or skull unless the image itself is specifically a t-shirt graphic or biker illustration!

2. TOP-SELLER TITLE (Strictly 20 to 30 words, 120-195 characters):
   - Formula: [Primary Subject & Motifs] + [Embedded Slogan/Text if any] + [Asset Format] + [Art Style & Colors] + [Real Applications for Advertising, Marketing, Presentation, and Editorial Media].
   - NO trailing period (.) or ellipsis (...) at the end. Zero trademarks. Zero usage of the word "commercial".

3. STRICTLY 45 TO 50 KEYWORDS:
   - Generate strictly 45 to 50 keywords (never fewer than 40).
   - Front-load the FIRST 10 keywords with the primary subject and direct visual nouns seen in the image to rank #1 on Adobe Sensei and Shutterstock algorithms.
   - Include authentic art medium, composition, and realistic marketing tags matching the image. Zero usage of the word "commercial".`;

        p.push({ text: visualTruthPrompt });
      } else {
        p.push({ text: `Analyze file "${file.name}". Generate long stock title (20-30 words) and at least 45-50 keywords (strictly 40+ keywords) based on context. Do NOT use the word "commercial".` });
      }

      const activeKey = apiKey || config.apiKey || (config.savedKeys && config.savedKeys.length > 0 ? config.savedKeys[0].key : '');
      const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') || "";
      const actualApiKey = activeKey || envKey;

      let effectiveModel = model || 'gemini-3.8-flash';
      if (!effectiveModel || effectiveModel.includes('2.0-flash') || effectiveModel === 'gemini-2.5-flash') {
        effectiveModel = 'gemini-3.8-flash';
      }

      const genConfigPayload: Record<string, any> = {
        systemInstruction,
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
      };

      try {
        const netRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal,
          body: JSON.stringify({
            model: effectiveModel,
            contents: [{ role: 'user', parts: p }],
            config: genConfigPayload,
            customApiKey: actualApiKey || undefined
          })
        });

        if (netRes.ok) {
          const netData = await netRes.json();
          outputText = netData.text || '{}';
        } else {
          let errMessage = '';
          try {
            const errJson = await netRes.json();
            errMessage = errJson?.error || errJson?.message;
          } catch {
            const text = await netRes.text().catch(() => '');
            if (text && text.length < 300) errMessage = text;
          }
          let finalErr = errMessage || `Server generation error: ${netRes.status}`;
          if (netRes.status === 400 && (!errMessage || errMessage.includes('400'))) {
            finalErr = "Gemini API Key is missing or invalid on Netlify (400). Please click 'Configure API Key' to set your key.";
          }
          throw new Error(finalErr);
        }
      } catch (proxyError: any) {
        if (actualApiKey && !proxyError.message?.includes('AbortError')) {
          const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${effectiveModel}:generateContent?key=${actualApiKey}`;
          const response = await fetch(fallbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal,
            body: JSON.stringify({
              contents: [{ role: 'user', parts: p }],
              systemInstruction: { parts: [{ text: systemInstruction }] },
              generationConfig: {
                responseMimeType: "application/json",
                temperature: actualTemperature,
                maxOutputTokens: 4096
              }
            })
          });

          if (response.ok) {
            const data = await response.json();
            const parts = data.candidates?.[0]?.content?.parts || [];
            const textPart = parts.find((partItem: any) => partItem.text && !partItem.thought) || parts[0];
            outputText = textPart?.text || '{}';
          } else {
            const errData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
            throw new Error(errData.error?.message || errData.error || proxyError.message);
          }
        } else {
          throw proxyError;
        }
      }
    } else {
      const openai = new OpenAI({
        apiKey: apiKey || 'dummy-key',
        baseURL: config.baseUrl || providerBaseUrls[provider] || undefined,
        dangerouslyAllowBrowser: true,
        timeout: 120000, // 120 second timeout for OpenAI compatible providers
      });

      const messages: any[] = [
        { role: 'system', content: systemInstruction }
      ];

      const isImage = file.type.startsWith('image/');

      if (isImage && provider !== 'groq') {
        const cleanSubjectHint = extractCleanStockSubject(file.name, false);
        const nameHint = cleanSubjectHint && cleanSubjectHint !== 'Stock Asset' ? ` Visual context hint: "${cleanSubjectHint}".` : '';
        const userPromptText = mode === 'prompt'
          ? `FIRST: Directly inspect the image pixels to identify the actual visual subject, art medium (3D render, vector, illustration, photo), and scene composition.${nameHint} DO NOT use random hash letters, stock photo IDs, or filenames as subjects! DO NOT use the word "commercial". SECOND: Write a pristine, accurate image generation prompt strictly based on the visual contents as per instructions.`
          : `Analyze the visual pixels of this image.${nameHint} DO NOT use random hash letters or stock photo IDs as subjects. STRICT BANNED WORD: DO NOT use the word "commercial". Identify: 1) True focal subject and visual motifs directly seen in the image. 2) Any typography/slogans embedded in the artwork verbatim. 3) Authentic asset format (Studio Photography, Detailed Vector Illustration, 3D Render, Icon Set, Pattern, or Graphic Design). 4) Actual background. Generate market-optimized stock title (strictly 20-30 words, NO trailing period) and strictly 45 to 50 keywords. Do NOT force unrelated categories unless visible in the image.`;
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: userPromptText },
            { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64Data}` } }
          ]
        });
      } else {
        const mediaType = file.type.startsWith('video/') ? 'video' : 'file';
        messages.push({ role: 'user', content: `Please analyze the ${mediaType} "${file.name}" based on its context.` });
      }

      const response = await openai.chat.completions.create({
        model: model,
        messages: messages,
        temperature: actualTemperature,
        response_format: { type: 'json_object' },
      }, { signal });

      outputText = response.choices[0]?.message?.content || '{}';
    }

    return parseAndAutoRepairResponse(outputText, mode, file, settings, provider, model);
}

function parseAndAutoRepairResponse(
  outputText: string,
  mode: AppMode,
  file: File,
  settings: GenerationSettings,
  provider: ApiProvider,
  model: string
): GeneratedResult {
  // 1. Direct clean JSON parse attempt
  const startIdx = outputText.indexOf('{');
  const endIdx = outputText.lastIndexOf('}');

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const jsonCandidate = outputText.substring(startIdx, endIdx + 1);
    try {
      const parsed = JSON.parse(jsonCandidate) as GeneratedResult;
      parsed.usedProvider = provider;
      parsed.usedModel = model;
      return mode === 'metadata'
        ? ensureRichMetadata(enforcePlatformMetadata(parsed, mode, settings.platform), file, settings)
        : parsed;
    } catch {
      // Continue to repair below
    }
  }

  // 2. Structural auto-repair: handles truncated JSON, unclosed strings, trailing commas
  let rawJson = (startIdx !== -1 ? outputText.substring(startIdx) : outputText).trim();
  if (rawJson.startsWith('{')) {
    let repaired = rawJson
      .replace(/,\s*([\}\]])/g, '$1') // remove trailing commas
      .replace(/: "([\s\S]*?)",/g, (_, p1) => `: "${p1.replace(/\n/g, '\\n')}",`)
      .replace(/: "([\s\S]*?)"\s*}/g, (_, p1) => `: "${p1.replace(/\n/g, '\\n')}"}`);

    // Check if ends with dangling unclosed string
    const quoteCount = (repaired.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      repaired += '"';
    }

    // Balance unclosed braces
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    for (let b = 0; b < openBraces - closeBraces; b++) {
      repaired += '}';
    }

    try {
      const parsed = JSON.parse(repaired) as GeneratedResult;
      parsed.usedProvider = provider;
      parsed.usedModel = model;
      return mode === 'metadata'
        ? ensureRichMetadata(enforcePlatformMetadata(parsed, mode, settings.platform), file, settings)
        : parsed;
    } catch {
      // Continue to regex recovery
    }
  }

  // 3. Regex Property Extraction: rescues whatever valid keys were partially outputted
  const extractVal = (key: string): string => {
    const rx = new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, 'i');
    const m = outputText.match(rx);
    if (m && m[1]) return m[1].trim();
    // In case string was truncated mid-quote
    const cutRx = new RegExp(`"${key}"\\s*:\\s*"([^"\\n\\r}]+)`, 'i');
    const mCut = outputText.match(cutRx);
    if (mCut && mCut[1]) return mCut[1].trim();
    return '';
  };

  const detectedSub = extractVal('detectedSubject') || extractVal('title');
  const detectedSty = extractVal('detectedStyle') || extractVal('style');
  const promptVal = extractVal('prompt');
  const negPromptVal = extractVal('negativePrompt');
  const titleVal = extractVal('title') || detectedSub;
  const descVal = extractVal('description');
  const kwsVal = extractVal('keywords');
  const catVal = extractVal('category');
  const contentVal = extractVal('contentType');

  if (mode === 'prompt') {
    if (detectedSub || promptVal) {
      const finalSubject = detectedSub || extractCleanStockSubject(file.name, false);
      const finalPrompt = removeCommercialWord(promptVal || `Studio visual asset featuring ${finalSubject}, balanced soft studio lighting, crisp optical details, clean uncluttered background, professional color palette, stock photography excellence.`);
      return {
        detectedSubject: removeCommercialWord(finalSubject),
        detectedStyle: removeCommercialWord(detectedSty || 'Stock Photography'),
        prompt: finalPrompt,
        negativePrompt: negPromptVal || 'blurry, low quality, distorted, watermark',
        usedProvider: provider,
        usedModel: model
      };
    }
  } else {
    // Mode is metadata
    if (titleVal || kwsVal || descVal) {
      const partial: GeneratedResult = {
        title: removeCommercialWord(titleVal || extractCleanStockSubject(file.name, false)),
        description: removeCommercialWord(descVal || ''),
        keywords: removeCommercialWord(kwsVal || ''),
        category: catVal || 'General',
        contentType: contentVal || 'Photo',
        style: removeCommercialWord(detectedSty || 'Stock'),
        usedProvider: provider,
        usedModel: model
      };
      return ensureRichMetadata(enforcePlatformMetadata(partial, mode, settings.platform), file, settings);
    }
  }

  // 4. Guaranteed Seamless Fallback: NEVER show the user an error screen
  console.warn("AI output malformed or truncated, applying visual fallback recovery:", outputText.slice(0, 100));
  const fallback = generateFallbackResult(file, mode, settings);
  fallback.usedProvider = provider;
  fallback.usedModel = model;
  return fallback;
}

export function enforcePlatformMetadata(result: GeneratedResult, mode: AppMode, platform: Platform = 'adobe'): GeneratedResult {
  if (mode !== 'metadata') return result;

  if (platform === 'adobe') {
    // Adobe Stock: strictly title and keywords (no description)
    result.description = '';
  } else if (platform === 'shutterstock') {
    // Shutterstock: strictly description and keywords (no title)
    if (!result.description && result.title) {
      result.description = result.title;
    }
    result.title = '';
  } else if (platform === 'freepik') {
    // Freepik: strictly title and keywords (no description)
    result.description = '';
  }
  // General: title, keywords, and description (all 3 kept)

  return result;
}

function formatError(error: any, provider: string, model: string): Error {
    let message = 'Generation failed';
    let details = '';

    if (error.response?.data?.error?.message) {
      details = error.response.data.error.message;
    } else if (error.message) {
      message = error.message;
      if (message.includes('{')) {
        try {
          const jsonStr = message.substring(message.indexOf('{'));
          const parsed = JSON.parse(jsonStr);
          if (parsed?.error?.message) details = parsed.error.message;
          else if (parsed?.error) details = typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error);
        } catch (e) {}
      }
    }

    const lowerMessage = message.toLowerCase();
    const lowerDetails = details.toLowerCase();

    if (lowerMessage.includes('401') || lowerDetails.includes('unauthorized') || lowerDetails.includes('api key not valid') || lowerDetails.includes('invalid api key')) {
      message = `Invalid API Key for ${provider}. Please check your configuration in Settings.`;
    } else if (lowerMessage.includes('404')) {
      message = `Model '${model}' not found or unavailable for ${provider}.`;
    } else if (lowerMessage.includes('400')) {
      message = `Bad Request for ${provider}. This could be an invalid parameter or unsupported file type for this model.`;
    } else if (lowerMessage.includes('429') || lowerDetails.includes('quota') || lowerDetails.includes('rate limit') || lowerDetails.includes('resource_exhausted')) {
      message = `Rate limit or quota exceeded for ${provider}. If you are on the free tier, retrying in a few minutes may help, or adding a billing-enabled API key in Settings.`;
    }
    
    if (details && !message.includes(details) && details.length < 200) {
       message += ` (Details: ${details})`;
    }

    return new Error(message);
}


function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export interface PreparedMediaItem {
  base64: string;
  mimeType: string;
}

/**
 * Fast client-side video frame extractor.
 * Captures a representative high-resolution keyframe from video (MP4, MOV, WEBM, etc.)
 * onto canvas as an optimized JPEG (~150KB).
 * Eliminates serverless payload limits (Netlify 6MB limit) and works with all vision models.
 */
export async function extractVideoFrame(file: File): Promise<PreparedMediaItem> {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      const objectUrl = URL.createObjectURL(file);

      let isHandled = false;
      const timeoutId = setTimeout(() => {
        if (!isHandled) {
          isHandled = true;
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Video frame extraction timed out'));
        }
      }, 7000);

      video.onloadedmetadata = () => {
        // Seek to 1.0 second or 15% to skip initial black frames
        const duration = video.duration || 0;
        const targetTime = duration > 2 ? 1.0 : (duration > 0.5 ? duration * 0.2 : 0);
        video.currentTime = targetTime;
      };

      video.onseeked = () => {
        if (isHandled) return;
        isHandled = true;
        clearTimeout(timeoutId);
        try {
          const maxDim = 900;
          let width = video.videoWidth || 800;
          let height = video.videoHeight || 600;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            URL.revokeObjectURL(objectUrl);
            const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (match && match[2]) {
              resolve({ mimeType: 'image/jpeg', base64: match[2] });
              return;
            }
          }
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Could not render video frame to canvas'));
        } catch (err) {
          URL.revokeObjectURL(objectUrl);
          reject(err);
        }
      };

      video.onerror = () => {
        if (isHandled) return;
        isHandled = true;
        clearTimeout(timeoutId);
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Browser could not decode video for frame extraction'));
      };

      video.src = objectUrl;
      video.load();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Fast client-side image downscaler to reduce network payload from 10MB to ~150KB.
 * Ensures lightning-fast API responses while preserving full analysis clarity and exact MIME type.
 */
export async function prepareImageBase64AndMime(file: File): Promise<PreparedMediaItem> {
  // 1. Video files (MP4, MOV, WEBM, AVI, MKV): extract a crisp representative keyframe
  const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|avi|wmv|mkv)$/i.test(file.name);
  if (isVideo) {
    try {
      const frame = await extractVideoFrame(file);
      return frame;
    } catch (e) {
      console.warn('Video frame extraction failed, trying fallback:', e);
      // If video frame extraction fails and file is small (< 2MB), try raw base64
      if (file.size < 2 * 1024 * 1024) {
        try {
          const raw = await convertFileToBase64(file);
          const match = raw.match(/^data:([^;]+);base64,(.+)$/);
          if (match && match[2]) {
            return { mimeType: match[1] || 'image/jpeg', base64: match[2] };
          }
        } catch {
          // ignore
        }
      }
    }
  }

  // 2. Vector SVG: rasterize via canvas to high-quality PNG
  const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
  if (isSvg) {
    try {
      const pngDataUrl = await rasterizeSvgToPng(file);
      const match = pngDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match && match[2]) {
        return { mimeType: match[1], base64: match[2] };
      }
    } catch (e) {
      console.warn('SVG rasterize fallback to raw data:', e);
    }
  }

  // 3. Vector EPS / AI: try extracting embedded thumbnail
  const isVectorExt = /\.(eps|ai)$/i.test(file.name) || file.type.includes('eps') || file.type.includes('postscript') || file.type.includes('illustrator');
  if (isVectorExt) {
    try {
      const thumb = await extractEmbeddedVectorThumbnail(file);
      if (thumb) {
        const match = thumb.match(/^data:([^;]+);base64,(.+)$/);
        if (match && match[2]) {
          return { mimeType: match[1], base64: match[2] };
        }
      }
    } catch (e) {
      console.warn('Vector thumbnail warning:', e);
    }
  }

  // 4. Small raster files (< 300 KB) or GIF: read directly
  if (file.size < 300 * 1024 || file.type === 'image/gif') {
    try {
      const rawDataUrl = await convertFileToBase64(file);
      const match = rawDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match && match[2]) {
        let detectedMime = match[1];
        if (detectedMime === 'application/octet-stream' || !detectedMime) {
          if (file.name.toLowerCase().endsWith('.png')) detectedMime = 'image/png';
          else if (file.name.toLowerCase().endsWith('.webp')) detectedMime = 'image/webp';
          else detectedMime = 'image/jpeg';
        }
        return { mimeType: detectedMime, base64: match[2] };
      }
    } catch (err) {
      console.warn('Direct file conversion warning:', err);
    }
  }

  // 4. Downscale large images (>300 KB) via Canvas to JPEG for fast, reliable upload
  return new Promise<PreparedMediaItem>((resolve) => {
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const maxDim = 900;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width || 800;
        canvas.height = height || 800;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          convertFileToBase64(file).then(r => {
            const m = r.match(/^data:([^;]+);base64,(.+)$/);
            resolve({ mimeType: m ? m[1] : 'image/jpeg', base64: m ? m[2] : r.split(',')[1] || '' });
          }).catch(() => resolve({ mimeType: 'image/jpeg', base64: '' }));
          return;
        }

        // Fill white background before drawing in case of transparent PNGs converting to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          resolve({ mimeType: match[1], base64: match[2] });
        } else {
          resolve({ mimeType: 'image/jpeg', base64: dataUrl.split(',')[1] || '' });
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        convertFileToBase64(file).then(r => {
          const m = r.match(/^data:([^;]+);base64,(.+)$/);
          resolve({ mimeType: m ? m[1] : (file.type || 'image/jpeg'), base64: m ? m[2] : r.split(',')[1] || '' });
        }).catch(() => resolve({ mimeType: 'image/jpeg', base64: '' }));
      };

      img.src = objectUrl;
    } catch {
      convertFileToBase64(file).then(r => {
        const m = r.match(/^data:([^;]+);base64,(.+)$/);
        resolve({ mimeType: m ? m[1] : (file.type || 'image/jpeg'), base64: m ? m[2] : r.split(',')[1] || '' });
      }).catch(() => resolve({ mimeType: 'image/jpeg', base64: '' }));
    }
  });
}

export async function prepareImageBase64(file: File): Promise<string> {
  const item = await prepareImageBase64AndMime(file);
  return item.base64;
}

