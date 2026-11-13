// Shared types for the extraction pipeline.

export type Weighted<T = string> = { value: T; weight: number };

/** Raw data collected inside the rendered page (see collector.ts). */
export type RawStyles = {
  meta: {
    url: string;
    title: string;
    description: string;
    themeColor: string;
    favicon: string;
    ogImage: string;
    lang: string;
    viewport: { width: number; height: number; scrollHeight: number };
  };
  colors: { value: string; text: number; bg: number; border: number }[];
  gradients: Weighted[];
  fonts: { family: string; stack: string; size: number; weight: number; lineHeight: number | null; letterSpacing: number; transform: string; tags: string[]; chars: number; sample: string }[];
  loadedFonts: string[];
  radii: Weighted<number>[];
  shadows: Weighted[];
  spacing: Weighted<number>[];
  containerWidths: Weighted<number>[];
  layout: { flex: number; grid: number; sticky: number; elements: number };
  cssVars: { name: string; value: string }[];
  components: {
    buttons: ComponentSample[];
    inputs: ComponentSample[];
    links: ComponentSample[];
    cards: ComponentSample[];
    nav: ComponentSample | null;
    headings: (ComponentSample & { tag: string })[];
    badges: ComponentSample[];
  };
  bodyBg: string;
  bodyColor: string;
};

export type ComponentSample = {
  text: string;
  bg: string;
  color: string;
  borderColor: string;
  borderWidth: number;
  radius: number;
  paddingX: number;
  paddingY: number;
  height: number;
  width: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  shadow: string;
  textTransform: string;
  letterSpacing: number;
};

export type TypographyToken = {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: number | string;
  letterSpacing?: string;
  textTransform?: string;
};

export type DesignTokens = {
  name: string;
  description: string;
  colors: Record<string, string>;
  typography: Record<string, TypographyToken>;
  rounded: Record<string, string>;
  spacing: Record<string, string>;
  shadows: Record<string, string>;
  components: Record<string, Record<string, string>>;
  fonts: { family: string; role: string; stack: string }[];
  gradients: string[];
  cssVars: { name: string; value: string }[];
  layout: { maxWidth: string | null; baseUnit: number; usesGrid: boolean; usesFlex: boolean; stickyHeader: boolean };
};

export type Prose = {
  name?: string;
  description?: string;
  overview: string;
  colors: string;
  colorNotes?: Record<string, string>;
  typography: string;
  layout: string;
  elevation: string;
  shapes: string;
  components: string;
  dos: string[];
  donts: string[];
};

export type ExtractionResult = {
  id: string;
  source: { type: "url" | "image"; url?: string; title?: string; favicon?: string };
  tokens: DesignTokens;
  prose: Prose;
  designMd: string;
  screenshot?: string; // data URL (jpeg)
  createdAt: number;
  aiUsed: boolean;
};
