import crypto from 'node:crypto';
import { openai } from '../config/openai';
import { env } from '../config/env';

function pseudoEmbedding(text: string) {
  const bytes = crypto.createHash('sha256').update(text).digest();
  const vector: number[] = [];
  for (let index = 0; index < 32; index += 1) {
    vector.push((bytes[index] ?? 0) / 255);
  }
  return vector;
}

export async function generateEmbedding(text: string) {
  if (!openai || !env.ENABLE_VECTOR_SEARCH) {
    return pseudoEmbedding(text);
  }

  const response = await openai.embeddings.create({
    model: env.OPENAI_EMBEDDING_MODEL,
    input: text.slice(0, 8000),
  });

  return response.data[0]?.embedding ?? pseudoEmbedding(text);
}

export async function generateAssistantReply(options: {
  systemPrompt: string;
  userMessage: string;
  context: string;
  citations: Array<{ title: string; excerpt: string; score: number }>;
}) {
  if (!openai || !env.ENABLE_AI_FEATURES) {
    const citationSummary = options.citations.length
      ? `\n\nSources: ${options.citations.map((citation) => citation.title).join(', ')}`
      : '';
    return `Thanks for the question. ${options.context ? `I used the knowledge base context to answer. ` : ''}${options.userMessage}${citationSummary}`;
  }

  const completion = await openai.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.2,
    messages: [
      { role: 'system', content: options.systemPrompt },
      {
        role: 'system',
        content: `Knowledge base context:\n${options.context || 'No relevant documents were found.'}`,
      },
      {
        role: 'user',
        content: options.userMessage,
      },
    ],
  });

  return completion.choices[0]?.message?.content || 'I could not generate a response.';
}
