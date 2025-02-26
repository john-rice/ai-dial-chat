import { MessageFormSchema, MessageFormValue } from './message-form-schema';

export enum Role {
  Assistant = 'assistant',
  User = 'user',
  System = 'system',
}

export type ImageMIMEType = 'image/jpeg' | 'image/png' | string;

export type MIMEType =
  | 'text/markdown'
  | 'text/plain'
  | 'text/html'
  | ImageMIMEType
  | string;

export interface Attachment {
  index?: number;
  type: MIMEType;
  title: string;
  data?: string;
  url?: string;
  reference_type?: MIMEType;
  reference_url?: string;
}

export type StageStatus = 'completed' | 'failed' | null;

export interface Stage {
  index: number;
  name: string;
  content?: string;
  attachments?: Attachment[];
  status: StageStatus;
}

export enum LikeState {
  Disliked = -1,
  Liked = 1,
  NoState = 0,
}

export interface MessageSettings {
  prompt: string;
  temperature: number;

  // Addons selected by user clicks
  selectedAddons: string[];
  assistantModelId?: string;
}

export interface ConversationEntityModel {
  id: string;
}

export interface Message {
  role: Role;
  content: string;
  custom_content?: {
    attachments?: Attachment[];
    stages?: Stage[];
    state?: object;
    // schema support properties
    form_schema?: MessageFormSchema;
    form_value?: MessageFormValue;
    configuration_schema?: MessageFormSchema;
    configuration_value?: MessageFormValue;
  };
  like?: LikeState;
  errorMessage?: string;
  model?: ConversationEntityModel;
  settings?: MessageSettings;
  responseId?: string;
  templateMapping?: TemplateMapping[] | Record<string, string>;
}

export enum UploadStatus {
  UNINITIALIZED = 'UNINITIALIZED',
  LOADING = 'UPLOADING',
  LOADED = 'LOADED',
  FAILED = 'FAILED',
  ALL_LOADED = 'ALL_LOADED',
}

export interface Entity {
  id: string;
  name: string;
  folderId: string;
  status?: UploadStatus;
}

export enum PublishActions {
  ADD = 'ADD',
  DELETE = 'DELETE',
  ADD_IF_ABSENT = 'ADD_IF_ABSENT',
}

export interface EntityPublicationInfo {
  action?: PublishActions;
  isNotExist?: boolean;
  version?: string;
  versionGroup?: string;
}

export enum SharePermission {
  READ = 'READ',
  WRITE = 'WRITE',
}

export interface ShareInterface {
  isShared?: boolean;
  sharedWithMe?: boolean;

  isPublished?: boolean;
  publishedWithMe?: boolean;
  publicationInfo?: EntityPublicationInfo;

  permissions?: SharePermission[];
}

export interface ShareEntity extends Entity, ShareInterface {}

export interface ConversationInfo extends ShareEntity {
  model: ConversationEntityModel;
  lastActivityDate?: number;
  isPlayback?: boolean;
  isReplay?: boolean;
}

export type TemplateMapping = [string, string];
