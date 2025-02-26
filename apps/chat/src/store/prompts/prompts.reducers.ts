import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { combineEntities } from '@/src/utils/app/common';
import {
  addGeneratedFolderId,
  isFolderEmpty,
  renameFolderWithChildren,
} from '@/src/utils/app/folders';
import { getPromptRootId, isEntityIdExternal } from '@/src/utils/app/id';
import { doesEntityContainSearchTerm } from '@/src/utils/app/search';

import { FolderInterface, FolderType } from '@/src/types/folder';
import { Prompt, PromptInfo } from '@/src/types/prompt';
import { SearchFilters } from '@/src/types/search';
import '@/src/types/share';

import * as PromptsSelectors from './prompts.selectors';
import { PromptsState } from './prompts.types';

import { UploadStatus } from '@epam/ai-dial-shared';
import xor from 'lodash-es/xor';

export { PromptsSelectors };

const initialState: PromptsState = {
  initialized: false,
  prompts: [],
  folders: [],
  temporaryFolders: [],
  searchTerm: '',
  searchFilters: SearchFilters.None,
  selectedPromptId: undefined,
  isSelectedPromptApproveRequiredResource: false,
  isEditModalOpen: false,
  isModalPreviewMode: false,
  newAddedFolderId: undefined,
  promptsLoaded: false,
  isPromptLoading: false,
  loadingFolderIds: [],
  isNewPromptCreating: false,
  chosenPromptIds: [],
  chosenEmptyFoldersIds: [],
};

