import { Tags } from '@/src/ui/domData';

export const ConfirmationDialogSelectors = {
  container: '[data-qa="confirmation-dialog"]',
  cancelDialog: '[data-qa="cancel-dialog"]',
  confirm: '[data-qa="confirm"]',
  confirmationMessage: '[data-qa="confirm-message"]',
};

export const Popup = {
  errorPopup: '[style*="animation"]',
};

export const PromptModal = {
  promptModalDialog: '[data-qa="prompt-modal"]',
  promptName: '[data-qa="prompt-name"]',
  promptDescription: '[data-qa="prompt-descr"]',
  promptValue: '[data-qa="prompt-value"]',
  savePrompt: '[data-qa="save-prompt"]',
  fieldLabel: (label: string) => `label[for="${label}"]`,
};

export const PromptPreviewModal = {
  promptPreviewModal: '[data-qa="preview-prompt-modal"]',
  promptPreviewModalTitle: '[data-qa="modal-entity-name"]',
  promptPreviewName: '[data-qa="prompt-name-label"] ~ [data-qa="prompt-name"]',
  promptPreviewDescription:
    '[data-qa="prompt-description-label"] ~ [data-qa="prompt-description"]',
  promptPreviewContent:
    '[data-qa="prompt-content-label"] ~ [data-qa="prompt-content"]',
  promptExportButton: '[data-qa="export-prompt"]',
  promptDeleteButton: '[data-qa="delete-prompt"]',
  promptDuplicateButton: '[data-qa="duplicate-prompt"]',
};

export const VariableModal = {
  variableModalDialog: '[data-qa="variable-modal"]',
  variablePromptName: '[data-qa="variable-prompt-name"]',
  variablePromptDescription: '[data-qa="variable-prompt-descr"]',
  submitVariable: '[data-qa="submit-variable"]',
  variable: '[data-qa="variable"]',
  variableAsterisk: '[data-qa="variable-asterisk"]',
  variableLabel: '[data-qa="variable-label"]',
};

export const ModelDialog = {
  modelDialog: '[data-qa="models-dialog"]',
  talkToGroup: '[data-qa="talk-to-group"]',
  closeDialog: '[data-qa="close-models-dialog"]',
  searchInput: '[name="titleInput"]',
  modelsTab: '[data-qa="models-tab"]',
  assistantsTab: '[data-qa="assistants-tab"]',
  applicationsTab: '[data-qa="applications-tab"]',
};

export const AddonDialog = {
  addonsDialog: '[data-qa="addons-dialog"]',
  addonSearchResults: '[data-qa="addon-search-results"]',
  addonName: '[data-qa="addon-name"]',
  closeDialog: '[data-qa="close-addons-dialog"]',
  applyAddons: '[data-qa="apply-addons"]',
};

export const ModelTooltip = {
  modelTooltip: '[data-qa="chat-model-tooltip"]',
  modelInfo: '[data-qa="agent-info"]',
  versionInfo: '[data-qa="version-info"]',
  title: '[data-qa="tooltip-title"]',
};

export const SettingsTooltip = {
  settingsTooltip: '[data-qa="chat-settings-tooltip"]',
  applicationInfo: '[data-qa="application-info"]',
  assistantInfo: '[data-qa="assistant-info"]',
  assistantModelInfo: '[data-qa="assistant agent-info"]',
  promptInfo: '[data-qa="prompt-info"]',
  tempInfo: '[data-qa="temp-info"]',
  addonsInfo: '[data-qa="addons-info"]',
};

export const TooltipSelector = {
  tooltip: '[data-qa="tooltip"]',
};

export const ShareModalSelectors = {
  modalContainer: '[data-qa="share-modal"]',
  shareLink: '[data-qa="share-link"]',
  copyLink: '[data-qa="copy-link"]',
  entityName: '[data-qa="modal-entity-name"]',
  shareText: ' .text-sm',
};

export const UploadFromDeviceModalSelectors = {
  modalContainer: '[data-qa="pre-upload-modal"]',
  uploadButton: '[data-qa="upload"]',
  uploadedFile: '[data-qa="uploaded-file"]',
  addMoreFiles: '[data-qa="add-more-files"]',
  deleteUploadedFileIcon: `[data-qa="delete-file"] > ${Tags.svg}`,
  fileExtension: '[data-qa="file-extension"]',
  uploadedFiles: '[data-qa="uploaded-files"]',
};

export const AttachFilesModalSelectors = {
  modalContainer: '[data-qa="file-manager-modal"]',
  organizationFilesContainer: '[data-qa="organization-files-container"]',
  sharedWithMeFilesContainer: '[data-qa="shared-with-me-files-container"]',
  allFilesContainer: '[data-qa="all-files-container"]',
  attachedFileIcon: '[data-qa="attached-file-icon"]',
  attachFilesButton: '[data-qa="attach-files"]',
  uploadFromDeviceButton: '[data-qa="upload-from-device"]',
  deleteFilesButton: '[data-qa="delete-files"]',
  downloadFilesButton: '[data-qa="download-files"]',
  newFolderButton: '[data-qa="new-folder"]',
  arrowAdditionalIcon: '[data-qa="arrow-icon"]',
  rootFolder: '[data-qa="section-root"]',
  fileSection: '[data-qa="file-section-content"]',
};

