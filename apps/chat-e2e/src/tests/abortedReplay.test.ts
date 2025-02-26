import { Conversation } from '@/chat/types/chat';
import { DialAIEntityModel } from '@/chat/types/models';
import dialTest from '@/src/core/dialFixtures';
import {
  CollapsedSections,
  ExpectedConstants,
  ExpectedMessages,
  MenuOptions,
  MockedChatApiResponseBodies,
} from '@/src/testData';
import { GeneratorUtil, ModelsUtil } from '@/src/utils';
import { expect } from '@playwright/test';

let models: DialAIEntityModel[];
let defaultModel: DialAIEntityModel;

dialTest.beforeAll(async () => {
  models = ModelsUtil.getLatestModels().filter((m) => m.iconUrl != undefined);
  defaultModel = ModelsUtil.getDefaultModel()!;
});

dialTest(
  'Replay after Stop generating.\n' +
    'Share menu item is not available for the chat in Replay mode.\n' +
    'No Edit, Delete and Clear buttons when chat is in replay mode.\n' +
    'Publish item is not available in context menu for the chat in Replay mode',
  async ({
    dialHomePage,
    conversationData,
    chat,
    localStorageManager,
    dataInjector,
    setTestIds,
    chatMessages,
    conversations,
    chatHeader,
    marketplacePage,
    iconApiHelper,
    conversationAssertion,
    chatMessagesAssertion,
    chatHeaderAssertion,
    conversationDropdownMenuAssertion,
    tooltipAssertion,
    sendMessage,
    sendMessageAssertion,
    talkToAgentDialog,
  }) => {
    dialTest.slow();
    setTestIds(
      'EPMRTC-512',
      'EPMRTC-3451',
      'EPMRTC-1448',
      'EPMRTC-1132',
      'EPMRTC-3452',
    );
    let firstConversation: Conversation;
    let secondConversation: Conversation;
    let historyConversation: Conversation;
    let replayConversation: Conversation;
    const firstRandomModel = GeneratorUtil.randomArrayElement(models);
    const secondRandomModel = GeneratorUtil.randomArrayElement(
      models.filter((m) => m.id !== firstRandomModel.id),
    );
    const newRandomModel = GeneratorUtil.randomArrayElement(
      models.filter(
        (m) => m.id !== firstRandomModel.id && m.id !== secondRandomModel.id,
      ),
    );
    const firstUserRequest = 'write down 100 adjectives';
    const secondUserRequest = 'write down 200 adjectives';
    const expectedNewModelIcon = iconApiHelper.getEntityIcon(newRandomModel);

    await dialTest.step(
      'Prepare partially replayed conversation with different models',
      async () => {
        firstConversation =
          conversationData.prepareModelConversationBasedOnRequests(
            [firstUserRequest],
            firstRandomModel,
          );
        conversationData.resetData();
        secondConversation =
          conversationData.prepareModelConversationBasedOnRequests(
            [secondUserRequest],
            secondRandomModel,
          );
        conversationData.resetData();
        historyConversation = conversationData.prepareHistoryConversation(
          firstConversation,
          secondConversation,
        );
        replayConversation =
          conversationData.preparePartiallyReplayedConversation(
            historyConversation,
            1,
          );
        await dataInjector.createConversations([
          historyConversation,
          replayConversation,
        ]);
        await localStorageManager.setRecentModelsIds(
          newRandomModel,
          firstRandomModel,
          secondRandomModel,
        );
        await localStorageManager.setChatCollapsedSection(
          CollapsedSections.Organization,
        );
      },
    );

    await dialTest.step(
      'Verify no "Share", "Publish" options are available in dropdown menu for partially replayed conversation',
      async () => {
        await dialHomePage.openHomePage({
          iconsToBeLoaded: [secondRandomModel.iconUrl],
        });
        await dialHomePage.waitForPageLoaded();
        await conversations.selectConversation(replayConversation.name);
        await conversations.getEntityByName(replayConversation.name).waitFor();
        await conversations.openEntityDropdownMenu(replayConversation.name);
        await conversationDropdownMenuAssertion.assertMenuExcludesOptions(
          MenuOptions.share,
          MenuOptions.publish,
        );
      },
    );

    await dialTest.step(
      'Verify no "Edit", "Delete", "Set message template" icons are available for partial request, no "Clear" button displayed in the header, "Continue replay" button is available',
      async () => {
        await chatMessagesAssertion.assertMessageEditIconState(3, 'hidden');
        await chatMessagesAssertion.assertMessageDeleteIconState(3, 'hidden');
        await chatMessagesAssertion.assertSetMessageTemplateIconState(
          3,
          'hidden',
        );
        await chatHeaderAssertion.assertClearButtonState('hidden');
        await sendMessageAssertion.assertContinueReplayButtonState('visible');
      },
    );

    await dialTest.step('Verify tooltip for Replay button', async () => {
      await sendMessage.proceedGenerating.hoverOver();
      await tooltipAssertion.assertTooltipContent(
        ExpectedConstants.continueReplayLabel,
      );
    });

    await dialTest.step(
      'Open conversation settings, select new model and verify model icon is updated in the header, Replay icon stays on chat bar',
      async () => {
        await chatHeader.chatAgent.click();
        await talkToAgentDialog.selectAgent(newRandomModel, marketplacePage);
        await chatHeaderAssertion.assertHeaderIcon(expectedNewModelIcon);
        await conversationAssertion.assertReplayIconState(
          {
            name:
              ExpectedConstants.replayConversation + historyConversation.name,
          },
          'visible',
        );
      },
    );

    await dialTest.step(
      'Proceed generating the answer and verify received content is preserved',
      async () => {
        const chatContentBeforeReplay =
          await chatMessages.chatMessages.getElementsInnerContent();
        await dialHomePage.mockChatTextResponse(
          MockedChatApiResponseBodies.simpleTextBody,
        );
        await chat.proceedReplaying(true);

        await chatMessagesAssertion.assertMessagesCount(
          chatContentBeforeReplay.length,
        );

        const chatContentAfterReplay =
          await chatMessages.chatMessages.getElementsInnerContent();
        expect
          .soft(
            JSON.stringify(
              chatContentAfterReplay.slice(
                0,
                chatContentAfterReplay.length - 1,
              ),
            ),
            ExpectedMessages.replayContinuesFromReceivedContent,
          )
          .toBe(
            JSON.stringify(
              chatContentBeforeReplay.slice(
                0,
                chatContentBeforeReplay.length - 1,
              ),
            ),
          );
      },
    );

    await dialTest.step('Verify model icon is updated chat bar', async () => {
      await conversationAssertion.assertTreeEntityIcon(
        {
          name: ExpectedConstants.replayConversation + historyConversation.name,
        },
        expectedNewModelIcon,
      );
    });

    await dialTest.step(
      'Verify "Share", "Publish" options are available in dropdown menu for fully replayed conversation',
      async () => {
        await conversations.openEntityDropdownMenu(replayConversation.name);
        await conversationDropdownMenuAssertion.assertMenuIncludesOptions(
          MenuOptions.share,
          MenuOptions.publish,
        );
      },
    );

    await dialTest.step(
      'Verify "Edit", "Delete", "Set message template" icons are available for all the requests, "Clear" button displayed in the header, "Continue replay" button is not available',
      async () => {
        for (const request of historyConversation.messages.filter(
          (m) => m.role === 'user',
        )) {
          await chatMessagesAssertion.assertMessageEditIconState(
            request.content,
            'visible',
          );
          await chatMessagesAssertion.assertSetMessageTemplateIconState(
            request.content,
            'visible',
          );
          await chatMessagesAssertion.assertMessageDeleteIconState(
            request.content,
            'visible',
          );
        }
        await chatHeaderAssertion.assertClearButtonState('visible');
        await sendMessageAssertion.assertContinueReplayButtonState('hidden');
      },
    );
  },
);

