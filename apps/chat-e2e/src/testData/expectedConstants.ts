import config from '../../config/chat.playwright.config';

import { CopyTableType } from '@/chat/types/chat';
import { EntityType } from '@/chat/types/common';
import path from 'path';

export const ExpectedConstants = {
  settingsTooltip: (entityType: EntityType) =>
    entityType === EntityType.Application
      ? 'Change conversation settings:\nThere are no conversation settings for this agent'
      : 'Change conversation settings:\nTemperature:',
  newConversationTitle: 'New conversation',
  newConversationWithIndexTitle: (index: number) =>
    `${ExpectedConstants.newConversationTitle} ${index}`,
  entityWithIndexTitle: (name: string, index: number) => `${name} ${index}`,
  newPromptTitle: (index: number) => `Prompt ${index}`,
  promptPlaceholder: (variable: string) => `Enter a value for ${variable}...`,
  newFolderTitle: 'New folder',
  newFolderWithIndexTitle: (index: number) =>
    `${ExpectedConstants.newFolderTitle} ${index}`,
  newPromptFolderWithIndexTitle: (index: number) =>
    `${ExpectedConstants.newFolderTitle} ${index}`,
  renameConversationModalTitle: 'Rename conversation',
  emptyString: '',
  defaultTemperature: '1',
  signInButtonTitle: 'Sign in with Credentials',
  talkTo: 'Talk to',
  model: 'Model',
  replayAsIsLabel: 'Replay as is',
  replayConversation: '[Replay] ',
  playbackLabel: 'Playback',
  playbackConversation: '[Playback] ',
  emptyPlaybackMessage: 'Type a message',
  startReplayLabel: 'Start replay',
  continueReplayLabel: 'Continue replay',
  continueReplayAfterErrorLabel: 'Try again',
  answerError:
    'Error happened during answering. Please check your internet connection and try again.',
  noConversationsAvailable: 'No conversations available',
  talkToReply: 'Replay as is',
  fillVariablesAlertText: 'Please fill out all variables',
  enterMessageAlert: 'Please enter a message',
  defaultIconUrl: 'url(images/icons/message-square-lines-alt.svg))',
  deleteFolderMessage:
    'Are you sure that you want to delete a folder with all nested elements?',
  deleteSelectedConversationsMessage:
    'Are you sure that you want to delete selected conversations?',
  deleteSelectedPromptsMessage:
    'Are you sure that you want to delete selected prompts?',
  deleteFileMessage: 'Are you sure that you want to delete this file?',
  deleteFilesMessage: 'Are you sure that you want to delete these files?',
  deleteSharedFolderMessage:
    'Are you sure that you want to delete a folder with all nested elements?\n' +
    'Deleting will stop sharing and other users will no longer see this folder.',
  deleteSharedConversationMessage:
    'Are you sure that you want to delete a conversation?\n' +
    'Deleting will stop sharing and other users will no longer see this conversation.',
  renameSharedFolderMessage:
    'Renaming will stop sharing and other users will no longer see this folder.',
  deleteSharedPromptMessage:
    'Are you sure that you want to delete a prompt?\n' +
    'Deleting will stop sharing and other users will no longer see this prompt.',
  notAllowedToMoveParentToChild:
    "It's not allowed to move parent folder in child folder",
  deletePromptConfirmationModalTitle: 'Confirm deleting prompt',
  deletePromptConfirmationModalMessage:
    'Are you sure that you want to delete a prompt?',
  unshareFolderMessage: 'Are you sure that you want to unshare this folder?',
  backgroundColorPattern: /(rgba\(\d+,\s*\d+,\s*\d+),\s*\d+\.*\d+\)/,
  sendMessageTooltip: 'Please type a message',
  sendMessageAttachmentLoadingTooltip: 'Please wait for the attachment to load',
  proceedReplayTooltip: 'Please continue replay to continue working with chat',
  stopGeneratingTooltip: 'Stop generating',
  backgroundAccentAttribute: 'bg-accent-primary-alpha',
  noResults: 'No results found',
  notAllowedModelError:
    'Not available agent selected. Please, change the agent to proceed',
  replayAsIsDescr:
    'This mode replicates user requests from the original conversation including settings set in each message.',
  replayOldVersionWarning:
    'Please note that some of your messages were created in older DIAL version. "Replay as is" could be working not as expected.',
  regenerateResponseToContinueTooltip:
    'Please regenerate response to continue working with chat',
  regenerateResponseTooltip: 'Regenerate response',
  sharedConversationTooltip: 'Shared',
  sharedConversationName: (name: string) => `Share: ${name}`,
  sharedLink: (invitationLink: string) => {
    const invitationPath = '/v1/invitations/';
    const startIndex =
      invitationLink.indexOf(invitationPath) + invitationPath.length;
    return invitationLink.slice(startIndex);
  },
  sharedConversationUrl: (invitationLink: string) => {
    return `${config.use!.baseURL}/share/${ExpectedConstants.sharedLink(invitationLink)}`;
  },
  shareInviteAcceptanceFailureMessage:
    'Accepting sharing invite failed. Please open share link again to being able to see shared resource.',
  sharingWithAttachmentNotFromAllFilesErrorMessage:
    'Sharing failed. You are only allowed to share conversations with attachments from "All files"',
  shareInviteDoesNotExist:
    'We are sorry, but the link you are trying to access has expired or does not exist.',
  copyUrlTooltip: 'Copy URL',
  revokeAccessTo: (name: string) => `Confirm unsharing: ${name}`,
  attachments: 'Attachments',
  responseContentPattern: /(?<="content":")[^"^$]+/g,
  responseFileUrlPattern: /(?<="url":")[^"$]+/g,
  responseFileUrlContentPattern: (model: string) =>
    new RegExp('/appdata/' + model + '/images/.*\\.png', 'g'),
  shareConversationText:
    'This link is temporary and will be active for 3 days. This conversation and future changes to it will be visible to users who follow the link. Only owner will be able to make changes.',
  sharePromptText:
    'This link is temporary and will be active for 3 days. This prompt and future changes to it will be visible to users who follow the link. Only owner will be able to make changes.',
  shareApplicationText:
    'This application and its updates will be visible to users with the link. Renaming or changing the version will stop sharing.',
  shareConversationFolderText:
    'This link is temporary and will be active for 3 days. This conversation folder and future changes to it will be visible to users who follow the link. Only owner will be able to make changes. Renaming will stop sharing.',
  sharePromptFolderText:
    'This link is temporary and will be active for 3 days. This prompt folder and future changes to it will be visible to users who follow the link. Only owner will be able to make changes. Renaming will stop sharing.',
  chatNotFoundMessage:
    'Conversation not found.Please select another conversation.',
  promptNameLabel: 'promptName',
  promptContentLabel: 'content',
  requiredFieldErrorMessage: 'Please fill in all required fields',
  isolatedUrl: (modelId: string) => `${config.use!.baseURL}/models/${modelId}`,
  modelNotFountErrorMessage:
    'Agent is not found.Please contact your administrator.',
  nameWithDotErrorMessage: 'Using a dot at the end of a name is not permitted.',
  notAllowedDuplicatedFolderNameErrorMessage:
    'Not allowed to have folders with same names',
  duplicatedFolderNameErrorMessage: (name: string) =>
    `Folder with name "${name}" already exists in this folder.`,
  duplicatedFolderRootNameErrorMessage: (name: string) =>
    `Folder with name "${name}" already exists at the root.`,
  duplicatedConversationNameErrorMessage: (name: string) =>
    `Conversation with name "${name}" already exists in this folder.`,
  duplicatedPromptNameErrorMessage: (name: string) =>
    `Prompt with name "${name}" already exists in this folder.`,
  duplicatedRootPromptNameErrorMessage: (name: string) =>
    `Prompt with name "${name}" already exists at the root.`,
  duplicatedConversationRootNameErrorMessage: (name: string) =>
    `Conversation with name "${name}" already exists at the root.`,
  // eslint-disable-next-line no-irregular-whitespace
  controlChars: `\b\t\f`,
  hieroglyphChars: `あおㅁㄹñ¿äß맞습니다. 한국어 학습의 인기는 그 나라의 문화와 경제뿐만 아니라 언어 자체의 매력에서도 비롯됩니다. 한국어는 한글이라는 고유한 문자 시스템을 사용하는데, 이는 15세기에 세종대왕에 의해 창안되었습니다. 한글은 그 논리적이고 과학적인 설계로 인해 배우기 쉬운 것으로 여겨지며, 이 또`,
  attachedFileError: (filename: string) =>
    `You're trying to upload files with incorrect type: ${filename}`,
  allowedSpecialChars: "(`~!@#$^*-_+[]'|<>.?)",
  allowedSpecialSymbolsInName: () =>
    `Test ${ExpectedConstants.allowedSpecialChars}`,
  winAllowedSpecialSymbolsInName: "Test (`~!@#$^_-_+[]'___._)",
  duplicatedFilenameError: (filename: string) =>
    `Files which you trying to upload already presented in selected folder. Please rename or delete them from uploading files list: ${filename}`,
  sameFilenamesError: (filename: string) =>
    `Files which you trying to upload have same names. Please rename or delete them from uploading files list: ${filename}`,
  restrictedNameChars: ':;,=/{}%&\\"',
  notAllowedFilenameError: (filename: string) =>
    `The symbols ${ExpectedConstants.restrictedNameChars} are not allowed in file name. Please rename or delete them from uploading files list: ${filename}`,
  endDotFilenameError: (filename: string) =>
    `Using a dot at the end of a name is not permitted. Please rename or delete them from uploading files list: ${filename}`,
  allFilesRoot: 'All files',
  copyTableTooltip: (copyType: CopyTableType) =>
    `Copy as ${copyType.toUpperCase()}`,
  charsToEscape: ['\\', '"'],
  maxEntityNameLength: 160,
  selectAllTooltip: 'Select all',
  unselectAllTooltip: 'Unselect all',
  deleteSelectedConversationsTooltip: 'Delete selected conversations',
  deleteSelectedPromptsTooltip: 'Delete selected prompts',
  promptLimitExceededTitle: 'Prompt limit exceeded',
  tooManyNestedFolders: "It's not allowed to have more nested folders",
  promptLimitExceededMessage: (
    maxPromptTokens: number,
    enteredTokens: number,
    remainedTokes: number,
  ) =>
    `Prompt limit is ${maxPromptTokens} tokens. You have entered ${enteredTokens} tokens and are trying to insert a prompt with more than ${remainedTokes} tokens. 1 token approximately equals to 4 characters.`,
  replayVariableModalTitle: 'Please, enter variables for the template:',
  exportedFileExtension: '.json',
  publishToLabel: 'Publish to',
  requestCreationDateLabel: 'Request creation date:',
  allowAccessLabel: 'Allow access if all match',
  noChangesLabel: 'No changes',
  availabilityLabel:
    'This publication will be available to all users in the organization',
  noPublishNameTooltip: 'Enter a name for the publish request',
  nothingToPublishTooltip: 'Nothing is selected and rules have not changed',
  defaultAppVersion: '0.0.1',
  rootPublicationFolder: 'public/',
  duplicatedPublicationErrorMessage: (targetUrl: string) =>
    `Target resource already exists: ${targetUrl}`,
  continueReviewButtonTitle: 'Continue review',
  goToReviewButtonTitle: 'Go to a review',
  reviewResourcesTooltip: `It's required to review all resources`,
  duplicatedUnpublishingError: (...names: string[]) => {
    const namesString = names.map((name) => `"${name}"`).join(', ');
    return `${namesString} have already been unpublished. You can't approve this request.`;
  },
  messageTemplateModalTitle: 'Message template',
  messageTemplateModalDescription:
    'Copy a part of the message into the first input and provide a template with template variables into the second input',
  messageTemplateModalOriginalMessageLabel: 'Original message:',
  messageTemplateContentPlaceholder: 'A part of the message',
  messageTemplateValuePlaceholder:
    'Your template. Use {{}} to denote a variable',
  originalMessageTemplateErrorMessage:
    'This part was not found in the original message',
  messageTemplateMissingVarErrorMessage:
    'Template must have at least one variable',
  messageTemplateRequiredField: 'Please fill in this required field',
  messageTemplateMismatchTextErrorMessage: `Template doesn't match the message text`,
  modelInfoTooltipTitle: 'Current agent:',
  modelInfoTooltipChangeTitle: 'Change current agent:',
  requestApiKeyLink: 'this form',
  reportAnIssueLink: 'report an issue',
  publishedAttachmentDownloadPath: (name: string) =>
    `${API.fileHost}/public/${name}`,
  attachmentPublishErrorMessage:
    'Publishing failed. You are only allowed to publish conversations with attachments from "All files"',
};

