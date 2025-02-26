import { PlotParams } from 'react-plotly.js';

import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { combineEntities } from '@/src/utils/app/common';
import {
  addGeneratedFolderId,
  isFolderEmpty,
  renameFolderWithChildren,
} from '@/src/utils/app/folders';
import {
  getConversationRootId,
  isEntityIdExternal,
  isEntityIdLocal,
} from '@/src/utils/app/id';
import { doesEntityContainSearchTerm } from '@/src/utils/app/search';

import { Conversation } from '@/src/types/chat';
import { FolderInterface, FolderType } from '@/src/types/folder';
import { SearchFilters } from '@/src/types/search';
import { LastConversationSettings } from '@/src/types/settings';

import * as ConversationsSelectors from './conversations.selectors';
import { ConversationsState } from './conversations.types';

import {
  ConversationInfo,
  CustomVisualizerData,
  LikeState,
  Message,
  UploadStatus,
} from '@epam/ai-dial-shared';
import uniq from 'lodash-es/uniq';
import xor from 'lodash-es/xor';

export { ConversationsSelectors };

const initialState: ConversationsState = {
  initialized: false,
  conversations: [],
  selectedConversationsIds: [],
  folders: [],
  temporaryFolders: [],
  searchTerm: '',
  searchFilters: SearchFilters.None,
  conversationSignal: new AbortController(),
  isReplayPaused: true,
  isPlaybackPaused: true,
  newAddedFolderId: undefined,
  conversationsLoaded: false,
  areSelectedConversationsLoaded: false,
  areConversationsWithContentUploading: false,
  conversationsStatus: UploadStatus.UNINITIALIZED,
  foldersStatus: UploadStatus.UNINITIALIZED,
  loadingFolderIds: [],
  loadedCharts: [],
  chartLoading: false,
  isNewConversationUpdating: false,
  isMessageSending: false,
  loadedCustomAttachmentsData: [],
  customAttachmentDataLoading: false,
  chosenConversationIds: [],
  chosenEmptyFoldersIds: [],
  renamingConversationId: null,
  talkToConversationId: null,
};