dialTest(
  '"Replay as is" or any model is re-set in the middle of replay',
  async ({
    dialHomePage,
    conversationData,
    chat,
    dataInjector,
    setTestIds,
    chatHeader,
    iconApiHelper,
    chatMessagesAssertion,
    conversations,
    localStorageManager,
    talkToAgentDialogAssertion,
    talkToAgentDialog,
  }) => {
    dialTest.slow();
    setTestIds('EPMRTC-1132');
    let firstConversation: Conversation;
    let secondConversation: Conversation;
    let thirdConversation: Conversation;
    let historyConversation: Conversation;
    let replayConversation: Conversation;
    const firstRandomModel = GeneratorUtil.randomArrayElement(models);
    const secondRandomModel = GeneratorUtil.randomArrayElement(
      models.filter((m) => m.id !== firstRandomModel.id),
    );
    const thirdRandomModel = GeneratorUtil.randomArrayElement(
      models.filter(
        (m) => m.id !== firstRandomModel.id && m.id !== secondRandomModel.id,
      ),
    );
    const randomAddon = GeneratorUtil.randomArrayElement(
      ModelsUtil.getAddons(),
    );
    const newRandomModel = GeneratorUtil.randomArrayElement(
      models.filter(
        (m) =>
          m.id !== firstRandomModel.id &&
          m.id !== secondRandomModel.id &&
          m.id !== thirdRandomModel.id,
      ),
    );
    const expectedSecondModelIcon =
      iconApiHelper.getEntityIcon(secondRandomModel);
    const expectedThirdModelIcon =
      iconApiHelper.getEntityIcon(thirdRandomModel);

    await dialTest.step(
      'Prepare conversation with different models to replay',
      async () => {
        firstConversation =
          conversationData.prepareDefaultConversation(firstRandomModel);
        conversationData.resetData();
        secondConversation =
          conversationData.prepareDefaultConversation(secondRandomModel);
        conversationData.resetData();
        thirdConversation = conversationData.prepareAddonsConversation(
          thirdRandomModel,
          [randomAddon.id],
        );
        conversationData.resetData();
        historyConversation = conversationData.prepareHistoryConversation(
          firstConversation,
          secondConversation,
          thirdConversation,
        );
        replayConversation =
          conversationData.preparePartiallyReplayedConversation(
            historyConversation,
            1,
            newRandomModel,
          );
        await dataInjector.createConversations([
          historyConversation,
          replayConversation,
        ]);
        await localStorageManager.setRecentModelsIds(
          firstRandomModel,
          secondRandomModel,
          thirdRandomModel,
          newRandomModel,
        );
        await localStorageManager.setChatCollapsedSection(
          CollapsedSections.Organization,
        );
      },
    );

    await dialTest.step(
      'Open conversation settings, select "Replay as is" option and verify it is highlighted',
      async () => {
        await dialHomePage.openHomePage();
        await dialHomePage.waitForPageLoaded();
        await conversations.selectConversation(replayConversation.name);
        await conversations.getEntityByName(replayConversation.name).waitFor();
        await chatHeader.chatAgent.click();
        await talkToAgentDialogAssertion.assertAgentIsSelected(newRandomModel);
        await talkToAgentDialog.selectReplayAsIs();
      },
    );

    await dialTest.step(
      'Continue generation with "Replay as is" option and verify model icons are updated on chat bar',
      async () => {
        await dialHomePage.mockChatTextResponse(
          MockedChatApiResponseBodies.simpleTextBody,
        );
        await chat.proceedReplaying(true);
        await chatMessagesAssertion.assertMessageIcon(
          4,
          expectedSecondModelIcon,
        );
        await chatMessagesAssertion.assertMessageIcon(
          6,
          expectedThirdModelIcon,
        );
      },
    );
  },
);