export enum Types {
  models = 'Models',
  assistants = 'Assistants',
  applications = 'Applications',
}

export enum MenuOptions {
  rename = 'Rename',
  edit = 'Edit',
  compare = 'Compare',
  duplicate = 'Duplicate',
  replay = 'Replay',
  playback = 'Playback',
  export = 'Export',
  withAttachments = 'With attachments',
  withoutAttachments = 'Without attachments',
  moveTo = 'Move to',
  share = 'Share',
  unshare = 'Unshare',
  publish = 'Publish',
  update = 'Update',
  unpublish = 'Unpublish',
  delete = 'Delete',
  newFolder = 'New folder',
  attachments = 'Attachments',
  download = 'Download',
  addNewFolder = 'Add new folder',
  upload = 'Upload',
  attachFolders = 'Attach folders',
  attachLink = 'Attach link',
  select = 'Select',
  view = 'View',
  use = 'Use',
}

export enum FilterMenuOptions {
  sharedByMe = 'Shared by me',
  publishedByMe = 'Published by me',
}

export enum AccountMenuOptions {
  settings = 'Settings',
  logout = 'Log out',
}

export enum UploadMenuOptions {
  attachUploadedFiles = 'Attach uploaded files',
  uploadFromDevice = 'Upload from device',
}

