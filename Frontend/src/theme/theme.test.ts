import { describe, expect, it } from 'vitest';
import { getTheme } from './theme';

describe('getTheme', () => {
  it('uses Vazirmatn for Farsi', () => {
    const theme = getTheme('rtl', 'fa', 'light');
    expect(theme.direction).toBe('rtl');
    expect(theme.typography.fontFamily).toContain('Vazirmatn');
  });

  it('uses Source fonts for English light and dark', () => {
    const light = getTheme('ltr', 'en', 'light');
    const dark = getTheme('ltr', 'en', 'dark');
    expect(light.palette.mode).toBe('light');
    expect(dark.palette.mode).toBe('dark');
    expect(light.typography.h1?.fontFamily).toContain('Source Serif');
    expect(dark.palette.primary.main).toBe('#2DD4BF');
    expect(light.palette.primary.main).toBe('#0F766E');
  });
});
