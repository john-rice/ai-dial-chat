import { Conversation } from '@/chat/types/chat';
import { DialAIEntityModel } from '@/chat/types/models';
import { ShareByLinkResponseModel } from '@/chat/types/share';
import dialTest from '@/src/core/dialFixtures';
import dialSharedWithMeTest from '@/src/core/dialSharedWithMeFixtures';
import {
  API,
  AttachFilesFolders,
  Attachment,
  CollapsedSections,
  ElementCaretState,
  ExpectedConstants,
  ExpectedMessages,
  MenuOptions,
  MockedChatApiResponseBodies,
  TreeEntity,
  UploadMenuOptions,
} from '@/src/testData';
import { Colors } from '@/src/ui/domData';
import { FileModalSection } from '@/src/ui/webElements';
import { BucketUtil, GeneratorUtil, ModelsUtil } from '@/src/utils';
import { expect } from '@playwright/test';

dialSharedWithMeTest(
  'Arrow icon appears for file in Manage attachments if it was shared along with chat. The file is located in folders in "All files". The file is used in the model answer.\n' +
    'Arrow icon appears for file in Manage attachments if it was shared along with chat folder.\n' +
    //'Arrow icon appears for file in Manage attachments if new chat was moved to already shared folder.\n' +
    'Arrow icon appears for the folder and file with the special chars in their names.\n' +
    'Error message appears if to Share the conversation with an attachment from Shared with me\n' +
    'Arrow icon stays for the file if the chat was unshared by the owner\n' +
    'Arrow icon stays for the file if the chat was renamed or deleted, or model was changed\n' +
    'Arrow icon disappears if all the users delete the file from "Shared with me"\n' +
    'Shared with me: the file with special chars in the name appears in "Shared with me" root',
  async ({
    setTestIds,
    conversationData,
    dataInjector,
    fileApiHelper,
    mainUserShareApiHelper,
    additionalUserShareApiHelper,
    dialHomePage,
    manageAttachmentsAssertion,
    chatBar,
    attachedAllFiles,
    localStorageManager,
    additionalShareUserSendMessage,
    additionalShareUserConversations,
    additionalShareUserChat,
    additionalShareUserConversationDropdownMenu,
    additionalShareUserAttachmentDropdownMenu,
    additionalShareUserDialHomePage,
    additionalShareUserLocalStorageManager,
    additionalShareUserAttachFilesModal,
    additionalShareUserToastAssertion,
    conversations,
    attachmentDropdownMenu,
    attachFilesModal,
    confirmationDialog,
    conversationDropdownMenu,
    chatHeader,
    talkToAgentDialog,
    marketplacePage,
    additionalSecondUserShareApiHelper,
    sendMessage,
    additionalSecondShareUserFileApiHelper,
    additionalShareUserFileApiHelper,
    toast,
    additionalShareUserManageAttachmentsAssertion,
    renameConversationModal,
  }) => {
    dialSharedWithMeTest.slow();
    setTestIds(
      'EPMRTC-4133',
      'EPMRTC-4134',
      /*'EPMRTC-4135,'*/
      'EPMRTC-4155',
      'EPMRTC-4156',
      'EPMRTC-4123',
      'EPMRTC-3116',
      'EPMRTC-3122',
      'EPMRTC-4164',
    );
    let imageUrl: string;
    let imageUrl2: string;
    let imageInConversationInFolderUrl: string;
    let specialCharsImageUrl: string;
    //TODO EPMRTC-4135 blocked by the #1076
    // let imageInFolderUrl2: string;
    let shareByLinkResponse: ShareByLinkResponseModel;
    let shareFolderByLinkResponse: ShareByLinkResponseModel;
    let defaultModel: DialAIEntityModel;
    let defaultModelId: string;
    let conversationInFolder: Conversation;
    //TODO EPMRTC-4135 blocked by the #1076
    // let conversationToMove: Conversation;
    const folderName = 'Folder with conversation';
    const specialCharsFolder = `Folder ${ExpectedConstants.allowedSpecialChars}`;
    let conversationWithSpecialChars: Conversation;
    let conversationWithTwoResponses: Conversation;

    await localStorageManager.setChatCollapsedSection(
      CollapsedSections.Organization,
    );

    await dialTest.step(
      'Upload image file to a conversation and prepare conversation with attachments in response',
      async () => {
        defaultModel = GeneratorUtil.randomArrayElement(
          ModelsUtil.getLatestModelsWithAttachment(),
        );
        defaultModelId = defaultModel.id;
        imageUrl = await fileApiHelper.putFile(
          Attachment.sunImageName,
          API.modelFilePath(defaultModelId),
        );
        imageUrl2 = await fileApiHelper.putFile(
          Attachment.cloudImageName,
          API.modelFilePath(defaultModelId),
        );
        imageInConversationInFolderUrl = await fileApiHelper.putFile(
          Attachment.flowerImageName,
          API.modelFilePath(defaultModelId),
        );
        specialCharsImageUrl = await fileApiHelper.putFile(
          Attachment.specialSymbolsName,
          specialCharsFolder,
        );

        //TODO EPMRTC-4135 blocked by the #1076
        // imageInFolderUrl2 = await fileApiHelper.putFile(
        //   Attachment.heartImageName,
        //   API.modelFilePath(defaultModel),
        // );

        conversationWithTwoResponses =
          conversationData.prepareHistoryConversationWithAttachmentsInRequest({
            1: {
              model: defaultModelId,
              attachmentUrl: [imageUrl],
            },
            2: {
              model: defaultModelId,
              attachmentUrl: [imageUrl2],
            },
          });

        conversationData.resetData();

        conversationInFolder =
          conversationData.prepareConversationWithAttachmentInResponse(
            imageInConversationInFolderUrl,
            defaultModelId,
            folderName,
          );

        conversationData.resetData();
        conversationWithSpecialChars =
          conversationData.prepareConversationWithAttachmentsInRequest(
            defaultModelId,
            true,
            specialCharsImageUrl,
          );
        await localStorageManager.setRecentModelsIds(defaultModel);

        //TODO EPMRTC-4135 blocked by the #1076
        // conversationData.resetData();
        // conversationToMove = conversationData.prepareConversationWithAttachmentInResponse(
        //   imageInFolderUrl2,
        //   defaultModel
        // );

        await dataInjector.createConversations([
          conversationWithTwoResponses,
          conversationInFolder,
          /*conversationToMove,*/ conversationWithSpecialChars,
        ]);
        shareByLinkResponse = await mainUserShareApiHelper.shareEntityByLink([
          conversationWithTwoResponses,
          conversationWithSpecialChars,
        ]);
        shareFolderByLinkResponse =
          await mainUserShareApiHelper.shareEntityByLink(
            [conversationInFolder],
            true,
          );
      },
    );

    await dialTest.step('Accept share invitation by another user', async () => {
      await additionalUserShareApiHelper.acceptInvite(shareByLinkResponse);
      await additionalSecondUserShareApiHelper.acceptInvite(
        shareByLinkResponse,
      );
      await additionalUserShareApiHelper.acceptInvite(
        shareFolderByLinkResponse,
      );
    });

    await dialTest.step('Open start page', async () => {
      await dialHomePage.openHomePage();
      await dialHomePage.waitForPageLoaded();
    });

    //TODO EPMRTC-4135 blocked by the #1076
    // await dialTest.step(
    //   'Move the second conversation to the shared folder',
    //   async () => {
    //     await folderConversations.expandFolder(folderName);
    //     await chatBar.dragAndDropConversationToFolderConversation(
    //       folderName,
    //       conversationInFolder.name,
    //       conversationToMove.name,
    //       {isHttpMethodTriggered: true}
    //     );
    //   }
    // );

    await dialTest.step(
      'Open "Manage attachments" modal and verify shared files have arrow icons',
      async () => {
        await chatBar.openManageAttachmentsModal();
        await attachedAllFiles.waitForState();

        await attachedAllFiles.expandFolder(AttachFilesFolders.appdata, {
          isHttpMethodTriggered: true,
        });
        await attachedAllFiles.expandFolder(defaultModelId, {
          isHttpMethodTriggered: true,
        });
        await attachedAllFiles.expandFolder(AttachFilesFolders.images, {
          isHttpMethodTriggered: true,
        });
        await attachedAllFiles.expandFolder(specialCharsFolder, {
          isHttpMethodTriggered: true,
        });

        await attachFilesModal.closeButton.hoverOver();

        const firstImageEntity: TreeEntity = { name: Attachment.sunImageName };
        await manageAttachmentsAssertion.assertSharedFileArrowIconState(
          firstImageEntity,
          'visible',
        );
        await manageAttachmentsAssertion.assertEntityArrowIconColor(
          firstImageEntity,
          Colors.controlsBackgroundAccent,
        );

        const secondImageEntity: TreeEntity = {
          name: Attachment.cloudImageName,
        };
        await manageAttachmentsAssertion.assertSharedFileArrowIconState(
          secondImageEntity,
          'visible',
        );
        await manageAttachmentsAssertion.assertEntityArrowIconColor(
          secondImageEntity,
          Colors.controlsBackgroundAccent,
        );

        const thirdImageEntity: TreeEntity = {
          name: Attachment.flowerImageName,
        };
        await manageAttachmentsAssertion.assertSharedFileArrowIconState(
          thirdImageEntity,
          'visible',
        );
        await manageAttachmentsAssertion.assertEntityArrowIconColor(
          thirdImageEntity,
          Colors.controlsBackgroundAccent,
        );

        //TODO EPMRTC-4135 blocked by the #1076
        // const fourthImageEntity: TreeEntity = { name: Attachment.heartImageName };
        // await manageAttachmentsAssertion.assertSharedFileArrowIconState(fourthImageEntity, 'visible');
        // await manageAttachmentsAssertion.assertEntityArrowIconColor(fourthImageEntity, Colors.controlsBackgroundAccent);

        const specialCharsImageEntity: TreeEntity = {
          name: Attachment.specialSymbolsName,
        };
        await manageAttachmentsAssertion.assertSharedFileArrowIconState(
          specialCharsImageEntity,
          'visible',
        );
        await manageAttachmentsAssertion.assertEntityArrowIconColor(
          specialCharsImageEntity,
          Colors.controlsBackgroundAccent,
        );
        await attachFilesModal.closeButton.click();
      },
    );

    await dialSharedWithMeTest.step(
      'By user2 create a conversation with attachments from Shared with me section in Manage attachments',
      async () => {
        await additionalShareUserLocalStorageManager.setRecentModelsIds(
          defaultModel,
        );
        const newRequest = GeneratorUtil.randomString(10);
        await additionalShareUserDialHomePage.openHomePage();
        await additionalShareUserDialHomePage.waitForPageLoaded();
        await additionalShareUserSendMessage.attachmentMenuTrigger.click();

        await additionalShareUserAttachmentDropdownMenu.selectMenuOption(
          UploadMenuOptions.attachUploadedFiles,
        );

        await additionalShareUserManageAttachmentsAssertion.assertEntityState(
          { name: Attachment.specialSymbolsName },
          FileModalSection.SharedWithMe,
          'visible',
        );

        await additionalShareUserAttachFilesModal.checkAttachedFile(
          Attachment.specialSymbolsName,
          FileModalSection.SharedWithMe,
        );
        await additionalShareUserAttachFilesModal.attachFiles();
        await additionalShareUserDialHomePage.mockChatTextResponse(
          MockedChatApiResponseBodies.simpleTextBody,
        );
        await additionalShareUserChat.sendRequestWithButton(newRequest);
        await additionalShareUserConversations.openEntityDropdownMenu(
          newRequest,
        );
        await additionalShareUserConversationDropdownMenu.selectMenuOption(
          MenuOptions.share,
        );
        await additionalShareUserToastAssertion.assertToastMessage(
          ExpectedConstants.sharingWithAttachmentNotFromAllFilesErrorMessage,
          ExpectedMessages.sharingWithAttachmentNotFromAllFilesFailed,
        );
        await toast.closeToast();
        await conversations.selectConversation(
          conversationWithTwoResponses.name,
        );
      },
    );

    for (const action of ['rename', 'model change', 'delete']) {
      await dialTest.step(`User1 ${action}s the shared chat`, async () => {
        switch (action) {
          case 'rename':
            await conversations.openEntityDropdownMenu(
              conversationWithTwoResponses.name,
            );
            conversationWithTwoResponses.name = GeneratorUtil.randomString(10);
            await conversationDropdownMenu.selectMenuOption(MenuOptions.rename);
            await renameConversationModal.editConversationNameWithSaveButton(
              conversationWithTwoResponses.name,
            );
            break;
          case 'model change':
            await chatHeader.chatAgent.click();
            await talkToAgentDialog.selectAgent(
              GeneratorUtil.randomArrayElement(
                ModelsUtil.getLatestModels().filter(
                  (model) => model.id !== defaultModelId,
                ),
              ),
              marketplacePage,
            );
            break;
          case 'delete':
            await conversations.openEntityDropdownMenu(
              conversationWithTwoResponses.name,
            );
            await conversationDropdownMenu.selectMenuOption(MenuOptions.delete);
            await confirmationDialog.confirm({
              triggeredHttpMethod: 'DELETE',
            });
            break;
        }
      });

      await dialTest.step(
        'User1 opens "Manage attachment" and finds file attached to the chat',
        async () => {
          await chatBar.openManageAttachmentsModal();
          await attachedAllFiles.waitForState();

          await attachedAllFiles.expandFolder(AttachFilesFolders.appdata);
          await attachedAllFiles.expandFolder(defaultModelId);
          await attachedAllFiles.expandFolder(AttachFilesFolders.images);

          await attachFilesModal.closeButton.hoverOver();
          await manageAttachmentsAssertion.assertSharedFileArrowIconState(
            { name: Attachment.sunImageName },
            'visible',
          );
          await manageAttachmentsAssertion.assertSharedFileArrowIconState(
            { name: Attachment.cloudImageName },
            'visible',
          );
          await attachFilesModal.closeButton.click();
        },
      );
    }

    const pathToDeleteSharedByUser1SunImage = `files/${BucketUtil.getBucket()}/${specialCharsFolder}/${Attachment.specialSymbolsName}`;

    await dialTest.step(
      'By User2 delete the file from "Shared with me"',
      async () => {
        await additionalShareUserFileApiHelper.deleteFromSharedWithMe(
          pathToDeleteSharedByUser1SunImage,
        );
      },
    );

    await dialTest.step(
      'By User1 check that arrow still exist for the file',
      async () => {
        await dialHomePage.reloadPage();
        await dialHomePage.waitForPageLoaded();
        await conversations.selectConversation(
          conversationWithSpecialChars.name,
        );
        await sendMessage.attachmentMenuTrigger.click();
        await attachmentDropdownMenu.selectMenuOption(
          UploadMenuOptions.attachUploadedFiles,
        );

        await attachedAllFiles.expandFolder(specialCharsFolder);
        await attachFilesModal.closeButton.hoverOver();
        await manageAttachmentsAssertion.assertSharedFileArrowIconState(
          { name: Attachment.specialSymbolsName },
          'visible',
        );
        await attachFilesModal.closeButton.click();
      },
    );

    await dialTest.step(
      'By User3 delete the file from "Shared with me"',
      async () => {
        await additionalSecondShareUserFileApiHelper.deleteFromSharedWithMe(
          pathToDeleteSharedByUser1SunImage,
        );
      },
    );

    await dialTest.step(
      'By User1 check that the arrow disappears from the file',
      async () => {
        await dialHomePage.reloadPage();
        await dialHomePage.waitForPageLoaded();
        await conversations.selectConversation(
          conversationWithSpecialChars.name,
        );
        await sendMessage.attachmentMenuTrigger.click();
        await attachmentDropdownMenu.selectMenuOption(
          UploadMenuOptions.attachUploadedFiles,
        );

        await attachedAllFiles.expandFolder(specialCharsFolder);
        await attachFilesModal.closeButton.hoverOver();
        await manageAttachmentsAssertion.assertSharedFileArrowIconState(
          { name: Attachment.specialSymbolsName },
          'hidden',
        );
        await attachFilesModal.closeButton.click();
      },
    );
  },
);

