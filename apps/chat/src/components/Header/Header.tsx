import { IconX } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';

import classNames from 'classnames';

import { useTranslation } from '@/src/hooks/useTranslation';

import { isMediumScreen, isSmallScreen } from '@/src/utils/app/mobile';
import { centralChatWidth, getNewSidebarWidth } from '@/src/utils/app/sidebar';

import { Translation } from '@/src/types/translation';

import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { SettingsSelectors } from '@/src/store/settings/settings.reducers';
import { UIActions, UISelectors } from '@/src/store/ui/ui.reducers';

import { CENTRAL_CHAT_MIN_WIDTH } from '@/src/constants/chat';
import {
  DEFAULT_HEADER_ICON_SIZE,
  OVERLAY_HEADER_ICON_SIZE,
} from '@/src/constants/default-ui-settings';

import Tooltip from '../Common/Tooltip';
import { SettingDialog } from '../Settings/SettingDialog';
import { CreateNewConversation } from './CreateNewConversation';
import { Logo } from './Logo';
import { User } from './User/User';

import MoveLeftIcon from '@/public/images/icons/move-left.svg';
import MoveRightIcon from '@/public/images/icons/move-right.svg';
import { Inversify } from '@epam/ai-dial-modulify-ui';
import { Feature } from '@epam/ai-dial-shared';

const Header = Inversify.register('Header', () => {
  const showChatbar = useAppSelector(UISelectors.selectShowChatbar);
  const showPromptbar = useAppSelector(UISelectors.selectShowPromptbar);
  const isUserSettingsOpen = useAppSelector(
    UISelectors.selectIsUserSettingsOpen,
  );
  const isOverlay = useAppSelector(SettingsSelectors.selectIsOverlay);

  const [windowWidth, setWindowWidth] = useState<number | undefined>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
  });

  const chatbarWidth = useAppSelector(UISelectors.selectChatbarWidth);
  const promptbarWidth = useAppSelector(UISelectors.selectPromptbarWidth);

  const dispatch = useAppDispatch();

  const { t } = useTranslation(Translation.Header);
  const enabledFeatures = useAppSelector(
    SettingsSelectors.selectEnabledFeatures,
  );

  const handleToggleChatbar = useCallback(() => {
    if (!showChatbar && isMediumScreen()) {
      dispatch(UIActions.setShowPromptbar(false));
    }

    if (!showChatbar && isSmallScreen()) {
      dispatch(UIActions.setIsProfileOpen(false));
    }

    if (!showChatbar && !isMediumScreen()) {
      if (!windowWidth) return;
      const calculatedChatWidth = centralChatWidth({
        oppositeSidebarWidth: promptbarWidth,
        windowWidth,
        currentSidebarWidth: chatbarWidth,
      });

      if (calculatedChatWidth < CENTRAL_CHAT_MIN_WIDTH) {
        const newPromptbarWidth = getNewSidebarWidth({
          windowWidth,
          oppositeSidebarWidth: chatbarWidth,
        });
        dispatch(UIActions.setPromptbarWidth(newPromptbarWidth));
      }
    }

    dispatch(UIActions.setShowChatbar(!showChatbar));
  }, [chatbarWidth, dispatch, promptbarWidth, showChatbar, windowWidth]);

  const handleTogglePromtbar = useCallback(() => {
    if (!showPromptbar && isMediumScreen()) {
      dispatch(UIActions.setShowChatbar(false));
    }

    if (!showPromptbar && isSmallScreen()) {
      dispatch(UIActions.setIsProfileOpen(false));
    }

    if (!showPromptbar && !isMediumScreen()) {
      if (!windowWidth) return;
      const calculatedChatWidth = centralChatWidth({
        oppositeSidebarWidth: chatbarWidth,
        windowWidth,
        currentSidebarWidth: promptbarWidth,
      });

      if (calculatedChatWidth < CENTRAL_CHAT_MIN_WIDTH) {
        const newChatbarWidth = getNewSidebarWidth({
          windowWidth,
          oppositeSidebarWidth: promptbarWidth,
        });
        dispatch(UIActions.setChatbarWidth(newChatbarWidth));
      }
    }

    dispatch(UIActions.setShowPromptbar(!showPromptbar));
  }, [chatbarWidth, dispatch, promptbarWidth, showPromptbar, windowWidth]);

  const onClose = () => {
    dispatch(UIActions.setIsUserSettingsOpen(false));
  };

  const headerIconSize = isOverlay
    ? OVERLAY_HEADER_ICON_SIZE
    : DEFAULT_HEADER_ICON_SIZE;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className={classNames(
        'z-40 flex w-full border-b border-tertiary bg-layer-3',
        isOverlay ? 'min-h-[36px]' : 'min-h-[48px]',
      )}
      data-qa="header"
    >
      {enabledFeatures.has(Feature.ConversationsSection) && (
        <Tooltip isTriggerClickable tooltip={t('Conversation list')}>
          <div
            className="flex h-full cursor-pointer items-center justify-center border-r border-tertiary px-3 md:px-5"
            onClick={handleToggleChatbar}
            data-qa="left-panel-toggle"
          >
            {showChatbar ? (
              <>
                <IconX
                  className="text-secondary md:hidden"
                  width={headerIconSize}
                  height={headerIconSize}
                />

                <MoveLeftIcon
                  className="text-secondary hover:text-accent-secondary max-md:hidden"
                  width={headerIconSize}
                  height={headerIconSize}
                />
              </>
            ) : (
              <MoveRightIcon
                className="text-secondary hover:text-accent-secondary"
                width={headerIconSize}
                height={headerIconSize}
              />
            )}
          </div>
        </Tooltip>
      )}
      {!enabledFeatures.has(Feature.HideNewConversation) && (
        <CreateNewConversation iconSize={headerIconSize} />
      )}
      <div className="flex grow justify-between">
        <Logo />
        <div className="w-[48px] max-md:border-l max-md:border-tertiary md:w-auto">
          <User />
        </div>
      </div>

      {enabledFeatures.has(Feature.PromptsSection) && (
        <Tooltip isTriggerClickable tooltip={t('Prompt list')}>
          <div
            className="flex h-full cursor-pointer items-center justify-center border-l border-tertiary px-3 md:px-5"
            onClick={handleTogglePromtbar}
            data-qa="right-panel-toggle"
          >
            {showPromptbar ? (
              <>
                <IconX
                  className="text-secondary md:hidden"
                  width={headerIconSize}
                  height={headerIconSize}
                />

                <MoveLeftIcon
                  className="rotate-180 text-secondary hover:text-accent-tertiary max-md:hidden"
                  width={headerIconSize}
                  height={headerIconSize}
                />
              </>
            ) : (
              <MoveRightIcon
                className="rotate-180 text-secondary hover:text-accent-tertiary"
                width={headerIconSize}
                height={headerIconSize}
              />
            )}
          </div>
        </Tooltip>
      )}
      <SettingDialog open={isUserSettingsOpen} onClose={onClose} />
    </div>
  );
});
export default Header;