export const promptsSlice = createSlice({
  name: 'prompts',
  initialState,
  reducers: {
    init: (state) => state,
    initFinish: (state) => {
      state.initialized = true;
    },
    initFoldersAndPromptsSuccess: (state) => {
      state.promptsLoaded = true;
    },
    uploadPromptsFromMultipleFolders: (
      state,
      _action: PayloadAction<{
        paths: string[];
        recursive?: boolean;
        pathToSelectFrom?: string;
      }>,
    ) => state,
    uploadPromptsWithFoldersRecursive: (
      state,
      {
        payload,
      }: PayloadAction<{ path?: string; noLoader?: boolean } | undefined>,
    ) => {
      state.promptsLoaded = !!payload?.noLoader;
    },
    uploadPromptsWithFoldersRecursiveSuccess: (state) => {
      state.promptsLoaded = true;
    },
    createNewPrompt: (state, _action: PayloadAction<Prompt>) => state,
    createNewPromptSuccess: (
      state,
      { payload }: PayloadAction<{ newPrompt: Prompt }>,
    ) => {
      state.prompts = state.prompts.concat(payload.newPrompt);
      state.isNewPromptCreating = false;
    },
    setIsNewPromptCreating: (state, { payload }: PayloadAction<boolean>) => {
      state.isNewPromptCreating = payload;
    },
    saveNewPrompt: (state, _action: PayloadAction<{ newPrompt: Prompt }>) =>
      state,
    deletePrompts: (state, _action: PayloadAction<{ promptIds: string[] }>) =>
      state,
    deletePromptsComplete: (
      state,
      { payload }: PayloadAction<{ promptIds: Set<string> }>,
    ) => {
      state.prompts = state.prompts.filter(
        (prompt) => !payload.promptIds.has(prompt.id),
      );
      state.promptsLoaded = true;
    },
    deletePrompt: (
      state,
      { payload }: PayloadAction<{ prompt: PromptInfo }>,
    ) => {
      state.prompts = state.prompts.filter(
        (prompt) => prompt.id !== payload.prompt.id,
      );
    },
    savePrompt: (state, _action: PayloadAction<Prompt>) => state,
    moveOrUpdatePrompt: (
      state,
      _action: PayloadAction<{
        prompt: PromptInfo;
        newValues: Partial<Prompt>;
      }>,
    ) => state,
    movePrompt: (
      state,
      _action: PayloadAction<{
        newPrompt: Prompt;
        oldPrompt: Prompt;
      }>,
    ) => state,
    movePromptFail: (
      state,
      {
        payload,
      }: PayloadAction<{
        newPrompt: Prompt;
        oldPrompt: Prompt;
      }>,
    ) => {
      state.prompts = state.prompts.map((prompt) => {
        if (payload.newPrompt.id === prompt.id) {
          return payload.oldPrompt;
        }

        return prompt;
      });
    },
    updatePrompt: (
      state,
      _action: PayloadAction<{ id: string; values: Partial<Prompt> }>,
    ) => state,
    updatePromptSuccess: (
      state,
      { payload }: PayloadAction<{ prompt: Partial<Prompt>; id: string }>,
    ) => {
      state.prompts = state.prompts.map((prompt) => {
        if (prompt.id === payload.id) {
          return {
            ...prompt,
            ...payload.prompt,
          };
        }

        return prompt;
      });
    },
    duplicatePrompt: (state, _action: PayloadAction<PromptInfo>) => state,
    applyPrompt: (state, _action: PayloadAction<PromptInfo>) => state,
    setPrompts: (
      state,
      { payload }: PayloadAction<{ prompts: PromptInfo[] }>,
    ) => {
      state.prompts = payload.prompts;
      state.promptsLoaded = true;
    },
    addPrompts: (state, { payload }: PayloadAction<{ prompts: Prompt[] }>) => {
      state.prompts = combineEntities(payload.prompts, state.prompts);
    },
    clearPrompts: (state) => {
      state.promptsLoaded = false;
    },
    clearPromptsSuccess: (state) => {
      state.prompts = state.prompts.filter((prompt) =>
        isEntityIdExternal(prompt),
      );
      state.folders = state.folders.filter((folder) =>
        isEntityIdExternal(folder),
      );
    },
    importPromptsSuccess: (
      state,
      {
        payload,
      }: PayloadAction<{ prompts: Prompt[]; folders: FolderInterface[] }>,
    ) => {
      state.prompts = combineEntities(payload.prompts, state.prompts);
      state.folders = combineEntities(payload.folders, state.folders);
    },
    createFolder: (
      state,
      { payload }: PayloadAction<{ name?: string; parentId: string }>,
    ) => {
      const newFolder: FolderInterface = addGeneratedFolderId({
        folderId: payload.parentId,
        name:
          // custom name
          payload?.name ??
          // default name with counter
          PromptsSelectors.selectNewFolderName(
            {
              prompts: state,
            },
            payload.parentId,
          ),
        type: FolderType.Prompt,
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
        type: FolderType.Prompt,
        folderId: payload.folderId || getPromptRootId(),
        temporary: true,
      });
      state.newAddedFolderId = payload.id;
    },
    deleteFolder: (
      state,
      { payload }: PayloadAction<{ folderId?: string }>,
    ) => {
      state.folders = state.folders.filter(({ id }) => id !== payload.folderId);
    },
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
        prompts: PromptInfo[];
      }>,
    ) => {
      state.folders = payload.folders;
      state.prompts = payload.prompts;
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
    setIsEditModalOpen: (
      state,
      {
        payload: { isOpen, isPreview = false },
      }: PayloadAction<{ isOpen: boolean; isPreview?: boolean }>,
    ) => {
      state.isEditModalOpen = isOpen;
      state.isModalPreviewMode = isPreview;
      if (!isOpen) {
        state.isNewPromptCreating = false;
      }
    },
    setSelectedPrompt: (
      state,
      {
        payload,
      }: PayloadAction<{
        promptId: string | undefined;
        isApproveRequiredResource?: boolean;
      }>,
    ) => {
      state.selectedPromptId = payload.promptId;
      state.isSelectedPromptApproveRequiredResource =
        !!payload.isApproveRequiredResource;
      state.isPromptLoading = !!payload.promptId;
    },
    uploadPrompt: (state, _action: PayloadAction<{ promptId: string }>) => {
      state.isPromptLoading = true;
    },
    uploadPromptSuccess: (
      state,
      { payload }: PayloadAction<{ prompt: Prompt | null }>,
    ) => {
      state.isPromptLoading = false;

      if (payload.prompt) {
        state.prompts = state.prompts.map((prompt) =>
          prompt.id === payload.prompt?.id
            ? { ...payload.prompt, ...prompt }
            : prompt,
        );
      }
    },
    toggleFolder: (state, _action: PayloadAction<{ id: string }>) => state,
    uploadFoldersIfNotLoaded: (
      state,
      _action: PayloadAction<{
        ids: string[];
      }>,
    ) => state,
    uploadFolders: (
      state,
      {
        payload,
      }: PayloadAction<{
        ids: string[];
      }>,
    ) => {
      state.loadingFolderIds = state.loadingFolderIds.concat(
        payload.ids as string[],
      );
    },
    uploadChildPromptsWithFoldersSuccess: (
      state,
      {
        payload,
      }: PayloadAction<{
        parentIds: string[];
        folders: FolderInterface[];
        prompts: PromptInfo[];
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
      state.prompts = combineEntities(state.prompts, payload.prompts);
    },
    setChosenPrompts: (
      state,
      { payload }: PayloadAction<{ ids: string[] }>,
    ) => {
      state.chosenPromptIds = xor(state.chosenPromptIds, payload.ids);
    },
    resetChosenPrompts: (state) => {
      state.chosenPromptIds = [];
      state.chosenEmptyFoldersIds = [];
    },
    setAllChosenPrompts: (state) => {
      if (state.searchTerm) {
        state.chosenPromptIds = state.prompts
          .filter(
            (prompt) =>
              !isEntityIdExternal(prompt) &&
              doesEntityContainSearchTerm(prompt, state.searchTerm),
          )
          .map(({ id }) => id);
      } else {
        state.chosenPromptIds = state.prompts
          .filter((prompt) => !isEntityIdExternal(prompt))
          .map(({ id }) => id);
      }

      state.chosenEmptyFoldersIds = state.folders
        .filter(
          (folder) =>
            !isEntityIdExternal(folder) &&
            isFolderEmpty({
              id: folder.id,
              folders: state.folders,
              entities: state.prompts,
            }),
        )
        .map(({ id }) => `${id}/`);
    },
    deleteChosenPrompts: (state) => state,

    addToChosenEmptyFolders: (
      state,
      { payload }: PayloadAction<{ ids: string[] }>,
    ) => {
      state.chosenEmptyFoldersIds = xor(
        state.chosenEmptyFoldersIds,
        payload.ids,
      );
    },
    setPromptWithVariablesForApply: (
      state,
      { payload }: PayloadAction<Prompt | undefined>,
    ) => {
      state.promptWithVariablesForApply = payload;
    },
  },
});

export const PromptsActions = promptsSlice.actions;
