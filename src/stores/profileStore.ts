import { create } from 'zustand'
import type { ITheme } from '@xterm/xterm'

export interface Profile {
  id: string
  name: string
  themeName: string
  fontFamily: string
  fontSize: number
  workingDir?: string
  command?: string
  category?: string
}

// xterm theme definitions matching TabzChrome theme names (dark mode variants)
// Source: TabzChrome/extension/styles/themes.ts
export const xtermThemes: Record<string, ITheme> = {
  'high-contrast': {
    background: '#0a0a0f',
    foreground: '#e0e0e0',
    cursor: '#00d4ff',
    cursorAccent: '#0a0a0f',
    selectionBackground: 'rgba(0, 212, 255, 0.3)',
    black: '#000000',
    red: '#ff4757',
    green: '#5af78e',
    yellow: '#ffd93d',
    blue: '#57c7ff',
    magenta: '#ff6ac1',
    cyan: '#6bcf7f',
    white: '#e0e0e0',
  },
  dracula: {
    background: '#1a1b26',
    foreground: '#f8f8f2',
    cursor: '#ff79c6',
    cursorAccent: '#1a1b26',
    selectionBackground: 'rgba(255, 121, 198, 0.25)',
    black: '#1a1b26',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#8be9fd',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
  },
  matrix: {
    background: '#000f00',
    foreground: '#5af78e',
    cursor: '#7dff94',
    cursorAccent: '#000f00',
    selectionBackground: 'rgba(90, 247, 142, 0.25)',
    black: '#000f00',
    red: '#ff4757',
    green: '#5af78e',
    yellow: '#c0ff00',
    blue: '#00d4ff',
    magenta: '#ff6ac1',
    cyan: '#7dff94',
    white: '#5af78e',
  },
  amber: {
    background: '#1a1308',
    foreground: '#ffb86c',
    cursor: '#ffcc95',
    cursorAccent: '#1a1308',
    selectionBackground: 'rgba(255, 184, 108, 0.25)',
    black: '#1a1308',
    red: '#ff6b35',
    green: '#a3e635',
    yellow: '#fde047',
    blue: '#60a5fa',
    magenta: '#f472b6',
    cyan: '#22d3ee',
    white: '#ffb86c',
  },
  ocean: {
    background: '#12162a',
    foreground: '#cad3f5',
    cursor: '#91d7e3',
    cursorAccent: '#12162a',
    selectionBackground: 'rgba(145, 215, 227, 0.25)',
    black: '#12162a',
    red: '#ed8796',
    green: '#a6da95',
    yellow: '#eed49f',
    blue: '#8aadf4',
    magenta: '#c6a0f6',
    cyan: '#91d7e3',
    white: '#cad3f5',
  },
  neon: {
    background: '#0a0014',
    foreground: '#00ffff',
    cursor: '#ff00ff',
    cursorAccent: '#0a0014',
    selectionBackground: 'rgba(255, 0, 255, 0.3)',
    black: '#0a0014',
    red: '#ff0055',
    green: '#00ff88',
    yellow: '#ffee00',
    blue: '#00aaff',
    magenta: '#ff00ff',
    cyan: '#00ffff',
    white: '#f0f0ff',
  },
  cyberpunk: {
    background: '#0a0014',
    foreground: '#00ffff',
    cursor: '#ff00ff',
    cursorAccent: '#0a0014',
    selectionBackground: 'rgba(255, 0, 255, 0.3)',
    black: '#000000',
    red: '#ff0055',
    green: '#00ff88',
    yellow: '#ffee00',
    blue: '#00aaff',
    magenta: '#ff00ff',
    cyan: '#00ffff',
    white: '#ffffff',
  },
  holographic: {
    background: '#001a10',
    foreground: '#00ff88',
    cursor: '#00ff88',
    cursorAccent: '#001a10',
    selectionBackground: 'rgba(0, 255, 136, 0.3)',
    black: '#000000',
    red: '#ff6b9d',
    green: '#00ff88',
    yellow: '#88ff00',
    blue: '#00ff44',
    magenta: '#00ff99',
    cyan: '#00ffaa',
    white: '#e0ffe0',
  },
  vaporwave: {
    background: '#1a0033',
    foreground: '#ff71ce',
    cursor: '#01cdfe',
    cursorAccent: '#1a0033',
    selectionBackground: 'rgba(255, 113, 206, 0.3)',
    black: '#000000',
    red: '#ff006e',
    green: '#05ffa1',
    yellow: '#ffff00',
    blue: '#01cdfe',
    magenta: '#ff71ce',
    cyan: '#01cdfe',
    white: '#fffb96',
  },
  synthwave: {
    background: '#190a14',
    foreground: '#f92aad',
    cursor: '#fdca40',
    cursorAccent: '#190a14',
    selectionBackground: 'rgba(249, 42, 173, 0.3)',
    black: '#242038',
    red: '#f92aad',
    green: '#3cff00',
    yellow: '#fdca40',
    blue: '#2892d7',
    magenta: '#a736d9',
    cyan: '#16b2d5',
    white: '#f7f7f7',
  },
  aurora: {
    background: '#001420',
    foreground: '#e0f7fa',
    cursor: '#80deea',
    cursorAccent: '#001420',
    selectionBackground: 'rgba(128, 222, 234, 0.3)',
    black: '#000000',
    red: '#ff5252',
    green: '#69f0ae',
    yellow: '#ffd740',
    blue: '#448aff',
    magenta: '#e040fb',
    cyan: '#18ffff',
    white: '#e0f7fa',
  },
}

// Get theme for a profile, with fallback
export function getThemeForProfile(profile: Profile | null): ITheme {
  if (!profile) return xtermThemes['high-contrast']
  return xtermThemes[profile.themeName] ?? xtermThemes['high-contrast']
}

interface ProfileState {
  profiles: Profile[]
  selectedProfileId: string | null
  isLoading: boolean
  error: string | null

  fetchProfiles: () => Promise<void>
  setSelectedProfile: (id: string | null) => void
  getSelectedProfile: () => Profile | null
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  selectedProfileId: null,
  isLoading: false,
  error: null,

  fetchProfiles: async () => {
    set({ isLoading: true, error: null })
    try {
      // Get auth token
      const tokenRes = await fetch('http://localhost:8129/api/auth-token')
      if (!tokenRes.ok) {
        throw new Error('Failed to get auth token')
      }
      const { token } = await tokenRes.json()

      // Fetch profiles
      const res = await fetch('http://localhost:8129/api/browser/profiles', {
        headers: { 'X-Auth-Token': token },
      })
      if (!res.ok) {
        throw new Error('Failed to fetch profiles')
      }
      const data = await res.json()

      // Extract relevant profile fields
      const profiles: Profile[] = data.profiles.map((p: Record<string, unknown>) => ({
        id: p.id,
        name: p.name,
        themeName: p.themeName || 'high-contrast',
        fontFamily: p.fontFamily || 'monospace',
        fontSize: p.fontSize || 16,
        workingDir: p.workingDir,
        command: p.command,
        category: p.category,
      }))

      set({ profiles, isLoading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Unknown error',
        isLoading: false
      })
    }
  },

  setSelectedProfile: (id) => set({ selectedProfileId: id }),

  getSelectedProfile: () => {
    const { profiles, selectedProfileId } = get()
    return profiles.find(p => p.id === selectedProfileId) ?? null
  },
}))
