import {
  KeyboardEvent,
  MutableRefObject,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

import classNames from 'classnames';

import { usePromptSelection } from '@/src/hooks/usePromptSelection';
import { useTokenizer } from '@/src/hooks/useTokenizer';
import { useTranslation } from '@/src/hooks/useTranslation';

import { getUserCustomContent } from '@/src/utils/app/file';
import {
  getConversationSchema,
  isFormValueValid,
} from '@/src/utils/app/form-schema';
import { isMobile } from '@/src/utils/app/mobile';
import { getPromptLimitDescription } from '@/src/utils/app/modals';

import { DialFile, DialLink } from '@/src/types/files';
import { Prompt } from '@/src/types/prompt';
import { Translation } from '@/src/types/translation';

import { ChatActions } from '@/src/store/chat/chat.reducer';
import { ChatSelectors } from '@/src/store/chat/chat.selectors';
import {
  ConversationsActions,
  ConversationsSelectors,
} from '@/src/store/conversations/conversations.reducers';
import { FilesActions, FilesSelectors } from '@/src/store/files/files.reducers';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { ModelsSelectors } from '@/src/store/models/models.reducers';
import { SettingsSelectors } from '@/src/store/settings/settings.reducers';
import { UISelectors } from '@/src/store/ui/ui.reducers';

import { errorsMessages } from '@/src/constants/errors';

import { ChatControls } from '@/src/components/Chat/ChatInput/ChatControls';
import { ConfirmDialog } from '@/src/components/Common/ConfirmDialog';

import { ScrollDownButton } from '../../Common/ScrollDownButton';
import { AttachButton } from '../../Files/AttachButton';
import { AdjustedTextarea } from '../ChatMessage/AdjustedTextarea';
import { ChatInputAttachments } from './ChatInputAttachments';
import { PromptList } from './PromptList';
import { PromptVariablesDialog } from './PromptVariablesDialog';
import { ReplayVariables } from './ReplayVariables';

import { Inversify } from '@epam/ai-dial-modulify-ui';
import { Message, Role } from '@epam/ai-dial-shared';

interface Props {
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>;
  showScrollDownButton: boolean;
  onScrollDownClick: () => void;
  onSend: (message: Message) => void;
  onStopConversation: () => void;
  isLastMessageError: boolean;
  onRegenerate: () => void;
  showReplayControls: boolean;
}

const MAX_HEIGHT = 320;

export const ChatInputMessage = Inversify.register(
  'ChatInputMessage',
  ({
    textareaRef,
    showScrollDownButton,
    onScrollDownClick,
    onSend,
    onStopConversation,
    onRegenerate,
    isLastMessageError,
    showReplayControls,
  }: Props) => {
    const { t } = useTranslation(Translation.Chat);
    const dispatch = useAppDispatch();
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [showPluginSelect, setShowPluginSelect] = useState(false);
    const [selectedDialLinks, setSelectedDialLinks] = useState<DialLink[]>([]);
    const promptTemplateMappingRef = useRef(new Map<string, string>());
    const isOverlay = useAppSelector(SettingsSelectors.selectIsOverlay);
    const messageIsStreaming = useAppSelector(
      ConversationsSelectors.selectIsConversationsStreaming,
    );
    const selectedConversations = useAppSelector(
      ConversationsSelectors.selectSelectedConversations,
    );
    const isConversationNameInvalid = useAppSelector(
      ConversationsSelectors.selectIsConversationNameInvalid,
    );
    const isConversationPathInvalid = useAppSelector(
      ConversationsSelectors.selectIsConversationPathInvalid,
    );
    const isReplay = useAppSelector(
      ConversationsSelectors.selectIsReplaySelectedConversations,
    );
    const canAttachFiles = useAppSelector(
      ConversationsSelectors.selectCanAttachFile,
    );
    const canAttachFolders = useAppSelector(
      ConversationsSelectors.selectCanAttachFolders,
    );
    const canAttachLinks = useAppSelector(
      ConversationsSelectors.selectCanAttachLink,
    );
    const maximumAttachmentsAmount = useAppSelector(
      ConversationsSelectors.selectMaximumAttachmentsAmount,
    );
    const selectedFiles = useAppSelector(FilesSelectors.selectSelectedFiles);
    const selectedFolders = useAppSelector(
      FilesSelectors.selectSelectedFolders,
    );
    const isUploadingFilePresent = useAppSelector(
      FilesSelectors.selectIsUploadingFilePresent,
    );

    const isMessageError = useAppSelector(
      ConversationsSelectors.selectIsMessagesError,
    );
    const isLastAssistantMessageEmpty = useAppSelector(
      ConversationsSelectors.selectIsLastAssistantMessageEmpty,
    );
    const isModelsLoaded = useAppSelector(ModelsSelectors.selectIsModelsLoaded);
    const isChatFullWidth = useAppSelector(UISelectors.selectIsChatFullWidth);
    const chatFormValue = useAppSelector(ChatSelectors.selectChatFormValue);

    const shouldRegenerate =
      isLastMessageError ||
      (isLastAssistantMessageEmpty && !messageIsStreaming);

    const selectedModels = useAppSelector(
      ConversationsSelectors.selectSelectedConversationsModels,
    );

    const isChatInputDisabled = useAppSelector(
      ConversationsSelectors.selectIsSelectedConversationBlocksInput,
    );
    const configurationSchema = useAppSelector(
      ChatSelectors.selectConfigurationSchema,
    );

    const isChatEmpty = !selectedConversations[0]?.messages?.length;

    const modelTokenizer =
      selectedModels?.length === 1 ? selectedModels[0]?.tokenizer : undefined;
    const maxTokensLength =
      selectedModels.length === 1
        ? (selectedModels[0]?.limits?.maxRequestTokens ?? Infinity)
        : Infinity;
    const { getTokensLength } = useTokenizer(modelTokenizer);

    const isIsolatedView = useAppSelector(
      SettingsSelectors.selectIsIsolatedView,
    );

    const {
      content,
      setContent,
      addPromptContent,
      activePromptIndex,
      setActivePromptIndex,
      isModalVisible,
      setIsModalVisible,
      isPromptLimitModalOpen,
      setIsPromptLimitModalOpen,
      showPromptList,
      setShowPromptList,
      updatePromptListVisibility,
      filteredPrompts,
      handleKeyDownIfShown,
      getPrompt,
      isLoading,
      selectedPrompt,
    } = usePromptSelection(maxTokensLength, modelTokenizer, '');

    const isSchemaValueValid = useMemo(() => {
      const schema =
        selectedConversations.map(getConversationSchema)?.[0] ??
        configurationSchema;

      if (!schema) return true;

      return isFormValueValid(schema, chatFormValue);
    }, [selectedConversations, configurationSchema, chatFormValue]);

    const isInputEmpty = useMemo(() => {
      return (
        !content.trim().length &&
        !selectedFiles.length &&
        !selectedFolders.length &&
        !selectedDialLinks.length
      );
    }, [
      content,
      selectedDialLinks.length,
      selectedFiles.length,
      selectedFolders.length,
    ]);
    const isSendDisabled =
      isReplay ||
      isMessageError ||
      isInputEmpty ||
      !isModelsLoaded ||
      isUploadingFilePresent ||
      isConversationNameInvalid ||
      isConversationPathInvalid ||
      !isSchemaValueValid;

    const canAttach =
      (canAttachFiles || canAttachFolders || canAttachLinks) &&
      !!maximumAttachmentsAmount;

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const valueTokensLength = getTokensLength(value);

        if (maxTokensLength && valueTokensLength > maxTokensLength) {
          setIsPromptLimitModalOpen(true);
          return;
        }

        setContent(value);
        updatePromptListVisibility(value);
      },
      [
        getTokensLength,
        maxTokensLength,
        setContent,
        setIsPromptLimitModalOpen,
        updatePromptListVisibility,
      ],
    );

    const handleSend = useCallback(() => {
      if (messageIsStreaming) {
        onStopConversation();
        return;
      }

      if (shouldRegenerate) {
        onRegenerate();
        return;
      }

      if (isSendDisabled) {
        return;
      }

      dispatch(ConversationsActions.setIsMessageSending(true));

      const templateMapping = Array.from(
        promptTemplateMappingRef.current,
      ).filter(([key]) => content.includes(key));

      onSend({
        role: Role.User,
        content: content,
        custom_content: {
          ...getUserCustomContent(
            selectedFiles,
            selectedFolders,
            selectedDialLinks,
          ),
          ...(chatFormValue && isChatEmpty
            ? {
                configuration_value: chatFormValue,
                configuration_schema: configurationSchema,
              }
            : {
                form_value: chatFormValue,
              }),
        },
        templateMapping,
      });
      setSelectedDialLinks([]);
      dispatch(FilesActions.resetSelectedFiles());
      dispatch(ChatActions.resetFormValue());
      setContent('');

      if (window.innerWidth < 640 && textareaRef && textareaRef.current) {
        textareaRef.current.blur();
      }
    }, [
      messageIsStreaming,
      shouldRegenerate,
      isSendDisabled,
      dispatch,
      onSend,
      content,
      selectedFiles,
      selectedFolders,
      selectedDialLinks,
      chatFormValue,
      isChatEmpty,
      configurationSchema,
      setContent,
      textareaRef,
      onStopConversation,
      onRegenerate,
    ]);

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (showPromptList && filteredPrompts.length > 0) {
          handleKeyDownIfShown(e);
        } else if (
          e.key === 'Enter' &&
          !isTyping &&
          !isMobile() &&
          !e.shiftKey
        ) {
          e.preventDefault();
          if (isReplay || messageIsStreaming) {
            return;
          }
          handleSend();
        } else if (e.key === '/' && e.metaKey) {
          e.preventDefault();
          setShowPluginSelect(!showPluginSelect);
        }
      },
      [
        showPromptList,
        filteredPrompts.length,
        isTyping,
        handleKeyDownIfShown,
        isReplay,
        messageIsStreaming,
        handleSend,
        showPluginSelect,
      ],
    );

    const handlePromptApply = useCallback(
      (newContent: string) => {
        const valueTokensLength = getTokensLength(newContent);

        if (valueTokensLength > maxTokensLength) {
          setIsPromptLimitModalOpen(true);
          return;
        }

        addPromptContent(newContent);
        if (promptTemplateMappingRef.current) {
          promptTemplateMappingRef.current.set(
            newContent.trim(),
            (
              (filteredPrompts[activePromptIndex] as Prompt)?.content || ''
            ).trim(),
          );
        }

        if (textareaRef && textareaRef.current) {
          textareaRef.current.focus();
        }
      },
      [
        activePromptIndex,
        addPromptContent,
        filteredPrompts,
        getTokensLength,
        maxTokensLength,
        setIsPromptLimitModalOpen,
        textareaRef,
      ],
    );

    const handleUnselectFile = useCallback(
      (fileId: string) => {
        dispatch(FilesActions.unselectFiles({ ids: [fileId] }));
      },
      [dispatch],
    );

    const handleRetry = useCallback(
      (fileId: string) => {
        dispatch(FilesActions.reuploadFile({ fileId }));
      },
      [dispatch],
    );

    const handleSelectAlreadyUploaded = useCallback(
      (result: unknown) => {
        if (typeof result === 'object') {
          const selectedFilesIds = result as string[];
          dispatch(FilesActions.resetSelectedFiles());
          dispatch(
            FilesActions.selectFiles({
              ids: selectedFilesIds,
            }),
          );
        }
      },
      [dispatch],
    );

    const handleUploadFromDevice = useCallback(
      (
        selectedFiles: Required<
          Pick<DialFile, 'fileContent' | 'id' | 'name'>
        >[],
        folderPath: string | undefined,
      ) => {
        selectedFiles.forEach((file) => {
          dispatch(
            FilesActions.uploadFile({
              fileContent: file.fileContent,
              id: file.id,
              relativePath: folderPath,
              name: file.name,
            }),
          );
        });
        dispatch(
          FilesActions.selectFiles({
            ids: selectedFiles.map(({ id }) => id),
          }),
        );
      },
      [dispatch],
    );

    const handleAddLinkToMessage = useCallback((link: DialLink) => {
      setSelectedDialLinks((links) => links.concat([link]));
    }, []);
    const handleUnselectLink = useCallback((unselectedIndex: number) => {
      setSelectedDialLinks((links) =>
        links.filter((_link, index) => unselectedIndex !== index),
      );
    }, []);

    const tooltipContent = (): string => {
      if (messageIsStreaming) {
        return t('Stop generating');
      }
      if (!isModelsLoaded) {
        return t(
          'Please wait for models will be loaded to continue working with conversation',
        );
      }
      if (isReplay) {
        return t(
          'Please continue replay to continue working with conversation',
        );
      }
      if (shouldRegenerate) {
        return t('Regenerate response');
      }
      if (isUploadingFilePresent) {
        return t('Please wait for the attachment to load');
      }
      if (isConversationNameInvalid) {
        return t(errorsMessages.entityNameInvalid);
      }
      if (isConversationPathInvalid) {
        return t(errorsMessages.entityPathInvalid);
      }
      if (!isSchemaValueValid) {
        return t('Please select one of the options above');
      }
      return t('Please type a message');
    };

    const chatInputPlaceholder = useMemo(() => {
      if (isChatInputDisabled) return '';
      if (isOverlay || isIsolatedView) return t('Type a message');
      return t('Type a text or «/» to use a prompt...');
    }, [isOverlay, isIsolatedView, isChatInputDisabled, t]);

    const paddingLeftClass = canAttach
      ? isOverlay
        ? 'pl-11'
        : 'pl-12'
      : isOverlay
        ? 'pl-3'
        : 'pl-4';

    return (
      <div
        className={classNames(
          'mx-2 mb-2 flex flex-row gap-3 md:mx-4 md:mb-0 md:last:mb-6',
          isChatFullWidth ? 'lg:ml-20 lg:mr-[84px]' : 'lg:mx-auto lg:max-w-3xl',
        )}
      >
        <div
          className="relative m-0 flex max-h-[400px] min-h-[38px] w-full grow flex-col rounded bg-layer-3 focus-within:border-accent-primary"
          data-qa="message"
        >
          <AdjustedTextarea
            ref={textareaRef}
            className={classNames(
              'm-0 min-h-[38px] w-full grow resize-none bg-transparent leading-[150%] outline-none placeholder:text-secondary',
              isOverlay ? 'py-[7px] pr-9' : 'py-2.5 pr-10 text-base md:py-3',
              paddingLeftClass,
            )}
            maxHeight={MAX_HEIGHT}
            placeholder={chatInputPlaceholder}
            disabled={isLoading || isChatInputDisabled}
            value={content}
            rows={1}
            onCompositionStart={() => setIsTyping(true)}
            onCompositionEnd={() => setIsTyping(false)}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
          <ChatControls
            showReplayControls={showReplayControls}
            onSend={handleSend}
            tooltip={tooltipContent()}
            isLastMessageError={isLastMessageError}
            isLoading={isLoading}
            isSendDisabled={isSendDisabled}
          />
          {canAttach && (
            <>
              <div className="absolute left-4 top-[calc(50%_-_12px)] cursor-pointer rounded disabled:cursor-not-allowed">
                <AttachButton
                  selectedFilesIds={selectedFiles
                    .map((f) => f.id)
                    .concat(selectedFolders.map((f) => `${f.id}/`))}
                  onSelectAlreadyUploaded={handleSelectAlreadyUploaded}
                  onUploadFromDevice={handleUploadFromDevice}
                  onAddLinkToMessage={handleAddLinkToMessage}
                />
              </div>
              {(selectedFiles.length > 0 ||
                selectedDialLinks.length > 0 ||
                selectedFolders.length > 0) && (
                <div
                  className="mb-2.5 flex max-h-[100px] flex-col gap-1 overflow-auto px-12 md:grid md:grid-cols-3"
                  data-qa="attachment-container"
                >
                  <ChatInputAttachments
                    files={selectedFiles}
                    folders={selectedFolders}
                    links={selectedDialLinks}
                    onUnselectFile={handleUnselectFile}
                    onRetryFile={handleRetry}
                    onUnselectLink={handleUnselectLink}
                  />
                </div>
              )}
            </>
          )}

          {showScrollDownButton && (
            <ScrollDownButton
              className="-top-16 right-0 md:-top-20"
              onScrollDownClick={onScrollDownClick}
            />
          )}

          {showPromptList && filteredPrompts.length > 0 && (
            <div className="absolute bottom-12 w-full">
              <PromptList
                activePromptIndex={activePromptIndex}
                prompts={filteredPrompts}
                onSelect={getPrompt}
                onMouseEnter={setActivePromptIndex}
                isOpen={showPromptList && filteredPrompts.length > 0}
                onClose={() => setShowPromptList(false)}
              />
            </div>
          )}

          {isModalVisible && selectedPrompt && (
            <PromptVariablesDialog
              prompt={selectedPrompt}
              onSubmit={handlePromptApply}
              onClose={() => setIsModalVisible(false)}
            />
          )}
          <ReplayVariables />
        </div>

        <ConfirmDialog
          isOpen={isPromptLimitModalOpen}
          heading={t('Prompt limit exceeded')}
          description={t(
            `Prompt limit is ${maxTokensLength} tokens. ${getPromptLimitDescription(getTokensLength(content), maxTokensLength)}`,
          )}
          confirmLabel={t('Confirm')}
          onClose={() => {
            setIsPromptLimitModalOpen(false);
          }}
        />
      </div>
    );
  },
);
