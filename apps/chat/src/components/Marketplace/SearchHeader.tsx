import { IconChevronDown, IconPlus, IconSearch } from '@tabler/icons-react';
import { ChangeEvent, useMemo, useState } from 'react';

import classNames from 'classnames';

import { useTranslation } from '@/src/hooks/useTranslation';

import { ApplicationType } from '@/src/types/applications';
import { FeatureType } from '@/src/types/common';
import { DisplayMenuItemProps } from '@/src/types/menu';
import { Translation } from '@/src/types/translation';

import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
  MarketplaceActions,
  MarketplaceSelectors,
} from '@/src/store/marketplace/marketplace.reducers';
import { SettingsSelectors } from '@/src/store/settings/settings.reducers';

import { MarketplaceTabs } from '@/src/constants/marketplace';

import ContextMenu from '@/src/components/Common/ContextMenu';

import { Feature } from '@epam/ai-dial-shared';

// const countLabel = {
//   [MarketplaceTabs.HOME]: 'DIAL Marketplace',
//   [MarketplaceTabs.MY_APPLICATIONS]: 'My workspace',
// };

interface AddAppButtonProps {
  menuItems: DisplayMenuItemProps[];
}

const AddAppButton = ({ menuItems }: AddAppButtonProps) => {
  const { t } = useTranslation(Translation.Marketplace);
  const [isOpen, setIsOpen] = useState(false);

  const visibleActions = useMemo(() => {
    return menuItems.filter((item) => item.display);
  }, [menuItems]);

  if (!visibleActions.length) return null;

  if (visibleActions.length === 1)
    return (
      <button
        onClick={visibleActions[0].onClick}
        className="button button-primary hidden items-center gap-2 py-2 sm:flex"
      >
        <IconPlus size={18} />
        <span>{t('Add app')}</span>
      </button>
    );

  return (
    <ContextMenu
      menuItems={menuItems}
      featureType={FeatureType.Application}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      placement="bottom"
      TriggerCustomRenderer={
        <button
          className="button button-primary hidden items-center gap-2 py-2 sm:flex"
          data-qa="add-app"
        >
          <span>{t('Add app')}</span>
          <IconChevronDown
            size={18}
            className={classNames(isOpen && 'rotate-180')}
          />
        </button>
      }
    />
  );
};

interface SearchHeaderProps {
  items: number;
  onAddApplication: (type: ApplicationType) => void;
}

interface MenuItem {
  type: ApplicationType;
  name: string;
  dataQa: string;
  display: boolean;
}

export const SearchHeader = ({
  // items,
  onAddApplication,
}: SearchHeaderProps) => {
  const { t } = useTranslation(Translation.Marketplace);

  const dispatch = useAppDispatch();
  const enabledFeatures = useAppSelector(
    SettingsSelectors.selectEnabledFeatures,
  );
  const isCustomApplicationsEnabled = enabledFeatures.has(
    Feature.CustomApplications,
  );
  const isQuickAppsEnabled = enabledFeatures.has(Feature.QuickApps);
  const isCodeAppsEnabled = enabledFeatures.has(Feature.CodeApps);

  const searchTerm = useAppSelector(MarketplaceSelectors.selectSearchTerm);
  const selectedTab = useAppSelector(MarketplaceSelectors.selectSelectedTab);

  const menuItems: DisplayMenuItemProps[] = useMemo(
    () =>
      [
        {
          type: ApplicationType.CODE_APP,
          name: 'Code app',
          dataQa: 'add-startable-app',
          display: isCodeAppsEnabled,
        },
        {
          type: ApplicationType.CUSTOM_APP,
          name: 'Custom app',
          dataQa: 'add-custom-app',
          display: isCustomApplicationsEnabled,
        },
        // {
        //   type: ApplicationType.MINDMAP,
        //   name: 'Mindmap',
        //   dataQa: 'add-mindmap',
        //   display: isMindmapEnabled,
        // },
        {
          type: ApplicationType.QUICK_APP,
          name: 'Quick app',
          dataQa: 'add-quick-app',
          display: isQuickAppsEnabled,
        },
      ].map(({ name, dataQa, display, type }: MenuItem) => ({
        name: t(name),
        dataQa: dataQa,
        display: display,
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          onAddApplication(type);
        },
      })),
    [
      onAddApplication,
      t,
      isCustomApplicationsEnabled,
      isQuickAppsEnabled,
      isCodeAppsEnabled,
    ],
  );

  const onSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch(MarketplaceActions.setSearchTerm(e.target.value));
  };

  return (
    <div className="flex items-center justify-end md:mt-4 xl:mt-6">
      {/* <div className="hidden text-secondary sm:block">
        {t('{{label}}: {{count}} items', {
          count: items,
          label: countLabel[selectedTab],
          nsSeparator: '::',
        })}
      </div> */}
      <div className="flex w-full gap-4 sm:justify-end md:w-auto">
        <div className="relative h-10 w-full shrink-0 sm:w-[315px] md:w-[560px]">
          <IconSearch
            className="absolute left-3 top-1/2 -translate-y-1/2"
            size={18}
          />
          <input
            name="titleInput"
            placeholder={t('Search')}
            type="text"
            value={searchTerm}
            onChange={onSearchChange}
            className="w-full rounded border border-primary bg-transparent py-2.5 pl-[38px] pr-3 leading-4 outline-none placeholder:text-secondary focus-visible:border-accent-primary"
          />
        </div>
        {selectedTab === MarketplaceTabs.MY_WORKSPACE && (
          <AddAppButton menuItems={menuItems} />
        )}
      </div>
    </div>
  );
};