export const conversationsSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    init: (state) => state,
    initShare: (state) => state,
    initFinish: (state) => {
      state.initialized = true;
    },
    initSelectedConversations: (state) => state,
    initFoldersAndConversations: (state) => state,
    initFoldersAndConversationsSuccess: (state) => {
      state.conversationsLoaded = true;
    },
    saveConversation: (state, _action: PayloadAction<Conversation>) => state,
    saveConversationSuccess: (state) => {
      if (state.isMessageSending) {
        state.isMessageSending = false;
      }
      if (state.isNewConversationUpdating) {
        state.isNewConversationUpdating = false;
      }
    },
    saveConversationFail: (state, { payload }: PayloadAction<Conversation>) => {
      state.conversations = state.conversations.map((conv) => {
        if (conv.id === payload.id) {
          return {
            ...conv,
            isMessageStreaming: false,
          };
        }

        return conv;
      });
      state.isNewConversationUpdating = false;
    },
    moveConversation: (
      state,
      action: PayloadAction<{
        newConversation: Conversation;
        oldConversation: Conversation;
      }>,
    ) => {
      if (!action.payload.oldConversation.messages.length) {
        state.isNewConversationUpdating = true;
      }
    },
    moveConversationFail: (
      state,
      {
        payload,
      }: PayloadAction<{
        oldConversation: Conversation;
        newConversation: Conversation;
      }>,
    ) => {
      state.conversations = state.conversations.map((conv) => {
        if (payload.newConversation.id === conv.id) {
          return payload.oldConversation;
        }

        return conv;
      });
      state.selectedConversationsIds = state.selectedConversationsIds.map(
        (id) =>
          id === payload.newConversation.id ? payload.oldConversation.id : id,
      );
    },
    updateConversation: (
      state,
      _action: PayloadAction<{
        id: string;
        values: Partial<Conversation>;
      }>,
    ) => state,
    updateConversationSuccess: (
      state,
      {
        payload,
      }: PayloadAction<{ id: string; conversation: Partial<Conversation> }>,
    ) => {
      state.conversations = state.conversations.map((conv) => {
        if (conv.id === payload.id) {
          return {
            ...conv,
            lastActivityDate: Date.now(),
            ...payload.conversation,
          };
        }

        return conv;
      });

      if (
        payload.id &&
        payload.conversation.id &&
        payload.id !== payload.conversation.id
      ) {
        state.selectedConversationsIds = state.selectedConversationsIds.map(
          (id) => (id === payload.id ? payload.conversation.id! : id),
        );
      }
    },
    selectForCompare: (state, _action: PayloadAction<ConversationInfo>) => {
      state.compareLoading = true;
    },
    selectForCompareCompleted: (
      state,
      { payload }: PayloadAction<Conversation>,
    ) => {
      state.compareLoading = false;
      state.conversations = combineEntities([payload], state.conversations);
    },
    selectConversations: (
      state,
      {
        payload,
      }: PayloadAction<{
        conversationIds: string[];
        suspendHideSidebar?: boolean;
      }>,
    ) => {
      state.selectedConversationsIds = uniq(payload.conversationIds);
      state.areSelectedConversationsLoaded = false;
    },
    unselectConversations: (
      state,
      { payload }: PayloadAction<{ conversationIds: string[] }>,
    ) => {
      state.selectedConversationsIds = state.selectedConversationsIds.filter(
        (id) => !payload.conversationIds.includes(id),
      );
    },
    createNewConversations: (
      state,
      _action: PayloadAction<{
        names: string[];
        folderId?: string | null;
        modelReference?: string;
        suspendHideSidebar?: boolean;
        headerCreateNew?: boolean;
      }>,
    ) => state,
    createNotLocalConversations: (
      state,
      _action: PayloadAction<{ conversations: Conversation[] }>,
    ) => state,
    createNotLocalConversationsSuccess: (
      state,
      _action: PayloadAction<ConversationInfo[]>,
    ) => state,
    deleteConversations: (
      state,
      _action: PayloadAction<{
        conversationIds: string[];
        suppressErrorMessage?: boolean;
      }>,
    ) => state,
    deleteConversationsComplete: (
      state,
      { payload }: PayloadAction<{ conversationIds: Set<string> }>,
    ) => {
      state.conversations = state.conversations.filter(
        (conv) => !payload.conversationIds.has(conv.id),
      );
      state.selectedConversationsIds = state.selectedConversationsIds.filter(
        (id) => !payload.conversationIds.has(id),
      );
      state.conversationsLoaded = true;
    },
    uploadConversationsByIds: (
      state,
      {
        payload,
      }: PayloadAction<{ conversationIds: string[]; showLoader?: boolean }>,
    ) => {
      if (payload.showLoader) {
        state.areSelectedConversationsLoaded = false;
      }
    },
    uploadConversationsByIdsSuccess: (
      state,
      {
        payload,
      }: PayloadAction<{
        setIds: Set<string>;
        conversations: Conversation[];
        showLoader?: boolean;
      }>,
    ) => {
      state.conversations = combineEntities(
        payload.conversations.map((conv) => ({
          ...conv,
          isMessageStreaming: false, // we shouldn't try to continue stream after upload
        })),
        state.conversations,
      );
      if (payload.showLoader) {
        state.areSelectedConversationsLoaded = true;
      }
    },
    createNewReplayConversation: (
      state,
      _action: PayloadAction<ConversationInfo>,
    ) => state,
    saveNewConversation: (
      state,
      _action: PayloadAction<{
        newConversation: Conversation;
        selectedIdToReplaceWithNewOne?: string;
      }>,
    ) => state,
    saveNewConversationSuccess: (
      state,
      {
        payload: { newConversation, selectedIdToReplaceWithNewOne },
      }: PayloadAction<{
        newConversation: Conversation;
        selectedIdToReplaceWithNewOne?: string;
      }>,
    ) => {
      state.selectedConversationsIds =
        selectedIdToReplaceWithNewOne &&
        state.selectedConversationsIds.length > 1
          ? state.selectedConversationsIds.map((id) =>
              id === selectedIdToReplaceWithNewOne ? newConversation.id : id,
            )
          : [newConversation.id];
      state.conversations = combineEntities(state.conversations, [
        newConversation,
      ]);

      state.areSelectedConversationsLoaded = true;
    },
    createNewPlaybackConversation: (
      state,
      _action: PayloadAction<ConversationInfo>,
    ) => state,
    duplicateConversation: (state, _action: PayloadAction<ConversationInfo>) =>
      state,
    importConversationsSuccess: (
      state,
      {
        payload,
      }: PayloadAction<{
        conversations: ConversationInfo[];
        folders: FolderInterface[];
      }>,
    ) => {
      state.conversations = combineEntities(
        payload.conversations,
        state.conversations,
      );
      state.folders = combineEntities(payload.folders, state.folders);
    },
    setConversations: (
      state,
      {
        payload,
      }: PayloadAction<{
        conversations: ConversationInfo[];
      }>,
    ) => {
      state.conversations = payload.conversations;
      state.conversationsLoaded = true;
    },
    addConversations: (
      state,
      {
        payload,
      }: PayloadAction<{
        conversations: ConversationInfo[];
        suspendHideSidebar?: boolean;
      }>,
    ) => {
      const hasNew = payload.conversations.some((conv) =>
        isEntityIdLocal(conv),
      );
      const existedConversation = hasNew
        ? state.conversations.filter((conv) => !isEntityIdLocal(conv))
        : state.conversations;
      state.conversations = combineEntities(
        payload.conversations,
        existedConversation,
      );
    },
    clearConversations: (state) => {
      state.conversationsLoaded = false;
      state.areSelectedConversationsLoaded = false;
    },
    clearConversationsSuccess: (state) => {
      state.conversations = state.conversations.filter(
        (conv) => isEntityIdExternal(conv) || isEntityIdLocal(conv),
      );
      state.folders = state.folders.filter((folder) =>
        isEntityIdExternal(folder),
      );
    },
    createFolder: (
      state,
      { payload }: PayloadAction<{ name?: string; parentId: string }>,
    ) => {
      const newFolder: FolderInterface = addGeneratedFolderId({
        folderId: payload?.parentId,
        name:
          // custom name
          payload?.name ??
          // default name with counter
          ConversationsSelectors.selectNewFolderName(
            { conversations: state },
            payload?.parentId,
          ),
        type: FolderType.Chat,
        status: UploadStatus.LOADED,
      });

      state.folders = state.folders.concat(newFolder);
    },
    createTemporaryFolder: (
      state,
      {
        payload,
      }: PayloadAction<{
        name: string;
        id: string;
        folderId?: string;
      }>,
    ) => {
      state.temporaryFolders.push({
        id: payload.id,
        name: payload.name,
        type: FolderType.Chat,
        folderId: payload.folderId || getConversationRootId(),
        temporary: true,
      });
      state.newAddedFolderId = payload.id;
    },
    deleteFolder: (state, _action: PayloadAction<{ folderId?: string }>) =>
      state,
    deleteTemporaryFolder: (
      state,
      { payload }: PayloadAction<{ folderId: string }>,
    ) => {
      state.temporaryFolders = state.temporaryFolders.filter(
        ({ id }) => id !== payload.folderId,
      );
    },
    deleteAllTemporaryFolders: (state) => {
      state.temporaryFolders = [];
    },
    renameTemporaryFolder: (
      state,
      { payload }: PayloadAction<{ folderId: string; name: string }>,
    ) => {
      state.newAddedFolderId = undefined;
      state.temporaryFolders = renameFolderWithChildren({
        folderId: payload.folderId,
        newName: payload.name,
        folders: state.temporaryFolders,
      });
    },
    resetNewFolderId: (state) => {
      state.newAddedFolderId = undefined;
    },
    updateFolder: (
      state,
      {
        payload,
      }: PayloadAction<{ folderId: string; values: Partial<FolderInterface> }>,
    ) => {
      state.folders = state.folders.map((folder) => {
        if (folder.id === payload.folderId) {
          return {
            ...folder,
            ...payload.values,
          };
        }

        return folder;
      });
    },
    updateFolderSuccess: (
      state,
      {
        payload,
      }: PayloadAction<{
        folders: FolderInterface[];
        conversations: ConversationInfo[];
        selectedConversationsIds: string[];
      }>,
    ) => {
      state.folders = payload.folders;
      state.conversations = payload.conversations;
      state.selectedConversationsIds = payload.selectedConversationsIds;
    },
    setFolders: (
      state,
      { payload }: PayloadAction<{ folders: FolderInterface[] }>,
    ) => {
      state.folders = payload.folders;
    },
    addFolders: (
      state,
      { payload }: PayloadAction<{ folders: FolderInterface[] }>,
    ) => {
      state.folders = combineEntities(state.folders, payload.folders);
    },
    setSearchTerm: (
      state,
      { payload }: PayloadAction<{ searchTerm: string }>,
    ) => {
      state.searchTerm = payload.searchTerm;
    },
    setSearchFilters: (
      state,
      { payload }: PayloadAction<{ searchFilters: SearchFilters }>,
    ) => {
      state.searchFilters = payload.searchFilters;
    },
    resetSearch: (state) => {
      state.searchTerm = '';
      state.searchFilters = SearchFilters.None;
    },
    updateMessage: (
      state,
      _action: PayloadAction<{
        conversationId: string;
        messageIndex: number;
        values: Partial<Message>;
      }>,
    ) => state,
    rateMessage: (
      state,
      _action: PayloadAction<{
        conversationId: string;
        messageIndex: number;
        rate: LikeState;
      }>,
    ) => state,
    rateMessageSuccess: (
      state,
      _action: PayloadAction<{
        conversationId: string;
        messageIndex: number;
        rate: LikeState;
      }>,
    ) => state,
    rateMessageFail: (
      state,
      _action: PayloadAction<{ error: Response | string }>,
    ) => state,
    deleteMessage: (state, _action: PayloadAction<{ index: number }>) => state,
    sendMessages: (
      state,
      _action: PayloadAction<{
        conversations: Conversation[];
        message: Message;
        deleteCount: number;
        activeReplayIndex: number;
      }>,
    ) => state,
    sendMessage: (
      state,
      _action: PayloadAction<{
        conversation: Conversation;
        message: Message;
        deleteCount: number;
        activeReplayIndex: number;
      }>,
    ) => state,
    streamMessage: (
      state,
      _action: PayloadAction<{
        conversation: Conversation;
        message: Message;
      }>,
    ) => state,
    createAbortController: (state) => {
      state.conversationSignal = new AbortController();
    },
    streamMessageFail: (
      state,
      _action: PayloadAction<{
        conversation: Conversation;
        message: string;
        response?: Response;
      }>,
    ) => state,
    streamMessageSuccess: (state) => state,
    stopStreamMessage: (state) => state,
    replayConversations: (
      state,
      _action: PayloadAction<{
        conversationsIds: string[];
        isRestart?: boolean;
        isContinue?: boolean;
      }>,
    ) => state,
    replayConversation: (
      state,
      {
        payload,
      }: PayloadAction<{
        conversationId: string;
        isRestart?: boolean;
        isContinue?: boolean;
        activeReplayIndex: number;
      }>,
    ) => {
      state.isReplayPaused = false;
      if (!payload.isRestart && !payload.isContinue) {
        state.conversations = (state.conversations as Conversation[]).map(
          (conv) =>
            conv.id === payload.conversationId
              ? {
                  ...conv,
                  replay: {
                    ...conv.replay,
                    activeReplayIndex: payload.activeReplayIndex,
                  },
                }
              : conv,
        );
      }
    },
    stopReplayConversation: (state) => {
      state.isReplayPaused = true;
    },
    endReplayConversation: (
      state,
      _action: PayloadAction<{
        conversationId: string;
      }>,
    ) => {
      state.isReplayPaused = true;
    },
    setIsReplayRequiresVariables: (
      state,
      { payload }: PayloadAction<boolean>,
    ) => {
      state.isReplayRequiresVariables = payload;
    },
    playbackNextMessageStart: (state) => {
      state.isPlaybackPaused = false;
    },
    playbackNextMessageEnd: (
      state,
      _action: PayloadAction<{ conversationId: string }>,
    ) => state,
    playbackPrevMessage: (state) => state,
    playbackStop: (state) => {
      state.isPlaybackPaused = true;
    },
    playbackCancel: (state) => {
      state.isPlaybackPaused = true;
    },
    uploadFoldersIfNotLoaded: (
      state,
      _action: PayloadAction<{ ids: string[] }>,
    ) => state,
    uploadFolders: (state, { payload }: PayloadAction<{ ids: string[] }>) => {
      state.foldersStatus = UploadStatus.LOADING;
      state.loadingFolderIds = state.loadingFolderIds.concat(
        payload.ids as string[],
      );
    },
    uploadFoldersFail: (
      state,
      {
        payload,
      }: PayloadAction<{
        paths: Set<string | undefined>;
      }>,
    ) => {
      state.loadingFolderIds = state.loadingFolderIds.filter(
        (id) => !payload.paths.has(id),
      );
      state.foldersStatus = UploadStatus.FAILED;
    },
    initConversationsRecursive: (state) => {
      state.conversationsStatus = UploadStatus.LOADING;
    },
    uploadConversationsFromMultipleFolders: (
      state,
      _action: PayloadAction<{
        paths: string[];
        recursive?: boolean;
        pathToSelectFrom?: string;
      }>,
    ) => state,
    uploadConversationsWithFoldersRecursive: (
      state,
      {
        payload,
      }: PayloadAction<{ path?: string; noLoader?: boolean } | undefined>,
    ) => {
      state.conversationsStatus = UploadStatus.LOADING;
      state.conversationsLoaded = !!payload?.noLoader;
    },
    uploadConversationsWithContentRecursive: (
      state,
      _action: PayloadAction<{ path: string }>,
    ) => {
      state.areConversationsWithContentUploading = true;
    },
    uploadConversationsWithContentRecursiveSuccess: (state) => {
      state.areConversationsWithContentUploading = false;
    },
    uploadConversationsWithFoldersRecursiveSuccess: (state) => {
      state.conversationsLoaded = true;
    },
    uploadConversationsFail: (state) => {
      state.conversationsStatus = UploadStatus.FAILED;
      state.areConversationsWithContentUploading = false;
    },
    toggleFolder: (state, _action: PayloadAction<{ id: string }>) => state,
    setIsMessageSending: (state, { payload }: PayloadAction<boolean>) => {
      state.isMessageSending = payload;
    },
    getChartAttachment: (
      state,
      _action: PayloadAction<{
        pathToChart: string;
      }>,
    ) => {
      state.chartLoading = true;
    },
    getChartAttachmentSuccess: (
      state,
      {
        payload,
      }: PayloadAction<{
        params: PlotParams;
        pathToChart: string;
      }>,
    ) => {
      state.loadedCharts = state.loadedCharts.find(
        (chart) => chart.url === payload.pathToChart,
      )
        ? state.loadedCharts
        : [
            ...state.loadedCharts,
            {
              url: payload.pathToChart,
              data: payload.params,
            },
          ];
      state.chartLoading = false;
    },
    getCustomAttachmentData: (
      state,
      _action: PayloadAction<{
        pathToAttachment: string;
      }>,
    ) => {
      state.customAttachmentDataLoading = true;
    },
    getCustomAttachmentDataSuccess: (
      state,
      {
        payload,
      }: PayloadAction<{
        params: CustomVisualizerData;
        url: string;
      }>,
    ) => {
      state.loadedCustomAttachmentsData =
        state.loadedCustomAttachmentsData.find(
          (attachmentData) => attachmentData.url === payload.url,
        )
          ? state.loadedCustomAttachmentsData
          : [
              ...state.loadedCustomAttachmentsData,
              {
                url: payload.url,
                data: payload.params,
              },
            ];
      state.customAttachmentDataLoading = false;
    },
    uploadChildConversationsWithFoldersSuccess: (
      state,
      {
        payload,
      }: PayloadAction<{
        parentIds: string[];
        folders: FolderInterface[];
        conversations: ConversationInfo[];
      }>,
    ) => {
      state.loadingFolderIds = state.loadingFolderIds.filter(
        (id) => !payload.parentIds.includes(id),
      );
      state.folders = combineEntities(
        state.folders,
        payload.folders.map((folder) => ({
          ...folder,
          status: payload.parentIds.includes(folder.id)
            ? UploadStatus.LOADED
            : undefined,
        })),
      );
      state.conversations = combineEntities(
        state.conversations,
        payload.conversations,
      );
    },
    setChosenConversations: (
      state,
      { payload }: PayloadAction<{ ids: string[] }>,
    ) => {
      state.chosenConversationIds = xor(
        state.chosenConversationIds,
        payload.ids,
      );
    },
    resetChosenConversations: (state) => {
      state.chosenConversationIds = [];
      state.chosenEmptyFoldersIds = [];
    },
    setAllChosenConversations: (state) => {
      if (state.searchTerm) {
        state.chosenConversationIds = state.conversations
          .filter(
            (conv) =>
              !isEntityIdExternal(conv) &&
              doesEntityContainSearchTerm(conv, state.searchTerm),
          )
          .map(({ id }) => id);
      } else {
        state.chosenConversationIds = state.conversations
          .filter((conv) => !isEntityIdExternal(conv))
          .map(({ id }) => id);
      }
      if (state.searchTerm) {
        return state;
      }
      state.chosenEmptyFoldersIds = state.folders
        .filter(
          (folder) =>
            !isEntityIdExternal(folder) &&
            isFolderEmpty({
              id: folder.id,
              folders: state.folders,
              entities: state.conversations,
            }),
        )
        .map(({ id }) => `${id}/`);
    },

    deleteChosenConversations: (state) => state,
    addToChosenEmptyFolders: (
      state,
      { payload }: PayloadAction<{ ids: string[] }>,
    ) => {
      state.chosenEmptyFoldersIds = xor(
        state.chosenEmptyFoldersIds,
        payload.ids,
      );
    },
    applyMarketplaceModel: (
      state,
      {
        payload,
      }: PayloadAction<{
        targetConversationId?: string;
        selectedModelId: string;
      }>,
    ) => {
      if (
        payload.targetConversationId &&
        !state.selectedConversationsIds.includes(payload.targetConversationId)
      ) {
        state.selectedConversationsIds = uniq([
          ...state.selectedConversationsIds,
          payload.targetConversationId,
        ]);
      }
    },
    initLastConversationSettings: (state) => state,
    setLastConversationSettings: (
      state,
      { payload }: PayloadAction<LastConversationSettings>,
    ) => {
      state.lastConversationSettings = payload;
    },
    setRenamingConversationId: (
      state,
      { payload }: PayloadAction<string | null>,
    ) => {
      state.renamingConversationId = payload;
    },
    setTalkToConversationId: (
      state,
      { payload }: PayloadAction<string | null>,
    ) => {
      state.talkToConversationId = payload;
    },
  },
});

export const ConversationsActions = conversationsSlice.actions;
