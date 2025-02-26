import { DialAIEntityModel } from '@/chat/types/models';
import dialTest from '@/src/core/dialFixtures';
import { ExpectedMessages } from '@/src/testData';
import { GeneratorUtil, ModelsUtil } from '@/src/utils';
import { expect } from '@playwright/test';

const sysPrompt = 'test prompt';
const temp = 0.8;

let models: DialAIEntityModel[];
let defaultModel: DialAIEntityModel;

dialTest.beforeAll(async () => {
  models = ModelsUtil.getLatestModels();
  defaultModel = ModelsUtil.getDefaultModel()!;
});

dialTest(
  'Selected settings are saved if to switch from Model1 to Model2',
  async ({
    dialHomePage,
    agentSettings,
    conversationSettingsModal,
    temperatureSlider,
    addons,
    setTestIds,
    talkToAgentDialog,
    marketplacePage,
    chat,
    localStorageManager,
  }) => {
    setTestIds('EPMRTC-1046');
    const randomModel = GeneratorUtil.randomArrayElement(
      models.filter(
        (m) =>
          m.id !== defaultModel.id &&
          ModelsUtil.doesModelAllowSystemPrompt(m) &&
          ModelsUtil.doesModelAllowTemperature(m),
      ),
    );
    await localStorageManager.setRecentModelsIds(defaultModel, randomModel);
    await dialHomePage.openHomePage();
    await dialHomePage.waitForPageLoaded();

    await chat.configureSettingsButton.click();
    if (ModelsUtil.doesModelAllowSystemPrompt(defaultModel)) {
      await agentSettings.setSystemPrompt(sysPrompt);
    }
    if (ModelsUtil.doesModelAllowTemperature(defaultModel)) {
      await temperatureSlider.setTemperature(temp);
    }
    await conversationSettingsModal.applyChangesButton.click();

    await chat.changeAgentButton.click();
    await talkToAgentDialog.selectAgent(randomModel, marketplacePage);

    await chat.configureSettingsButton.click();
    if (ModelsUtil.doesModelAllowSystemPrompt(defaultModel)) {
      const systemPromptVisible = await agentSettings.getSystemPrompt();
      expect
        .soft(systemPromptVisible, ExpectedMessages.systemPromptIsValid)
        .toBe(sysPrompt);
    }
    if (ModelsUtil.doesModelAllowTemperature(defaultModel)) {
      const temperature = await temperatureSlider.getTemperature();
      expect
        .soft(temperature, ExpectedMessages.temperatureIsValid)
        .toBe(temp.toString());
    }
    const selectedAddons = await addons.getSelectedAddons();
    expect
      .soft(selectedAddons, ExpectedMessages.selectedAddonsValid)
      .toEqual([]);
  },
);

dialTest(
  'System prompt contains combinations with :',
  async ({ dialHomePage, agentSettings, chat, setTestIds }) => {
    setTestIds('EPMRTC-1084');
    const prompts = [
      'test:',
      'test. test:',
      'test :',
      ' test:',
      'test test. test:',
    ];
    await dialHomePage.openHomePage();
    await dialHomePage.waitForPageLoaded();
    await chat.configureSettingsButton.click();
    for (const prompt of prompts) {
      await agentSettings.setSystemPrompt(prompt);
      const systemPrompt = await agentSettings.getSystemPrompt();
      expect
        .soft(systemPrompt, ExpectedMessages.systemPromptIsValid)
        .toBe(prompt);
      await agentSettings.clearSystemPrompt();
    }
  },
);
