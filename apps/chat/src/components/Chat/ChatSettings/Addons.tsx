import { IconX } from '@tabler/icons-react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';

import classNames from 'classnames';

import { useTranslation } from '@/src/hooks/useTranslation';

import { DialAIEntityAddon } from '@/src/types/models';
import { Translation } from '@/src/types/translation';

import { AddonsSelectors } from '@/src/store/addons/addons.reducers';
import { useAppSelector } from '@/src/store/hooks';

import { ModelIcon } from '../../Chatbar/ModelIcon';
import { EntityMarkdownDescription } from '../../Common/MarkdownDescription';
import Tooltip from '../../Common/Tooltip';
import { AddonsDialog } from './AddonsDialog';

interface AddonProps {
  addonId: string;
  isSelected: boolean;
  preselectedAddonsIds: string[];
  disabled: boolean;
  onChangeAddon: (addonId: string) => void;
}

const AddonButton = ({
  addonId,
  preselectedAddonsIds,
  isSelected,
  disabled,
  onChangeAddon,
}: AddonProps) => {
  const addonsMap = useAppSelector(AddonsSelectors.selectAddonsMap);

  return (
    <button
      className={classNames(
        'flex items-center gap-2 rounded px-3 py-2 text-left disabled:cursor-not-allowed',
        { 'bg-accent-primary-alpha': isSelected },
        {
          'bg-layer-3 hover:bg-layer-4': !isSelected,
        },
      )}
      disabled={disabled || preselectedAddonsIds.includes(addonId)}
      onClick={() => {
        onChangeAddon(addonId);
      }}
    >
      <ModelIcon entity={addonsMap[addonId]} entityId={addonId} size={15} />
      <span>{addonsMap[addonId]?.name || addonId}</span>
      {isSelected && !preselectedAddonsIds.includes(addonId) && (
        <IconX size={14} className="text-secondary" />
      )}
    </button>
  );
};

const Addon = ({
  addonId,
  preselectedAddonsIds,
  isSelected,
  disabled,
  onChangeAddon,
}: AddonProps) => {
  const addonsMap = useAppSelector(AddonsSelectors.selectAddonsMap);

  const description = useMemo(
    () => addonsMap[addonId]?.description,
    [addonId, addonsMap],
  );

  if (description) {
    return (
      <Tooltip
        tooltip={
          <EntityMarkdownDescription>{description}</EntityMarkdownDescription>
        }
        triggerClassName="flex shrink-0"
        contentClassName="max-w-[220px]"
        placement="top"
      >
        <AddonButton
          addonId={addonId}
          preselectedAddonsIds={preselectedAddonsIds}
          isSelected={isSelected}
          onChangeAddon={onChangeAddon}
          disabled={disabled}
        />
      </Tooltip>
    );
  }

  return (
    <AddonButton
      addonId={addonId}
      preselectedAddonsIds={preselectedAddonsIds}
      isSelected={isSelected}
      onChangeAddon={onChangeAddon}
      disabled={disabled}
    />
  );
};

interface AddonsProps {
  preselectedAddonsIds: string[];
  selectedAddonsIds: string[];
  disabled: boolean;
  onApplyAddons: (addonsIds: string[]) => void;
  onChangeAddon: (addonId: string) => void;
}

const filterRecentAddons = (
  recentAddonsIds: string[],
  selectedAddonsIds: string[],
  preselectedAddonsIds: string[],
  addonsMap: Partial<Record<string, DialAIEntityAddon>>,
) => {
  return recentAddonsIds.filter(
    (id) =>
      addonsMap[id] &&
      !selectedAddonsIds.includes(id) &&
      !preselectedAddonsIds.includes(id),
  );
};

export const Addons = ({
  preselectedAddonsIds,
  selectedAddonsIds,
  disabled,
  onChangeAddon,
  onApplyAddons,
}: AddonsProps) => {
  const { t } = useTranslation(Translation.Chat);

  const recentAddonsIds = useAppSelector(AddonsSelectors.selectRecentAddonsIds);
  const addonsMap = useAppSelector(AddonsSelectors.selectAddonsMap);
  const addons = useAppSelector(AddonsSelectors.selectAddons);

  const [filteredRecentAddons, setFilteredRecentAddons] = useState<string[]>(
    filterRecentAddons(
      recentAddonsIds,
      selectedAddonsIds,
      preselectedAddonsIds,
      addonsMap,
    ),
  );
  const [isAddonsDialogOpen, setIsAddonsDialogOpen] = useState(false);

  useEffect(() => {
    setFilteredRecentAddons(
      filterRecentAddons(
        recentAddonsIds,
        selectedAddonsIds,
        preselectedAddonsIds,
        addonsMap,
      ),
    );
  }, [selectedAddonsIds, preselectedAddonsIds, recentAddonsIds, addonsMap]);

  const handleCloseAddonsDialog = useCallback(() => {
    setIsAddonsDialogOpen(false);
  }, []);

  if (!addons.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3" data-qa="addons">
      <span>{t('Addons (max 10)')}</span>

      {(selectedAddonsIds?.filter((id) => addonsMap[id]).length > 0 ||
        preselectedAddonsIds?.length > 0) && (
        <>
          <span className="text-secondary">{t('Selected')}</span>
          <div className="flex flex-wrap gap-1" data-qa="selected-addons">
            {preselectedAddonsIds.map((addon) => (
              <Addon
                key={addon}
                addonId={addon}
                isSelected
                onChangeAddon={onChangeAddon}
                preselectedAddonsIds={preselectedAddonsIds}
                disabled={disabled}
              />
            ))}
            {selectedAddonsIds
              .filter(
                (id) => addonsMap[id] && !preselectedAddonsIds.includes(id),
              )
              .map((addon) => (
                <Addon
                  key={addon}
                  addonId={addon}
                  isSelected
                  onChangeAddon={onChangeAddon}
                  preselectedAddonsIds={preselectedAddonsIds}
                  disabled={disabled}
                />
              ))}
          </div>
        </>
      )}
      {(!selectedAddonsIds ||
        selectedAddonsIds.length + preselectedAddonsIds.length < 11) && (
        <>
          {filteredRecentAddons?.length > 0 && (
            <>
              <span className="text-secondary">{t('Recent')}</span>
              <div className="flex flex-wrap gap-1" data-qa="recent-addons">
                {filteredRecentAddons
                  .map((addon) => (
                    <Addon
                      key={addon}
                      addonId={addon}
                      isSelected={false}
                      onChangeAddon={onChangeAddon}
                      preselectedAddonsIds={preselectedAddonsIds}
                      disabled={disabled}
                    />
                  ))
                  .filter(Boolean)}
              </div>
            </>
          )}
          <div>
            <button
              disabled={disabled}
              className="mt-3 inline text-left text-accent-primary disabled:cursor-not-allowed"
              onClick={() => {
                setIsAddonsDialogOpen(true);
              }}
              data-qa="see-all-addons"
            >
              {t('See all addons')}
            </button>
          </div>
          <AddonsDialog
            isOpen={isAddonsDialogOpen}
            selectedAddonsIds={selectedAddonsIds}
            preselectedAddonsIds={preselectedAddonsIds}
            onClose={handleCloseAddonsDialog}
            onAddonsSelected={onApplyAddons}
          />
        </>
      )}
    </div>
  );
};
