import { Conversation } from '@/chat/types/chat';
import { DialAIEntityModel } from '@/chat/types/models';
import { ShareByLinkResponseModel } from '@/chat/types/share';
import dialTest from '@/src/core/dialFixtures';
import dialSharedWithMeTest from '@/src/core/dialSharedWithMeFixtures';
import {
  ExpectedMessages,
  FolderConversation,
  MenuOptions,
  MockedChatApiResponseBodies,
} from '@/src/testData';
import { Colors } from '@/src/ui/domData';
import { BucketUtil, ModelsUtil } from '@/src/utils';
import { expect } from '@playwright/test';

let defaultModel: DialAIEntityModel;

dialTest.beforeAll(async () => {
  defaultModel = ModelsUtil.getDefaultModel()!;
});

dialSharedWithMeTest(
  'Shared with me. Duplicate chat from chat menu.\n' +
    'Shared with me. Duplicated chat can be moved to new folder, renamed, model changed',
  async ({
    conversationData,
    dataInjector,
    mainUserShareApiHelper,
    additionalUserShareApiHelper,
    additionalShareUserDialHomePage,
    additionalShareUserSharedWithMeConversations,
    additionalShareUserSharedWithMeConversationDropdownMenu,
    additionalShareUserConversations,
    additionalShareUserChatMessages,
    additionalShareUserChat,
    dialHomePage,
    setTestIds,
  }) => {
    setTestIds('EPMRTC-1845', 'EPMRTC-2768');
    let conversation: Conversation;
    let shareByLinkResponse: ShareByLinkResponseModel;

    await dialSharedWithMeTest.step('Prepare shared conversation', async () => {
      conversation = conversationData.prepareDefaultConversation();
      await dataInjector.createConversations([conversation]);
      shareByLinkResponse = await mainUserShareApiHelper.shareEntityByLink([
        conversation,
      ]);
      await additionalUserShareApiHelper.acceptInvite(shareByLinkResponse);
    });

    await dialSharedWithMeTest.step(
      'Open shared conversation, select Duplicate option from dropdown menu and verify conversation is duplicated in Today section',
      async () => {
        await additionalShareUserDialHomePage.openHomePage({
          iconsToBeLoaded: [defaultModel!.iconUrl],
        });
        await additionalShareUserDialHomePage.waitForPageLoaded();
        await additionalShareUserSharedWithMeConversations.openEntityDropdownMenu(
          conversation.name,
        );
        await additionalShareUserSharedWithMeConversationDropdownMenu.selectMenuOption(
          MenuOptions.duplicate,
          { triggeredHttpMethod: 'POST' },
        );
        await additionalShareUserConversations
          .getEntityByName(conversation.name)
          .waitFor();
      },
    );

    await dialSharedWithMeTest.step(
      'Verify response regenerating, sending new request',
      async () => {
        await dialHomePage.mockChatTextResponse(
          MockedChatApiResponseBodies.simpleTextBody,
        );
        await additionalShareUserChatMessages.regenerateResponse();
        let messagesCount =
          await additionalShareUserChatMessages.chatMessages.getElementsCount();
        expect
          .soft(messagesCount, ExpectedMessages.messageCountIsCorrect)
          .toBe(2);

        await additionalShareUserChat.sendRequestWithButton(
          'another test request',
        );
        messagesCount =
          await additionalShareUserChatMessages.chatMessages.getElementsCount();
        expect
          .soft(messagesCount, ExpectedMessages.messageCountIsCorrect)
          .toBe(4);
      },
    );
  },
);

