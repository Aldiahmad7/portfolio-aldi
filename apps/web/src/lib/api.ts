import type { CommentInput, ContactInput } from '@cursor-crew/shared'
import { postJson, request } from './api-client'

/** Every endpoint the web app calls (docs/backend-api.md §3). */
export const api = {
  builds: () => request('/api/builds', (shared) => shared.buildsCountSchema),
  countBuild: () =>
    request('/api/builds', (shared) => shared.buildsCountSchema, { method: 'POST' }),
  comments: (cursor: string | null) => {
    const query = cursor ? `?${new URLSearchParams({ cursor })}` : ''
    return request(`/api/comments${query}`, (shared) => shared.commentsPageSchema)
  },
  postComment: (input: CommentInput) =>
    request('/api/comments', (shared) => shared.commentCreatedSchema, postJson(input)),
  sendContact: (input: ContactInput) =>
    request('/api/contact', (shared) => shared.contactSentSchema, postJson(input)),
}
