import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'

const publicApi = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '' })

interface RSVPInfo {
  name: string
  rsvp_status: string
  event_title: string
  event_date: string | null
}

export default function RSVPPage() {
  const { token } = useParams<{ token: string }>()
  const [submitted, setSubmitted] = useState(false)
  const [choice, setChoice] = useState<'confirmed' | 'declined' | 'maybe' | null>(null)

  const { data, isLoading, isError } = useQuery<RSVPInfo>({
    queryKey: ['rsvp', token],
    queryFn: () => publicApi.get(`/public/rsvp/${token}`).then((r) => r.data),
  })

  const submit = useMutation({
    mutationFn: (status: 'confirmed' | 'declined' | 'maybe') =>
      publicApi.post(`/public/rsvp/${token}`, { status }),
    onSuccess: (_, status) => {
      setChoice(status)
      setSubmitted(true)
    },
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
          <p className="text-gray-600 font-medium">This RSVP link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    const thankYou = {
      confirmed: { emoji: '🎉', title: "We'll see you there!", body: `Thanks ${data.name}! Your attendance at ${data.event_title} has been confirmed.` },
      declined:  { emoji: '💌', title: 'We understand, thanks!', body: `Thanks for letting us know, ${data.name}. You'll be missed!` },
      maybe:     { emoji: '🤔', title: "No worries, we'll keep you posted!", body: `Thanks ${data.name}! We hope you'll be able to make it to ${data.event_title}.` },
    }[choice!]
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-sm w-full mx-4 text-center">
          <div className="text-5xl mb-4">{thankYou.emoji}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{thankYou.title}</h1>
          <p className="text-gray-500">{thankYou.body}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-sm text-burgundy-700 font-medium uppercase tracking-widest mb-2">
            You're invited
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{data.event_title}</h1>
          {data.event_date && (
            <p className="text-gray-400 text-sm mb-6">
              {new Date(data.event_date).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}

          <div className="border-t border-gray-100 pt-6">
            <p className="text-gray-600 mb-1 text-sm">Hi <span className="font-semibold text-gray-900">{data.name}</span>,</p>
            <p className="text-gray-500 text-sm mb-6">Will you be joining us?</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => submit.mutate('confirmed')}
                disabled={submit.isPending}
                className="w-full bg-burgundy-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-burgundy-800 transition-colors disabled:opacity-50"
              >
                ✓ Yes, I'll be there!
              </button>
              <button
                onClick={() => submit.mutate('maybe')}
                disabled={submit.isPending}
                className="w-full bg-orange-50 text-orange-600 border border-orange-200 py-3 rounded-xl font-semibold text-sm hover:bg-orange-100 transition-colors disabled:opacity-50"
              >
                🤔 Not sure yet
              </button>
              <button
                onClick={() => submit.mutate('declined')}
                disabled={submit.isPending}
                className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                ✕ Sorry, I can't make it
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