dialSharedWithMeTest(
  'Shared with me. Duplicate chat from chat history',
  async ({
    conversationData,
    dataInjector,
    mainUserShareApiHelper,
    additionalUserShareApiHelper,
    additionalShareUserDialHomePage,
    additionalShareUserSharedWithMeConversations,
    additionalShareUserConversations,
    additionalShareUserChat,
    additionalShareUserSharedFolderConversations,
    setTestIds,
  }) => {
    setTestIds('EPMRTC-1844');
    let folderConversation: FolderConversation;
    let shareByLinkResponse: ShareByLinkResponseModel;
    let conversationName: string;

    await dialSharedWithMeTest.step(
      'Prepare shared folder with conversation inside',
      async () => {
        folderConversation =
          conversationData.prepareDefaultConversationInFolder();
        await dataInjector.createConversations(
          folderConversation.conversations,
          folderConversation.folders,
        );
        shareByLinkResponse = await mainUserShareApiHelper.shareEntityByLink(
          folderConversation.conversations,
          true,
        );
        await additionalUserShareApiHelper.acceptInvite(shareByLinkResponse);
        conversationName = folderConversation.conversations[0].name;
      },
    );

    await dialSharedWithMeTest.step(
      'Open shared conversation, click "Duplicate the conversation to be able to edit it" button and verify conversation is duplicated in Today section',
      async () => {
        await additionalShareUserDialHomePage.openHomePage({
          iconsToBeLoaded: [defaultModel!.iconUrl],
        });
        await additionalShareUserDialHomePage.waitForPageLoaded();
        await additionalShareUserSharedFolderConversations.expandFolder(
          folderConversation.folders.name,
        );
        await additionalShareUserSharedFolderConversations.selectFolderEntity(
          folderConversation.folders.name,
          folderConversation.conversations[0].name,
        );
        await additionalShareUserChat.duplicateConversation();

        await expect
          .soft(
            additionalShareUserConversations.getEntityByName(conversationName),
            ExpectedMessages.newConversationCreated,
          )
          .toBeVisible();
      },
    );

    await dialSharedWithMeTest.step(
      'Click once again "Duplicate the conversation to be able to edit it" button and verify conversation with index 1 is duplicated in Today section',
      async () => {
        await additionalShareUserSharedWithMeConversations.selectConversation(
          conversationName,
        );
        await additionalShareUserChat.duplicateConversation();
        await additionalShareUserConversations
          .getEntityByName(`${conversationName} 1`)
          .waitFor();
      },
    );
  },
);

