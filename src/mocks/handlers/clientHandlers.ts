import { http, HttpResponse } from 'msw'
import { mockClients } from '../data/clients'
import { mockHoldings } from '../data/holdings'
import { mockFollowUps } from '../data/followUps'

export const clientHandlers = [
  http.get('/api/clients', ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    const level = url.searchParams.get('level') || ''
    const riskLevel = url.searchParams.get('riskLevel') || ''
    const keyword = url.searchParams.get('keyword') || ''

    let filtered = [...mockClients]

    if (level) {
      filtered = filtered.filter((c) => c.level === level)
    }
    if (riskLevel) {
      filtered = filtered.filter((c) => c.riskLevel === riskLevel)
    }
    if (keyword) {
      const kw = keyword.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(kw) ||
          c.phone.includes(kw) ||
          c.email.toLowerCase().includes(kw)
      )
    }

    const total = filtered.length
    const start = (page - 1) * pageSize
    const data = filtered.slice(start, start + pageSize)

    return HttpResponse.json({ data, total, page, pageSize })
  }),

  http.get('/api/clients/:id', ({ params }) => {
    const client = mockClients.find((c) => c.id === params.id)
    if (!client) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(client)
  }),

  http.get('/api/clients/:id/holdings', ({ params }) => {
    const holdings = mockHoldings.filter((h) => h.clientId === params.id)
    return HttpResponse.json(holdings)
  }),

  http.get('/api/clients/:id/follow-ups', ({ params }) => {
    const followUps = mockFollowUps
      .filter((f) => f.clientId === params.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return HttpResponse.json(followUps)
  }),

  http.post('/api/clients/:id/follow-ups', async ({ params, request }) => {
    const body = (await request.json()) as { type: string; content: string; createdBy: string }
    const client = mockClients.find((c) => c.id === params.id)
    const newFollowUp = {
      id: `followup_${Date.now()}`,
      clientId: params.id as string,
      clientName: client?.name || '',
      type: body.type,
      content: body.content,
      createdAt: new Date().toISOString(),
      createdBy: body.createdBy,
    }
    mockFollowUps.unshift(newFollowUp as any)
    return HttpResponse.json(newFollowUp, { status: 201 })
  }),
]
