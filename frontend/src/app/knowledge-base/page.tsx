import { AppShell } from '@/components/app-shell';
import { SectionHeading } from '@/components/section-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { documents } from '@/lib/data';

export default function KnowledgeBasePage() {
  return (
    <AppShell title="Knowledge Base" description="Upload, parse, chunk, embed, and serve grounded answers with citations.">
      <SectionHeading
        eyebrow="Documents"
        title="Knowledge ingestion pipeline"
        description="The product is ready to accept PDFs, DOCX files, and TXT documents, then fan them into embeddings and semantic retrieval."
      />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardContent className="space-y-4 p-5">
            <p className="font-semibold">Upload document</p>
            <div className="rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-400/10 p-6 text-sm text-slate-300">
              Drag and drop a PDF, DOCX, or TXT file here to queue parsing and embeddings.
            </div>
            <div className="grid gap-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">Chunk size: 300 tokens</div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">Vector storage: pgvector-ready</div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">Async processing: BullMQ</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 text-white">
          <CardContent className="space-y-3 p-5">
            {documents.map((document) => (
              <div key={document.name} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{document.name}</p>
                  <Badge variant={document.status === 'Ready' ? 'success' : 'warning'}>{document.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {document.chunks} chunks generated from {document.source}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
