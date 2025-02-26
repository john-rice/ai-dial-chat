import { useDismiss, useFloating, useInteractions } from '@floating-ui/react';
import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useScreenState } from '@/src/hooks/useScreenState';
import { useTranslation } from '@/src/hooks/useTranslation';

import { isEntityNameOnSameLevelUnique } from '@/src/utils/app/common';
import {
  isPlaybackConversation,
  isReplayConversation,
} from '@/src/utils/app/conversation';
import { constructPath } from '@/src/utils/app/file';
import { getNextDefaultName } from '@/src/utils/app/folders';
import {
  getConversationRootId,
  getIdWithoutRootPathSegments,
  isRootId,
} from '@/src/utils/app/id';
import { defaultMyItemsFilters } from '@/src/utils/app/search';
import { translate } from '@/src/utils/app/translation';

import { Conversation } from '@/src/types/chat';
import { FeatureType, ScreenState, isNotLoaded } from '@/src/types/common';
import { MoveToFolderProps } from '@/src/types/folder';
import { ContextMenuProps } from '@/src/types/menu';
import { SharingType } from '@/src/types/share';
import { Translation } from '@/src/types/translation';

import {
  ConversationsActions,
  ConversationsSelectors,
} from '@/src/store/conversations/conversations.reducers';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { ImportExportActions } from '@/src/store/import-export/importExport.reducers';
import { PublicationSelectors } from '@/src/store/publication/publication.reducers';
import { SettingsSelectors } from '@/src/store/settings/settings.reducers';
import { ShareActions } from '@/src/store/share/share.reducers';
import { UIActions, UISelectors } from '@/src/store/ui/ui.reducers';

import { DEFAULT_FOLDER_NAME } from '@/src/constants/default-ui-settings';
import { PINNED_CONVERSATIONS_SECTION_NAME } from '@/src/constants/sections';

import { PublishModal } from '@/src/components/Chat/Publish/PublishWizard';
import { ExportModal } from '@/src/components/Chatbar/ExportModal';
import { ConfirmDialog } from '@/src/components/Common/ConfirmDialog';
import ItemContextMenu from '@/src/components/Common/ItemContextMenu';
import { MoveToFolderMobileModal } from '@/src/components/Common/MoveToFolderMobileModal';

import {
  ConversationInfo,
  PublishActions,
  UploadStatus,
} from '@epam/ai-dial-shared';

interface ConversationContextMenuProps {
  conversation: ConversationInfo;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  isHeaderMenu?: boolean;
  publicationUrl?: string;
  className?: string;
  TriggerIcon?: ContextMenuProps['TriggerIcon'];
  disabledState?: boolean;
}