export const Chronology = {
  today: 'Today',
  yesterday: 'Yesterday',
  lastSevenDays: 'Last 7 days',
  lastThirtyDays: 'Last 30 days',
  older: 'Older',
  other: 'Other',
};

export const API = {
  modelsHost: '/api/models',
  addonsHost: '/api/addons',
  chatHost: '/api/chat',
  sessionHost: '/api/auth/session',
  themeUrl: '/api/themes/image',
  defaultModelIconHost: () => `${API.themeUrl}/default-model`,
  defaultAddonIconHost: () => `${API.themeUrl}/default-addon`,
  bucketHost: '/api/bucket',
  listingHost: '/api/listing',
  conversationsHost: () => `${API.listingHost}/conversations`,
  promptsHost: () => `${API.listingHost}/prompts`,
  filesListingHost: () => `${API.listingHost}/files`,
  fileHost: '/api/files',
  conversationHost: '/api/conversations',
  promptHost: '/api/prompts',
  moveHost: '/api/ops/resource/move',
  importFileRootPath: (bucket: string) => `files/${bucket}`,
  modelFilePath: (modelId: string) => `appdata/${modelId}/images`,
  importFilePath: (bucket: string, modelId: string) =>
    `${API.importFileRootPath(bucket)}/${API.modelFilePath(modelId)}`,
  shareInviteAcceptanceHost: '/api/share/accept',
  shareConversationHost: '/api/share/create',
  shareListing: '/api/share/listing',
  discardShareWithMeItem: '/api/share/discard',
  installedDeploymentsFolder: 'clientdata',
  installedDeploymentsFile: 'installed_deployments.json',
  installedDeploymentsHost: () =>
    `${API.installedDeploymentsFolder}/${API.installedDeploymentsFile}`,
  marketplaceHost: 'marketplace.json',
  publicationRequestHost: '/api/publication/create',
  publicationRequestCreate: '/api/publication/create',
  publicationRequestRejection: '/api/publication/reject',
  publicationRequestApproval: '/api/publication/approve',
  publicationRequestDetails: '/api/publication/details',
  publicationRulesList: '/api/publication/rulesList',
  multipleListingHost: () => `${API.listingHost}/multiple?recursive=true`,
  pendingPublicationsListing: '/api/publication/listing',
  publishedConversations: '/api/publication/conversations/public',
};

