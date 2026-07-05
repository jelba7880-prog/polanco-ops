/**
 * Single source of truth for the theme identifiers, the next-themes → CSS-class
 * mapping, and the quick-toggle memory. Imported by the ThemeProvider config,
 * the toggle hook, and the Settings picker so the "System resolves to Dim"
 * rule and the theme key names live in exactly one place.
 *
 * ── Why "black" for the true-black theme ──────────────────────────────────
 * next-themes hardcodes its system-preference resolution to the strings
 * 'dark' | 'light' (getSystemTheme()), and both `theme:'system'` (OS dark) and
 * an explicit `theme:'dark'` collapse to the same resolved value 'dark'. There
 * is no config to make them differ. Since this app must map OS-dark to the DIM
 * palette while still offering an explicit true-black option, the true-black
 * theme cannot use the reserved key 'dark'. It is keyed 'black' and mapped to
 * the CSS class 'dark' via THEME_CLASS_MAP below. The user-facing label stays
 * "Dark".
 */

export const THEME = {
  light: 'light',
  dim: 'dim',
  /** User-facing "Dark" (true black). Stored as 'black', renders CSS class 'dark'. */
  dark: 'black',
  system: 'system',
} as const

export type ThemeValue = (typeof THEME)[keyof typeof THEME]

/** The concrete (non-system) themes next-themes manages. */
export const THEMES: string[] = [THEME.light, THEME.dim, THEME.dark]

/**
 * next-themes `value` map: theme key (and its system-resolved 'dark'/'light')
 * → the CSS class applied to <html>. The 'dark' entry is what maps an OS
 * dark-scheme preference to the DIM palette; the explicit true-black theme
 * ('black') is what maps to the true-black `.dark` class. This mapping is the
 * ONE place the System→Dim decision is made — honored by next-themes' pre-paint
 * script, so there is no flash.
 */
export const THEME_CLASS_MAP: Record<string, string> = {
  light: 'light',
  dim: 'dim',
  black: 'dark', // explicit true-black
  dark: 'dim', // system-resolved OS-dark → Dim
}

/**
 * resolvedTheme values that count as "a dark-family variant is showing":
 * 'dim'/'black' from explicit choices, and 'dark' when System resolves to
 * OS-dark (rendered as Dim). Used by the quick toggle to decide direction.
 */
export function isDarkFamily(resolvedTheme: string | undefined): boolean {
  return resolvedTheme != null && resolvedTheme !== THEME.light
}

/** localStorage key + default for remembering the user's last dark-family variant. */
export const DARK_VARIANT_STORAGE_KEY = 'dark-variant'
export const DEFAULT_DARK_VARIANT: string = THEME.dim

/** The dark-family variants the quick toggle can land on (never 'system'). */
export function isDarkVariant(value: string | null | undefined): value is 'dim' | 'black' {
  return value === THEME.dim || value === THEME.dark
}