dialTest(
  'Send button is disabled if the chat in replay mode',
  async ({
    dialHomePage,
    conversationData,
    chat,
    dataInjector,
    setTestIds,
    sendMessage,
    tooltip,
    context,
    chatMessages,
    conversations,
  }) => {
    setTestIds('EPMRTC-1535');
    const message = GeneratorUtil.randomString(10);
    let replayConversation: Conversation;

    await dialTest.step('Prepare conversation to replay', async () => {
      const requests: string[] = [];
      for (let i = 1; i <= 10; i++) {
        requests.push(GeneratorUtil.randomString(200));
      }
      const conversation =
        conversationData.prepareModelConversationBasedOnRequests(requests);
      replayConversation =
        conversationData.prepareDefaultReplayConversation(conversation);
      await dataInjector.createConversations([
        conversation,
        replayConversation,
      ]);
    });

    await dialTest.step(
      'Type new message while chat is replaying and verify Send button is disabled',
      async () => {
        await dialHomePage.openHomePage();
        await dialHomePage.waitForPageLoaded();
        await conversations.selectConversation(replayConversation.name);
        await chat.startReplay();
        await sendMessage.messageInput.fillInInput(message);

        await sendMessage.stopGenerating.hoverOver();
        const tooltipContent = await tooltip.getContent();
        expect
          .soft(tooltipContent, ExpectedMessages.tooltipContentIsValid)
          .toBe(ExpectedConstants.stopGeneratingTooltip);

        await expect
          .soft(
            sendMessage.sendMessageButton.getElementLocator(),
            ExpectedMessages.sendMessageButtonDisabled,
          )
          .toBeHidden();
      },
    );

    await dialTest.step(
      'Stop generating and verify message is preserved, footer is visible and tooltip shown on hover',
      async () => {
        await sendMessage.stopGenerating.click();
        const inputMessage = await sendMessage.messageInput.getElementContent();
        expect
          .soft(inputMessage, ExpectedMessages.messageContentIsValid)
          .toBe(message);

        await expect
          .soft(
            sendMessage.sendMessageButton.getElementLocator(),
            ExpectedMessages.sendMessageButtonIsNotVisible,
          )
          .toBeHidden();

        await chat.getFooter().waitForState({ state: 'attached' });
      },
    );

    await dialTest.step(
      'Continue replaying, refresh page and verify error appears for the least response, message is preserved, footer is visible and tooltip shown on hover',
      async () => {
        await context.setOffline(true);
        await chat.proceedReplaying();

        const generatedContent = await chatMessages.getLastMessageContent();
        expect
          .soft(generatedContent, ExpectedMessages.errorReceivedOnReplay)
          .toBe(ExpectedConstants.answerError);

        const inputMessage = await sendMessage.messageInput.getElementContent();
        expect
          .soft(inputMessage, ExpectedMessages.messageContentIsValid)
          .toBe(message);

        await expect
          .soft(
            sendMessage.sendMessageButton.getElementLocator(),
            ExpectedMessages.sendMessageButtonIsNotVisible,
          )
          .toBeHidden();

        await chat.getFooter().waitForState({ state: 'attached' });
      },
    );
  },
);

