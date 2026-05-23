import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

async function fetchNewsForMatch(
  home: string,
  away: string
): Promise<string[]> {
  const query = encodeURIComponent(`${home} ${away} World Cup 2026`)
  const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`

  const res = await fetch(url)
  const data = await res.json()

  if (!data.articles || data.articles.length === 0) return []

  return data.articles
    .filter((a: any) => a.title && a.description)
    .slice(0, 8)
    .map((a: any) => `${a.title}. ${a.description}`)
}

async function generateSentiment(
  home: string,
  away: string,
  articles: string[]
): Promise<string> {
  if (articles.length === 0) {
    return `No major news coverage yet for ${home} vs ${away}.`
  }

  const articleText = articles.join('\n\n')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: `Based on these news headlines, write a 2-sentence pre-match buzz summary specifically about the upcoming ${home} vs ${away} World Cup 2026 match. Focus only on these two teams. If the headlines aren't specifically about this match, write a general preview based on what you know about both teams' World Cup 2026 preparation.
Headlines:
${articleText}

Write only the 2-sentence summary, nothing else.`
      }
    ]
  })

  return (message.content[0] as any).text
}

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch upcoming fixtures for next 3 days
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/matches`)
    const data = await res.json()
    const fixtures = data.fixtures || []

    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const upcoming = fixtures.filter((m: any) => {
      const matchDate = new Date(m.fixture.date)
      return (
        m.fixture.status.short === 'NS' &&
        matchDate >= now &&
        matchDate <= threeDaysFromNow
      )
    })

    console.log(`Processing ${upcoming.length} upcoming matches`)

    const results = []

    for (const match of upcoming) {
      const fixtureId = match.fixture.id
      const home = match.teams.home.name
      const away = match.teams.away.name

      // Skip if already generated
      const { data: existing } = await supabase
        .from('match_sentiment')
        .select('id')
        .eq('fixture_id', fixtureId)
        .single()

      if (existing) {
        console.log(`Skipping ${home} vs ${away} — already generated`)
        continue
      }

      // Fetch news and generate sentiment
      const articles = await fetchNewsForMatch(home, away)
      const sentiment = await generateSentiment(home, away, articles)

      // Store in Supabase
      const { error } = await supabase.from('match_sentiment').insert({
        fixture_id: fixtureId,
        home_team: home,
        away_team: away,
        sentiment_text: sentiment
      })

      if (error) {
        console.error(`Error storing sentiment for ${home} vs ${away}:`, error)
      } else {
        console.log(`Generated sentiment for ${home} vs ${away}`)
        results.push({ home, away, sentiment })
      }

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500))
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