export const ConversationContextMenu = ({
  conversation,
  publicationUrl,
  isOpen,
  setIsOpen,
  className,
  TriggerIcon,
  isHeaderMenu,
  disabledState,
}: ConversationContextMenuProps) => {
  const { t } = useTranslation(Translation.Chat);

  const dispatch = useAppDispatch();
  const selectFilteredFoldersSelector = useMemo(
    () =>
      ConversationsSelectors.selectFilteredFolders(
        defaultMyItemsFilters,
        '',
        true,
      ),
    [],
  );

  const folders = useAppSelector(selectFilteredFoldersSelector);
  const allConversations = useAppSelector(
    ConversationsSelectors.selectConversations,
  );
  const resourceToReview = useAppSelector((state) =>
    PublicationSelectors.selectResourceToReviewByReviewUrl(
      state,
      conversation.id,
    ),
  );
  const isPublishingEnabled = useAppSelector((state) =>
    SettingsSelectors.selectIsPublishingEnabled(state, FeatureType.Chat),
  );

  const collapsedSectionsSelector = useMemo(
    () => UISelectors.selectCollapsedSections(FeatureType.Chat),
    [],
  );

  const collapsedSections = useAppSelector(collapsedSectionsSelector);

  const [isShowMoveToModal, setIsShowMoveToModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isShowExportModal, setIsShowExportModal] = useState(false);
  const [isUnshareConfirmOpened, setIsUnshareConfirmOpened] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  const screenState = useScreenState();

  const { refs, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
  });

  useEffect(() => {
    if (isOpen && isNotLoaded(conversation.status)) {
      dispatch(
        ConversationsActions.uploadConversationsByIds({
          conversationIds: [conversation.id],
        }),
      );
    }
  }, [conversation.id, conversation.status, dispatch, isOpen]);

  const isReplay = isReplayConversation(conversation);
  const isPlayback = isPlaybackConversation(conversation);
  const isEmptyConversation = !(
    (conversation as Conversation).messages?.length > 0
  );

  const isUnpublishVisible =
    !(isHeaderMenu && resourceToReview) && !isReplay && !publicationUrl;

  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  const handleOpenExportModal = useCallback(() => {
    setIsShowExportModal(true);
  }, []);

  const handleCloseExportModal = useCallback(() => {
    setIsShowExportModal(false);
  }, []);

  useEffect(() => {
    if (screenState !== ScreenState.MOBILE) {
      setIsShowMoveToModal(false);
      handleCloseExportModal();
    }
  }, [handleCloseExportModal, screenState]);

  const handleOpenDeleteModal: MouseEventHandler<HTMLButtonElement> =
    useCallback((e) => {
      e.stopPropagation();

      setIsDeleting(true);
    }, []);

  const handleUnshare: MouseEventHandler<HTMLButtonElement> =
    useCallback(() => {
      setIsUnshareConfirmOpened(true);
      setIsOpen(false);
    }, [setIsOpen]);

  const handleOpenPublishing = useCallback(() => {
    setIsPublishing(true);
  }, []);

  const handleOpenUnpublishing = useCallback(() => {
    setIsUnpublishing(true);
  }, []);

  const handleClosePublishModal = useCallback(() => {
    setIsPublishing(false);
    setIsUnpublishing(false);
  }, []);

  const handleMoveToFolder = useCallback(
    ({ folderId, isNewFolder }: MoveToFolderProps) => {
      const conversationRootId = getConversationRootId();
      const folderPath = (
        isNewFolder
          ? getNextDefaultName(
              translate(DEFAULT_FOLDER_NAME),
              folders.filter((f) => f.folderId === conversationRootId), // only my root conversation folders
            )
          : folderId
      ) as string;

      if (
        !isEntityNameOnSameLevelUnique(
          conversation.name,
          { ...conversation, folderId: folderPath },
          allConversations,
        )
      ) {
        dispatch(
          UIActions.showErrorToast(
            t(
              'Conversation with name "{{name}}" already exists in this folder.',
              {
                ns: Translation.Chat,
                name: conversation.name,
              },
            ),
          ),
        );

        return;
      }

      if (isNewFolder) {
        dispatch(
          ConversationsActions.createFolder({
            name: folderPath,
            parentId: getConversationRootId(),
          }),
        );
      }

      dispatch(
        UIActions.setCollapsedSections({
          featureType: FeatureType.Chat,
          collapsedSections: collapsedSections.filter(
            (section) => section !== PINNED_CONVERSATIONS_SECTION_NAME,
          ),
        }),
      );
      dispatch(
        ConversationsActions.updateConversation({
          id: conversation.id,
          values: {
            folderId: isNewFolder
              ? constructPath(getConversationRootId(), folderPath)
              : folderPath,
          },
        }),
      );
    },
    [allConversations, collapsedSections, conversation, dispatch, folders, t],
  );

  const handleCompare: MouseEventHandler<HTMLButtonElement> =
    useCallback(() => {
      if (isReplay || isPlayback) return;
      dispatch(
        ConversationsActions.selectConversations({
          conversationIds: [conversation.id],
        }),
      );
      dispatch(UIActions.setIsCompareMode(true));
    }, [conversation.id, dispatch, isPlayback, isReplay]);

  const handleDuplicate: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.stopPropagation();

      setIsOpen(false);
      dispatch(ConversationsActions.duplicateConversation(conversation));
    },
    [conversation, dispatch, setIsOpen],
  );

  const handleExport = useCallback(
    (args?: unknown) => {
      const typedArgs = args as { withAttachments?: boolean };

      dispatch(
        ImportExportActions.exportConversation({
          conversationId: conversation.id,
          withAttachments: typedArgs?.withAttachments ?? false,
        }),
      );
      handleCloseExportModal();
    },
    [conversation.id, dispatch, handleCloseExportModal],
  );

  const handleStartReplay: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.stopPropagation();
      setIsOpen(false);
      dispatch(ConversationsActions.createNewReplayConversation(conversation));
    },
    [conversation, dispatch, setIsOpen],
  );

  const handleCreatePlayback: MouseEventHandler<HTMLButtonElement> =
    useCallback(() => {
      dispatch(
        ConversationsActions.createNewPlaybackConversation(conversation),
      );
      setIsOpen(false);
    }, [conversation, dispatch, setIsOpen]);

  const handleOpenSharing: MouseEventHandler<HTMLButtonElement> =
    useCallback(() => {
      dispatch(
        ShareActions.share({
          featureType: FeatureType.Chat,
          resourceId: conversation.id,
        }),
      );
      setIsOpen(false);
    }, [conversation.id, dispatch, setIsOpen]);

  const handleSelect: MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      e.stopPropagation();
      setIsOpen(false);
      dispatch(
        ConversationsActions.setChosenConversations({
          ids: [conversation.id],
        }),
      );
    },
    [conversation.id, dispatch, setIsOpen],
  );

  const handleDelete = useCallback(() => {
    if (conversation.sharedWithMe) {
      dispatch(
        ShareActions.discardSharedWithMe({
          resourceIds: [conversation.id],
          featureType: FeatureType.Chat,
        }),
      );
    } else {
      dispatch(
        ConversationsActions.deleteConversations({
          conversationIds: [conversation.id],
        }),
      );
    }
    setIsDeleting(false);
  }, [conversation.id, conversation.sharedWithMe, dispatch]);

  const handleOpenRenameModal = useCallback(() => {
    dispatch(ConversationsActions.setRenamingConversationId(conversation.id));
  }, [conversation, dispatch]);

  return (
    <>
      <button
        ref={refs.setFloating}
        {...getFloatingProps()}
        data-qa="dots-menu"
        disabled={disabledState}
        className="group"
      >
        <ItemContextMenu
          TriggerIcon={TriggerIcon}
          className={className}
          entity={conversation}
          isEmptyConversation={!isReplay && !isPlayback && isEmptyConversation}
          folders={folders}
          featureType={FeatureType.Chat}
          onOpenMoveToModal={() => setIsShowMoveToModal(true)}
          onMoveToFolder={handleMoveToFolder}
          onDelete={handleOpenDeleteModal}
          onRename={handleOpenRenameModal}
          onExport={handleExport}
          onOpenExportModal={handleOpenExportModal}
          onCompare={!isReplay && !isPlayback ? handleCompare : undefined}
          onDuplicate={handleDuplicate}
          onReplay={!isReplay && !isPlayback ? handleStartReplay : undefined}
          onPlayback={
            !isReplay && !isPlayback ? handleCreatePlayback : undefined
          }
          onShare={!isReplay ? handleOpenSharing : undefined}
          onUnshare={!isReplay ? handleUnshare : undefined}
          onPublish={!isReplay ? handleOpenPublishing : undefined}
          onUnpublish={isUnpublishVisible ? handleOpenUnpublishing : undefined}
          onOpenChange={setIsOpen}
          isOpen={isOpen}
          isLoading={conversation.status !== UploadStatus.LOADED}
          onSelect={isHeaderMenu ? undefined : handleSelect}
          useStandardColor={isHeaderMenu}
        />
      </button>

      {isShowMoveToModal && (
        <MoveToFolderMobileModal
          onClose={() => {
            setIsShowMoveToModal(false);
          }}
          folders={folders}
          onMoveToFolder={handleMoveToFolder}
        />
      )}

      {isShowExportModal && (
        <ExportModal onExport={handleExport} onClose={handleCloseExportModal} />
      )}

      {isPublishingEnabled && (isPublishing || isUnpublishing) && (
        <PublishModal
          entity={conversation}
          type={SharingType.Conversation}
          isOpen={isPublishing || isUnpublishing}
          onClose={handleClosePublishModal}
          publishAction={
            isPublishing ? PublishActions.ADD : PublishActions.DELETE
          }
          defaultPath={
            isUnpublishing && !isRootId(conversation.folderId)
              ? getIdWithoutRootPathSegments(conversation.folderId)
              : undefined
          }
        />
      )}

      {isUnshareConfirmOpened && (
        <ConfirmDialog
          isOpen
          heading={t('Confirm unsharing: {{conversationName}}', {
            conversationName: conversation.name,
          })}
          description={t(
            'Are you sure that you want to unshare this conversation?',
          )}
          confirmLabel={t('Unshare')}
          cancelLabel={t('Cancel')}
          onClose={(result) => {
            setIsUnshareConfirmOpened(false);
            if (result) {
              dispatch(
                ShareActions.revokeAccess({
                  resourceId: conversation.id,
                  featureType: FeatureType.Chat,
                }),
              );
            }
          }}
        />
      )}

      {isDeleting && (
        <ConfirmDialog
          isOpen
          heading={t('Confirm deleting conversation')}
          description={`${t('Are you sure that you want to delete a conversation?')}${t(
            conversation.isShared
              ? '\nDeleting will stop sharing and other users will no longer see this conversation.'
              : '',
          )}`}
          confirmLabel={t('Delete')}
          cancelLabel={t('Cancel')}
          onClose={(result) => {
            setIsDeleting(false);
            if (result) handleDelete();
          }}
        />
      )}
    </>
  );
};
