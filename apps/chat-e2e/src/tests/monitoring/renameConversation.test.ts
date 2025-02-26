import { Conversation } from '@/chat/types/chat';
import dialTest from '@/src/core/dialFixtures';
import { MenuOptions } from '@/src/testData';
import { GeneratorUtil } from '@/src/utils';

dialTest(
  'Rename conversation',
  async ({
    dialHomePage,
    conversations,
    conversationDropdownMenu,
    conversationData,
    dataInjector,
    conversationAssertion,
    renameConversationModal,
  }) => {
    const updatedConversationName = GeneratorUtil.randomString(5);
    let conversation: Conversation;

    await dialTest.step('Prepare new conversation', async () => {
      conversation = conversationData.prepareDefaultConversation();
      await dataInjector.createConversations([conversation]);
    });

    await dialTest.step('Rename conversation', async () => {
      await dialHomePage.openHomePage();
      await dialHomePage.waitForPageLoaded();
      await conversations.selectConversation(conversation.name);
      await conversations.openEntityDropdownMenu(conversation.name);
      await conversationDropdownMenu.selectMenuOption(MenuOptions.rename);
      await renameConversationModal.editConversationNameWithSaveButton(
        updatedConversationName,
      );
      await conversationAssertion.assertEntityState(
        { name: updatedConversationName },
        'visible',
      );
    });
  },
);