export const Import = {
  importPath: path.resolve(__dirname, 'import'),
  exportPath: path.resolve(__dirname, 'export'),
  oldVersionAppFolderName: 'Version 1.x',
  oldVersionAppFolderChatName: '3-5 GPT math',
  v14AppBisonChatName: 'bison chat king',
  v14AppImportedFilename: 'ai_dial_chat_history_1-4_version.json',
  v19AppImportedFilename: 'ai_dial_chat_history_1-9_version.json',
  importedAttachmentsFilename: 'ai_dial_chat_with_attachments.dial',
  importedConversationWithAttachmentsName: `test`,
  importedGpt4VisionAttachmentName: 'SDRequestAttachment.png',
  importedStableDiffusionAttachmentName: 'SDResponseAttachment.png',
  v14AppFolderPromptName: 'Version 1.4 A*B',
  oldVersionAppGpt35Message: '11 * 12 =',
  importAttachmentExtension: '.dial',
};

export const Attachment = {
  attachmentPath: path.resolve(__dirname, 'attachments'),
  sunImageName: 'sun.jpg',
  cloudImageName: 'cloud.jpg',
  heartImageName: 'heart.webp',
  flowerImageName: 'flower.jpg',
  longImageName: 'attachmentWithVeryVeryVeryVeryVeryLongTitleDescription.jpg',
  specialSymbolsName: "special (`~!@#$^-_+[]'.).jpg",
  textName: 'text.txt',
  allTypesExtension: '*/*',
  allTypesLabel: 'all',
  imageTypesExtension: 'image/*',
  imagesTypesLabel: 'images',
  zeroSizeFileName: 'test1.txt',
  incrementedImageName: (index: number) => `test${index}.jpg`,
  dotExtensionImageName: 'testdot..JPg',
  restrictedSemicolonCharFilename: 'restricted;char.jpg',
  restrictedEqualCharFilename: 'restricted=char.jpg',
  fileWithoutExtension: 'withoutExtension',
  plotlyName: 'plotly.json',
  pdfName: 'pdf_attachment.pdf',
};