export const FilesModalSelectors = {
  supportedAttributesLabel: '[data-qa="supported-attributes"]',
};

export const SelectFolderModalSelectors = {
  modalContainer: '[data-qa="select-folder-modal"]',
  newFolderButton: '[data-qa="new-folder"]',
  selectFolderButton: '[data-qa="select-folder"]',
  selectFolders: '[data-qa="select-folders"]',
  allFolders: '[data-qa="all-folders"]',
  rootFolder: '[data-qa="section-root"]',
  searchInput: '[data-qa="search-folder"]',
};

export const AccountSettingsModalSelector = {
  settingsModal: '[data-qa="settings-modal"]',
  theme: '[data-qa="theme"]',
  customLogo: '[data-qa="custom-logo"]',
  fullWidthChatToggle: '[data-qa="toggle-switch"]',
  save: '[data-qa="save"]',
};

export const PublishingModalSelectors = {
  modalContainer: '[data-qa="publish-modal"]',
  requestName: '[data-qa="request-name"]',
  publishTo: '[data-qa="change-path-container"]',
  publishToPath: '[data-qa="path"]',
  changePublishToPath: '[data-qa="change-button"]',
  conversationsToPublishContainer:
    '[data-qa="conversations-to-send-request-container"]',
  filesToPublishContainer: '[data-qa="files-to-send-request-container"]',
  promptsToPublishContainer: '[data-qa="prompts-to-send-request-container"]',
  appsToPublishContainer: '[data-qa="applications-to-send-request-container"]',
  sendButton: '[data-qa="publish"]',
  noPublishingFilesMessage: '[data-qa="no-publishing-files"]',
};

export const ChangePathElement = {
  changePathContainer: '[data-qa="change-path-container"]',
  path: '[data-qa="path"]',
  changeButton: '[data-qa="change-button"]',
};

export const PublishingApprovalModalSelectors = {
  modalContainer: '[data-qa="publish-approval-modal"]',
  publishName: '[data-qa="publish-name"]',
  publishToPath: '[data-qa="publish-to-path"]',
  publishToPathLabel: '[data-qa="publish-to-label"]',
  publishDate: '[data-qa="publish-date"]',
  publishDateLabel: '[data-qa="creation-date"]',
  conversationsToApproveContainer:
    '[data-qa="conversations-to-approve-container"]',
  filesToApproveContainer: '[data-qa="files-to-approve-container"]',
  promptsToApproveContainer: '[data-qa="prompts-to-approve-container"]',
  applicationsToApproveContainer:
    '[data-qa="applications-to-approve-container"]',
  allowAccessLabel: '[data-qa="allow-access-label"]',
  noChangesLabel: '[data-qa="no-changes-label"]',
  availabilityLabel: '[data-qa="availability-label"]',
  goToReviewButton: '[data-qa="go-to-review"]',
  rejectButton: '[data-qa="reject"]',
  approveButton: '[data-qa="approve"]',
  duplicatedPublishing: '[data-qa="duplicate-unpublishing"]',
};

export const ChatSettingsModalSelectors = {
  conversationSettingsModal: '[data-qa="chat-settings-modal"]',
  applyChanges: '[data-qa="apply-changes"]',
  entitySettings: '[data-qa="entity-settings"]',
  systemPrompt: '[data-qa="system-prompt"]',
  temperatureSlider: '[data-qa="temp-slider"]',
  slider: '.temperature-slider',
  addons: '[data-qa="addons"]',
  selectedAddons: '[data-qa="selected-addons"]',
  recentAddons: '[data-qa="recent-addons"]',
  seeAllSelectors: '[data-qa="see-all-addons"]',
};

export const TalkToAgentDialogSelectors = {
  talkToAgentModal: '[data-qa="talk-to-agent"]',
  searchAgent: '[data-qa="search-agents"]',
  goToMyWorkspaceButton: '[data-qa="go-to-my-workspace"]',
};

export const MessageTemplateModalSelectors = {
  messageTemplateModal: '[data-qa="message-templates-dialog"]',
  modalTitle: '[data-qa="modal-entity-name"]',
  description: '[data-qa="description"]',
  originalMessageLabel: '[data-qa="original-message-label"]',
  setTemplateTab: '[data-qa="set-template-tab"]',
  previewTab: '[data-qa="preview-tab"]',
  originalMessageContent: '[data-qa="original-message-content"]',
  templateRow: '[data-qa="template-row"]',
  templateRowContent: '[data-qa="template-content"]',
  templateRowValue: '[data-qa="template-value"]',
  deleteRow: '[name="delete-row"]',
  saveButton: '[data-qa="save-button"]',
  templatePreview: '[data-qa="result-message-template"]',
  showMoreButton: '[data-qa="show-more"]',
  showLessButton: '[data-qa="show-less"]',
};

export const RequestApiKeyModalSelectors = {
  requestApiKeyContainer: '[data-qa="request-api-key-dialog"]',
};

export const ReportAnIssueModalSelectors = {
  reportAnIssueContainer: '[data-qa="report-issue-dialog"]',
};
