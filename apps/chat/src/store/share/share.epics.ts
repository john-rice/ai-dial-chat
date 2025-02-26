import {
  EMPTY,
  Observable,
  catchError,
  concat,
  filter,
  iif,
  map,
  mergeMap,
  of,
  switchMap,
  zip,
} from 'rxjs';

import { AnyAction } from '@reduxjs/toolkit';

import { combineEpics } from 'redux-observable';

import {
  getApplicationType,
  getQuickAppDocumentUrl,
} from '@/src/utils/app/application';
import { ConversationService } from '@/src/utils/app/data/conversation-service';
import { ShareService } from '@/src/utils/app/data/share-service';
import {
  constructPath,
  isAttachmentLink,
  isConversationHasExternalAttachments,
} from '@/src/utils/app/file';
import { splitEntityId } from '@/src/utils/app/folders';
import {
  isApplicationId,
  isConversationId,
  isEntityIdExternal,
  isFolderId,
  isPromptId,
} from '@/src/utils/app/id';
import { EnumMapper } from '@/src/utils/app/mappers';
import { isEntityIdPublic } from '@/src/utils/app/publications';
import { hasWritePermission } from '@/src/utils/app/share';
import { translate } from '@/src/utils/app/translation';
import { ApiUtils, parseConversationApiKey } from '@/src/utils/server/api';

import { ApplicationType } from '@/src/types/applications';
import { Conversation } from '@/src/types/chat';
import { FeatureType } from '@/src/types/common';
import { DialFile } from '@/src/types/files';
import { FolderInterface } from '@/src/types/folder';
import { Prompt } from '@/src/types/prompt';
import {
  ShareByLinkResponseModel,
  ShareRelations,
  ShareRequestType,
  ShareResource,
} from '@/src/types/share';
import { AppEpic } from '@/src/types/store';

import { DEFAULT_CONVERSATION_NAME } from '@/src/constants/default-ui-settings';
import { errorsMessages } from '@/src/constants/errors';
import { DeleteType } from '@/src/constants/marketplace';

import {
  ApplicationActions,
  ApplicationSelectors,
} from '../application/application.reducers';
import { CodeEditorActions } from '../codeEditor/codeEditor.reducer';
import {
  ConversationsActions,
  ConversationsSelectors,
} from '../conversations/conversations.reducers';
import { FilesActions, FilesSelectors } from '../files/files.reducers';
import { MarketplaceActions } from '../marketplace/marketplace.reducers';
import { ModelsActions, ModelsSelectors } from '../models/models.reducers';
import { ModelUpdatedValues } from '../models/models.types';
import { PromptsActions, PromptsSelectors } from '../prompts/prompts.reducers';
import { SettingsSelectors } from '../settings/settings.reducers';
import { UIActions } from '../ui/ui.reducers';
import { ShareActions, ShareSelectors } from './share.reducers';

import { ConversationInfo, Message, UploadStatus } from '@epam/ai-dial-shared';

const getInternalResourcesUrls = (
  messages: Message[] | undefined,
): string[] => {
  return (messages
    ?.map((message) =>
      message.custom_content?.attachments
        ?.map((attachment) => attachment.url)
        .filter(Boolean)
        .filter((url) => url && !isAttachmentLink(url)),
    )
    .filter(Boolean)
    .flat() || []) as string[];
};

const shareEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.share.match),
    switchMap(({ payload }) => {
      if (payload.featureType === FeatureType.Chat) {
        if (!payload.isFolder) {
          return of(
            ShareActions.shareConversation({ resourceId: payload.resourceId }),
          );
        } else {
          return of(
            ShareActions.shareConversationFolder({
              resourceId: payload.resourceId,
            }),
          );
        }
      } else if (payload.featureType === FeatureType.Prompt) {
        if (!payload.isFolder) {
          return of(
            ShareActions.sharePrompt({ resourceId: payload.resourceId }),
          );
        } else {
          return of(
            ShareActions.sharePromptFolder({
              resourceId: payload.resourceId,
            }),
          );
        }
      } else {
        return of(
          ShareActions.shareApplication({
            resourceId: payload.resourceId,
            permissions: payload.permissions,
          }),
        );
      }
    }),
  );

const shareConversationEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.shareConversation.match),
    switchMap(({ payload }) => {
      const { apiKey, bucket, parentPath, name } = splitEntityId(
        payload.resourceId,
      );

      return ConversationService.getConversation({
        ...parseConversationApiKey(payload.resourceId),
        id: payload.resourceId,
        name,
        folderId: constructPath(apiKey, bucket, parentPath),
      }).pipe(
        switchMap((res) => {
          const internalResources = getInternalResourcesUrls(
            res?.playback?.messagesStack || res?.messages,
          );

          if (res && isConversationHasExternalAttachments(res)) {
            return of(
              ShareActions.shareFail(
                errorsMessages.shareWithExternalFilesFailed,
              ),
            );
          }

          return ShareService.share({
            invitationType: ShareRequestType.link,
            resources: [
              {
                url: ApiUtils.encodeApiUrl(payload.resourceId),
              },
              ...internalResources.map((res) => ({
                url: res,
              })),
            ],
          }).pipe(
            map((response: ShareByLinkResponseModel) => {
              return ShareActions.shareSuccess({
                invitationId: response.invitationLink.split('/').slice(-1)?.[0],
              });
            }),
            catchError((err) => {
              console.error(err);
              return of(ShareActions.shareFail());
            }),
          );
        }),
        catchError((err) => {
          console.error(err);
          return of(ShareActions.shareFail());
        }),
      );
    }),
  );

const shareConversationFolderEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.shareConversationFolder.match),
    switchMap(({ payload }) => {
      return ConversationService.getConversations(
        payload.resourceId,
        true,
      ).pipe(
        switchMap((res) => {
          return zip(
            res.map((res) =>
              ConversationService.getConversation({
                ...res,
              }),
            ),
          );
        }),
        map((res) => res.filter(Boolean) as Conversation[]),
        switchMap((conversations: Conversation[]) => {
          const internalResourcesIds = conversations
            .flatMap((res) =>
              getInternalResourcesUrls(
                res.playback?.messagesStack || res.messages,
              ),
            )
            .map((url) => ({ url }));

          if (conversations.some(isConversationHasExternalAttachments)) {
            return of(
              ShareActions.shareFail(
                errorsMessages.shareWithExternalFilesFailed,
              ),
            );
          }

          return ShareService.share({
            invitationType: ShareRequestType.link,
            resources: [
              {
                url: ApiUtils.encodeApiUrl(payload.resourceId) + '/',
              },
              ...internalResourcesIds,
            ],
          }).pipe(
            map((response: ShareByLinkResponseModel) => {
              return ShareActions.shareSuccess({
                invitationId: response.invitationLink.split('/').slice(-1)?.[0],
              });
            }),
            catchError((err) => {
              console.error(err);
              return of(ShareActions.shareFail());
            }),
          );
        }),
        catchError((err) => {
          console.error(err);
          return of(ShareActions.shareFail());
        }),
      );
    }),
  );
const sharePromptEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.sharePrompt.match),
    switchMap(({ payload }) => {
      return ShareService.share({
        invitationType: ShareRequestType.link,
        resources: [
          {
            url: ApiUtils.encodeApiUrl(payload.resourceId),
          },
        ],
      }).pipe(
        map((response: ShareByLinkResponseModel) => {
          return ShareActions.shareSuccess({
            invitationId: response.invitationLink.split('/').slice(-1)?.[0],
          });
        }),
        catchError((err) => {
          console.error(err);
          return of(ShareActions.shareFail());
        }),
      );
    }),
  );

const sharePromptFolderEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.sharePromptFolder.match),
    switchMap(({ payload }) => {
      return ShareService.share({
        invitationType: ShareRequestType.link,
        resources: [
          {
            url: ApiUtils.encodeApiUrl(payload.resourceId) + '/',
          },
        ],
      }).pipe(
        map((response: ShareByLinkResponseModel) => {
          return ShareActions.shareSuccess({
            invitationId: response.invitationLink.split('/').slice(-1)?.[0],
          });
        }),
        catchError((err) => {
          console.error(err);
          return of(ShareActions.shareFail());
        }),
      );
    }),
  );

const shareApplicationEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(ShareActions.shareApplication.match),
    switchMap(({ payload }) => {
      const modelsMap = ModelsSelectors.selectModelsMap(state$.value);
      const application = modelsMap[payload.resourceId];

      if (!application) {
        return of(ShareActions.shareFail());
      }

      const applicationType = getApplicationType(application);
      const applicationDetails = ApplicationSelectors.selectApplicationDetail(
        state$.value,
      );

      if (
        (applicationType === ApplicationType.CODE_APP ||
          applicationType === ApplicationType.QUICK_APP) &&
        applicationDetails?.reference !== application.reference
      ) {
        return of(
          ApplicationActions.get({
            applicationId: payload.resourceId,
            isForSharing: true,
          }),
        );
      }

      const resources: ShareResource[] = [
        {
          url: ApiUtils.encodeApiUrl(payload.resourceId),
          permissions: payload.permissions,
        },
      ];

      const actions: Observable<AnyAction>[] = [];

      if (application?.iconUrl) {
        const iconId = application.iconUrl;
        if (isEntityIdExternal({ id: iconId })) {
          actions.push(
            of(
              UIActions.showWarningToast(
                `The icon used for this application is in the "${isEntityIdPublic({ id: iconId }) ? 'Organization' : 'Shared with me'}" section and cannot be shared. Please replace the icon, otherwise the application will be shared with the default one.`,
              ),
            ),
          );
        } else {
          resources.push({
            url: ApiUtils.encodeApiUrl(iconId),
          });
        }
      }

      if (getQuickAppDocumentUrl(applicationDetails)) {
        resources.push({
          url: ApiUtils.encodeApiUrl(
            getQuickAppDocumentUrl(applicationDetails) as string,
          ),
        });
      }

      if (
        hasWritePermission(payload.permissions) &&
        applicationType &&
        applicationDetails?.function?.sourceFolder
      ) {
        resources.push({
          url:
            ApiUtils.encodeApiUrl(applicationDetails.function.sourceFolder) +
            '/',
          permissions: payload.permissions,
        });
      }

      return ShareService.share({
        invitationType: ShareRequestType.link,
        resources,
      }).pipe(
        switchMap((response: ShareByLinkResponseModel) => {
          return concat(
            of(
              ShareActions.shareSuccess({
                invitationId: response.invitationLink.split('/').slice(-1)?.[0],
                permissions: payload.permissions,
              }),
            ),
            ...actions,
          );
        }),
        catchError((err) => {
          console.error(err);
          return of(ShareActions.shareFail());
        }),
      );
    }),
  );

const shareFailEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.shareFail.match),
    map(({ payload }) => {
      return UIActions.showErrorToast(
        translate(payload ?? errorsMessages.shareFailed),
      );
    }),
  );

const acceptInvitationEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.acceptShareInvitation.match),
    switchMap(({ payload }) => {
      return ShareService.shareAccept({
        invitationId: payload.invitationId,
      }).pipe(
        switchMap(() =>
          ShareService.getShareDetails({
            invitationId: payload.invitationId,
          }).pipe(
            switchMap((data) => {
              const acceptedIds = data.resources.filter(
                (resource) =>
                  isPromptId(resource.url) ||
                  isConversationId(resource.url) ||
                  isApplicationId(resource.url),
              );

              const acceptedId = ApiUtils.decodeApiUrl(acceptedIds[0].url);

              return of(
                ShareActions.acceptShareInvitationSuccess({
                  acceptedId,
                  isFolder: isFolderId(acceptedIds[0].url),
                  isConversation: isConversationId(acceptedIds[0].url),
                  isPrompt: isPromptId(acceptedIds[0].url),
                  isApplication: isApplicationId(acceptedId),
                }),
              );
            }),
          ),
        ),
        catchError((err) => {
          console.error(err);
          let message = errorsMessages.acceptShareFailed;
          if (err.message.trim().toLowerCase() === 'not found') {
            message = errorsMessages.acceptShareNotExists;
          }
          return of(ShareActions.acceptShareInvitationFail({ message }));
        }),
      );
    }),
  );

const acceptInvitationSuccessEpic: AppEpic = (action$, _state$, { router }) =>
  action$.pipe(
    filter(ShareActions.acceptShareInvitationSuccess.match),
    switchMap(({ payload }) => {
      if (payload.isApplication) {
        router.push('/marketplace', undefined, { shallow: true });
        //TODO make request for the shared applications to add them into the state when share invitation is accepted.
        return of(ModelsActions.getModels());
      } else {
        router.push('/', undefined, { shallow: true });
      }

      if (payload.isPrompt) {
        return of(UIActions.setShowPromptbar(true));
      } else if (payload.isConversation) {
        return of(UIActions.setShowChatbar(true));
      }
      return EMPTY;
    }),
  );

const acceptInvitationFailEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.acceptShareInvitationFail.match),
    switchMap(({ payload }) => {
      history.replaceState({}, '', window.location.origin);

      return concat(
        of(ShareActions.resetAcceptedEntityInfo()),
        of(ConversationsActions.initSelectedConversations()),
        of(
          UIActions.showErrorToast(
            translate(payload.message || errorsMessages.acceptShareFailed),
          ),
        ),
      );
    }),
  );

