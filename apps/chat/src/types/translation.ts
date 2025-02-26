export enum Translation {
  Chat = 'chat',
  Common = 'common',
  Markdown = 'markdown',
  PromptBar = 'promptbar',
  Settings = 'settings',
  SideBar = 'sidebar',
  Files = 'files',
  Marketplace = 'marketplace',
  Header = 'header',
}

export type TranslationOptions = Record<string, unknown> & {
  ns?: Translation;
};
