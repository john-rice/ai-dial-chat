import { DefaultsService } from '@/src/utils/app/data/defaults-service';
import { getTopicColors } from '@/src/utils/app/style-helpers';

import {
  ApiApplicationModel,
  ApiApplicationModelBase,
  ApiApplicationModelSchema,
  ApiApplicationResponse,
  ApplicationInfo,
  ApplicationStatus,
  ApplicationType,
  CustomApplicationModel,
  SimpleApplicationStatus,
} from '@/src/types/applications';
import { EntityType, PartialBy } from '@/src/types/common';
import { DialAIEntityModel } from '@/src/types/models';
import { QuickAppConfig } from '@/src/types/quick-apps';
import { Translation } from '@/src/types/translation';

import { DESCRIPTION_DELIMITER_REGEX } from '@/src/constants/chat';
import { DEFAULT_TEMPERATURE } from '@/src/constants/default-ui-settings';
import {
  DEFAULT_QUICK_APPS_MODEL,
  DEFAULT_QUICK_APPS_SCHEMA_ID,
} from '@/src/constants/quick-apps';

import { ApiUtils, getApplicationApiKey } from '../server/api';
import { constructPath } from './file';
import { getFolderIdFromEntityId } from './folders';
import { getApplicationRootId } from './id';
import { isEntityIdPublic } from './publications';
import { translate } from './translation';

import omit from 'lodash-es/omit';

export const getGeneratedApplicationId = (
  application: Omit<ApplicationInfo, 'id'>,
): string => {
  return constructPath(
    getApplicationRootId(),
    getApplicationApiKey(application),
  );
};

export const regenerateApplicationId = <T extends ApplicationInfo>(
  application: PartialBy<T, 'id'>,
): T => {
  const newId = getGeneratedApplicationId(application);
  if (!application.id || newId !== application.id) {
    return {
      ...application,
      id: newId,
    } as T;
  }
  return application as T;
};

export const mapApplicationPropertiesToApi = (
  properties: CustomApplicationModel['applicationProperties'],
) => {
  if (properties?.document_relative_url)
    return {
      ...properties,
      document_relative_url: ApiUtils.encodeApiUrl(
        properties.document_relative_url as string,
      ),
    };
  return properties;
};

export const convertApplicationToApi = (
  applicationData: Omit<CustomApplicationModel, 'id'>,
): ApiApplicationModel => {
  const commonData: ApiApplicationModelBase = {
    display_name: applicationData.name,
    display_version: applicationData.version,
    icon_url: ApiUtils.encodeApiUrl(applicationData.iconUrl ?? ''),
    description: applicationData.description,
    features: applicationData.features,
    input_attachment_types: applicationData.inputAttachmentTypes,
    max_input_attachments: applicationData.maxInputAttachments,
    reference: applicationData.reference || undefined,
    description_keywords: applicationData.topics,
    applicationTypeSchemaId: applicationData.applicationTypeSchemaId,
    applicationProperties: mapApplicationPropertiesToApi(
      applicationData.applicationProperties,
    ),
  };

  if (applicationData.function) {
    return {
      ...commonData,
      function: {
        runtime: applicationData.function.runtime ?? 'python3.11',
        source_folder: `${ApiUtils.encodeApiUrl(applicationData.function.sourceFolder)}/`,
        mapping: applicationData.function.mapping,
        ...(applicationData.function.env && {
          env: applicationData.function.env,
        }),
      },
    };
  }

  if (commonData.applicationTypeSchemaId) {
    return commonData as ApiApplicationModelSchema;
  }
  return {
    ...commonData,
    endpoint: applicationData.completionUrl,
  };
};

export const mapApplicationPropertiesFromApi = (
  properties: CustomApplicationModel['applicationProperties'],
) => {
  if (properties?.document_relative_url)
    return {
      ...properties,
      document_relative_url: ApiUtils.decodeApiUrl(
        properties.document_relative_url as string,
      ),
    };
  return properties;
};

export const convertApplicationFromApi = (
  application: ApiApplicationResponse,
): CustomApplicationModel => {
  const id = ApiUtils.decodeApiUrl(
    'application' in application ? application.application : application.name,
  );

  const appFunction = application.function
    ? {
        ...omit(application.function, ['source_folder']),
        sourceFolder: ApiUtils.decodeApiUrl(application.function.source_folder),
      }
    : undefined;

  return {
    ...omit(application, ['function', 'endpoint']),
    isDefault: false,
    type: EntityType.Application,
    id,
    inputAttachmentTypes: application.input_attachment_types,
    iconUrl: ApiUtils.decodeApiUrl(application.icon_url),
    maxInputAttachments: application.max_input_attachments,
    version: application.display_version,
    name: application.display_name,
    completionUrl: application.endpoint ?? '',
    folderId: getFolderIdFromEntityId(id),
    topics: application.description_keywords,
    applicationTypeSchemaId: application.application_type_schema_id,
    applicationProperties: mapApplicationPropertiesFromApi(
      application.application_properties,
    ),
    ...(appFunction && {
      function: appFunction,
      functionStatus: appFunction.status,
    }),
  };
};

