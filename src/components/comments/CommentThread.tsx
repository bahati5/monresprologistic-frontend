import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/api/client'
import { getApiErrorMessage } from '@/lib/apiError'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/authStore'
import { MessageSquare, Send, Lock, Trash2 } from 'lucide-react'

interface CommentThreadProps {
  commentableType: 'assisted_purchase' | 'shipment' | 'refund'
  commentableId: number
}

interface Comment {
  id: number
  user: { id: number; name: string } | null
  body: string
  is_internal: boolean
  created_at: string
}

export default function CommentThread({ commentableType, commentableId }: CommentThreadProps) {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const isClient = user?.roles?.includes('client')
  const [body, setBody] = useState('')
  const [isInternal, setIsInternal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['comments', commentableType, commentableId],
    queryFn: () => api.get('/api/comments', { params: { commentable_type: commentableType, commentable_id: commentableId } }).then(r => r.data),
    enabled: !!commentableId,
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/api/comments', { commentable_type: commentableType, commentable_id: commentableId, body, is_internal: isInternal }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', commentableType, commentableId] })
      setBody('')
      setIsInternal(false)
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Erreur')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/comments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', commentableType, commentableId] }),
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Erreur')),
  })

  const comments: Comment[] = data?.comments ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        Commentaires ({comments.length})
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">Aucun commentaire.</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.map(comment => (
            <div key={comment.id} className={`rounded-lg border p-3 text-sm ${comment.is_internal ? 'border-amber-200 bg-amber-50/50' : ''}`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{comment.user?.name ?? 'Système'}</span>
                  {comment.is_internal && (
                    <span className="flex items-center gap-1 text-xs text-amber-700">
                      <Lock className="h-3 w-3" /> interne
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleString('fr-FR')}
                  </span>
                  {comment.user?.id === user?.id && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deleteMutation.mutate(comment.id)}>
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="whitespace-pre-wrap">{comment.body}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 border-t pt-3">
        <Textarea
          placeholder="Ajouter un commentaire..."
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={2}
          className="text-sm"
        />
        <div className="flex items-center justify-between gap-3">
          {!isClient && (
            <div className="flex items-center gap-2">
              <input
                id="internal"
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="internal" className="text-xs text-muted-foreground cursor-pointer">
                Note interne (invisible au client)
              </Label>
            </div>
          )}
          <Button
            size="sm"
            disabled={!body.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="ml-auto"
          >
            <Send className="h-3 w-3 mr-1" /> Envoyer
          </Button>
        </div>
      </div>
    </div>
  )
}
