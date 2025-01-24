import { IconUserShare } from '@tabler/icons-react';
import { MouseEventHandler, useCallback } from 'react';

import { useTranslation } from 'next-i18next';

import classNames from 'classnames';

import { useScreenState } from '@/src/hooks/useScreenState';

import { isApplicationPublic } from '@/src/utils/app/application';
import { isMyApplication } from '@/src/utils/app/id';

import { FeatureType, ScreenState } from '@/src/types/common';
import { DialAIEntityModel } from '@/src/types/models';
import { Translation } from '@/src/types/translation';

import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { SettingsSelectors } from '@/src/store/settings/settings.reducers';
import { ShareActions } from '@/src/store/share/share.reducers';

import { FunctionStatusIndicator } from '@/src/components/Marketplace/FunctionStatusIndicator';

import { ModelIcon } from '../../Chatbar/ModelIcon';
import ShareIcon from '../../Common/ShareIcon';
import { ApplicationTopic } from '../ApplicationTopic';
import { ApplicationCopyLink } from './ApplicationCopyLink';

import { Feature } from '@epam/ai-dial-shared';

const MOBILE_SHARE_ICON_SIZE = 20;
const DESKTOP_SHARE_ICON_SIZE = 30;

interface Props {
  entity: DialAIEntityModel;
}

export const ApplicationDetailsHeader = ({ entity }: Props) => {
  const { t } = useTranslation(Translation.Marketplace);
  const dispatch = useAppDispatch();
  const screenState = useScreenState();

  const shareIconSize =
    screenState === ScreenState.MOBILE
      ? MOBILE_SHARE_ICON_SIZE
      : DESKTOP_SHARE_ICON_SIZE;

  const isMyApp = isMyApplication(entity);
  const isPublicApp = isApplicationPublic(entity);
  const handleOpenSharing: MouseEventHandler<HTMLButtonElement> =
    useCallback(() => {
      dispatch(
        ShareActions.share({
          featureType: FeatureType.Application,
          resourceId: entity.id,
        }),
      );
    }, [dispatch, entity.id]);

  const isApplicationsSharingEnabled = useAppSelector((state) =>
    SettingsSelectors.isFeatureEnabled(state, Feature.ApplicationsSharing),
  );
  // const dispatch = useAppDispatch();

  // const contextMenuItems = useMemo(
  //   () => [
  //     {
  //       BrandIcon: IconLink,
  //       text: t('Copy link'),
  //       onClick: () => {
  //         dispatch(UIActions.showInfoToast(t('Link copied')));
  //       },
  //     },
  //     {
  //       BrandIcon: IconBrandFacebook,
  //       text: t('Share via Facebook'),
  //       onClick: () => {
  //         return 'Share via Facebook';
  //       },
  //     },
  //     {
  //       BrandIcon: IconBrandX,
  //       text: t('Share via X'),
  //       onClick: () => {
  //         return 'Share via X';
  //       },
  //     },
  //   ],
  //   [dispatch, t],
  // );

  return (
    <header className="flex items-start justify-between px-3 py-4 md:p-6">
      <div className="flex items-center gap-2 md:gap-4 ">
        <ShareIcon
          {...entity}
          isHighlighted={false}
          size={shareIconSize}
          featureType={FeatureType.Application}
          iconClassName="bg-layer-3 !stroke-[0.6] !rounded-[4px]"
          iconWrapperClassName="!rounded-[4px]"
        >
          <ModelIcon
            enableShrinking
            isCustomTooltip
            entity={entity}
            entityId={entity.id}
            size={screenState === ScreenState.MOBILE ? 48 : 96}
          />
        </ShareIcon>
        <div className="flex min-w-0 shrink flex-col justify-center gap-1 md:gap-3">
          <div className="flex justify-between">
            <div className="flex w-full flex-col gap-2">
              <div
                className={classNames(
                  'flex flex-wrap gap-2 overflow-hidden truncate',
                  entity.topics?.length ? 'block' : 'hidden',
                )}
              >
                {entity.topics?.map((topic) => (
                  <ApplicationTopic key={topic} topic={topic} />
                ))}
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <div
                  className="shrink truncate text-lg font-semibold leading-[18px] md:text-xl md:leading-6"
                  data-qa="agent-name"
                >
                  {entity.name}
                </div>
                <FunctionStatusIndicator entity={entity} />
              </div>
            </div>
            {/* <div className="flex items-center gap-5">
              <Menu
                listClassName="bg-layer-1 !z-[60] w-[290px]"
                placement="bottom-end"
                type="contextMenu"
                data-qa="application-share-type-select"
                trigger={
                  <button className="hidden items-center gap-3 text-accent-primary md:flex">
                    <IconShare className="[&_path]:fill-current" size={18} />
                    <span className="font-semibold">{t('Share')}</span>
                  </button>
                }
              >
                <div className="divide-y divide-primary">
                  <div className="flex items-center gap-2 px-3 py-4">
                    <ModelIcon
                      isCustomTooltip
                      entity={entity}
                      entityId={entity.id}
                      size={24}
                    />
                    <h5 className="text-xl">{entity.name}</h5>
                  </div>
                  <div>
                    {contextMenuItems.map(({ BrandIcon, text, ...props }) => (
                      <MenuItem
                        key={text}
                        item={
                          <>
                            <BrandIcon size={18} className="text-secondary" />
                            <span>{text}</span>
                          </>
                        }
                        className="flex w-full items-center gap-3 px-3 py-2 hover:bg-accent-primary-alpha"
                        {...props}
                      />
                    ))}
                  </div>
                </div>
              </Menu>
              <button
                className="text-secondary hover:text-accent-primary"
                onClick={onClose}
              >
                <IconX size={24} />
              </button>
            </div> */}
          </div>
          {/* <h2 className="text-lg font-semibold leading-[18px] md:text-xl md:leading-6">
            {application.title}
          </h2> */}
        </div>
      </div>
      {isMyApp && isApplicationsSharingEnabled && (
        <button
          className="flex gap-2 px-3 py-1.5 text-sm text-accent-primary"
          onClick={handleOpenSharing}
        >
          <IconUserShare size={18} />
          <span>{t('Share')}</span>
        </button>
      )}
      {isPublicApp && <ApplicationCopyLink entity={entity} />}
    </header>
  );
};
