import {
  IconFileDescription,
  IconPencilMinus,
  IconTrashX,
  IconUserShare,
  IconWorldShare,
} from '@tabler/icons-react';
import React, { useCallback, useMemo } from 'react';

import classNames from 'classnames';

import { useMenuItemHandler } from '@/src/hooks/useHandler';
import { useScreenState } from '@/src/hooks/useScreenState';
import { useTranslation } from '@/src/hooks/useTranslation';

import {
  getApplicationNextStatus,
  getApplicationSimpleStatus,
  getModelShortDescription,
  getPlayerCaption,
  isApplicationStatusUpdating,
  isExecutableApp,
} from '@/src/utils/app/application';
import {
  isOldConversationReplay,
  isPlaybackConversation,
} from '@/src/utils/app/conversation';
import { isMyApplication } from '@/src/utils/app/id';
import { canWriteSharedWithMe } from '@/src/utils/app/share';
import { PseudoModel, isPseudoModel } from '@/src/utils/server/api';

import { SimpleApplicationStatus } from '@/src/types/applications';
import { Conversation } from '@/src/types/chat';
import { FeatureType } from '@/src/types/common';
import { DisplayMenuItemProps } from '@/src/types/menu';
import { DialAIEntityModel } from '@/src/types/models';
import { Translation } from '@/src/types/translation';

import { ApplicationActions } from '@/src/store/application/application.reducers';
import { AuthSelectors } from '@/src/store/auth/auth.reducers';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { ModelsSelectors } from '@/src/store/models/models.reducers';
import { SettingsSelectors } from '@/src/store/settings/settings.reducers';
import { ShareActions } from '@/src/store/share/share.reducers';

import { REPLAY_AS_IS_MODEL } from '@/src/constants/chat';
import {
  CardIconSizes,
  PlayerContextIconClasses,
  PlayerContextIcons,
} from '@/src/constants/marketplace';

import { ModelVersionSelect } from '@/src/components/Chat/ModelVersionSelect';
import { PlaybackIcon } from '@/src/components/Chat/Playback/PlaybackIcon';
import { ReplayAsIsIcon } from '@/src/components/Chat/ReplayAsIsIcon';
import { ModelIcon } from '@/src/components/Chatbar/ModelIcon';
import ContextMenu from '@/src/components/Common/ContextMenu';
import { EntityMarkdownDescription } from '@/src/components/Common/MarkdownDescription';
import { ApplicationTopic } from '@/src/components/Marketplace/ApplicationTopic';
import { FunctionStatusIndicator } from '@/src/components/Marketplace/FunctionStatusIndicator';

import ShareIcon from '../../Common/ShareIcon';

import IconUserUnshare from '@/public/images/icons/unshare-user.svg';
import { Feature } from '@epam/ai-dial-shared';

interface ApplicationCardProps {
  entity: DialAIEntityModel;
  conversation: Conversation;
  isSelected: boolean;
  disabled: boolean;
  isUnavailableModel: boolean;
  onClick: (entity: DialAIEntityModel) => void;
  onPublish: (entity: DialAIEntityModel) => void;
  onDelete: (entity: DialAIEntityModel) => void;
  onEdit: (entity: DialAIEntityModel) => void;
  onSelectVersion: (entity: DialAIEntityModel) => void;
  onOpenLogs: (entity: DialAIEntityModel) => void;
}