dialTest(
  'Restart replay after error appeared on browser refresh.\n' +
    'Restart replay after error appeared on network interruption',
  async ({
    dialHomePage,
    conversationData,
    chat,
    dataInjector,
    setTestIds,
    chatMessages,
    tooltip,
    context,
    sendMessage,
    conversations,
  }) => {
    setTestIds('EPMRTC-514', 'EPMRTC-1165');
    let conversation: Conversation;
    let replayConversation: Conversation;
    await dialTest.step('Prepare conversation to replay', async () => {
      conversation = conversationData.prepareDefaultConversation(defaultModel);
      replayConversation =
        conversationData.prepareDefaultReplayConversation(conversation);
      await dataInjector.createConversations([
        conversation,
        replayConversation,
      ]);
    });

    await dialTest.step(
      'Press Start replay and interrupt it with network error',
      async () => {
        await dialHomePage.openHomePage();
        await dialHomePage.waitForPageLoaded();
        await conversations.selectConversation(replayConversation.name);
        await context.setOffline(true);
        await chat.startReplay();
      },
    );

    await dialTest.step('Verify error message is displayed', async () => {
      const generatedContent = await chatMessages.getLastMessageContent();
      await sendMessage.proceedGenerating.hoverOver();
      const tooltipContent = await tooltip.getContent();

      expect
        .soft(generatedContent, ExpectedMessages.errorReceivedOnReplay)
        .toBe(ExpectedConstants.answerError);
      expect
        .soft(tooltipContent, ExpectedMessages.proceedReplayIsVisible)
        .toBe(ExpectedConstants.continueReplayAfterErrorLabel);
    });

    await dialTest.step(
      'Proceed replaying and verify response received',
      async () => {
        await context.setOffline(false);
        await chat.proceedReplaying(true);
        const generatedContent = await chatMessages.getGeneratedChatContent(
          conversation.messages.length,
        );
        expect
          .soft(
            generatedContent.includes(
              conversation.messages.find((m) => m.role === 'user')!.content,
            ),
            ExpectedMessages.replayContinuesFromReceivedContent,
          )
          .toBeTruthy();
      },
    );
  },
);

dialTest(
  'Start replay button appears in [Replay]chat if the parent chat has error in the response',
  async ({
    dialHomePage,
    conversationData,
    chat,
    dataInjector,
    setTestIds,
    conversations,
  }) => {
    setTestIds('EPMRTC-1312');
    let errorConversation: Conversation;
    let replayConversation: Conversation;

    await dialTest.step(
      'Prepare errorConversation with error response and replay errorConversation',
      async () => {
        errorConversation =
          conversationData.prepareErrorResponseConversation(defaultModel);
        replayConversation =
          conversationData.prepareDefaultReplayConversation(errorConversation);
        await dataInjector.createConversations([
          errorConversation,
          replayConversation,
        ]);
      },
    );

    await dialTest.step(
      'Verify "Start Replay" button is available',
      async () => {
        await dialHomePage.openHomePage();
        await dialHomePage.waitForPageLoaded();
        await conversations.selectConversation(replayConversation.name);
        const isStartReplayEnabled = await chat.replay.isElementEnabled();
        expect
          .soft(isStartReplayEnabled, ExpectedMessages.startReplayVisible)
          .toBeTruthy();
      },
    );
  },
);
