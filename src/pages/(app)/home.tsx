
import { useAuthProfileReady, useMutations, useQuery } from 'deepspace'
import { useState, type FormEvent } from 'react'

type EventType = 'Training' | 'Class' | 'Assignment' | 'Game'

type AthleteEvent = {
  title: string
  day: string
  start: string
  end: string
  type: EventType
  ownerId: string
}

type ScheduleEvent = AthleteEvent & {
  id: string
}

const days = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday',
  'Friday', 'Saturday', 'Sunday',
]

function findConflicts(events: ScheduleEvent[]) {
  const conflicts: [ScheduleEvent, ScheduleEvent][] = []

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i]
      const b = events[j]

      if (a.day === b.day && a.start < b.end && b.start < a.end) {
        conflicts.push([a, b])
      }
    }
  }

  return conflicts
}

export default function HomePage() {
  const { isSignedIn, user } = useAuthProfileReady({ requireUser: true })

  const { records, status } = useQuery<AthleteEvent>('athlete_events', {
    orderBy: 'createdAt',
    orderDir: 'desc',
  })

  const { createConfirmed, removeConfirmed } =
    useMutations<AthleteEvent>('athlete_events')

  const [title, setTitle] = useState('')
  const [day, setDay] = useState('Monday')
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('10:00')
  const [type, setType] = useState<EventType>('Class')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const events: ScheduleEvent[] = records
    .filter(record => record.data.ownerId === user?.id)
    .map(record => ({
      ...record.data,
      id: record.recordId,
    }))

  const conflicts = findConflicts(events)
  const isLoading = status === 'loading'

  async function addEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!user) {
      setError('Please sign in before adding an event.')
      return
    }

    if (!title.trim() || start >= end) {
      setError('Enter a title and make sure the end time is after the start time.')
      return
    }

    if (saving) return

    setSaving(true)

    try {
      await createConfirmed({
        title: title.trim(),
        day,
        start,
        end,
        type,
        ownerId: user.id,
      })

      setTitle('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save the event. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteEvent(id: string) {
    if (deletingId) return

    setError('')
    setDeletingId(id)

    try {
      await removeConfirmed(id)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not delete the event. Please try again.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  const inputStyle =
    'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white'

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">
              AthleteOS
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Your Performance Dashboard
            </h1>
            <p className="mt-2 text-slate-400">
              Welcome{isSignedIn && user?.name ? `, ${user.name}` : ''}.
              {' '}Manage your academics and athletics in one place.
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
            Weekly Overview
          </span>
        </header>

        {error && (
          <div role="alert" className="rounded-lg border border-red-700 bg-red-950/40 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Scheduled Events', value: events.length },
            {
              label: 'Training Sessions',
              value: events.filter(e => e.type === 'Training').length,
            },
            { label: 'Schedule Conflicts', value: conflicts.length },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
            <h2 className="mb-5 text-xl font-semibold">Weekly Schedule</h2>

            {isLoading ? (
              <p className="text-sm text-slate-400">
                Loading your saved events...
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {days.map(currentDay => (
                  <div
                    key={currentDay}
                    className="rounded-lg bg-slate-950 p-4"
                  >
                    <h3 className="mb-3 font-semibold text-slate-300">
                      {currentDay}
                    </h3>

                    <div className="space-y-2">
                      {events
                        .filter(event => event.day === currentDay)
                        .sort((a, b) => a.start.localeCompare(b.start))
                        .map(event => (
                          <div
                            key={event.id}
                            className="rounded-lg border-l-4 border-emerald-400 bg-slate-800 p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">{event.title}</p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {event.start}–{event.end} · {event.type}
                                </p>
                              </div>
                              <button
                                type="button"
                                disabled={deletingId !== null}
                                onClick={() => void deleteEvent(event.id)}
                                className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                                aria-label={`Delete ${event.title}`}
                              >
                                {deletingId === event.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        ))}

                      {!events.some(event => event.day === currentDay) && (
                        <p className="text-sm text-slate-500">
                          No events scheduled
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-4 text-xl font-semibold">Add Event</h2>

              <form onSubmit={addEvent} className="space-y-3">
                <input
                  className={inputStyle}
                  placeholder="Event title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />

                <select
                  className={inputStyle}
                  value={type}
                  onChange={e => setType(e.target.value as EventType)}
                >
                  {(['Class', 'Training', 'Assignment', 'Game'] as EventType[])
                    .map(t => <option key={t}>{t}</option>)}
                </select>

                <select
                  className={inputStyle}
                  value={day}
                  onChange={e => setDay(e.target.value)}
                >
                  {days.map(d => <option key={d}>{d}</option>)}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-sm text-slate-400">
                    Start
                    <input
                      type="time"
                      className={inputStyle}
                      value={start}
                      onChange={e => setStart(e.target.value)}
                      required
                    />
                  </label>
                  <label className="text-sm text-slate-400">
                    End
                    <input
                      type="time"
                      className={inputStyle}
                      value={end}
                      onChange={e => setEnd(e.target.value)}
                      required
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving || !user}
                  className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : '+ Add Event'}
                </button>
              </form>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-4 text-xl font-semibold">
                Conflict Detection
              </h2>

              {conflicts.length === 0 ? (
                <p className="text-sm text-emerald-400">
                  No scheduling conflicts detected.
                </p>
              ) : (
                <div className="space-y-3">
                  {conflicts.map(([a, b]) => (
                    <div
                      key={`${a.id}-${b.id}`}
                      className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-3"
                    >
                      <p className="text-sm font-semibold text-amber-400">
                        Conflict on {a.day}
                      </p>
                      <p className="mt-1 text-sm">
                        {a.title} overlaps with {b.title}.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>

        <footer className="pb-6 text-center text-xs text-slate-500">
          AthleteOS · Built with DeepSpace
        </footer>
      </div>
    </main>
  )
}
