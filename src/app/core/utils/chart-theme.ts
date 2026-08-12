/** Chart color tokens for light/dark mode, from the validated dataviz palette. */
export interface ChartTheme {
  text: string;
  muted: string;
  grid: string;
  surface: string;
  positive: string;
  negative: string;
  categories: Record<string, string>;
  otherCategory: string;
}

const LIGHT: ChartTheme = {
  text: '#0b0b0b',
  muted: '#898781',
  grid: '#e1e0d9',
  surface: '#fcfcfb',
  positive: '#2a78d6',
  negative: '#e34948',
  categories: {
    'Transferencias enviadas': '#2a78d6',
    'Transferencias recibidas': '#eb6834',
    Rendimientos: '#1baf7a',
    Pagos: '#eda100',
    Cobros: '#e87ba4',
  },
  otherCategory: '#898781',
};

const DARK: ChartTheme = {
  text: '#ffffff',
  muted: '#898781',
  grid: '#2c2c2a',
  surface: '#1a1a19',
  positive: '#3987e5',
  negative: '#e66767',
  categories: {
    'Transferencias enviadas': '#3987e5',
    'Transferencias recibidas': '#d95926',
    Rendimientos: '#199e70',
    Pagos: '#c98500',
    Cobros: '#d55181',
  },
  otherCategory: '#898781',
};

export function getChartTheme(isDark: boolean): ChartTheme {
  return isDark ? DARK : LIGHT;
}

export function categoryColor(theme: ChartTheme, category: string): string {
  return theme.categories[category] ?? theme.otherCategory;
}