const triggerGettingSharedListingsConversationsEpic: AppEpic = (
  action$,
  state$,
) =>
  action$.pipe(
    filter(
      (action) =>
        ConversationsActions.initFoldersAndConversationsSuccess.match(action) ||
        ShareActions.acceptShareInvitationSuccess.match(action) ||
        ShareActions.triggerGettingSharedConversationListings.match(action),
    ),
    filter(() =>
      SettingsSelectors.isSharingEnabled(state$.value, FeatureType.Chat),
    ),
    switchMap(() => {
      return concat(
        of(
          ShareActions.getSharedListing({
            featureType: FeatureType.Chat,
            sharedWith: ShareRelations.me,
          }),
        ),
        of(
          ShareActions.getSharedListing({
            featureType: FeatureType.Chat,
            sharedWith: ShareRelations.others,
          }),
        ),
      );
    }),
  );

const triggerGettingSharedListingsPromptsEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(
      (action) =>
        PromptsActions.initFoldersAndPromptsSuccess.match(action) ||
        ShareActions.acceptShareInvitationSuccess.match(action) ||
        ShareActions.triggerGettingSharedPromptListings.match(action),
    ),
    filter(() =>
      SettingsSelectors.isSharingEnabled(state$.value, FeatureType.Prompt),
    ),
    switchMap(() => {
      return concat(
        of(
          ShareActions.getSharedListing({
            featureType: FeatureType.Prompt,
            sharedWith: ShareRelations.me,
          }),
        ),
        of(
          ShareActions.getSharedListing({
            featureType: FeatureType.Prompt,
            sharedWith: ShareRelations.others,
          }),
        ),
      );
    }),
  );

const triggerGettingSharedListingsAttachmentsEpic: AppEpic = (
  action$,
  state$,
) =>
  action$.pipe(
    filter(
      (action) =>
        (FilesActions.getFilesWithFolders.match(action) &&
          !action.payload.id) ||
        ShareActions.acceptShareInvitationSuccess.match(action) ||
        ShareActions.triggerGettingSharedFilesListings.match(action) ||
        CodeEditorActions.initCodeEditor.match(action),
    ),
    filter(() => {
      return SettingsSelectors.isSharingEnabled(state$.value, FeatureType.Chat);
    }),
    switchMap(() => {
      return concat(
        of(
          ShareActions.getSharedListing({
            featureType: FeatureType.File,
            sharedWith: ShareRelations.me,
          }),
        ),
        of(
          ShareActions.getSharedListing({
            featureType: FeatureType.File,
            sharedWith: ShareRelations.others,
          }),
        ),
      );
    }),
  );

const triggerGettingSharedListingsApplicationsEpic: AppEpic = (
  action$,
  state$,
) =>
  action$.pipe(
    filter(
      (action) =>
        ModelsActions.getModelsSuccess.match(action) ||
        ShareActions.triggerGettingSharedApplicationsListings.match(action),
    ),
    filter(() => {
      return SettingsSelectors.isSharingEnabled(
        state$.value,
        FeatureType.Application,
      );
    }),
    switchMap(() => {
      return concat(
        of(
          ShareActions.getSharedListing({
            featureType: FeatureType.Application,
            sharedWith: ShareRelations.me,
          }),
        ),
        of(
          ShareActions.getSharedListing({
            featureType: FeatureType.Application,
            sharedWith: ShareRelations.others,
          }),
        ),
      );
    }),
  );

const getSharedListingEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.getSharedListing.match),
    mergeMap(({ payload }) => {
      return ShareService.getSharedListing({
        order: 'popular_asc',
        resourceTypes: [
          EnumMapper.getBackendResourceTypeByFeatureType(payload.featureType),
        ],
        with: payload.sharedWith,
      }).pipe(
        switchMap((entities) => {
          return of(
            ShareActions.getSharedListingSuccess({
              featureType: payload.featureType,
              sharedWith: payload.sharedWith,
              resources: entities,
            }),
          );
        }),
        catchError((err) => {
          console.error(err);
          return of(ShareActions.getSharedListingFail());
        }),
      );
    }),
  );

const getSharedListingFailEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.getSharedListingFail.match),
    switchMap(() => {
      return of(
        UIActions.showErrorToast(
          translate(errorsMessages.shareByMeListingFailed),
        ),
      );
    }),
  );

