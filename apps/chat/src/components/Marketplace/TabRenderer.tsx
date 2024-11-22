import { IconMessage2 } from '@tabler/icons-react';
import { useCallback, useMemo, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { getApplicationType } from '@/src/utils/app/application';
import { groupModelsAndSaveOrder } from '@/src/utils/app/conversation';
import { getFolderIdFromEntityId } from '@/src/utils/app/folders';
import { doesEntityContainSearchTerm } from '@/src/utils/app/search';
import { translate } from '@/src/utils/app/translation';
import { ApiUtils } from '@/src/utils/server/api';

import {
  ApplicationActionType,
  ApplicationType,
} from '@/src/types/applications';
import { ScreenState } from '@/src/types/common';
import { DialAIEntityModel } from '@/src/types/models';
import { SharingType } from '@/src/types/share';
import { Translation } from '@/src/types/translation';

import { ApplicationActions } from '@/src/store/application/application.reducers';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { MarketplaceSelectors } from '@/src/store/marketplace/marketplace.reducers';
import {
  ModelsActions,
  ModelsSelectors,
} from '@/src/store/models/models.reducers';

import {
  DeleteType,
  FilterTypes,
  MarketplaceTabs,
} from '@/src/constants/marketplace';

import { PublishModal } from '@/src/components/Chat/Publish/PublishWizard';
import { ApplicationWizard } from '@/src/components/Common/ApplicationWizard/ApplicationWizard';
import { ConfirmDialog } from '@/src/components/Common/ConfirmDialog';
import ApplicationDetails from '@/src/components/Marketplace/ApplicationDetails/ApplicationDetails';
import { CardsList } from '@/src/components/Marketplace/CardsList';
import { MarketplaceBanner } from '@/src/components/Marketplace/MarketplaceBanner';
import { SearchHeader } from '@/src/components/Marketplace/SearchHeader';

import Magnifier from '../../../public/images/icons/search-alt.svg';
import { NoResultsFound } from '../Common/NoResultsFound';

import { PublishActions, ShareEntity } from '@epam/ai-dial-shared';
import intersection from 'lodash-es/intersection';

interface NoAgentsFoundProps {
  children: React.ReactNode;
  desc: string;
  header?: string;
}

const NoAgentsFound = ({ children, desc, header }: NoAgentsFoundProps) => (
  <div className="flex grow flex-col items-center justify-center">
    {children}
    {header && <span className="mt-5 text-lg font-semibold">{header}</span>}
    {desc && <span className="mt-4 text-sm font-normal">{desc}</span>}
  </div>
);

interface ResultsViewProps {
  entities: DialAIEntityModel[];
  suggestedResults: DialAIEntityModel[];
  selectedTab: MarketplaceTabs;
  areAllFiltersEmpty: boolean;
  isNotDesktop: boolean;
  onCardClick: (entity: DialAIEntityModel, isSuggested?: boolean) => void;
  onPublish: (entity: DialAIEntityModel, action: PublishActions) => void;
  onDelete: (entity: DialAIEntityModel) => void;
  onEdit: (entity: DialAIEntityModel) => void;
  onBookmarkClick: (entity: DialAIEntityModel) => void;
}

const ResultsView = ({
  entities,
  suggestedResults,
  areAllFiltersEmpty,
  onCardClick,
  onPublish,
  onDelete,
  onEdit,
  isNotDesktop,
  onBookmarkClick,
}: ResultsViewProps) => {
  const { t } = useTranslation(Translation.Marketplace);

  const handleSuggestedCardClick = useCallback(
    (entity: DialAIEntityModel) => {
      onCardClick(entity, true);
    },
    [onCardClick],
  );

  if (suggestedResults.length) {
    return (
      <>
        <CardsList
          entities={entities}
          onCardClick={onCardClick}
          onPublish={onPublish}
          onDelete={onDelete}
          onEdit={onEdit}
          isNotDesktop={isNotDesktop}
          onBookmarkClick={onBookmarkClick}
        />
        {!entities.length && (
          <div className="flex items-center gap-1">
            <Magnifier
              height={32}
              width={32}
              className="shrink-0 text-secondary"
            />
            <span className="text-sm sm:text-base">
              {t(
                'No results found in My workspace. Look at suggested results from DIAL Marketplace.',
              )}
            </span>
          </div>
        )}
        <span className="mb-4 mt-5 text-xl md:mt-6 lg:mt-8">
          {t('Suggested results from DIAL Marketplace')}
        </span>
        <CardsList
          entities={suggestedResults}
          onCardClick={handleSuggestedCardClick}
          onPublish={onPublish}
          onDelete={onDelete}
          onEdit={onEdit}
          isNotDesktop={isNotDesktop}
          onBookmarkClick={onBookmarkClick}
        />
      </>
    );
  }

  if (entities.length) {
    return (
      <CardsList
        entities={entities}
        onCardClick={onCardClick}
        onPublish={onPublish}
        onDelete={onDelete}
        onEdit={onEdit}
        isNotDesktop={isNotDesktop}
        onBookmarkClick={onBookmarkClick}
      />
    );
  }

  if (areAllFiltersEmpty) {
    return (
      <NoAgentsFound
        header={t('No agents') ?? ''}
        desc={t("You don't have any agents.") ?? ''}
      >
        <IconMessage2 size={100} className="stroke-[0.2]" />
      </NoAgentsFound>
    );
  }

  return (
    <NoAgentsFound
      desc={t("Sorry, we couldn't find any results for your search.")}
    >
      <NoResultsFound iconSize={100} className="gap-5 text-lg font-semibold" />
    </NoAgentsFound>
  );
};

const getDeleteConfirmationText = (
  action: DeleteType,
  entity: DialAIEntityModel,
) => {
  const translationVariables = {
    modelName: entity.name,
    modelVersion: entity.version
      ? translate(' (version {{version}})', { version: entity.version })
      : '',
  };

  const deleteConfirmationText = {
    [DeleteType.DELETE]: {
      heading: translate('Confirm deleting application'),
      description: translate(
        'Are you sure you want to delete the {{modelName}}{{modelVersion}}?',
        translationVariables,
      ),
      confirmLabel: translate('Delete'),
    },
    [DeleteType.REMOVE]: {
      heading: translate('Confirm removing application'),
      description: translate(
        'Are you sure you want to remove the {{modelName}}{{modelVersion}} from My workspace?',
        translationVariables,
      ),
      confirmLabel: translate('Remove'),
    },
  };

  return deleteConfirmationText[action];
};

interface TabRendererProps {
  screenState: ScreenState;
}

export const TabRenderer = ({ screenState }: TabRendererProps) => {
  const { t } = useTranslation(Translation.Marketplace);

  const dispatch = useAppDispatch();

  const installedModelIds = useAppSelector(
    ModelsSelectors.selectInstalledModelIds,
  );
  const selectedTab = useAppSelector(MarketplaceSelectors.selectSelectedTab);
  const selectedFilters = useAppSelector(
    MarketplaceSelectors.selectSelectedFilters,
  );
  const searchTerm = useAppSelector(
    MarketplaceSelectors.selectTrimmedSearchTerm,
  );
  const allModels = useAppSelector(ModelsSelectors.selectModels);

  const [suggestedResults, setSuggestedResults] = useState<DialAIEntityModel[]>(
    [],
  );
  const [applicationModel, setApplicationModel] = useState<{
    action: ApplicationActionType;
    type: ApplicationType;
    entity?: DialAIEntityModel;
  }>();
  const [deleteModel, setDeleteModel] = useState<{
    action: DeleteType;
    entity: DialAIEntityModel;
  }>();
  const [publishModel, setPublishModel] = useState<{
    entity: ShareEntity & { iconUrl?: string };
    action: PublishActions;
  }>();
  const [detailsModel, setDetailsModel] = useState<{
    entity: DialAIEntityModel;
    isSuggested?: boolean;
  }>();

  const isSomeFilterNotEmpty =
    searchTerm.length ||
    selectedFilters[FilterTypes.ENTITY_TYPE].length ||
    selectedFilters[FilterTypes.TOPICS].length;

  const areAllFiltersEmpty =
    !searchTerm.length &&
    !selectedFilters[FilterTypes.ENTITY_TYPE].length &&
    !selectedFilters[FilterTypes.TOPICS].length;

  const displayedEntities = useMemo(() => {
    const filteredEntities = allModels.filter(
      (entity) =>
        (doesEntityContainSearchTerm(entity, searchTerm) ||
          (entity.version &&
            doesEntityContainSearchTerm(
              { name: entity.version },
              searchTerm,
            ))) &&
        (selectedFilters[FilterTypes.ENTITY_TYPE].length
          ? selectedFilters[FilterTypes.ENTITY_TYPE].includes(entity.type)
          : true) &&
        (selectedFilters[FilterTypes.TOPICS].length
          ? intersection(selectedFilters[FilterTypes.TOPICS], entity.topics)
              .length
          : true),
    );

    const isInstalledModel = (entity: DialAIEntityModel) =>
      installedModelIds.has(entity.reference);

    const entitiesForTab =
      selectedTab === MarketplaceTabs.MY_APPLICATIONS
        ? filteredEntities.filter(isInstalledModel)
        : filteredEntities;

    const shouldSuggest =
      selectedTab === MarketplaceTabs.MY_APPLICATIONS && isSomeFilterNotEmpty;

    const groupedEntities = groupModelsAndSaveOrder(
      entitiesForTab.concat(shouldSuggest ? filteredEntities : []),
    );

    let orderedEntities = groupedEntities.map(({ entities }) => entities[0]);

    if (shouldSuggest) {
      const suggestedListWithoutInstalled = orderedEntities.filter(
        (entity) => !isInstalledModel(entity),
      );
      orderedEntities = orderedEntities.filter(isInstalledModel);
      setSuggestedResults(suggestedListWithoutInstalled);
    } else {
      setSuggestedResults([]);
    }

    return orderedEntities;
  }, [
    allModels,
    selectedTab,
    isSomeFilterNotEmpty,
    searchTerm,
    selectedFilters,
    installedModelIds,
  ]);

  const handleAddApplication = useCallback((type: ApplicationType) => {
    setApplicationModel({
      action: ApplicationActionType.ADD,
      type,
    });
  }, []);

  const handleEditApplication = useCallback(
    (entity: DialAIEntityModel) => {
      dispatch(ApplicationActions.get(entity.id));
      setApplicationModel({
        entity,
        action: ApplicationActionType.EDIT,
        type: getApplicationType(entity),
      });
    },
    [dispatch],
  );

  const handleDeleteClose = useCallback(
    (confirm: boolean) => {
      if (confirm && deleteModel) {
        if (deleteModel.action === DeleteType.REMOVE) {
          dispatch(
            ModelsActions.removeInstalledModels({
              references: [deleteModel.entity.reference],
              action: DeleteType.REMOVE,
            }),
          );
        } else if (deleteModel.action === DeleteType.DELETE) {
          dispatch(ApplicationActions.delete(deleteModel.entity));
        }

        setDetailsModel(undefined);
      }

      setDeleteModel(undefined);
    },
    [deleteModel, dispatch],
  );

  const handleSetPublishEntity = useCallback(
    (entity: DialAIEntityModel, action: PublishActions) =>
      setPublishModel({
        entity: {
          name: entity.name,
          id: ApiUtils.decodeApiUrl(entity.id),
          folderId: getFolderIdFromEntityId(entity.id),
          iconUrl: entity.iconUrl,
        },
        action,
      }),
    [],
  );

  const handlePublishClose = useCallback(() => setPublishModel(undefined), []);

  const handleDelete = useCallback(
    (entity: DialAIEntityModel) => {
      setDeleteModel({ entity, action: DeleteType.DELETE });
    },
    [setDeleteModel],
  );

  const handleSetDetailsModel = useCallback(
    (entity: DialAIEntityModel, isSuggested?: boolean) => {
      setDetailsModel({
        entity,
        isSuggested: !!isSuggested,
      });
    },
    [setDetailsModel],
  );

  const handleSetVersion = useCallback(
    (entity: DialAIEntityModel) => {
      if (detailsModel) {
        setDetailsModel({ ...detailsModel, entity });
      }
    },
    [setDetailsModel, detailsModel],
  );

  const handleCloseApplicationDialog = useCallback(
    () => setApplicationModel(undefined),
    [setApplicationModel],
  );

  const handleCloseDetailsDialog = useCallback(
    () => setDetailsModel(undefined),
    [setDetailsModel],
  );

  const handleBookmarkClick = useCallback(
    (entity: DialAIEntityModel) => {
      if (installedModelIds.has(entity.reference)) {
        setDeleteModel({ entity, action: DeleteType.REMOVE });
      } else {
        dispatch(
          ModelsActions.addInstalledModels({
            references: [entity.reference],
            showSuccessToast: true,
          }),
        );
      }
    },
    [dispatch, installedModelIds],
  );

  return (
    <>
      <header className="mb-5 md:mb-4 xl:mb-6" data-qa="marketplace-header">
        <MarketplaceBanner />
        <SearchHeader
          items={displayedEntities.length}
          onAddApplication={handleAddApplication}
        />
      </header>

      <ResultsView
        entities={displayedEntities}
        suggestedResults={suggestedResults}
        selectedTab={selectedTab}
        areAllFiltersEmpty={areAllFiltersEmpty}
        onCardClick={handleSetDetailsModel}
        onPublish={handleSetPublishEntity}
        onDelete={handleDelete}
        onEdit={handleEditApplication}
        isNotDesktop={screenState !== ScreenState.DESKTOP}
        onBookmarkClick={handleBookmarkClick}
      />

      {/* MODALS */}
      {!!applicationModel && (
        <ApplicationWizard
          isOpen={!!applicationModel}
          onClose={handleCloseApplicationDialog}
          isEdit={applicationModel.action === ApplicationActionType.EDIT}
          currentReference={applicationModel.entity?.reference}
          type={applicationModel.type}
        />
      )}
      {!!deleteModel && (
        <ConfirmDialog
          isOpen={!!deleteModel}
          {...getDeleteConfirmationText(deleteModel.action, deleteModel.entity)}
          onClose={handleDeleteClose}
          cancelLabel={t('Cancel')}
        />
      )}
      {detailsModel && (
        <ApplicationDetails
          onPublish={handleSetPublishEntity}
          isMobileView={screenState === ScreenState.MOBILE}
          entity={detailsModel.entity}
          onChangeVersion={handleSetVersion}
          onClose={handleCloseDetailsDialog}
          onDelete={handleDelete}
          onEdit={handleEditApplication}
          onBookmarkClick={handleBookmarkClick}
          allEntities={allModels}
          isMyAppsTab={selectedTab === MarketplaceTabs.MY_APPLICATIONS}
          isSuggested={detailsModel.isSuggested}
        />
      )}
      {!!(publishModel && publishModel?.entity?.id) && (
        <PublishModal
          entity={publishModel.entity}
          type={SharingType.Application}
          isOpen={!!publishModel}
          onClose={handlePublishClose}
          publishAction={publishModel.action}
        />
      )}
    </>
  );
};