dialSharedWithMeTest(
  'Shared with me. Compare chats, compare mode is opened from Shared with me section.\n' +
    'Shared with me. Duplicate shared chats both opened in compare mode.\n' +
    'Shared with me. Duplicate shared chat from compare mode',
  async ({
    conversationData,
    dataInjector,
    mainUserShareApiHelper,
    additionalUserShareApiHelper,
    additionalShareUserDialHomePage,
    additionalShareUserSharedWithMeConversations,
    additionalShareUserChatAssertion,
    additionalShareUserSharedWithMeConversationDropdownMenu,
    additionalUserItemApiHelper,
    additionalShareUserChat,
    additionalShareUserCompare,
    additionalShareUserCompareConversation,
    setTestIds,
    baseAssertion,
    additionalShareUserConversationAssertion,
  }) => {
    setTestIds('EPMRTC-1835', 'EPMRTC-1843', 'EPMRTC-1838');
    let firstComparedConversation: Conversation;
    let secondComparedConversation: Conversation;
    let thirdComparedConversation: Conversation;
    let conversationsToShare: Conversation[];

    await dialSharedWithMeTest.step(
      'Prepare two shared conversations',
      async () => {
        firstComparedConversation =
          conversationData.prepareDefaultConversation();
        conversationData.resetData();
        secondComparedConversation =
          conversationData.prepareDefaultConversation();
        conversationData.resetData();
        conversationsToShare = [
          firstComparedConversation,
          secondComparedConversation,
        ];
        await dataInjector.createConversations(conversationsToShare);

        for (const conversation of conversationsToShare) {
          const shareByLinkResponse =
            await mainUserShareApiHelper.shareEntityByLink([conversation]);
          await additionalUserShareApiHelper.acceptInvite(shareByLinkResponse);
        }
      },
    );

    await dialSharedWithMeTest.step(
      'Create conversation in Today section by another user',
      async () => {
        thirdComparedConversation =
          conversationData.prepareDefaultConversation();
        await additionalUserItemApiHelper.createConversations(
          [thirdComparedConversation],
          BucketUtil.getAdditionalShareUserBucket(),
        );
      },
    );

    await dialSharedWithMeTest.step(
      'Select Compare option from dropdown menu for shared conversations',
      async () => {
        await additionalShareUserDialHomePage.openHomePage({
          iconsToBeLoaded: [defaultModel!.iconUrl],
        });
        await additionalShareUserDialHomePage.waitForPageLoaded();
        await additionalShareUserSharedWithMeConversations.selectConversation(
          firstComparedConversation.name,
        );
        await additionalShareUserSharedWithMeConversations.openEntityDropdownMenu(
          firstComparedConversation.name,
        );
        await additionalShareUserSharedWithMeConversationDropdownMenu.selectMenuOption(
          MenuOptions.compare,
        );
      },
    );

    await dialSharedWithMeTest.step(
      'Check "Show all conversations" check-box, expand the list and verify three conversations are displayed',
      async () => {
        await additionalShareUserCompareConversation.checkShowAllConversations();
        const conversationsList =
          await additionalShareUserCompareConversation.getCompareConversationNames();
        baseAssertion.assertArrayIncludesAll(
          conversationsList,
          [secondComparedConversation.name, thirdComparedConversation.name],
          ExpectedMessages.conversationsToCompareOptionsValid,
        );
      },
    );

    await dialSharedWithMeTest.step(
      'Select shared conversation from the list and verify Compare mode is opened',
      async () => {
        await additionalShareUserCompareConversation.selectCompareConversation(
          secondComparedConversation.name,
        );
        await additionalShareUserCompare.waitForComparedConversationsLoaded();
      },
    );

    await dialSharedWithMeTest.step(
      'Click on "Duplicate the conversation to be able to edit it" button and verify comparing conversations are duplicated and opened in Compare mode',
      async () => {
        await additionalShareUserChat.duplicateConversation();
        await additionalShareUserCompare.waitForComparedConversationsLoaded();
        await additionalShareUserChatAssertion.assertDuplicateButtonState(
          'hidden',
        );

        for (const conversation of conversationsToShare) {
          await additionalShareUserConversationAssertion.assertEntityBackgroundColor(
            { name: conversation.name },
            Colors.backgroundAccentSecondary,
          );
        }
      },
    );

    await dialSharedWithMeTest.step(
      'Open compare mode for shared conversation and conversation from Today section',
      async () => {
        await additionalShareUserSharedWithMeConversations.openEntityDropdownMenu(
          firstComparedConversation.name,
        );
        await additionalShareUserSharedWithMeConversationDropdownMenu.selectMenuOption(
          MenuOptions.compare,
        );
        await additionalShareUserCompareConversation.checkShowAllConversations();
        await additionalShareUserCompareConversation.selectCompareConversation(
          thirdComparedConversation.name,
        );
        await additionalShareUserCompare.waitForComparedConversationsLoaded();
      },
    );

    await dialSharedWithMeTest.step(
      'Click on "Duplicate the conversation to be able to edit it" button and verify comparing conversations are duplicated and opened in Compare mode',
      async () => {
        await additionalShareUserChat.duplicateConversation();
        await additionalShareUserCompare.waitForComparedConversationsLoaded();
        await additionalShareUserChatAssertion.assertDuplicateButtonState(
          'hidden',
        );

        for (const conversationName of [
          `${firstComparedConversation.name} 1`,
          thirdComparedConversation.name,
        ]) {
          await additionalShareUserConversationAssertion.assertEntityBackgroundColor(
            { name: conversationName },
            Colors.backgroundAccentSecondary,
          );
        }
        await additionalShareUserConversationAssertion.assertEntityState(
          { name: `${thirdComparedConversation.name} 1` },
          'hidden',
        );
      },
    );
  },
);
