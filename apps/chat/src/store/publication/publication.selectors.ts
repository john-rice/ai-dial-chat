import { createSelector } from '@reduxjs/toolkit';

import { isFileId } from '@/src/utils/app/id';
import { EnumMapper } from '@/src/utils/app/mappers';

import { FeatureType } from '@/src/types/common';
import { FolderInterface } from '@/src/types/folder';
import { Publication, PublicationResource } from '@/src/types/publication';

import { RootState } from '../index';
import { PublicationState } from './publication.reducers';

import { ShareEntity, UploadStatus } from '@epam/ai-dial-shared';

const rootSelector = (state: RootState): PublicationState => state.publication;

export const selectPublications = (state: RootState) =>
  rootSelector(state).publications;

export const selectFilteredPublications = (
  featureTypes: FeatureType[],
  includeEmptyResourceTypes?: boolean,
) =>
  createSelector([selectPublications], (publications) => {
    return publications.filter(
      (publication) =>
        publication.resourceTypes.some((resourceType) =>
          featureTypes
            .map((featureType) =>
              EnumMapper.getBackendResourceTypeByFeatureType(featureType),
            )
            .includes(resourceType),
        ) ||
        (includeEmptyResourceTypes && !publication.resourceTypes.length),
    );
  });

export const selectFilteredPublicationResources = (
  featureTypes: FeatureType[],
) =>
  createSelector(
    [selectFilteredPublications(featureTypes)],
    (filteredPublications) => {
      return filteredPublications
        .filter((publication) => publication.resources)
        .flatMap(
          (publication) => publication.resources,
        ) as PublicationResource[];
    },
  );

export const selectSelectedPublicationUrl = (state: RootState) =>
  rootSelector(state).selectedPublicationUrl;

export const selectSelectedPublication = createSelector(
  [selectSelectedPublicationUrl, selectPublications],
  (selectedPublicationUrl, publications) => {
    return selectedPublicationUrl
      ? (publications.find(
          (publication) => publication.url === selectedPublicationUrl,
        ) as Publication)
      : null;
  },
);

export const selectResourcesToReview = (state: RootState) =>
  rootSelector(state).resourcesToReview;

export const selectResourceToReviewByReviewUrl = createSelector(
  [
    selectResourcesToReview,
    selectSelectedPublication,
    (_state, id: string) => id,
  ],
  (resourcesToReview, selectedPublication, id) => {
    return resourcesToReview.find(
      (resource) =>
        resource.reviewUrl === id &&
        selectedPublication?.url === resource.publicationUrl,
    );
  },
);

export const selectResourceToReviewByReviewAndPublicationUrls = createSelector(
  [
    selectResourcesToReview,
    (_state, id: string) => id,
    (_state, _id: string, publicationUrl?: string) => publicationUrl,
  ],
  (resourcesToReview, id, publicationUrl) => {
    return resourcesToReview.find(
      (resource) =>
        resource.reviewUrl === id && publicationUrl === resource.publicationUrl,
    );
  },
);

export const selectResourcesToReviewByPublicationUrl = createSelector(
  [selectResourcesToReview, (_state, id: string) => id],
  (resourcesToReview, id) => {
    return resourcesToReview.filter((r) => r.publicationUrl === id);
  },
);

export const selectRulesByPath = createSelector(
  [rootSelector, (_state, path: string) => path],
  (state, path) => {
    return Object.fromEntries(
      Object.entries(state.rules).filter(
        ([key]) => path.startsWith(key) && key.split('/').length !== 1,
      ),
    );
  },
);

export const selectIsRulesLoading = (state: RootState) =>
  rootSelector(state).isRulesLoading;

export const selectIsAllItemsUploaded = (
  state: RootState,
  featureType: FeatureType,
) => rootSelector(state).allPublishedWithMeItemsUploaded[featureType];

export const selectSelectedItemsToPublish = (state: RootState) =>
  rootSelector(state).selectedItemsToPublish;

export const selectChosenFolderIds = createSelector(
  [
    selectSelectedItemsToPublish,
    (_state, folders: FolderInterface[]) => folders,
    (_state, _folders: FolderInterface[], itemsShouldBeChosen: ShareEntity[]) =>
      itemsShouldBeChosen,
  ],
  (selectedItemsToPublish, folders, itemsShouldBeChosen) => {
    const fullyChosenFolderIds = folders
      .map((folder) => `${folder.id}/`)
      .filter((folderId) =>
        itemsShouldBeChosen.some((item) => item.id.startsWith(folderId)),
      )
      .filter((folderId) =>
        itemsShouldBeChosen
          .filter((item) => item.id.startsWith(folderId))
          .every((item) => selectedItemsToPublish.includes(item.id)),
      );

    const partialChosenFolderIds = folders
      .map((folder) => `${folder.id}/`)
      .filter(
        (folderId) =>
          !selectedItemsToPublish.some((chosenId) =>
            folderId.startsWith(chosenId),
          ) &&
          (selectedItemsToPublish.some((chosenId) =>
            chosenId.startsWith(folderId),
          ) ||
            selectedItemsToPublish.some((entityId) =>
              entityId.startsWith(folderId),
            )) &&
          !fullyChosenFolderIds.includes(folderId),
      );

    return { partialChosenFolderIds, fullyChosenFolderIds };
  },
);

export const selectPublicationsToReviewCount = createSelector(
  [
    selectPublications,
    selectResourcesToReview,
    (_state, featureTypes: FeatureType[]) => featureTypes,
    (
      _state,
      _featureTypes: FeatureType[],
      includeEmptyFeatureTypes?: boolean,
    ) => includeEmptyFeatureTypes,
  ],
  (publications, resourcesToReview, featureTypes, includeEmptyFeatureTypes) => {
    const filteredPublications = publications.filter(
      (p) =>
        featureTypes.some((featureType) =>
          p.resourceTypes.includes(
            EnumMapper.getBackendResourceTypeByFeatureType(featureType),
          ),
        ) ||
        (includeEmptyFeatureTypes && !p.resourceTypes.length),
    );

    return filteredPublications.filter(
      (p) =>
        !resourcesToReview
          .filter((r) => r.publicationUrl === p.url)
          .filter((item) => !isFileId(item.reviewUrl))
          .every((r) => r.reviewed) || p.uploadStatus !== UploadStatus.LOADED,
    ).length;
  },
);

export const selectIsFolderContainsResourcesToReview = createSelector(
  [
    selectResourcesToReview,
    (_state, folderId: string) => folderId,
    (_state, _folderId: string, publicationUrl?: string) => publicationUrl,
  ],
  (resourcesToReview, folderId, publicationUrl) => {
    return resourcesToReview.some(
      (r) =>
        r.reviewUrl.startsWith(`${folderId}/`) &&
        !r.reviewed &&
        r.publicationUrl === publicationUrl,
    );
  },
);

export const selectIsApplicationReview = (state: RootState) =>
  rootSelector(state).isApplicationReview;

export const selectInitialized = (state: RootState) =>
  rootSelector(state).initialized;

export const selectPublicVersionGroups = (state: RootState) =>
  rootSelector(state).publicVersionGroups;

export const selectPublicVersionGroupById = (
  state: RootState,
  versionGroupId: string,
) => (versionGroupId ? selectPublicVersionGroups(state)[versionGroupId] : null);
