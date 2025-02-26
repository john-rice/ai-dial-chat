import { signOut } from 'next-auth/react';

import {
  EMPTY,
  Observable,
  catchError,
  concat,
  filter,
  from,
  ignoreElements,
  map,
  of,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap,
  throwError,
  withLatestFrom,
} from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { AnyAction } from '@reduxjs/toolkit';

import { combineEpics } from 'redux-observable';

import { ClientDataService } from '@/src/utils/app/data/client-data-service';
import { DataService } from '@/src/utils/app/data/data-service';
import { isMyApplication } from '@/src/utils/app/id';
import { translate } from '@/src/utils/app/translation';

import { ApplicationStatus } from '@/src/types/applications';
import { FeatureType } from '@/src/types/common';
import { DialAIEntityModel, InstalledModel } from '@/src/types/models';
import { AppEpic } from '@/src/types/store';

import { ApplicationActions } from '@/src/store/application/application.reducers';

import { DeleteType } from '@/src/constants/marketplace';

import { MarketplaceActions } from '../marketplace/marketplace.reducers';
import { PublicationActions } from '../publication/publication.reducers';
import {
  SettingsActions,
  SettingsSelectors,
} from '../settings/settings.reducers';
import { UIActions } from '../ui/ui.reducers';
import { ModelsActions, ModelsSelectors } from './models.reducers';

import { Feature } from '@epam/ai-dial-shared';
import uniqBy from 'lodash-es/uniqBy';

const initEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(
      (action) =>
        ModelsActions.init.match(action) &&
        !ModelsSelectors.selectInitialized(state$.value),
    ),
    switchMap(() =>
      concat(of(ModelsActions.getModels()), of(ModelsActions.initFinish())),
    ),
  );

const initRecentModelsEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(ModelsActions.init.match),
    switchMap(() => DataService.getRecentModelsIds()),
    switchMap((recentModelsIds) => {
      return state$.pipe(
        startWith(state$.value),
        map((state) => ModelsSelectors.selectModels(state)),
        filter((models) => models && models.length > 0),
        take(1),
        map((models) => ({
          models,
          recentModelsIds,
          defaultRecentModelsIds:
            SettingsSelectors.selectDefaultRecentModelsIds(state$.value),
        })),
        switchMap(({ models, recentModelsIds, defaultRecentModelsIds }) => {
          const filteredRecentModels = recentModelsIds?.filter(
            (resentModelId) =>
              models.some(
                ({ reference, id }) =>
                  resentModelId === reference || resentModelId === id,
              ),
          );
          const filteredDefaultRecentModelsIds = defaultRecentModelsIds.filter(
            (resentModelId) =>
              models.some(
                ({ reference, id }) =>
                  resentModelId === reference || resentModelId === id,
              ),
          );

          return of(
            ModelsActions.initRecentModels({
              defaultRecentModelsIds: filteredDefaultRecentModelsIds,
              localStorageRecentModelsIds: filteredRecentModels,
              defaultModelId: SettingsSelectors.selectDefaultModelId(
                state$.value,
              ),
            }),
          );
        }),
      );
    }),
  );

const getModelsEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(ModelsActions.getModels.match),
    switchMap(() => {
      return fromFetch('/api/models', {
        headers: {
          'Content-Type': 'application/json',
        },
      }).pipe(
        switchMap((resp) => {
          if (!resp.ok) {
            return throwError(() => resp);
          }
          return from(resp.json());
        }),
        switchMap((response: DialAIEntityModel[]) => {
          const isOverlay = SettingsSelectors.selectIsOverlay(state$.value);
          const isHeaderFeatureEnabled = SettingsSelectors.isFeatureEnabled(
            state$.value,
            Feature.Header,
          );

          if (response.length === 0 && isOverlay && !isHeaderFeatureEnabled) {
            signOut();
          }

          const updatingModels = response.filter(
            (model) =>
              model.functionStatus &&
              (model.functionStatus === ApplicationStatus.DEPLOYING ||
                model.functionStatus === ApplicationStatus.UNDEPLOYING),
          );
          const continueUpdateActions: Observable<AnyAction>[] =
            updatingModels.map((model) =>
              of(
                ApplicationActions.continueUpdatingFunctionStatus({
                  id: model.id,
                  status: model.functionStatus as ApplicationStatus,
                }),
              ),
            );

          return concat(
            of(ModelsActions.getModelsSuccess({ models: response })),
            of(
              PublicationActions.uploadAllPublishedWithMeItems({
                featureType: FeatureType.Application,
              }),
            ),
            of(MarketplaceActions.initQueryParams()),
            ...continueUpdateActions,
          );
        }),
        catchError((err) => {
          return of(ModelsActions.getModelsFail({ error: err }));
        }),
        takeUntil(action$.pipe(filter(ModelsActions.getModels.match))),
      );
    }),
  );

const getInstalledModelIdsEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(ModelsActions.getInstalledModelIds.match),
    map(() => {
      const allModels = ModelsSelectors.selectModels(state$.value);

      return allModels
        .filter((model) => isMyApplication(model) || model.sharedWithMe)
        .map((app) => app.reference);
    }),
    switchMap((myAppIds) => {
      return ClientDataService.getInstalledDeployments().pipe(
        switchMap((installedModels) => {
          if (!installedModels) {
            return of(ModelsActions.getInstalledModelIdsFail(myAppIds));
          }

          const actions: Observable<AnyAction>[] = [];

          const recentModelIds = ModelsSelectors.selectRecentModelsIds(
            state$.value,
          );

          const installedModelIds = new Set(
            installedModels.map((model) => model.id),
          );
          const modelsToInstall = [...recentModelIds, ...myAppIds].filter(
            (id) => !installedModelIds.has(id),
          );

          if (modelsToInstall.length) {
            actions.push(
              of(
                ModelsActions.addInstalledModels({
                  references: modelsToInstall,
                }),
              ),
            );
          }

          return concat(
            of(ModelsActions.getInstalledModelsSuccess(installedModels)),
            ...actions,
          );
        }),
        catchError((error) => {
          if (error?.message && error?.message.endsWith('Not Found')) {
            return of(ModelsActions.getInstalledModelIdsFail(myAppIds));
          }
          return EMPTY;
        }),
      );
    }),
  );

const getInstalledModelIdsFailEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(ModelsActions.getInstalledModelIdsFail.match),
    switchMap(({ payload: myAppIds }) => {
      const defaultModelIds = SettingsSelectors.selectDefaultRecentModelsIds(
        state$.value,
      );
      const recentModelIds = ModelsSelectors.selectRecentModelsIds(
        state$.value,
      );
      const availableModels = ModelsSelectors.selectModels(state$.value);
      const fallbackModels = availableModels?.[0]?.reference
        ? [availableModels[0].reference]
        : [];

      const modelsToInstall = recentModelIds.length
        ? recentModelIds
        : defaultModelIds;

      const installCandidates = [...myAppIds, ...modelsToInstall];
      const agentsToInstall = installCandidates.length
        ? installCandidates
        : fallbackModels;

      return of(
        ModelsActions.addInstalledModels({
          references: agentsToInstall,
        }),
      );
    }),
  );

const removeInstalledModelsEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(ModelsActions.removeInstalledModels.match),
    switchMap(({ payload }) => {
      const installedModels = ModelsSelectors.selectInstalledModels(
        state$.value,
      );
      const newInstalledModels = installedModels.filter(
        (model) => !payload.references.includes(model.id),
      );

      return ClientDataService.saveInstalledDeployments(
        newInstalledModels,
      ).pipe(
        switchMap(() => {
          const recentModelIds = ModelsSelectors.selectRecentModelsIds(
            state$.value,
          );

          const newInstalledModelIds = new Set(
            newInstalledModels.map(({ id }) => id),
          );
          const filteredRecentModelIds = recentModelIds.filter((id) =>
            newInstalledModelIds.has(id),
          );

          return DataService.setRecentModelsIds(filteredRecentModelIds).pipe(
            switchMap(() => {
              const actions: Observable<AnyAction>[] = [];

              if (payload.action === DeleteType.DELETE) {
                actions.push(
                  of(
                    ModelsActions.deleteModels({
                      references: payload.references,
                    }),
                  ),
                );
              }

              return concat(
                ...actions,
                of(ModelsActions.getInstalledModelsSuccess(newInstalledModels)),
                of(
                  ModelsActions.updateInstalledModelsSuccess({
                    installedModels: newInstalledModels,
                  }),
                ),
              );
            }),
          );
        }),
        catchError((err) => {
          console.error(err);
          return of(ModelsActions.updateInstalledModelFail());
        }),
      );
    }),
  );

const addInstalledModelsEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(ModelsActions.addInstalledModels.match),
    switchMap(({ payload }) => {
      const installedModels = ModelsSelectors.selectInstalledModels(
        state$.value,
      );
      const newInstalledModels = uniqBy<InstalledModel>(
        [
          ...installedModels,
          ...payload.references.map((ref) => ({
            id: ref,
          })),
        ],
        'id',
      );

      return ClientDataService.saveInstalledDeployments(
        newInstalledModels,
      ).pipe(
        switchMap(() => {
          const recentModelIds = ModelsSelectors.selectRecentModelsIds(
            state$.value,
          );

          return DataService.setRecentModelsIds(recentModelIds).pipe(
            switchMap(() => {
              const actions: Observable<AnyAction>[] = [];

              if (payload.showSuccessToast) {
                actions.push(
                  of(
                    UIActions.showSuccessToast(
                      translate(
                        `The agent${payload.references.length > 1 ? 's' : ''} added to my workspace`,
                      ),
                    ),
                  ),
                );
              }
              if (payload.updateRecentModels) {
                actions.push(
                  ...newInstalledModels.map(({ id }) =>
                    of(ModelsActions.updateRecentModels({ modelId: id })),
                  ),
                );
              }

              return concat(
                ...actions,
                of(ModelsActions.getInstalledModelsSuccess(newInstalledModels)),
                of(
                  ModelsActions.updateInstalledModelsSuccess({
                    installedModels: newInstalledModels,
                  }),
                ),
              );
            }),
          );
        }),
      );
    }),
  );

const updateRecentModelsEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(
      (action) =>
        ModelsActions.initRecentModels.match(action) ||
        ModelsActions.updateRecentModels.match(action),
    ),
    withLatestFrom(state$),
    map(([_action, state]) => ModelsSelectors.selectRecentModelsIds(state)),
    switchMap((recentModelIds) => {
      return DataService.setRecentModelsIds(recentModelIds);
    }),
    ignoreElements(),
  );

const getModelsSuccessEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(ModelsActions.getModelsSuccess.match),
    switchMap(({ payload }) => {
      const overlayDefaultModelId =
        SettingsSelectors.selectOverlayDefaultModelId(state$.value);

      const defaultModelId = overlayDefaultModelId
        ? undefined
        : payload.models.find((model) => model.isDefault)?.id;

      if (defaultModelId) {
        return concat(
          of(SettingsActions.setDefaultModelId({ defaultModelId })),
          of(ModelsActions.getInstalledModelIds()),
        );
      }

      return of(ModelsActions.getInstalledModelIds());
    }),
  );

const getModelsFailEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ModelsActions.getModelsFail.match),
    tap(({ payload }) => {
      if (payload.error.status === 401) {
        window.location.assign('/api/auth/signin');
      }
    }),
    ignoreElements(),
  );

export const ModelsEpics = combineEpics(
  initEpic,
  getModelsEpic,
  getModelsSuccessEpic,
  getModelsFailEpic,
  getInstalledModelIdsEpic,
  getInstalledModelIdsFailEpic,
  addInstalledModelsEpic,
  removeInstalledModelsEpic,
  updateRecentModelsEpic,
  initRecentModelsEpic,
);