export const isQuickApp = (entity: DialAIEntityModel) =>
  entity.applicationTypeSchemaId === DEFAULT_QUICK_APPS_SCHEMA_ID;

export const getModelDescription = (entity: DialAIEntityModel) => {
  return entity.description ?? '';
};

export const getModelShortDescription = (entity: DialAIEntityModel) =>
  getModelDescription(entity).split(DESCRIPTION_DELIMITER_REGEX)[0];

export const getQuickAppConfig = (
  entity: CustomApplicationModel,
): QuickAppConfig => {
  return (entity.applicationProperties as QuickAppConfig)?.web_api_toolset
    ? (entity.applicationProperties as QuickAppConfig)
    : {
        instructions: '',
        model: DefaultsService.get('quickAppsModel', DEFAULT_QUICK_APPS_MODEL),
        temperature: DEFAULT_TEMPERATURE,
        web_api_toolset: {},
      };
};

export const getQuickAppDocumentUrl = (entity?: CustomApplicationModel) => {
  return entity ? getQuickAppConfig(entity).document_relative_url : undefined;
};

export const createQuickAppConfig = ({
  instructions,
  temperature,
  config,
  model,
  document_relative_url,
}: {
  instructions: string;
  temperature: number;
  config: string;
  model: string;
  document_relative_url: string;
}): QuickAppConfig => ({
  instructions,
  temperature,
  web_api_toolset: JSON.parse(config ?? '{}'),
  model:
    model ?? DefaultsService.get('quickAppsModel', DEFAULT_QUICK_APPS_MODEL),
  document_relative_url: document_relative_url || undefined,
});

export const topicToOption = (topic: string) => ({
  value: topic,
  label: topic,
  ...getTopicColors(topic),
});

export const isExecutableApp = (entity: DialAIEntityModel) =>
  !!entity.functionStatus;

export const getApplicationType = (entity: DialAIEntityModel) => {
  if (isQuickApp(entity)) return ApplicationType.QUICK_APP;
  if (isExecutableApp(entity)) return ApplicationType.CODE_APP;
  // TODO: Add mindmap type check in future
  return ApplicationType.CUSTOM_APP;
};

export const getApplicationNextStatus = (entity: DialAIEntityModel) => {
  return entity.functionStatus === ApplicationStatus.DEPLOYED
    ? ApplicationStatus.UNDEPLOYING
    : ApplicationStatus.DEPLOYING;
};

export const getApplicationSimpleStatus = (entity: DialAIEntityModel) => {
  switch (entity.functionStatus) {
    case ApplicationStatus.UNDEPLOYED:
    case ApplicationStatus.FAILED:
      return SimpleApplicationStatus.DEPLOY;
    case ApplicationStatus.DEPLOYED:
      return SimpleApplicationStatus.UNDEPLOY;
    default:
      return SimpleApplicationStatus.UPDATING;
  }
};

export const isApplicationStatusUpdating = (entity: DialAIEntityModel) => {
  return (
    entity.functionStatus === ApplicationStatus.DEPLOYING ||
    entity.functionStatus === ApplicationStatus.UNDEPLOYING ||
    entity.functionStatus === ApplicationStatus.DEPLOYED
  );
};

export const isApplicationDeployed = (entity: DialAIEntityModel) => {
  return entity.functionStatus === ApplicationStatus.DEPLOYED;
};

export const isApplicationDeploymentInProgress = (
  entity: DialAIEntityModel,
) => {
  return (
    entity.functionStatus === ApplicationStatus.DEPLOYING ||
    entity.functionStatus === ApplicationStatus.UNDEPLOYING
  );
};

export const getSharedTooltip = (context: string) => {
  return translate(
    `You cannot change the ${context} of a shared application.`,
    { ns: Translation.Marketplace },
  );
};

export const isApplicationPublic = (entity: DialAIEntityModel) =>
  isEntityIdPublic(entity) || entity.id === entity.reference;

export const getPlayerCaption = (entity: DialAIEntityModel) => {
  switch (entity.functionStatus) {
    case ApplicationStatus.DEPLOYED:
      return 'Undeploy';
    case ApplicationStatus.UNDEPLOYED:
    case ApplicationStatus.FAILED:
      return 'Deploy';
    case ApplicationStatus.UNDEPLOYING:
      return 'Undeploying';
    case ApplicationStatus.DEPLOYING:
    default:
      return 'Deploying';
  }
};
