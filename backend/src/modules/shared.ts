import type { Agent, Organization, OrganizationMember, User } from '@prisma/client';

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
  };
}

export function publicOrganization(organization: Organization) {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    description: organization.description,
    logoUrl: organization.logoUrl,
    status: organization.status,
    subscriptionTier: organization.subscriptionTier,
    ownerId: organization.ownerId,
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt,
  };
}

export function publicMember(member: OrganizationMember & { user: User }) {
  return {
    id: member.id,
    organizationId: member.organizationId,
    user: publicUser(member.user),
    role: member.role,
    status: member.status,
    joinedAt: member.joinedAt,
  };
}

export function publicAgent(agent: Agent) {
  return {
    id: agent.id,
    organizationId: agent.organizationId,
    knowledgeBaseId: agent.knowledgeBaseId,
    createdById: agent.createdById,
    name: agent.name,
    description: agent.description,
    systemPrompt: agent.systemPrompt,
    model: agent.model,
    temperature: agent.temperature,
    maxTokens: agent.maxTokens,
    status: agent.status,
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
  };
}

export function cosineSimilarity(left: number[], right: number[]) {
  const length = Math.min(left.length, right.length);
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;
    dot += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }
  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

export function chunkText(text: string, chunkSize: number, overlap: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let index = 0; index < words.length; index += chunkSize - overlap) {
    chunks.push(words.slice(index, index + chunkSize).join(' '));
  }
  return chunks.filter(Boolean);
}

export function countTokens(text: string) {
  return Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3));
}
