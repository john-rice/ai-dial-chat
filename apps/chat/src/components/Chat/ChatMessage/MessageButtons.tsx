import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconListDetails,
  IconRefresh,
  IconThumbDown,
  IconThumbUp,
  IconTrashX,
} from '@tabler/icons-react';
import { ButtonHTMLAttributes, FC } from 'react';

import classNames from 'classnames';

import { useTranslation } from '@/src/hooks/useTranslation';

import { getMessageCustomContent } from '@/src/utils/server/chat';

import { Translation } from '@/src/types/translation';

import { ConversationsSelectors } from '@/src/store/conversations/conversations.reducers';
import { useAppSelector } from '@/src/store/hooks';
import { SettingsSelectors } from '@/src/store/settings/settings.reducers';

import { MenuItem } from '@/src/components/Common/DropdownMenu';
import Tooltip from '@/src/components/Common/Tooltip';

import { LikeState, Message, Role } from '@epam/ai-dial-shared';

const Button: FC<ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className,
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      className={classNames(
        '[&:not(:disabled)]:hover:text-accent-primary',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};

interface MessageUserButtonsProps {
  toggleEditing: () => void;
  onDelete: () => void;
  isEditAvailable: boolean;
  isMessageStreaming: boolean;
  editDisabled?: boolean;
  isEditTemplatesAvailable: boolean;
  onToggleTemplatesEditing: () => void;
}

export const MessageUserButtons = ({
  onDelete,
  toggleEditing,
  isEditAvailable,
  editDisabled,
  isMessageStreaming,
  isEditTemplatesAvailable,
  onToggleTemplatesEditing,
}: MessageUserButtonsProps) => {
  const { t } = useTranslation(Translation.Chat);

  const isOverlay = useAppSelector(SettingsSelectors.selectIsOverlay);
  const isConversationsWithSchema = useAppSelector(
    ConversationsSelectors.selectIsSelectedConversationsWithSchema,
  );

  return (
    <div
      className={classNames(
        'flex h-[18px] w-full items-center justify-end gap-2',
        isOverlay ? 'mt-3' : 'mt-4',
      )}
    >
      {!isMessageStreaming && (
        <>
          {isEditTemplatesAvailable && !isConversationsWithSchema && (
            <Tooltip
              placement="top"
              isTriggerClickable
              tooltip={t('Set message template')}
            >
              <button
                className="text-secondary hover:text-accent-primary disabled:cursor-not-allowed"
                onClick={onToggleTemplatesEditing}
              >
                <IconListDetails size={18} />
              </button>
            </Tooltip>
          )}
          {isEditAvailable && !editDisabled && (
            <Tooltip placement="top" isTriggerClickable tooltip={t('Edit')}>
              <button
                className="text-secondary hover:text-accent-primary disabled:cursor-not-allowed"
                onClick={toggleEditing}
              >
                <IconEdit size={18} />
              </button>
            </Tooltip>
          )}
          <Tooltip placement="top" isTriggerClickable tooltip={t('Delete')}>
            <button
              className="text-secondary hover:text-accent-primary"
              onClick={onDelete}
            >
              <IconTrashX size={18} />
            </button>
          </Tooltip>
        </>
      )}
    </div>
  );
};

interface MessageAssistantButtonsProps {
  messageCopied?: boolean;
  copyOnClick: () => void;
  isLikesEnabled: boolean;
  message: Message;
  onLike: (likeStatus: LikeState) => void;
  onRegenerate?: () => void;
}

export const MessageAssistantButtons = ({
  messageCopied,
  copyOnClick,
  message,
  isLikesEnabled,
  onLike,
  onRegenerate,
}: MessageAssistantButtonsProps) => {
  const { t } = useTranslation(Translation.Chat);

  const isOverlay = useAppSelector(SettingsSelectors.selectIsOverlay);

  return (
    <div
      className={classNames(
        'flex w-full justify-end gap-2',
        isOverlay ? 'mt-3' : 'mt-4',
      )}
    >
      {onRegenerate && (
        <Tooltip placement="top" isTriggerClickable tooltip={t('Regenerate')}>
          <Button
            onClick={onRegenerate}
            data-qa="regenerate"
            className="text-secondary"
          >
            <IconRefresh size={18} />
          </Button>
        </Tooltip>
      )}
      {message.content.trim() &&
        (messageCopied ? (
          <Tooltip key="copied" placement="top" tooltip={t('Text copied')}>
            <IconCheck size={18} className="text-secondary" />
          </Tooltip>
        ) : (
          <Tooltip
            key="copy"
            placement="top"
            isTriggerClickable
            tooltip={t('Copy text')}
          >
            <Button className="text-secondary" onClick={copyOnClick}>
              <IconCopy size={18} />
            </Button>
          </Tooltip>
        ))}
      <div className="flex flex-row gap-2">
        {isLikesEnabled &&
          (message.content.trim() || !!getMessageCustomContent(message)) && (
            <>
              {message.like !== LikeState.Disliked && (
                <Tooltip
                  placement="top"
                  isTriggerClickable={message.like !== LikeState.Liked}
                  tooltip={
                    message.like !== LikeState.Liked ? t('Like') : t('Liked')
                  }
                >
                  <Button
                    onClick={() => {
                      if (message.like !== LikeState.NoState) {
                        onLike(LikeState.Liked);
                      }
                    }}
                    className={
                      message.like !== LikeState.Liked
                        ? 'text-secondary'
                        : 'text-accent-primary'
                    }
                    disabled={message.like === LikeState.Liked}
                    data-qa="like"
                  >
                    <IconThumbUp size={18} />
                  </Button>
                </Tooltip>
              )}
              {message.like !== LikeState.Liked && (
                <Tooltip
                  placement="top"
                  isTriggerClickable={message.like !== LikeState.Disliked}
                  tooltip={
                    message.like !== LikeState.Disliked
                      ? t('Dislike')
                      : t('Disliked')
                  }
                >
                  <Button
                    onClick={() => {
                      if (message.like !== LikeState.NoState) {
                        onLike(LikeState.Disliked);
                      }
                    }}
                    className={
                      message.like !== LikeState.Disliked
                        ? 'text-secondary'
                        : 'text-accent-primary'
                    }
                    disabled={message.like === LikeState.Disliked}
                    data-qa="dislike"
                  >
                    <IconThumbDown size={18} />
                  </Button>
                </Tooltip>
              )}
            </>
          )}
      </div>
    </div>
  );
};

interface MessageMobileButtonsProps {
  message: Message;
  onCopy: () => void;
  messageCopied: boolean;
  editDisabled: boolean;
  onLike: (likeStatus: LikeState) => void;
  onDelete: () => void;
  isEditing: boolean;
  onToggleEditing: (value: boolean) => void;
  isEditTemplatesAvailable: boolean;
  onToggleTemplatesEditing: () => void;
  isLastMessage: boolean;
  isLikesEnabled: boolean;
  isMessageStreaming: boolean;
  onRegenerate?: () => void;
  isConversationInvalid: boolean;
}

export const MessageMobileButtons = ({
  messageCopied,
  editDisabled,
  message,
  isLikesEnabled,
  onLike,
  onCopy,
  onDelete,
  isEditing,
  onToggleEditing,
  isEditTemplatesAvailable,
  onToggleTemplatesEditing,
  onRegenerate,
  isLastMessage,
  isMessageStreaming,
  isConversationInvalid,
}: MessageMobileButtonsProps) => {
  const { t } = useTranslation(Translation.Chat);

  const isConversationsWithSchema = useAppSelector(
    ConversationsSelectors.selectIsSelectedConversationsWithSchema,
  );

  const isAssistant = message.role === Role.Assistant;

  if (isAssistant) {
    return (
      !(isMessageStreaming && isLastMessage) &&
      !isConversationInvalid && (
        <>
          {message.content.trim() &&
            (messageCopied ? (
              <MenuItem
                item={
                  <div className="flex items-center gap-3">
                    <IconCheck size={20} className="text-secondary" />
                    <p>{t('Copied')}</p>
                  </div>
                }
              />
            ) : (
              <MenuItem
                className="hover:bg-accent-primary-alpha"
                item={
                  <div className="flex items-center gap-3">
                    <IconCopy className="text-secondary" size={18} />
                    {t('Copy')}
                  </div>
                }
                onClick={onCopy}
              />
            ))}
          {onRegenerate && (
            <MenuItem
              item={
                <div className="flex items-center gap-3">
                  <IconRefresh className="text-secondary" size={18} />
                  {t('Regenerate')}
                </div>
              }
              data-qa="regenerate"
              onClick={onRegenerate}
            />
          )}
          {isLikesEnabled &&
            (message.content.trim() || !!getMessageCustomContent(message)) && (
              <>
                {message.like !== LikeState.Disliked && (
                  <MenuItem
                    className={classNames(
                      message.like !== LikeState.Liked &&
                        'hover:bg-accent-primary-alpha',
                    )}
                    item={
                      <div className="flex items-center gap-3">
                        <IconThumbUp className="text-secondary" size={18} />
                        <p
                          className={classNames(
                            message.like === LikeState.Liked &&
                              'text-secondary',
                          )}
                        >
                          {message.like === LikeState.Liked
                            ? t('Liked')
                            : t('Like')}
                        </p>
                      </div>
                    }
                    disabled={message.like === LikeState.Liked}
                    data-qa="like"
                    onClick={() => {
                      if (message.like !== LikeState.NoState) {
                        onLike(LikeState.Liked);
                      }
                    }}
                  />
                )}
                {message.like !== LikeState.Liked && (
                  <MenuItem
                    disabled={message.like === LikeState.Disliked}
                    className={classNames(
                      message.like !== LikeState.Disliked &&
                        'hover:bg-accent-primary-alpha',
                    )}
                    data-qa="dislike"
                    item={
                      <div className="flex items-center gap-3">
                        <IconThumbDown className="text-secondary" size={18} />
                        <p
                          className={classNames(
                            message.like === LikeState.Disliked &&
                              'text-secondary',
                          )}
                        >
                          {message.like === LikeState.Disliked
                            ? t('Disliked')
                            : t('Dislike')}
                        </p>
                      </div>
                    }
                    onClick={() => {
                      if (message.like !== LikeState.NoState) {
                        onLike(LikeState.Disliked);
                      }
                    }}
                  />
                )}
              </>
            )}
        </>
      )
    );
  }

  return (
    !isMessageStreaming &&
    !isConversationInvalid && (
      <>
        {isEditTemplatesAvailable && !isConversationsWithSchema && (
          <MenuItem
            className="hover:bg-accent-primary-alpha focus:visible disabled:cursor-not-allowed group-hover:visible"
            onClick={() => onToggleTemplatesEditing()}
            item={
              <div className="flex items-center gap-3 whitespace-nowrap">
                <IconListDetails
                  className="text-secondary"
                  size={18}
                  height={18}
                  width={18}
                />
                <p className="whitespace-nowrap">{t('Set template')}</p>
              </div>
            }
          />
        )}
        {!editDisabled && (
          <MenuItem
            className="hover:bg-accent-primary-alpha focus:visible disabled:cursor-not-allowed group-hover:visible"
            onClick={() => onToggleEditing(!isEditing)}
            item={
              <div className="flex items-center gap-3">
                <IconEdit className="text-secondary" size={18} />
                <p>{t('Edit')}</p>
              </div>
            }
          />
        )}
        <MenuItem
          className="hover:bg-accent-primary-alpha focus:visible group-hover:visible"
          onClick={onDelete}
          item={
            <div className="flex items-center gap-3">
              <IconTrashX className="text-secondary" size={18} />
              <p>{t('Delete')}</p>
            </div>
          }
        />
      </>
    )
  );
};
