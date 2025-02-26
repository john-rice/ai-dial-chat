import { useState } from 'react';

import classNames from 'classnames';

import { useTranslation } from '@/src/hooks/useTranslation';

import { DialAIEntity, DialAIEntityModel } from '@/src/types/models';
import { Translation } from '@/src/types/translation';

import { stopBubbling } from '@/src/constants/chat';

import { Menu, MenuItem } from '@/src/components/Common/DropdownMenu';

import { ModelIcon } from '../Chatbar/ModelIcon';

import ChevronDownIcon from '@/public/images/icons/chevron-down.svg';

const VersionPrefix = () => {
  const { t } = useTranslation(Translation.Chat);

  return (
    <div className="mr-2 flex items-center">
      <span className="hidden md:block">{t('Version: ')}</span>
      <span className="md:hidden">{t('v. ')}</span>
    </div>
  );
};

interface ModelVersionSelectProps {
  entities: DialAIEntityModel[];
  currentEntity: DialAIEntity;
  className?: string;
  showVersionPrefix?: boolean;
  readonly?: boolean;
  onSelect: (entity: DialAIEntityModel) => void;
}

export const ModelVersionSelect = ({
  entities,
  currentEntity,
  className,
  showVersionPrefix = false,
  readonly = false,
  onSelect,
}: ModelVersionSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const onChangeHandler = (entity: DialAIEntityModel) => {
    onSelect(entity);
    setIsOpen(false);
  };

  if (entities.length < 2) {
    if (entities.length && entities[0].version) {
      return (
        <div className={classNames('flex truncate', className)}>
          {showVersionPrefix && <VersionPrefix />}
          <span
            className="mr-3 max-w-full overflow-hidden truncate whitespace-nowrap"
            data-qa="version"
          >
            {entities[0].version}
          </span>
        </div>
      );
    }

    return null;
  }

  return (
    <Menu
      className={className}
      type="contextMenu"
      placement="bottom-end"
      onOpenChange={setIsOpen}
      listClassName="z-[60]"
      data-qa="model-version-select"
      trigger={
        <div
          className="flex cursor-pointer items-center justify-between"
          data-qa="agent-version-select-trigger"
          data-model-versions
          onClick={stopBubbling}
        >
          {showVersionPrefix && <VersionPrefix />}
          <span
            className="max-w-full overflow-hidden truncate whitespace-nowrap"
            data-qa="version"
          >
            {currentEntity.version || currentEntity.id}
          </span>
          <ChevronDownIcon
            className={classNames(
              'ml-1 shrink-0 text-primary transition-all',
              isOpen && 'rotate-180',
            )}
            width={18}
            height={18}
          />
        </div>
      }
    >
      {entities.map((entity) => (
        <MenuItem
          key={entity.id}
          className={classNames(
            'max-w-[350px] text-nowrap hover:bg-accent-primary-alpha',
            currentEntity.id === entity.id && 'bg-accent-primary-alpha',
          )}
          item={
            <div className="flex items-center gap-2">
              <ModelIcon entityId={entity.id} entity={entity} size={16} />
              {entity.version || entity.id}
            </div>
          }
          disabled={readonly}
          value={entity.id}
          onClick={(e) => {
            e.stopPropagation();
            onChangeHandler(entity);
          }}
          data-model-versions
          data-qa="model-version-option"
        />
      ))}
    </Menu>
  );
};
