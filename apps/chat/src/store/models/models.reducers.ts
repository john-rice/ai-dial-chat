import { PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit';

import { combineEntities } from '@/src/utils/app/common';
import { canWriteSharedWithMe } from '@/src/utils/app/share';
import { translate } from '@/src/utils/app/translation';

import { ApplicationInfo, ApplicationStatus } from '@/src/types/applications';
import { EntityType } from '@/src/types/common';
import { ErrorMessage } from '@/src/types/error';
import {
  DialAIEntityModel,
  InstalledModel,
  ModelsMap,
  PublishRequestDialAIEntityModel,
} from '@/src/types/models';

import { RECENT_MODELS_COUNT } from '@/src/constants/chat';
import { errorsMessages } from '@/src/constants/errors';
import { DeleteType } from '@/src/constants/marketplace';

import { RootState } from '../index';

import { UploadStatus } from '@epam/ai-dial-shared';
import { sortBy } from 'lodash-es';
import cloneDeep from 'lodash-es/cloneDeep';
import groupBy from 'lodash-es/groupBy';
import omit from 'lodash-es/omit';
import orderBy from 'lodash-es/orderBy';
import uniq from 'lodash-es/uniq';

export interface ModelsState {
  initialized: boolean;
  status: UploadStatus;
  error: ErrorMessage | undefined;
  models: DialAIEntityModel[];
  modelsMap: ModelsMap;
  recentModelsIds: string[];
  recentModelsStatus: UploadStatus;
  isInstalledModelsInitialized: boolean;
  installedModels: InstalledModel[];
  publishRequestModels: PublishRequestDialAIEntityModel[];
  publishedApplicationIds: string[];
}

const initialState: ModelsState = {
  initialized: false,
  status: UploadStatus.UNINITIALIZED,
  error: undefined,
  models: [],
  modelsMap: {},
  installedModels: [],
  recentModelsIds: [],
  recentModelsStatus: UploadStatus.UNINITIALIZED,
  isInstalledModelsInitialized: false,
  publishRequestModels: [],
  publishedApplicationIds: [],
};

export const modelsSlice = createSlice({
  name: 'models',
  initialState,
  reducers: {
    init: (state) => state,
    initFinish: (state) => {
      state.initialized = true;
    },
    getModels: (state) => {
      state.status = UploadStatus.LOADING;
    },
    getInstalledModelIds: (state) => state,
    getInstalledModelIdsFail: (state, _action: PayloadAction<string[]>) =>
      state,
    getInstalledModelsSuccess: (
      state,
      { payload }: PayloadAction<InstalledModel[]>,
    ) => {
      state.installedModels = payload;
      state.isInstalledModelsInitialized = true;
    },
    addInstalledModels: (
      state,
      _action: PayloadAction<{
        references: string[];
        showSuccessToast?: boolean;
        updateRecentModels?: boolean;
      }>,
    ) => state,
    removeInstalledModels: (
      state,
      _action: PayloadAction<{ references: string[]; action: DeleteType }>,
    ) => state,
    updateInstalledModelsSuccess: (
      state,
      { payload }: PayloadAction<{ installedModels: InstalledModel[] }>,
    ) => {
      state.installedModels = payload.installedModels;
    },
    updateInstalledModelFail: (state) => state,
    getModelsSuccess: (
      state,
      { payload }: PayloadAction<{ models: DialAIEntityModel[] }>,
    ) => {
      state.status = UploadStatus.LOADED;
      state.error = undefined;
      state.models = payload.models;
      state.modelsMap = (payload.models as DialAIEntityModel[]).reduce(
        (acc, model) => {
          acc[model.id] = model;
          if (model.id !== model.reference) {
            acc[model.reference] = model;
          }

          return acc;
        },
        {} as Record<string, DialAIEntityModel>,
      );
    },
    getModelsFail: (
      state,
      {
        payload,
      }: PayloadAction<{
        error: { status?: string | number; statusText?: string };
      }>,
    ) => {
      state.status = UploadStatus.LOADED;
      state.error = {
        title: translate('Error fetching models.'),
        code: payload.error.status?.toString() ?? 'unknown',
        messageLines: payload.error.statusText
          ? [payload.error.statusText]
          : [translate(errorsMessages.generalServer, { ns: 'common' })],
      } as ErrorMessage;
    },
    initRecentModels: (
      state,
      {
        payload,
      }: PayloadAction<{
        defaultRecentModelsIds: string[];
        localStorageRecentModelsIds: string[] | undefined;
        defaultModelId: string | undefined;
      }>,
    ) => {
      const isDefaultModelAvailable = state.models.some(
        ({ id }) => id === payload.defaultModelId,
      );

      if (payload.localStorageRecentModelsIds) {
        state.recentModelsIds = payload.localStorageRecentModelsIds;
      } else if (payload.defaultRecentModelsIds.length) {
        state.recentModelsIds = payload.defaultRecentModelsIds;
      } else if (payload.defaultModelId && isDefaultModelAvailable) {
        state.recentModelsIds = [payload.defaultModelId];
      } else {
        state.recentModelsIds = [state.models[0].id];
      }
      state.recentModelsIds = uniq(state.recentModelsIds).slice(
        0,
        RECENT_MODELS_COUNT,
      );
      state.recentModelsStatus = UploadStatus.LOADED;
    },
    updateRecentModels: (
      state,
      { payload }: PayloadAction<{ modelId: string }>,
    ) => {
      const newModel = state.modelsMap[payload.modelId];
      if (!newModel) return;

      const recentModels = state.recentModelsIds.map(
        (id) => state.modelsMap[id],
      );
      const oldIndex = recentModels.findIndex((m) => m?.name === newModel.name);
      if (oldIndex >= 0) {
        if (recentModels[oldIndex]?.reference !== payload.modelId) {
          //replace
          const newIds = [...state.recentModelsIds];
          newIds[oldIndex] = payload.modelId;
          state.recentModelsIds = newIds;
        }
      }

      const recentFilteredModels = state.recentModelsIds.filter(
        (recentModelId) => recentModelId !== payload.modelId,
      );
      recentFilteredModels.unshift(payload.modelId);

      state.recentModelsIds = uniq(recentFilteredModels).slice(
        0,
        RECENT_MODELS_COUNT,
      );
    },
    setPublishedApplicationIds: (
      state,
      {
        payload,
      }: PayloadAction<{
        modelIds: string[];
      }>,
    ) => {
      state.publishedApplicationIds = payload.modelIds;
    },
    addModels: (
      state,
      { payload }: PayloadAction<{ models: DialAIEntityModel[] }>,
    ) => {
      state.models = [...state.models, ...payload.models];
      payload.models.forEach((model) => {
        state.modelsMap[model.id] = model;
        state.modelsMap[model.reference] = model;
      });
    },
    updateModel: (
      state,
      {
        payload,
      }: PayloadAction<{
        model: DialAIEntityModel;
        oldApplicationId: string;
      }>,
    ) => {
      const oldModel = state.modelsMap[payload.model.reference];
      //Copy permissions and sharedWithMe after update
      const newModel: DialAIEntityModel = {
        sharedWithMe: oldModel?.sharedWithMe,
        permissions: oldModel?.permissions,
        ...payload.model,
      };

      state.models = state.models.map((model) =>
        model.reference === newModel.reference ? newModel : model,
      );
      state.modelsMap = omit(state.modelsMap, [payload.oldApplicationId]);
      state.modelsMap[newModel.id] = newModel;
      state.modelsMap[newModel.reference] = newModel;
    },
    deleteModels: (
      state,
      { payload }: PayloadAction<{ references: string[] }>,
    ) => {
      const ids = payload.references
        .map((reference) => state.modelsMap[reference]?.id)
        .filter(Boolean) as string[];
      state.models = state.models.filter(
        (model) => !payload.references.includes(model.reference),
      );
      state.recentModelsIds = state.recentModelsIds.filter(
        (id) => !payload.references.includes(id),
      );
      state.modelsMap = omit(state.modelsMap, [...payload.references, ...ids]);
    },

    addPublishRequestModels: (
      state,
      {
        payload,
      }: PayloadAction<{
        models: PublishRequestDialAIEntityModel[];
      }>,
    ) => {
      state.publishRequestModels = combineEntities(
        state.publishRequestModels,
        payload.models,
      );
    },
    updateFunctionStatus: (
      state,
      {
        payload,
      }: PayloadAction<{
        id: string;
        status: ApplicationStatus;
      }>,
    ) => {
      const targetModel = state.modelsMap[payload.id];

      if (targetModel && targetModel.functionStatus) {
        const updatedModel = cloneDeep(targetModel);
        updatedModel.functionStatus = payload.status;

        state.models = state.models.map((model) =>
          model.reference === targetModel.reference ? updatedModel : model,
        );
        state.modelsMap[targetModel.id] = updatedModel;
        state.modelsMap[targetModel.reference] = updatedModel;
      }
    },
    updateLocalModels: (
      state,
      {
        payload,
      }: PayloadAction<{
        reference: string;
        updatedValues: Partial<ApplicationInfo>;
      }>,
    ) => {
      const model = state.modelsMap[payload.reference];

      if (model) {
        const updatedModel = {
          ...model,
          ...payload.updatedValues,
        };
        state.modelsMap[model.reference] = updatedModel;
        state.modelsMap[model.id] = updatedModel;

        state.models = state.models.map((model) => {
          if (model.reference === payload.reference) {
            return {
              ...model,
              ...payload.updatedValues,
            };
          }

          return model;
        });
      }
    },
  },
});

const rootSelector = (state: RootState): ModelsState => state.models;

const selectModelsIsLoading = createSelector([rootSelector], (state) => {
  return (
    state.status === UploadStatus.LOADING ||
    state.status === UploadStatus.UNINITIALIZED
  );
});

const selectIsModelsLoaded = createSelector([rootSelector], (state) => {
  return state.status === UploadStatus.LOADED;
});

const selectIsInstalledModelsInitialized = createSelector(
  [rootSelector],
  (state) => {
    return state.isInstalledModelsInitialized;
  },
);

const selectModelsError = createSelector([rootSelector], (state) => {
  return state.error;
});

const selectIsRecentModelsLoaded = createSelector([rootSelector], (state) => {
  return state.recentModelsStatus === UploadStatus.LOADED;
});

const selectModels = createSelector([rootSelector], (state) => {
  const groups = groupBy(state.models, (model) =>
    model.reference === model.id ? 'rest' : 'custom',
  );

  return sortBy(
    [
      ...(groups.rest ?? []),
      ...orderBy(groups.custom ?? [], 'version', 'desc'),
    ],
    (model) => model.name.toLowerCase(),
  );
});

const selectModelTopics = createSelector([rootSelector], (state) => {
  return uniq(
    state.models?.flatMap((model) => model.topics ?? []) ?? [],
  ).sort();
});

const selectModelsMap = createSelector([rootSelector], (state) => {
  return state.modelsMap;
});
const selectRecentModelsIds = createSelector([rootSelector], (state) => {
  return state.recentModelsIds;
});

const selectRecentModels = createSelector(
  [selectRecentModelsIds, selectModelsMap],
  (recentModelsIds, modelsMap) => {
    return recentModelsIds.map((id) => modelsMap[id]).filter(Boolean);
  },
);

const selectModelsOnly = createSelector([selectModels], (models) => {
  return models.filter((model) => model.type === EntityType.Model);
});

const selectPublishRequestModels = createSelector([rootSelector], (state) => {
  return state.publishRequestModels;
});

const selectPublishedApplicationIds = createSelector(
  [rootSelector],
  (state) => {
    return state.publishedApplicationIds;
  },
);

const selectInstalledModels = createSelector([rootSelector], (state) => {
  return state.installedModels;
});

const selectInstalledModelIds = createSelector([rootSelector], (state) => {
  return new Set(state.installedModels.map(({ id }) => id));
});

const selectRecentWithInstalledModelsIds = createSelector(
  [selectRecentModelsIds, selectInstalledModelIds],
  (recentModelIds, installedModelIds) => {
    // TODO: implement Pin-behavior in future
    const installedWithoutRecents = Array.from(installedModelIds).filter(
      (id) => !recentModelIds.includes(id),
    );
    return [...recentModelIds, ...installedWithoutRecents];
  },
);

const selectInitialized = createSelector(
  [rootSelector],
  (state) => state.initialized,
);

const selectCustomModels = createSelector([rootSelector], (state) => {
  return state.models.filter((model) => model.reference !== model.id);
});

const selectSharedWithMeModels = createSelector(
  [selectCustomModels],
  (customModels) => {
    return customModels.filter((model) => model.sharedWithMe);
  },
);

const selectSharedWriteModels = createSelector(
  [selectCustomModels],
  (customModels) => {
    return customModels.filter((model) => canWriteSharedWithMe(model));
  },
);

export const ModelsSelectors = {
  selectIsInstalledModelsInitialized,
  selectIsModelsLoaded,
  selectModelsIsLoading,
  selectModelsError,
  selectModels,
  selectModelsMap,
  selectCustomModels,
  selectInstalledModels,
  selectInstalledModelIds,
  selectRecentModelsIds,
  selectRecentModels,
  selectIsRecentModelsLoaded,
  selectModelsOnly,
  selectPublishRequestModels,
  selectPublishedApplicationIds,
  selectModelTopics,
  selectRecentWithInstalledModelsIds,
  selectInitialized,
  selectSharedWithMeModels,
  selectSharedWriteModels,
};

export const ModelsActions = modelsSlice.actions;
