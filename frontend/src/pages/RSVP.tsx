import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { publicApi } from '../api/client'
import type { RSVPInfo } from '../api/types'

type RSVPChoice = 'confirmed' | 'declined' | 'maybe'

const THANK_YOU: Record<RSVPChoice, { emoji: string; title: string; body: (eventTitle: string) => string }> = {
  confirmed: {
    emoji: '🎉',
    title: 'תודה! נתראה שם',
    body: (eventTitle) => `אישרתם הגעה ל${eventTitle}. נשמח לראותכם!`,
  },
  declined: {
    emoji: '💌',
    title: 'תודה על העדכון',
    body: () => 'חבל שלא תוכלו להגיע. נשמח לחגוג איתכם בהזדמנות אחרת!',
  },
  maybe: {
    emoji: '🤔',
    title: 'תודה! נעדכן אתכם',
    body: (eventTitle) => `נקווה שתוכלו להגיע ל${eventTitle}. נשמח לשמוע בהקדם.`,
  },
}

/** Public RSVP page reached via a unique token link; lets a guest confirm, decline, or mark maybe without logging in. */
export default function RSVPPage() {
  const { token } = useParams<{ token: string }>()
  const [submittedStatus, setSubmittedStatus] = useState<RSVPChoice | null>(null)

  const { data, isLoading, isError } = useQuery<RSVPInfo>({
    queryKey: ['rsvp', token],
    queryFn: () => publicApi.get(`/public/rsvp/${token}`).then((r) => r.data),
  })

  const submit = useMutation({
    mutationFn: (status: RSVPChoice) =>
      publicApi.post(`/public/rsvp/${token}`, { status }),
    onSuccess: (_, status) => setSubmittedStatus(status),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-2xl mb-2">😕</p>
          <p className="text-gray-600 font-medium">הקישור אינו תקין או שפג תוקפו.</p>
        </div>
      </div>
    )
  }

  if (submittedStatus) {
    const { emoji, title, body } = THANK_YOU[submittedStatus]
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-sm w-full mx-4 text-center" dir="rtl">
          <div className="text-5xl mb-4">{emoji}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-500">{body(data.event_title)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center" dir="rtl">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">הנכם מוזמנים ל{data.event_title}</h1>
          {data.event_date && (
            <p className="text-gray-400 text-sm mb-6">
              {new Date(data.event_date + 'T00:00:00').toLocaleDateString('he-IL', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          )}

          <div className="border-t border-gray-100 pt-6">
            <p className="text-gray-500 text-sm mb-6">האם תוכלו להגיע?</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => submit.mutate('confirmed')}
                disabled={submit.isPending}
                className="w-full bg-burgundy-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-burgundy-800 transition-colors disabled:opacity-50"
              >
                ✓ כן, נשמח להגיע!
              </button>
              <button
                onClick={() => submit.mutate('maybe')}
                disabled={submit.isPending}
                className="w-full bg-orange-50 text-orange-600 border border-orange-200 py-3 rounded-xl font-semibold text-sm hover:bg-orange-100 transition-colors disabled:opacity-50"
              >
                🤔 עדיין לא בטוחים
              </button>
              <button
                onClick={() => submit.mutate('declined')}
                disabled={submit.isPending}
                className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                ✕ לצערנו לא נוכל להגיע
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