export const TalkToCard = ({
  entity,
  conversation,
  isSelected,
  disabled,
  isUnavailableModel,
  onClick,
  onDelete,
  onEdit,
  onPublish,
  onSelectVersion,
  onOpenLogs,
}: ApplicationCardProps) => {
  const { t } = useTranslation(Translation.Marketplace);

  const dispatch = useAppDispatch();

  const installedModelIds = useAppSelector(
    ModelsSelectors.selectInstalledModelIds,
  );
  const allModels = useAppSelector(ModelsSelectors.selectModels);
  const isCodeAppsEnabled = useAppSelector((state) =>
    SettingsSelectors.isFeatureEnabled(state, Feature.CodeApps),
  );
  const isAdmin = useAppSelector(AuthSelectors.selectIsAdmin);

  const isMyEntity = isMyApplication(entity);

  const canWrite = canWriteSharedWithMe(entity);

  const isExecutable = isExecutableApp(entity) && (isMyEntity || isAdmin); //TODO add  ```|| canWrite``` when core issues #655 and #672 will be ready
  const screenState = useScreenState();

  const isApplicationsSharingEnabled = useAppSelector((state) =>
    SettingsSelectors.isFeatureEnabled(state, Feature.ApplicationsSharing),
  );

  const { iconSize, shareIconSize } = CardIconSizes[screenState];

  const versionsToSelect = useMemo(() => {
    return allModels.filter(
      (model) =>
        entity.name === model.name &&
        entity.version &&
        (installedModelIds.has(model.reference) ||
          (isSelected && entity.reference === model.reference)),
    );
  }, [
    allModels,
    entity.name,
    entity.reference,
    entity.version,
    installedModelIds,
    isSelected,
  ]);

  const isModifyDisabled = isApplicationStatusUpdating(entity);
  const playerStatus = getApplicationSimpleStatus(entity);

  const PlayerContextIcon = PlayerContextIcons[playerStatus];

  const handleUpdateFunctionStatus = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch(
        ApplicationActions.startUpdatingFunctionStatus({
          id: entity.id,
          status: getApplicationNextStatus(entity),
        }),
      );
    },
    [dispatch, entity],
  );

  const handleSelectVersion = useCallback(
    (model: DialAIEntityModel) => {
      onSelectVersion(model);
    },
    [onSelectVersion],
  );

  const handleOpenSharing = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch(
        ShareActions.share({
          featureType: FeatureType.Application,
          resourceId: entity.id,
        }),
      );
    },
    [dispatch, entity.id],
  );

  const handleOpenUnshare = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch(ShareActions.setUnshareEntity(entity));
    },
    [dispatch, entity],
  );

  const handleEdit = useMenuItemHandler(onEdit, entity);
  const handleDelete = useMenuItemHandler(onDelete, entity);
  const handleOpenLogs = useMenuItemHandler(onOpenLogs, entity);
  const handlePublish = useMenuItemHandler(onPublish, entity);

  const menuItems: DisplayMenuItemProps[] = useMemo(
    () => [
      {
        name: t(getPlayerCaption(entity)),
        dataQa: 'status-change',
        disabled: playerStatus === SimpleApplicationStatus.UPDATING,
        display:
          (isAdmin || isMyEntity) && //TODO add  ```|| canWrite``` when core issues #655 will be ready
          !!entity.functionStatus &&
          isCodeAppsEnabled,
        Icon: PlayerContextIcon,
        iconClassName: PlayerContextIconClasses[playerStatus],
        onClick: handleUpdateFunctionStatus,
      },
      {
        name: t('Edit'),
        dataQa: 'edit',
        display: (isMyEntity || !!canWrite) && !!onEdit,
        Icon: IconPencilMinus,
        onClick: handleEdit,
      },
      {
        name: t('Share'),
        dataQa: 'share',
        display: isMyEntity && isApplicationsSharingEnabled,
        Icon: IconUserShare,
        onClick: handleOpenSharing,
      },
      {
        name: t('Unshare'),
        dataQa: 'unshare',
        display: !!entity.sharedWithMe && isApplicationsSharingEnabled,
        Icon: IconUserUnshare,
        onClick: handleOpenUnshare,
      },
      {
        name: t('Publish'),
        dataQa: 'publish',
        display: isMyEntity && !!onPublish,
        Icon: IconWorldShare,
        onClick: handlePublish,
      },
      {
        name: t('Logs'),
        dataQa: 'app-logs',
        display:
          !!isExecutable && playerStatus === SimpleApplicationStatus.UNDEPLOY,
        Icon: IconFileDescription,
        onClick: handleOpenLogs,
      },
      {
        name: t('Delete'),
        dataQa: 'delete',
        display: isMyEntity && !!onDelete,
        disabled: isModifyDisabled,
        Icon: IconTrashX,
        iconClassName: 'stroke-error',
        onClick: handleDelete,
      },
    ],
    [
      t,
      entity,
      playerStatus,
      isAdmin,
      isMyEntity,
      isCodeAppsEnabled,
      PlayerContextIcon,
      handleUpdateFunctionStatus,
      canWrite,
      onEdit,
      handleEdit,
      isApplicationsSharingEnabled,
      handleOpenSharing,
      handleOpenUnshare,
      onPublish,
      handlePublish,
      isExecutable,
      handleOpenLogs,
      onDelete,
      isModifyDisabled,
      handleDelete,
    ],
  );

  const isOldReplay =
    entity.id === REPLAY_AS_IS_MODEL &&
    isOldConversationReplay(conversation.replay);

  return (
    <div
      onClick={() => {
        if (!disabled) {
          onClick(entity);
        }
      }}
      className={classNames(
        'group relative flex flex-col rounded-md border bg-layer-2 p-[11px] md:p-[15px] xl:p-[19px]',
        isSelected && !isUnavailableModel && 'border-accent-primary',
        !isSelected && 'border-primary',
        isUnavailableModel && 'border-error',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-layer-3',
        isOldReplay && 'pb-2',
      )}
      aria-selected={isSelected}
      data-qa="agent"
    >
      <div className="absolute right-4 top-4 flex cursor-pointer gap-1 xl:right-5 xl:top-5">
        <ContextMenu
          menuItems={menuItems}
          featureType={FeatureType.Application}
          triggerIconHighlight
          triggerIconSize={18}
          className="m-0 xl:invisible group-hover:xl:visible"
        />
      </div>
      <div className="flex items-center gap-4 overflow-hidden">
        <div className="flex shrink-0 items-center justify-center xl:my-[3px]">
          {entity.reference === PseudoModel.Playback && (
            <span
              className="shrink-0 rounded-full bg-model-icon"
              style={{
                height: `${iconSize}px`,
                width: `${iconSize}px`,
              }}
            >
              <PlaybackIcon size={iconSize} />
            </span>
          )}
          {entity.reference === REPLAY_AS_IS_MODEL && (
            <ReplayAsIsIcon size={iconSize} />
          )}
          {!isPseudoModel(entity.reference) &&
            entity.reference !== REPLAY_AS_IS_MODEL && (
              <ShareIcon
                {...entity}
                isHighlighted={false}
                size={shareIconSize}
                featureType={FeatureType.Application}
                iconClassName="bg-layer-2 !stroke-[0.6] group-hover:bg-transparent !rounded-[4px]"
                iconWrapperClassName="!rounded-[4px]"
              >
                <ModelIcon
                  entityId={entity.id}
                  entity={entity}
                  size={iconSize}
                />
              </ShareIcon>
            )}
        </div>
        <div className="flex grow flex-col justify-center gap-2 overflow-hidden leading-4">
          {!!versionsToSelect.length && (
            <div className="flex items-center">
              <p className="mr-1 text-xs text-secondary">{t('Version')}: </p>
              <ModelVersionSelect
                readonly={isPlaybackConversation(conversation)}
                className="h-max truncate text-xs"
                entities={versionsToSelect}
                onSelect={handleSelectVersion}
                currentEntity={entity}
              />
            </div>
          )}
          <div className="flex whitespace-nowrap">
            <div
              className={classNames(
                'shrink truncate text-base font-semibold leading-[19px] text-primary',
                !isMyEntity && !entity.version && 'mr-6',
                isUnavailableModel ? 'text-secondary' : 'text-primary',
              )}
              data-qa="agent-name"
            >
              {entity.name}
            </div>
            <FunctionStatusIndicator entity={entity} />
          </div>
          <EntityMarkdownDescription
            className={classNames(
              'hidden text-ellipsis text-sm leading-4',
              isUnavailableModel ? 'text-error' : 'text-secondary',
              entity.id !== REPLAY_AS_IS_MODEL
                ? 'xl:!line-clamp-2'
                : 'xl:block',
            )}
          >
            {getModelShortDescription(entity)}
          </EntityMarkdownDescription>
        </div>
      </div>
      <EntityMarkdownDescription
        className={classNames(
          'mt-3 hidden text-ellipsis text-sm leading-4 md:line-clamp-2 xl:hidden',
          isUnavailableModel ? 'text-error' : 'text-secondary',
        )}
      >
        {getModelShortDescription(entity)}
      </EntityMarkdownDescription>
      <div className="mt-auto">
        <div
          className={classNames(
            'mt-3 flex grow gap-2 overflow-hidden',
            isOldReplay ? 'mt-1.5 md:mt-1 xl:mt-2' : 'xl:mt-4',
          )}
        >
          {isOldReplay && (
            <span className="text-xs leading-[15px] text-error">
              {t(
                'Some messages were created in an older DIAL version and may not replay as expected.',
              )}
            </span>
          )}
          {entity.topics?.map((topic) => (
            <ApplicationTopic key={topic} topic={topic} />
          ))}
        </div>
      </div>
    </div>
  );
};