dialSharedWithMeTest(
  'Shared with me: shared files located in "All folders" root appear in "Shared with me" root. The chat was shared.\n' +
    'Shared with me: shared files located in folders appear in "Shared with me" root. The chat was shared.\n' +
    'Shared with me: shared files appear in "Shared with me" root. The folder was shared.\n' +
    'Shared with me: download a file via context menu\n' +
    'Shared with me: delete a file via context menu\n' +
    'Shared with me: download multiple files\n' +
    'Shared with me: delete multiples files\n' +
    "The 'Shared with me' section appears and disappears from Manage Attachments depending on the existence of shared files\n" +
    'Search: File from "Shared with me" is found\n' +
    'Search: No results found\n' +
    'Collapsed or expanded state of "Shared with me" is stored\n' +
    'Deleted by the owner file disappears from "Shared with me"\n' +
    'Shared with me: the file stays if the chat was unshared, renamed, model was changed, the chat was deleted by the owner',
  async ({
    setTestIds,
    conversationData,
    dataInjector,
    fileApiHelper,
    additionalShareUserFileApiHelper,
    mainUserShareApiHelper,
    additionalUserShareApiHelper,
    additionalShareUserSendMessage,
    additionalShareUserConversations,
    additionalShareUserSharedWithMeConversations,
    additionalShareUserLocalStorageManager,
    additionalShareUserChatMessages,
    additionalShareUserAttachmentDropdownMenu,
    additionalShareUserDialHomePage,
    additionalShareUserDataInjector,
    additionalShareUserManageAttachmentsAssertion,
    additionalShareUserSharedFolderConversations,
    additionalShareUserAttachFilesModal,
    additionalShareUserDownloadAssertion,
    additionalShareUserConfirmationDialog,
    localStorageManager,
  }) => {
    dialSharedWithMeTest.slow();
    setTestIds(
      'EPMRTC-3520',
      'EPMRTC-4129',
      'EPMRTC-4130',
      'EPMRTC-4149',
      'EPMRTC-4150',
      'EPMRTC-4151',
      'EPMRTC-4152',
      'EPMRTC-4153',
      'EPMRTC-4158',
      'EPMRTC-4159',
      'EPMRTC-4166',
      'EPMRTC-4162',
      'EPMRTC-4165',
    );
    const user1ImageInRequest1 = Attachment.sunImageName;
    const user1ImageInRequest2 = Attachment.cloudImageName;
    const user1ImageInResponse1 = Attachment.heartImageName;
    const user1ImageInResponse2 = Attachment.flowerImageName;
    const user1ConversationInFolderImageInResponse1 = Attachment.longImageName;

    let user1ImageUrlInRequest1: string;
    let user1ImageUrlInRequest2: string;
    let user1ImageUrlInResponse1: string;
    let user1ImageUrlInResponse2: string;
    let user1ConversationInFolderImageUrlInResponse1: string;

    let shareByLinkResponse: ShareByLinkResponseModel;
    let shareFolderByLinkResponse: ShareByLinkResponseModel;

    let conversationWithTwoRequestsWithAttachments: Conversation;
    let conversationWithTwoResponsesWithAttachments: Conversation;
    let secondUserEmptyConversation: Conversation;
    const attachmentModel = GeneratorUtil.randomArrayElement(
      ModelsUtil.getLatestModelsWithAttachment(),
    );
    const user1FolderName = 'SharedFolder';
    let user1ConversationInFolder: Conversation;

    await dialTest.step(
      'User1 uploads an image to the "All files" root',
      async () => {
        user1ImageUrlInRequest1 =
          await fileApiHelper.putFile(user1ImageInRequest1);
        user1ImageUrlInRequest2 =
          await fileApiHelper.putFile(user1ImageInRequest2);

        user1ImageUrlInResponse1 = await fileApiHelper.putFile(
          user1ImageInResponse1,
        );
        user1ImageUrlInResponse2 = await fileApiHelper.putFile(
          user1ImageInResponse2,
        );

        user1ConversationInFolderImageUrlInResponse1 =
          await fileApiHelper.putFile(
            user1ConversationInFolderImageInResponse1,
          );

        //upload file into 'All files' section to have it visible
        await additionalShareUserFileApiHelper.putFile(
          Attachment.heartImageName,
        );
      },
    );

    await dialTest.step('User1 creates chats', async () => {
      conversationWithTwoRequestsWithAttachments =
        conversationData.prepareHistoryConversationWithAttachmentsInRequest({
          1: {
            model: attachmentModel,
            attachmentUrl: [user1ImageUrlInRequest1],
          },
          2: {
            model: attachmentModel,
            attachmentUrl: [user1ImageUrlInRequest2],
          },
        });
      conversationData.resetData();

      conversationWithTwoResponsesWithAttachments =
        conversationData.prepareHistoryConversationWithAttachmentsInResponse({
          1: {
            model: attachmentModel,
            attachmentUrl: user1ImageUrlInResponse1,
          },
          2: {
            model: attachmentModel,
            attachmentUrl: user1ImageUrlInResponse2,
          },
        });
      conversationData.resetData();

      user1ConversationInFolder =
        conversationData.prepareConversationWithAttachmentInResponse(
          user1ConversationInFolderImageUrlInResponse1,
          attachmentModel,
          user1FolderName,
        );
      conversationData.resetData();

      await dataInjector.createConversations([
        conversationWithTwoRequestsWithAttachments,
        conversationWithTwoResponsesWithAttachments,
        user1ConversationInFolder,
      ]);
    });

    await dialTest.step('User1 shares the chat with User2', async () => {
      shareByLinkResponse = await mainUserShareApiHelper.shareEntityByLink([
        conversationWithTwoRequestsWithAttachments,
        conversationWithTwoResponsesWithAttachments,
      ]);
    });

    await dialTest.step(
      'User2 accepts share invitation by another user',
      async () => {
        await additionalUserShareApiHelper.acceptInvite(shareByLinkResponse);
        await additionalShareUserLocalStorageManager.setRecentModelsIds(
          attachmentModel,
        );
        await localStorageManager.setRecentModelsIds(attachmentModel);
      },
    );

    await dialTest.step('User1 shares the folder with User2', async () => {
      shareFolderByLinkResponse =
        await mainUserShareApiHelper.shareEntityByLink(
          [user1ConversationInFolder],
          true,
        );
    });

    await dialTest.step(
      'User2 accepts share invitation by another user',
      async () => {
        await additionalUserShareApiHelper.acceptInvite(
          shareFolderByLinkResponse,
        );
      },
    );

    await dialTest.step(
      'User2 creates a chat with attachment modal accessible',
      async () => {
        secondUserEmptyConversation =
          conversationData.prepareEmptyConversation(attachmentModel);

        conversationData.resetData();
        await additionalShareUserDataInjector.createConversations([
          secondUserEmptyConversation,
        ]);
      },
    );

    await dialSharedWithMeTest.step(
      'User2 opens the file in the shared chat and verifies the picture is shown in requests',
      async () => {
        await additionalShareUserDialHomePage.openHomePage();
        await additionalShareUserDialHomePage.waitForPageLoaded();
        await additionalShareUserSharedWithMeConversations.selectConversation(
          conversationWithTwoRequestsWithAttachments.name,
          { isHttpMethodTriggered: true },
        );

        await additionalShareUserChatMessages.expandChatMessageAttachment(
          1,
          user1ImageInRequest1,
        );
        await additionalShareUserChatMessages.expandChatMessageAttachment(
          3,
          user1ImageInRequest2,
        );
        const attachmentUrl1 =
          await additionalShareUserChatMessages.getChatMessageAttachmentUrl(1);
        const attachmentUrl2 =
          await additionalShareUserChatMessages.getChatMessageAttachmentUrl(3);

        expect(attachmentUrl1, ExpectedMessages.attachmentUrlIsValid).toContain(
          `${API.importFileRootPath(BucketUtil.getBucket())}/${user1ImageInRequest1}`,
        );
        expect(attachmentUrl2, ExpectedMessages.attachmentUrlIsValid).toContain(
          `${API.importFileRootPath(BucketUtil.getBucket())}/${user1ImageInRequest2}`,
        );
      },
    );

    await dialSharedWithMeTest.step(
      'User2 opens the file in the shared chat and verifies the picture is shown in responses',
      async () => {
        await additionalShareUserSharedWithMeConversations.selectConversation(
          conversationWithTwoResponsesWithAttachments.name,
          { isHttpMethodTriggered: true },
        );

        await additionalShareUserChatMessages.expandChatMessageAttachment(
          2,
          user1ImageInResponse1,
        );
        await additionalShareUserChatMessages.expandChatMessageAttachment(
          4,
          user1ImageInResponse2,
        );
        const attachmentInResponseUrl1 =
          await additionalShareUserChatMessages.getChatMessageAttachmentUrl(2);
        const attachmentInResponseUrl2 =
          await additionalShareUserChatMessages.getChatMessageAttachmentUrl(4);

        expect(
          attachmentInResponseUrl1,
          ExpectedMessages.attachmentUrlIsValid,
        ).toContain(
          `${API.importFileRootPath(BucketUtil.getBucket())}/${user1ImageInResponse1}`,
        );
        expect(
          attachmentInResponseUrl2,
          ExpectedMessages.attachmentUrlIsValid,
        ).toContain(
          `${API.importFileRootPath(BucketUtil.getBucket())}/${user1ImageInResponse2}`,
        );
      },
    );

    await dialSharedWithMeTest.step(
      'User2 opens the file in the shared chat and verifies the picture is shown',
      async () => {
        await additionalShareUserSharedFolderConversations.expandFolder(
          user1FolderName,
        );

        await additionalShareUserSharedWithMeConversations.selectConversation(
          user1ConversationInFolder.name,
          { isHttpMethodTriggered: true },
        );

        await additionalShareUserChatMessages.expandChatMessageAttachment(
          2,
          user1ConversationInFolderImageInResponse1,
        );
        const attachmentUrl =
          await additionalShareUserChatMessages.getChatMessageAttachmentUrl(2);
        expect(attachmentUrl, ExpectedMessages.attachmentUrlIsValid).toContain(
          `${API.importFileRootPath(BucketUtil.getBucket())}/${user1ConversationInFolderImageInResponse1}`,
        );
      },
    );

    await dialSharedWithMeTest.step('User 1 unshares chat', async () => {
      const sharedEntities =
        await additionalUserShareApiHelper.listSharedWithMeConversations();
      const entityToUnshare = sharedEntities.resources.find(
        (entity) =>
          entity.url === conversationWithTwoRequestsWithAttachments.id,
      );

      if (entityToUnshare) {
        await additionalUserShareApiHelper.deleteSharedWithMeEntities([
          entityToUnshare,
        ]);
      } else {
        throw new Error('Conversation not found in Shared with me section');
      }
    });

    await dialSharedWithMeTest.step(
      'User2 opens Manage attachments',
      async () => {
        await additionalShareUserConversations.selectConversation(
          secondUserEmptyConversation.name,
        );
        await additionalShareUserSendMessage.attachmentMenuTrigger.click();

        await additionalShareUserAttachmentDropdownMenu.selectMenuOption(
          UploadMenuOptions.attachUploadedFiles,
        );
      },
    );

    for (const section of [
      FileModalSection.AllFiles,
      FileModalSection.SharedWithMe,
    ]) {
      for (const state of ['collapsed', 'expanded'] as ElementCaretState[]) {
        await dialSharedWithMeTest.step(
          `Collapsed or expanded state of "Shared with me" is stored. User2 sets the "${section}" section to ${state} state and reopens the modal`,
          async () => {
            await additionalShareUserAttachFilesModal.expandCollapseSection(
              section,
            ); // collapse or expand

            // Close and reopen the modal
            await additionalShareUserAttachFilesModal.closeButton.click();
            await additionalShareUserSendMessage.attachmentMenuTrigger.click();
            await additionalShareUserSendMessage
              .getDropdownMenu()
              .selectMenuOption(UploadMenuOptions.attachUploadedFiles);

            await additionalShareUserManageAttachmentsAssertion.assertSectionState(
              section,
              state,
            );
          },
        );
      }
    }

    await dialSharedWithMeTest.step(
      "The 'Shared with me' section appears with the existence of shared files",
      async () => {
        await additionalShareUserAttachFilesModal
          .getSharedWithMeFilesContainer()
          .waitForState({ state: 'visible' });
      },
    );

    await dialSharedWithMeTest.step('User2 searches in files', async () => {
      await additionalShareUserAttachFilesModal
        .getSearchInput()
        .fillInInput(user1ImageInRequest1.replace('.jpg', ''));
      await additionalShareUserManageAttachmentsAssertion.assertEntityState(
        { name: user1ImageInRequest1 },
        FileModalSection.SharedWithMe,
        'visible',
      );
      await additionalShareUserManageAttachmentsAssertion.assertEntityState(
        { name: user1ConversationInFolderImageInResponse1 },
        FileModalSection.SharedWithMe,
        'hidden',
      );

      await additionalShareUserAttachFilesModal
        .getSearchInput()
        .fillInInput('');
    });

    await dialSharedWithMeTest.step('User2 searches in files', async () => {
      await additionalShareUserAttachFilesModal
        .getSearchInput()
        .fillInInput(GeneratorUtil.randomString(10));
      await additionalShareUserAttachFilesModal
        .getAllFilesTree()
        .waitForState({ state: 'hidden' });
      await additionalShareUserAttachFilesModal
        .getSharedWithMeTree()
        .waitForState({ state: 'hidden' });

      const allFiles = [
        user1ImageInRequest1,
        user1ImageInRequest2,
        user1ImageInResponse1,
        user1ImageInResponse2,
        user1ConversationInFolderImageInResponse1,
      ];
      for (const file of allFiles) {
        await additionalShareUserManageAttachmentsAssertion.assertEntityState(
          { name: file },
          FileModalSection.SharedWithMe,
          'hidden',
        );
      }

      await additionalShareUserAttachFilesModal
        .getSearchInput()
        .fillInInput('');
      await additionalShareUserAttachFilesModal
        .getAllFilesTree()
        .waitForState({ state: 'visible' });
      await additionalShareUserAttachFilesModal
        .getSharedWithMeTree()
        .waitForState({ state: 'visible' });
    });

    await dialSharedWithMeTest.step('User2 observe shared files', async () => {
      const allFiles = [
        user1ImageInRequest1,
        user1ImageInRequest2,
        user1ImageInResponse1,
        user1ImageInResponse2,
        user1ConversationInFolderImageInResponse1,
      ];
      for (const file of allFiles) {
        await additionalShareUserManageAttachmentsAssertion.assertEntityState(
          { name: file },
          FileModalSection.SharedWithMe,
          'visible',
        );
      }
    });

    await dialSharedWithMeTest.step(
      'User2 downloads a file via context menu',
      async () => {
        await additionalShareUserAttachFilesModal.openFileDropdownMenu(
          user1ImageInRequest1,
          FileModalSection.SharedWithMe,
        );
        const downloadedData =
          await additionalShareUserDialHomePage.downloadData(() =>
            additionalShareUserAttachFilesModal
              .getFileDropdownMenu()
              .selectMenuOption(MenuOptions.download),
          );
        await additionalShareUserDownloadAssertion.assertPlainFileIsDownloaded(
          downloadedData,
        );
      },
    );

    await dialSharedWithMeTest.step(
      'User2 downloads multiple files',
      async () => {
        const imagesToDownload = [
          user1ImageInRequest1,
          user1ImageInRequest2,
          user1ImageInResponse1,
          user1ImageInResponse2,
          user1ConversationInFolderImageInResponse1,
        ];
        for (const file of imagesToDownload) {
          await additionalShareUserAttachFilesModal.checkAttachedFile(
            file,
            FileModalSection.SharedWithMe,
          );
        }
        const downloadedData =
          await additionalShareUserDialHomePage.downloadMultipleData(
            () =>
              additionalShareUserAttachFilesModal.downloadFilesButton.click(),
            imagesToDownload.length,
          );
        for (const data of downloadedData) {
          await additionalShareUserDownloadAssertion.assertPlainFileIsDownloaded(
            data,
          );
        }
        for (const file of imagesToDownload) {
          await additionalShareUserAttachFilesModal.checkAttachedFile(
            file,
            FileModalSection.SharedWithMe,
          );
        }
      },
    );

    await dialSharedWithMeTest.step(
      'User2 deletes a file via context menu',
      async () => {
        await additionalShareUserAttachFilesModal.openFileDropdownMenu(
          user1ImageInRequest1,
          FileModalSection.SharedWithMe,
        );
        await additionalShareUserAttachFilesModal
          .getFileDropdownMenu()
          .selectMenuOption(MenuOptions.delete);
        await additionalShareUserConfirmationDialog.cancelDialog();
        await additionalShareUserManageAttachmentsAssertion.assertEntityState(
          { name: user1ImageInRequest1 },
          FileModalSection.SharedWithMe,
          'visible',
        );

        await additionalShareUserAttachFilesModal.openFileDropdownMenu(
          user1ImageInRequest1,
          FileModalSection.SharedWithMe,
        );
        await additionalShareUserAttachFilesModal
          .getFileDropdownMenu()
          .selectMenuOption(MenuOptions.delete);
        await additionalShareUserConfirmationDialog.confirm({
          triggeredHttpMethod: 'POST',
        });
        await additionalShareUserManageAttachmentsAssertion.assertEntityState(
          { name: user1ImageInRequest1 },
          FileModalSection.SharedWithMe,
          'hidden',
        );
      },
    );

    await dialSharedWithMeTest.step('User 1 deletes a file', async () => {
      await fileApiHelper.deleteFromAllFiles(user1ImageUrlInRequest2);
    });

    await dialSharedWithMeTest.step(
      'User 2 check that the file has disappeared',
      async () => {
        await additionalShareUserDialHomePage.reloadPage();
        await additionalShareUserDialHomePage.waitForPageLoaded();
        await additionalShareUserSendMessage.attachmentMenuTrigger.click();

        await additionalShareUserAttachmentDropdownMenu.selectMenuOption(
          UploadMenuOptions.attachUploadedFiles,
        );
        await additionalShareUserManageAttachmentsAssertion.assertEntityState(
          { name: user1ImageInRequest2 },
          FileModalSection.SharedWithMe,
          'hidden',
        );
      },
    );

    await dialSharedWithMeTest.step(
      'User2 deletes multiple files',
      async () => {
        const imagesToDelete = [
          user1ImageInResponse1,
          user1ImageInResponse2,
          user1ConversationInFolderImageInResponse1,
        ];
        for (const file of imagesToDelete) {
          await additionalShareUserAttachFilesModal.checkAttachedFile(
            file,
            FileModalSection.SharedWithMe,
          );
        }
        await additionalShareUserAttachFilesModal.deleteFilesButton.click();
        await additionalShareUserConfirmationDialog.confirm({
          triggeredHttpMethod: 'POST',
        });
        for (const file of imagesToDelete) {
          await additionalShareUserManageAttachmentsAssertion.assertEntityState(
            { name: file },
            FileModalSection.SharedWithMe,
            'hidden',
          );
        }
      },
    );

    await dialSharedWithMeTest.step(
      "The 'Shared with me' section disappears from Manage Attachments without shared files",
      async () => {
        await additionalShareUserAttachFilesModal
          .getSharedWithMeFilesContainer()
          .waitForState({ state: 'hidden' });
      },
    );
  },
);
