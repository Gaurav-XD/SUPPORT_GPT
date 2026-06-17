'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { SectionHeading } from '@/components/section-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const initialMessages = [
  { role: 'user', content: 'How do I update my billing email?' },
  { role: 'assistant', content: 'Open Settings → Billing → Contact email. I cited the billing handbook for you.' },
];

export default function ChatPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');

  return (
    <AppShell title="AI Chat" description="A citation-aware conversational interface for customers and agents.">
      <SectionHeading
        eyebrow="RAG"
        title="Streaming support conversations"
        description="The UI demonstrates a live customer support chat with citations, escalation handling, and thread history."
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Conversation: Billing email update</p>
              <Badge variant="success">Streaming</Badge>
            </div>
            <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'ml-auto max-w-[80%] rounded-2xl bg-cyan-400/15 p-3 text-right' : 'max-w-[80%] rounded-2xl bg-white/5 p-3'}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{message.role}</p>
                  <p className="mt-1 text-sm text-slate-100">{message.content}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about billing, product docs, or workflow..." className="border-white/10 bg-slate-950/60 text-white" />
              <Button
                className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                onClick={() => {
                  if (!input.trim()) return;
                  setMessages((current) => [...current, { role: 'user', content: input.trim() }]);
                  setInput('');
                }}
              >
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 text-white">
          <CardContent className="space-y-4 p-5">
            <p className="font-semibold">Response metadata</p>
            <div className="grid gap-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">Citations attached to every response</div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">Typing indicators and live notifications</div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">Conversation history persisted in PostgreSQL</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
