export interface SiteTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  [key: string]: unknown;
}

export interface Site {
  id: string;
  name: string;
  slug: string;
  domain: string;
  theme?: SiteTheme;
  logoFile?: string | null;
  logoUrl?: string;
  public_read: boolean;
  created?: string;
  updated?: string;
}

export interface Page {
  id: string;
  site: string;
  path: string;
  title: string;
  content: string;
  content_format: 'md' | 'html';
  published: boolean;
  created?: string;
  updated?: string;
}

export type FormValues<T extends string = string> = Record<T, string>;

export type FormErrors<T extends string = string> = Partial<Record<T, string>>;

export interface FormState<T extends string = string> {
  values: FormValues<T>;
  errors: FormErrors<T>;
}