// TODO: refactor it to something better
const getSharedListingSuccessEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(ShareActions.getSharedListingSuccess.match),
    switchMap(({ payload }) => {
      const actions = [];
      const { acceptedId, isFolderAccepted, isConversation, isPrompt } =
        ShareSelectors.selectAcceptedEntityInfo(state$.value);
      const [selectedConv] = ConversationsSelectors.selectSelectedConversations(
        state$.value,
      );

      if (payload.featureType === FeatureType.Chat) {
        if (payload.sharedWith === ShareRelations.others) {
          const conversations = ConversationsSelectors.selectConversations(
            state$.value,
          );
          const folders = ConversationsSelectors.selectFolders(state$.value);

          actions.push(
            ...(payload.resources.folders
              .map((item) => {
                const isShared = folders.find((res) => res.id === item.id);

                if (isShared) {
                  return ConversationsActions.updateFolder({
                    folderId: item.id,
                    values: {
                      isShared: true,
                    },
                  });
                }
                return undefined;
              })
              .filter(Boolean) as AnyAction[]),
          );

          actions.push(
            ...((payload.resources.entities as ConversationInfo[])
              .map((conv) => {
                const sharedConv = conversations.find(
                  (res) => res.id === conv.id,
                );

                if (sharedConv) {
                  return ConversationsActions.updateConversationSuccess({
                    id: conv.id,
                    conversation: {
                      isShared: true,
                      lastActivityDate: sharedConv.lastActivityDate,
                    },
                  });
                }
                return undefined;
              })
              .filter(Boolean) as AnyAction[]),
          );
        } else {
          actions.push(
            ConversationsActions.uploadConversationsFromMultipleFolders({
              paths: payload.resources.folders.map((folder) => folder.id),
              recursive: true,
              pathToSelectFrom:
                isFolderAccepted && isConversation ? acceptedId : undefined,
            }),
          );

          if (acceptedId && isConversation) {
            if (!isFolderAccepted) {
              actions.push(
                ConversationsActions.selectConversations({
                  conversationIds: [acceptedId],
                }),
              );
            }

            actions.push(ShareActions.resetAcceptedEntityInfo());
          }

          if (
            selectedConv &&
            payload.resources.entities.some(
              (conv) => conv.id === selectedConv.id,
            )
          ) {
            actions.push(
              ConversationsActions.selectConversations({
                conversationIds: [selectedConv.id],
              }),
            );
          }

          payload.resources.entities.length &&
            actions.push(
              ConversationsActions.addConversations({
                conversations: payload.resources.entities.map((res) => ({
                  ...res,
                  sharedWithMe: true,
                })) as Conversation[],
              }),
            );
          payload.resources.folders.length &&
            actions.push(
              ConversationsActions.addFolders({
                folders: payload.resources.folders.map((res) => ({
                  ...res,
                  sharedWithMe: true,
                  status: UploadStatus.LOADED,
                })) as FolderInterface[],
              }),
            );
        }
      }
      if (payload.featureType === FeatureType.Prompt) {
        if (payload.sharedWith === ShareRelations.others) {
          const prompts = PromptsSelectors.selectPrompts(state$.value);
          actions.push(
            ...(payload.resources.entities
              .map((item) => {
                const sharedPrompt = prompts.find((res) => res.id === item.id);

                if (sharedPrompt) {
                  return PromptsActions.updatePromptSuccess({
                    id: item.id,
                    prompt: {
                      isShared: true,
                    },
                  });
                }
                return undefined;
              })
              .filter(Boolean) as AnyAction[]),
          );
          const folders = PromptsSelectors.selectFolders(state$.value);
          payload.resources.folders.length &&
            actions.push(
              ...(payload.resources.folders
                .map((item) => {
                  const isShared = folders.find((res) => res.id === item.id);

                  if (isShared) {
                    return PromptsActions.updateFolder({
                      folderId: item.id,
                      values: {
                        isShared: true,
                      },
                    });
                  }
                  return undefined;
                })
                .filter(Boolean) as AnyAction[]),
            );
        } else {
          actions.push(
            PromptsActions.uploadPromptsFromMultipleFolders({
              paths: payload.resources.folders.map((folder) => folder.id),
              recursive: true,
              pathToSelectFrom:
                isFolderAccepted && isPrompt ? acceptedId : undefined,
            }),
          );

          if (acceptedId && isPrompt) {
            if (!isFolderAccepted) {
              actions.push(
                PromptsActions.setSelectedPrompt({
                  promptId: acceptedId,
                }),
              );
              actions.push(
                PromptsActions.uploadPrompt({
                  promptId: acceptedId,
                }),
              );
              actions.push(
                PromptsActions.setIsEditModalOpen({
                  isOpen: true,
                  isPreview: true,
                }),
              );
            }

            if (!selectedConv) {
              // shared with me could be already selected, so we haven't to upload it twice
              actions.push(ConversationsActions.initSelectedConversations());
            }

            actions.push(ShareActions.resetAcceptedEntityInfo());
          }

          const selectedPrompt = PromptsSelectors.selectSelectedPrompt(
            state$.value,
          );

          payload.resources.entities.length &&
            actions.push(
              PromptsActions.addPrompts({
                prompts: payload.resources.entities
                  // do not override selected prompt
                  .filter((res) => res.id !== selectedPrompt?.id)
                  .map((res) => ({
                    ...res,
                    sharedWithMe: true,
                    status: UploadStatus.LOADED,
                  })) as Prompt[],
              }),
            );
          payload.resources.folders.length &&
            actions.push(
              PromptsActions.addFolders({
                folders: payload.resources.folders.map((res) => ({
                  ...res,
                  sharedWithMe: true,
                })) as FolderInterface[],
              }),
            );
        }
      }

      if (payload.featureType === FeatureType.File) {
        if (payload.sharedWith === ShareRelations.others) {
          const files = FilesSelectors.selectFiles(state$.value);

          actions.push(
            FilesActions.setSharedFileIds({
              ids: payload.resources.entities.map((entity) => entity.id),
            }),
          );

          actions.push(
            ...(payload.resources.entities
              .map((item) => {
                const sharedFile = files.find((res) => res.id === item.id);
                if (sharedFile) {
                  return FilesActions.updateFileInfo({
                    id: item.id,
                    file: {
                      isShared: true,
                    },
                  });
                }
                return undefined;
              })
              .filter(Boolean) as AnyAction[]),
          );
        } else {
          const selectedFilesIds = FilesSelectors.selectSelectedFilesIds(
            state$.value,
          );

          payload.resources.entities.length &&
            actions.push(
              FilesActions.addFiles({
                files: payload.resources.entities
                  // do not override selected files
                  .filter((res) => !selectedFilesIds.includes(res.id))
                  .map((res) => ({
                    ...res,
                    sharedWithMe: true,
                  })) as DialFile[],
              }),
            );

          payload.resources.folders.length &&
            actions.push(
              FilesActions.addFolders({
                folders: payload.resources.folders.map((res) => ({
                  ...res,
                  sharedWithMe: true,
                })) as FolderInterface[],
              }),
            );
        }
      }

      if (payload.featureType === FeatureType.Application) {
        const modelsMap = ModelsSelectors.selectModelsMap(state$.value);
        if (payload.sharedWith === ShareRelations.others) {
          const modelsToUpdate = payload.resources.entities
            .map((sharedItem) => {
              const sharedModel = modelsMap[sharedItem.id];

              if (sharedModel) {
                return {
                  reference: sharedModel.reference,
                  updatedValues: {
                    isShared: true,
                  },
                };
              }
              return undefined;
            })
            .filter(Boolean) as ModelUpdatedValues[];

          actions.push(ModelsActions.updateLocalModels({ modelsToUpdate }));
        } else {
          //TODO make request for the shared applications to add them into the state when share invitation is accepted.
          //TODO new action-service needs to be created.

          const updateSharedActions: AnyAction[] = [];
          const modelsToUpdate = payload.resources.entities
            .map((sharedItem) => {
              const sharedModel = modelsMap[sharedItem.id];

              if (sharedModel) {
                return {
                  reference: sharedModel.reference,
                  updatedValues: {
                    sharedWithMe: true,
                    permissions: sharedItem.permissions,
                  },
                };
              }
              return undefined;
            })
            .filter(Boolean) as ModelUpdatedValues[];

          if (modelsToUpdate.length) {
            updateSharedActions.push(
              ModelsActions.updateLocalModels({ modelsToUpdate }),
            );

            updateSharedActions.push(ModelsActions.getInstalledModelIds());

            const { acceptedId } = ShareSelectors.selectAcceptedEntityInfo(
              state$.value,
            );

            const acceptedApplicationReference =
              acceptedId && modelsMap[acceptedId]?.reference;

            if (acceptedApplicationReference) {
              updateSharedActions.push(
                MarketplaceActions.setDetailsModel({
                  reference: acceptedApplicationReference,
                  isSuggested: false,
                }),
              );
              updateSharedActions.push(ShareActions.resetAcceptedEntityInfo());
            }

            actions.push(...updateSharedActions);
          }
        }
      }

      return concat(actions);
    }),
  );

const revokeAccessEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.revokeAccess.match),
    switchMap(({ payload }) => {
      const resourceUrl = payload.isFolder
        ? ApiUtils.encodeApiUrl(payload.resourceId) + '/'
        : ApiUtils.encodeApiUrl(payload.resourceId);

      return ShareService.shareRevoke([resourceUrl]).pipe(
        map(() => ShareActions.revokeAccessSuccess(payload)),
        catchError(() => of(ShareActions.revokeAccessFail())),
      );
    }),
  );

const revokeAccessSuccessEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(ShareActions.revokeAccessSuccess.match),
    switchMap(({ payload }) => {
      if (!payload.isFolder && payload.featureType === FeatureType.Chat) {
        return of(
          ConversationsActions.updateConversationSuccess({
            id: payload.resourceId,
            conversation: {
              isShared: false,
            },
          }),
        );
      }
      if (payload.isFolder && payload.featureType === FeatureType.Chat) {
        return of(
          ConversationsActions.updateFolder({
            folderId: payload.resourceId,
            values: {
              isShared: false,
            },
          }),
        );
      }
      if (!payload.isFolder && payload.featureType === FeatureType.Prompt) {
        return of(
          PromptsActions.updatePromptSuccess({
            id: payload.resourceId,
            prompt: {
              isShared: false,
            },
          }),
        );
      }
      if (payload.isFolder && payload.featureType === FeatureType.Prompt) {
        return of(
          PromptsActions.updateFolder({
            folderId: payload.resourceId,
            values: {
              isShared: false,
            },
          }),
        );
      }

      if (payload.featureType === FeatureType.File) {
        return of(
          FilesActions.updateFileInfo({
            id: payload.resourceId,
            file: {
              isShared: false,
            },
          }),
        );
      }

      if (payload.featureType === FeatureType.Application) {
        const modelsMap = ModelsSelectors.selectModelsMap(state$.value);
        const applicationReference = modelsMap[payload.resourceId]?.reference;

        if (!applicationReference) {
          return EMPTY;
        }
        return of(
          ModelsActions.updateLocalModels({
            modelsToUpdate: [
              {
                reference: applicationReference,
                updatedValues: {
                  isShared: false,
                },
              },
            ],
          }),
        );
      }

      console.error(`Entity not updated: ${payload.resourceId}`);
      return EMPTY;
    }),
  );

const revokeAccessFailEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.revokeAccessFail.match),
    switchMap(() => {
      return of(
        UIActions.showErrorToast(translate(errorsMessages.revokeAccessFailed)),
      );
    }),
  );

const discardSharedWithMeEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.discardSharedWithMe.match),
    switchMap(({ payload }) => {
      const resourceUrls = payload.isFolder
        ? payload.resourceIds.map(
            (resourceId) => ApiUtils.encodeApiUrl(resourceId) + '/',
          )
        : payload.resourceIds.map((resourceId) =>
            ApiUtils.encodeApiUrl(resourceId),
          );

      return ShareService.shareDiscard(resourceUrls).pipe(
        switchMap(() => {
          if (!payload.isFolder && payload.featureType === FeatureType.File) {
            return EMPTY;
          }
          const actions: Observable<AnyAction>[] = payload.resourceIds.map(
            (resourceId) =>
              of(
                ShareActions.discardSharedWithMeSuccess({
                  resourceId,
                  featureType: payload.featureType,
                  isFolder: payload.isFolder,
                }),
              ),
          );
          return concat(...actions);
        }),
        catchError(() => of(ShareActions.discardSharedWithMeFail())),
      );
    }),
  );

const discardSharedWithMeSuccessEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(ShareActions.discardSharedWithMeSuccess.match),
    switchMap(({ payload }) => {
      if (payload.featureType === FeatureType.Chat) {
        const actions: Observable<AnyAction>[] = [];
        const conversations = ConversationsSelectors.selectConversations(
          state$.value,
        );
        const selectedConversationsIds =
          ConversationsSelectors.selectSelectedConversationsIds(state$.value);
        const newSelectedConversationsIds = payload.isFolder
          ? selectedConversationsIds.filter(
              (id) => !id.startsWith(`${payload.resourceId}/`),
            )
          : selectedConversationsIds.filter((id) => id !== payload.resourceId);
        const newConversations = payload.isFolder
          ? conversations.filter(
              (conv) => !conv.id.startsWith(`${payload.resourceId}/`),
            )
          : conversations.filter((conv) => conv.id !== payload.resourceId);

        if (!newSelectedConversationsIds.length) {
          actions.push(
            of(
              ConversationsActions.createNewConversations({
                names: [translate(DEFAULT_CONVERSATION_NAME)],
              }),
            ),
          );
        }

        if (!payload.isFolder) {
          return concat(
            of(
              ConversationsActions.setConversations({
                conversations: newConversations,
              }),
            ),
            ...actions,
          );
        }

        const folders = ConversationsSelectors.selectFolders(state$.value);
        return concat(
          of(
            ConversationsActions.setFolders({
              folders: folders.filter(
                (item) =>
                  item.id !== payload.resourceId &&
                  !item.id.startsWith(`${payload.resourceId}/`),
              ),
            }),
          ),
          of(
            ConversationsActions.setConversations({
              conversations: newConversations,
            }),
          ),
          ...actions,
        );
      }

      if (payload.featureType === FeatureType.Prompt) {
        const prompts = PromptsSelectors.selectPrompts(state$.value);

        if (!payload.isFolder) {
          return of(
            PromptsActions.setPrompts({
              prompts: prompts.filter((item) => item.id !== payload.resourceId),
            }),
          );
        }

        const folders = PromptsSelectors.selectFolders(state$.value);
        return concat(
          of(
            PromptsActions.setFolders({
              folders: folders.filter(
                (item) =>
                  item.id !== payload.resourceId &&
                  !item.id.startsWith(`${payload.resourceId}/`),
              ),
            }),
          ),
          of(
            PromptsActions.setPrompts({
              prompts: prompts.filter(
                (p) => !p.id.startsWith(`${payload.resourceId}/`),
              ),
            }),
          ),
        );
      }

      if (payload.featureType === FeatureType.File) {
        const folders = FilesSelectors.selectFolders(state$.value);
        return concat(
          of(
            FilesActions.setFolders({
              folders: folders.filter(
                (item) =>
                  item.id !== payload.resourceId &&
                  !item.id.startsWith(`${payload.resourceId}/`),
              ),
            }),
          ),
          of(FilesActions.deleteFile({ fileId: payload.resourceId })),
        );
      }

      if (payload.featureType === FeatureType.Application) {
        const modelsMap = ModelsSelectors.selectModelsMap(state$.value);
        const applicationReference = modelsMap[payload.resourceId]?.reference;
        return concat(
          iif(
            () => !!applicationReference,
            of(
              ModelsActions.removeInstalledModels({
                references: [applicationReference ?? ''],
                action: DeleteType.DELETE,
              }),
            ),
            EMPTY,
          ),

          of(MarketplaceActions.setDetailsModel()),
        );
      }

      console.error(`Entity not updated: ${payload.resourceId}`);
      return EMPTY;
    }),
  );

const discardSharedWithMeFailEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(ShareActions.discardSharedWithMeFail.match),
    switchMap(() => {
      return of(
        UIActions.showErrorToast(
          translate(errorsMessages.discardSharedWithMeFailed),
        ),
      );
    }),
  );

const deleteOrRenameSharedFolderEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(
      (action) =>
        ConversationsActions.deleteFolder.match(action) ||
        PromptsActions.deleteFolder.match(action) ||
        ConversationsActions.updateFolder.match(action) ||
        PromptsActions.updateFolder.match(action),
    ),
    switchMap(({ payload }) => {
      const folders = ConversationsSelectors.selectFolders(state$.value);
      const isSharedFolder = folders.find(
        (folder) => folder.id === payload.folderId,
      )?.isShared;
      const requireRevoke =
        'values' in payload && payload.values ? payload.values.name : true;

      return payload.folderId && isSharedFolder && requireRevoke
        ? of(
            ShareActions.revokeAccess({
              resourceId: payload.folderId,
              featureType: FeatureType.Chat,
              isFolder: true,
            }),
          )
        : EMPTY;
    }),
  );

export const ShareEpics = combineEpics(
  shareEpic,
  shareFailEpic,

  shareConversationEpic,
  sharePromptEpic,
  shareConversationFolderEpic,
  sharePromptFolderEpic,
  shareApplicationEpic,

  acceptInvitationEpic,
  acceptInvitationSuccessEpic,
  acceptInvitationFailEpic,

  revokeAccessEpic,
  revokeAccessSuccessEpic,
  revokeAccessFailEpic,

  discardSharedWithMeEpic,
  discardSharedWithMeSuccessEpic,
  discardSharedWithMeFailEpic,

  getSharedListingEpic,
  getSharedListingFailEpic,
  getSharedListingSuccessEpic,

  triggerGettingSharedListingsConversationsEpic,
  triggerGettingSharedListingsPromptsEpic,
  triggerGettingSharedListingsAttachmentsEpic,
  triggerGettingSharedListingsApplicationsEpic,

  deleteOrRenameSharedFolderEpic,
);
