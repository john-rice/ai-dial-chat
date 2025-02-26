/*eslint-disable @next/next/no-img-element*/
import { IconSettings } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useCallback, useState } from 'react';

import classNames from 'classnames';

import { useLogout } from '@/src/hooks/useLogout';
import { useTranslation } from '@/src/hooks/useTranslation';

import { ScreenState } from '@/src/types/common';
import { Translation } from '@/src/types/translation';

import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { SettingsSelectors } from '@/src/store/settings/settings.reducers';
import { UIActions, UISelectors } from '@/src/store/ui/ui.reducers';

import { ConfirmDialog } from '@/src/components/Common/ConfirmDialog';
import { FooterMessage } from '@/src/components/Common/FooterMessage';

import LogOutIcon from '../../../../public/images/icons/log-out.svg';
import UserIcon from '../../../../public/images/icons/user.svg';
import { withRenderWhen } from '../../Common/RenderWhen';
import { withRenderForScreen } from '../../Common/ScreenRender';

import { Inversify } from '@epam/ai-dial-modulify-ui';

const UserInfo = () => {
  const { t } = useTranslation(Translation.Header);

  const { data: session } = useSession();

  return (
    <div className="w-full border-b border-tertiary p-2 text-primary">
      <div className="flex h-[42px] items-center">
        {session?.user?.image ? (
          <img
            className="mx-2 rounded"
            src={session?.user?.image}
            width={18}
            height={18}
            alt={t('User avatar')}
          />
        ) : (
          <UserIcon className="mx-2 text-secondary" width={18} height={18} />
        )}

        <span className="grow" data-qa="username">
          {session?.user?.name ?? ''}
        </span>
      </div>
    </div>
  );
};

const UserSettings = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation(Translation.Header);

  const onClick = useCallback(() => {
    dispatch(UIActions.setIsUserSettingsOpen(true));
  }, [dispatch]);

  return (
    <div
      id="user-settings-menu-item"
      className="flex h-[42px] cursor-pointer items-center gap-2 px-2"
      onClick={onClick}
    >
      <IconSettings className="text-secondary" size={18} />
      <span>{t('Settings')}</span>
    </div>
  );
};

const Logout = () => {
  const { session, handleLogout } = useLogout();
  const { t } = useTranslation(Translation.Header);
  const [isLogoutConfirmationOpened, setIsLogoutConfirmationOpened] =
    useState(false);

  return (
    <>
      <div
        id="logout-menu-item"
        className="flex h-[42px] cursor-pointer items-center gap-2 px-2"
        onClick={() => {
          if (!session) {
            handleLogout();
            return;
          }
          setIsLogoutConfirmationOpened(true);
        }}
      >
        <LogOutIcon className="text-secondary" width={18} height={18} />
        <span>{session ? t('Log out') : t('Login')}</span>
      </div>
      <ConfirmDialog
        isOpen={isLogoutConfirmationOpened}
        heading={t('Confirm logging out')}
        description={t('Are you sure that you want to log out?')}
        confirmLabel={t('Log out')}
        cancelLabel={t('Cancel')}
        onClose={(result) => {
          setIsLogoutConfirmationOpened(false);
          if (result) {
            handleLogout();
          }
        }}
      />
    </>
  );
};
const UserMenu = () => {
  return (
    <div className="flex flex-col gap-1 p-2">
      <UserSettings />
      <Logout />
    </div>
  );
};

const UserMobileView = Inversify.register('UserMobile', () => {
  const isOverlay = useAppSelector(SettingsSelectors.selectIsOverlay);

  return (
    <div
      className={classNames(
        'fixed right-0 z-40 flex w-[260px] flex-col overflow-y-auto border-tertiary bg-layer-3 md:hidden',
        isOverlay ? 'top-9 h-[calc(100%-36px)]' : 'top-12 h-[calc(100%-48px)]',
      )}
      data-qa="profile-panel"
    >
      <UserInfo />
      <UserMenu />
      <div className="grow"></div>
      <div className="border-t border-tertiary p-4">
        <FooterMessage />
      </div>
    </div>
  );
});

export const UserMobile = withRenderForScreen([ScreenState.MOBILE])(
  withRenderWhen(UISelectors.selectIsProfileOpen)(UserMobileView),
);
