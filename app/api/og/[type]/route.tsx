import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

type OgType = 'repo' | 'commit' | 'issue' | 'pr';

type Source = {
  title: string;
  subtitle: string;
  meta: string;
  accent: string;
  badge: string;
  avatarUrl?: string;
  state?: string;
};

const paletteMap: Record<OgType, { accent: string; glow: string }> = {
  repo: { accent: '#8b5cf6', glow: '#a78bfa' },
  commit: { accent: '#22c55e', glow: '#4ade80' },
  issue: { accent: '#f59e0b', glow: '#fbbf24' },
  pr: { accent: '#38bdf8', glow: '#7dd3fc' },
};

async function fetchGithub<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'og-scale',
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`GitHub request failed: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}

function truncate(value: string, max = 48) {
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function getBadge(type: OgType) {
  return type === 'repo' ? 'REPO' : type === 'commit' ? 'COMMIT' : type === 'issue' ? 'ISSUE' : 'PR';
}

async function resolveSource(type: OgType, searchParams: URLSearchParams): Promise<Source> {
  const owner = searchParams.get('owner') || 'vercel';
  const repo = searchParams.get('repo') || 'next.js';

  if (type === 'repo') {
    const data = await fetchGithub<{
      name: string;
      full_name: string;
      description: string | null;
      stargazers_count: number;
      forks_count: number;
      default_branch: string;
      owner: { avatar_url?: string };
    }>(`https://api.github.com/repos/${owner}/${repo}`);

    return {
      title: data.name,
      subtitle: data.full_name,
      meta: `${data.stargazers_count} stars • ${data.forks_count} forks • ${data.default_branch}`,
      accent: paletteMap.repo.accent,
      badge: getBadge(type),
      avatarUrl: data.owner?.avatar_url || `https://github.com/${owner}.png`,
    };
  }

  if (type === 'commit') {
    const sha = searchParams.get('sha') || 'HEAD';
    const data = await fetchGithub<{
      sha: string;
      commit: { message: string; author?: { date?: string } };
      author?: { avatar_url?: string };
    }>(`https://api.github.com/repos/${owner}/${repo}/commits/${sha}`);

    const message = data.commit?.message || 'Untitled commit';

    return {
      title: truncate(message.split('\n')[0], 46),
      subtitle: `${owner}/${repo}`,
      meta: `sha ${data.sha.slice(0, 7)} • ${data.commit?.author?.date ? new Date(data.commit.author.date).toISOString().slice(0, 10) : 'recent'}`,
      accent: paletteMap.commit.accent,
      badge: getBadge(type),
      avatarUrl: data.author?.avatar_url || `https://github.com/${owner}.png`,
    };
  }

  if (type === 'issue') {
    const number = searchParams.get('number') || '1';
    const data = await fetchGithub<{
      title: string;
      user?: { login?: string; avatar_url?: string };
      state: string;
      number: number;
    }>(`https://api.github.com/repos/${owner}/${repo}/issues/${number}`);

    return {
      title: truncate(data.title || 'Untitled issue', 48),
      subtitle: `${owner}/${repo}`,
      meta: `${data.user?.login || 'unknown'} • ${data.state}`,
      accent: paletteMap.issue.accent,
      badge: getBadge(type),
      state: data.state,
      avatarUrl: data.user?.avatar_url || `https://github.com/${owner}.png`,
    };
  }

  const number = searchParams.get('number') || '1';
  const data = await fetchGithub<{
    title: string;
    user?: { login?: string; avatar_url?: string };
    state: string;
    draft?: boolean;
  }>(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`);

  return {
    title: truncate(data.title || 'Untitled pull request', 48),
    subtitle: `${owner}/${repo}`,
    meta: `${data.user?.login || 'unknown'} • ${data.state}${data.draft ? ' • draft' : ''}`,
    accent: paletteMap.pr.accent,
    badge: getBadge(type),
    state: data.state,
    avatarUrl: data.user?.avatar_url || `https://github.com/${owner}.png`,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { type?: string } }
) {
  const type = (params.type || 'repo') as OgType;
  const { searchParams } = new URL(request.url);

  try {
    const source = await resolveSource(type, searchParams);
    const accent = source.accent;

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            background: 'linear-gradient(135deg, #0b1120 0%, #111827 100%)',
            color: '#f8fafc',
            fontFamily: 'Segoe UI, Helvetica Neue, Arial, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at top left, ${accent}33 0%, transparent 35%)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 280,
              height: 280,
              borderRadius: 200,
              background: `${accent}22`,
              filter: 'blur(45px)',
              top: -30,
              right: 8,
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              padding: 52,
              justifyContent: 'space-between',
              zIndex: 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#ffffff',
                  }}
                >
                  O
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>OG Scale</div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 999,
                  padding: '8px 14px',
                  background: `${accent}22`,
                  color: '#f8fafc',
                  border: `1px solid ${accent}55`,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                }}
              >
                {source.badge}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                marginTop: 18,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 18,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.12)',
                  width: 96,
                  height: 96,
                  background: '#ffffff',
                }}
              >
                {source.avatarUrl ? (
                  <img
                    src={source.avatarUrl}
                    style={{ width: 96, height: 96, objectFit: 'cover' }}
                    alt="avatar"
                  />
                ) : (
                  <div style={{ width: 96, height: 96, background: '#dfe7ff' }} />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                <div
                  style={{
                    fontSize: 15,
                    color: '#cbd5e1',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {source.subtitle}
                </div>
                <div
                  style={{
                    fontSize: 42,
                    lineHeight: 1.08,
                    fontWeight: 800,
                    letterSpacing: -1.8,
                    maxWidth: 760,
                  }}
                >
                  {source.title}
                </div>
                <div style={{ fontSize: 20, color: '#dfe6f6', fontWeight: 500 }}>{source.meta}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'rgba(15, 23, 42, 0.42)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: 12,
                  padding: '12px 16px',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: 999, background: accent }} />
                <div style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>
                  {source.state || 'active'}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  borderRadius: 12,
                  background: 'rgba(148, 163, 184, 0.1)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  padding: '12px 16px',
                  color: '#dbeafe',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                github.com/{source.subtitle}
              </div>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #0f172a 0%, #111827 100%)',
            color: '#f8fafc',
            fontFamily: 'Segoe UI, Helvetica Neue, Arial, sans-serif',
            padding: 40,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 900 }}>
            <div style={{ fontSize: 22, color: '#fbbf24', marginBottom: 12 }}>OG Scale</div>
            <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -2 }}>GitHub data unavailable</div>
            <div style={{ fontSize: 24, color: '#cbd5e1', marginTop: 10 }}>{message}</div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}