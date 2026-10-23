export const PROVIDER_MODELS: Record<string, { id: string, name: string }[]> = {
  google: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Ultra Fast & Recommended)' },
    { id: 'gemini-flash-latest', name: 'Gemini Flash Latest' },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite' },
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' }
  ],
  openrouter: [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'anthropic/claude-3-5-haiku', name: 'Claude 3.5 Haiku' },
    { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite' },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
    { id: 'openai/gpt-4o-2024-11-20', name: 'GPT-4o (Latest)' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3' }
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'o1', name: 'OpenAI o1' },
    { id: 'o1-mini', name: 'OpenAI o1-mini' }
  ],
  mistral: [
    { id: 'mistral-large-latest', name: 'Mistral Large' },
    { id: 'pixtral-large-latest', name: 'Pixtral Large' },
    { id: 'pixtral-12b-2409', name: 'Pixtral 12B' },
    { id: 'mistral-small-latest', name: 'Mistral Small' }
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B' }
  ],
  custom: [
    { id: 'custom-model', name: 'Custom Model ID' }
  ]
};
