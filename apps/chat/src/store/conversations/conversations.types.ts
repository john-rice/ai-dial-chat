import { PlotParams } from 'react-plotly.js';

import { FolderInterface } from '@/src/types/folder';
import { SearchFilters } from '@/src/types/search';
import { LastConversationSettings } from '@/src/types/settings';

import {
  ConversationInfo,
  CustomVisualizerData,
  UploadStatus,
} from '@epam/ai-dial-shared';

export interface ConversationsState {
  initialized: boolean;
  conversations: ConversationInfo[];
  selectedConversationsIds: string[];
  folders: FolderInterface[];
  temporaryFolders: FolderInterface[];
  searchTerm: string;
  searchFilters: SearchFilters;
  conversationSignal: AbortController;
  isReplayPaused: boolean;
  isReplayRequiresVariables?: boolean;
  isPlaybackPaused: boolean;
  newAddedFolderId?: string;
  conversationsLoaded: boolean;
  areSelectedConversationsLoaded: boolean;
  areConversationsWithContentUploading: boolean;
  conversationsStatus: UploadStatus;
  foldersStatus: UploadStatus;
  loadingFolderIds: string[];
  isNewConversationUpdating: boolean;
  isMessageSending: boolean;
  loadedCharts: { url: string; data: PlotParams }[];
  chartLoading: boolean;
  compareLoading?: boolean;
  loadedCustomAttachmentsData: { url: string; data: CustomVisualizerData }[];
  customAttachmentDataLoading: boolean;
  chosenConversationIds: string[];
  chosenEmptyFoldersIds: string[];
  lastConversationSettings?: LastConversationSettings;
  renamingConversationId?: string | null;
  talkToConversationId?: string | null;
}