export enum Side {
  right = 'right',
  left = 'left',
}

export enum ImportedModelIds {
  GPT_3_5_TURBO = 'gpt-35-turbo',
  GPT_4 = 'gpt-4',
  CHAT_BISON = 'chat-bison',
}

export enum Rate {
  like = 'like',
  dislike = 'dislike',
}

export enum Theme {
  dark = 'dark',
  light = 'light',
}

export const toTitleCase = (str: string): string =>
  str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase(),
  );

export enum ResultFolder {
  allureChatReport = 'allure-chat-results',
  allureOverlayReport = 'allure-overlay-results',
  chatHtmlReport = 'chat-html-report',
  overlayHtmlReport = 'overlay-html-report',
  testResults = 'test-results',
}

export enum ScrollState {
  top = 'top',
  middle = 'middle',
  bottom = 'bottom',
}

export const MockedChatApiResponseBodies = {
  simpleTextBody: '{"content":"Response"}\u0000{}\u0000',
  listTextBody: `{"content":"1"}\u0000{"content":"."}\u0000{"content":" Italy"}\u0000{"content":"\\n"}\u0000{"content":"2"}\u0000{"content":"."}\u0000{"content":" Greece"}\u0000{"content":"\\n"}\u0000{"content":"3"}\u0000{"content":"."}\u0000{"content":" Switzerland"}\u0000{"content":"\\n"}\u0000{"content":"4"}\u0000{"content":"."}\u0000{"content":" Australia"}\u0000{"content":"\\n"}\u0000{"content":"5"}\u0000{"content":"."}\u0000{"content":" New"}\u0000{"content":" Zealand"}\u0000{"content":"\\n"}\u0000{"content":"6"}\u0000{"content":"."}\u0000{"content":" Mal"}\u0000{"content":"dives"}\u0000{"content":"\\n"}\u0000{"content":"7"}\u0000{"content":"."}\u0000{"content":" Canada"}\u0000{"content":"\\n"}\u0000{"content":"8"}\u0000{"content":"."}\u0000{"content":" Norway"}\u0000{"content":"\\n"}\u0000{"content":"9"}\u0000{"content":"."}\u0000{"content":" France"}\u0000{"content":"\\n"}\u0000{"content":"10"}\u0000{"content":"."}\u0000{"content":" Spain"}\u0000{"content":"\\n"}\u0000{"content":"11"}\u0000{"content":"."}\u0000{"content":" Iceland"}\u0000{"content":"\\n"}\u0000{"content":"12"}\u0000{"content":"."}\u0000{"content":" Scotland"}\u0000{"content":"\\n"}\u0000{"content":"13"}\u0000{"content":"."}\u0000{"content":" Ireland"}\u0000{"content":"\\n"}\u0000{"content":"14"}\u0000{"content":"."}\u0000{"content":" Japan"}\u0000{"content":"\\n"}\u0000{"content":"15"}\u0000{"content":"."}\u0000{"content":" Thailand"}\u0000{"content":"\\n"}\u0000{"content":"16"}\u0000{"content":"."}\u0000{"content":" Croatia"}\u0000{"content":"\\n"}\u0000{"content":"17"}\u0000{"content":"."}\u0000{"content":" Austria"}\u0000{"content":"\\n"}\u0000{"content":"18"}\u0000{"content":"."}\u0000{"content":" Sweden"}\u0000{"content":"\\n"}\u0000{"content":"19"}\u0000{"content":"."}\u0000{"content":" South"}\u0000{"content":" Africa"}\u0000{"content":"\\n"}\u0000{"content":"20"}\u0000{"content":"."}\u0000{"content":" Brazil"}\u0000{"content":"\\n"}\u0000{"content":"21"}\u0000{"content":"."}\u0000{"content":" United"}\u0000{"content":" States"}\u0000{"content":"\\n"}\u0000{"content":"22"}\u0000{"content":"."}\u0000{"content":" India"}\u0000{"content":"\\n"}\u0000{"content":"23"}\u0000{"content":"."}\u0000{"content":" Costa"}\u0000{"content":" Rica"}\u0000{"content":"\\n"}\u0000{"content":"24"}\u0000{"content":"."}\u0000{"content":" Turkey"}\u0000{"content":"\\n"}\u0000{"content":"25"}\u0000{"content":"."}\u0000{"content":" Morocco"}\u0000{"content":"\\n"}\u0000{"content":"26"}\u0000{"content":"."}\u0000{"content":" Argentina"}\u0000{"content":"\\n"}\u0000{"content":"27"}\u0000{"content":"."}\u0000{"content":" Portugal"}\u0000{"content":"\\n"}\u0000{"content":"28"}\u0000{"content":"."}\u0000{"content":" Vietnam"}\u0000{"content":"\\n"}\u0000{"content":"29"}\u0000{"content":"."}\u0000{"content":" Fiji"}\u0000{"content":"\\n"}\u0000{"content":"30"}\u0000{"content":"."}\u0000{"content":" China"}\u0000{"content":"\\n"}\u0000{"content":"31"}\u0000{"content":"."}\u0000{"content":" Indonesia"}\u0000{"content":"\\n"}\u0000{"content":"32"}\u0000{"content":"."}\u0000{"content":" Mexico"}\u0000{"content":"\\n"}\u0000{"content":"33"}\u0000{"content":"."}\u0000{"content":" Peru"}\u0000{"content":"\\n"}\u0000{"content":"34"}\u0000{"content":"."}\u0000{"content":" Chile"}\u0000{"content":"\\n"}\u0000{"content":"35"}\u0000{"content":"."}\u0000{"content":" Netherlands"}\u0000{"content":"\\n"}\u0000{"content":"36"}\u0000{"content":"."}\u0000{"content":" Belize"}\u0000{"content":"\\n"}\u0000{"content":"37"}\u0000{"content":"."}\u0000{"content":" Sey"}\u0000{"content":"ch"}\u0000{"content":"elles"}\u0000{"content":"\\n"}\u0000{"content":"38"}\u0000{"content":"."}\u0000{"content":" Philippines"}\u0000{"content":"\\n"}\u0000{"content":"39"}\u0000{"content":"."}\u0000{"content":" Denmark"}\u0000{"content":"\\n"}\u0000{"content":"40"}\u0000{"content":"."}\u0000{"content":" Hungary"}\u0000{"content":"\\n"}\u0000{"content":"41"}\u0000{"content":"."}\u0000{"content":" Czech"}\u0000{"content":" Republic"}\u0000{"content":"\\n"}\u0000{"content":"42"}\u0000{"content":"."}\u0000{"content":" Mal"}\u0000{"content":"awi"}\u0000{"content":"\\n"}\u0000{"content":"43"}\u0000{"content":"."}\u0000{"content":" Kenya"}\u0000{"content":"\\n"}\u0000{"content":"44"}\u0000{"content":"."}\u0000{"content":" Jordan"}\u0000{"content":"\\n"}\u0000{"content":"45"}\u0000{"content":"."}\u0000{"content":" Tanzania"}\u0000{"content":"\\n"}\u0000{"content":"46"}\u0000{"content":"."}\u0000{"content":" South"}\u0000{"content":" Korea"}\u0000{"content":"\\n"}\u0000{"content":"47"}\u0000{"content":"."}\u0000{"content":" Sri"}\u0000{"content":" Lanka"}\u0000{"content":"\\n"}\u0000{"content":"48"}\u0000{"content":"."}\u0000{"content":" Cambodia"}\u0000{"content":"\\n"}\u0000{"content":"49"}\u0000{"content":"."}\u0000{"content":" Israel"}\u0000{"content":"\\n"}\u0000{"content":"50"}\u0000{"content":"."}\u0000{"content":" Latvia"}\u0000{}\u0000`,
};

export enum CheckboxState {
  checked = 'checked',
  unchecked = 'unchecked',
  partiallyChecked = 'partiallyChecked',
}
export enum ToggleState {
  on = 'ON',
  off = 'OFF',
}

export enum AuthProvider {
  auth0 = 'auth0',
  azureAD = 'azureAD',
  gitlab = 'gitlab',
  google = 'google',
  keycloak = 'keycloak',
  pingID = 'pingID',
  cognito = 'cognito',
  okta = 'okta',
}

export enum AttachFilesFolders {
  appdata = 'appdata',
  images = 'images',
}

export enum PseudoModel {
  replay = 'replay',
  playback = 'playback',
}
