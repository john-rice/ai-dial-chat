import dialOverlayTest from '@/src/core/dialOverlayFixtures';
import { ExpectedMessages } from '@/src/testData';
import { ModelsUtil } from '@/src/utils';
import { expect } from '@playwright/test';

const expectedModelId = 'gpt-4';

for (const overlayUrl of ['/cases/overlay', '/cases/overlay-manager']) {
  dialOverlayTest(
    `Overlay test for url: "${overlayUrl}"`,
    async ({
      overlayHomePage,
      overlayContainer,
      overlayChat,
      overlayHeader,
      overlayChatHeader,
      overlayEntitySettings,
      overlayIconApiHelper,
      overlayChatHeaderAssertion,
      overlayApiAssertion,
      overlayChatMessagesAssertion,
      overlayEntitySettingAssertion,
    }) => {
      const expectedModel = ModelsUtil.getModel(expectedModelId)!;
      const expectedModelIcon =
        overlayIconApiHelper.getEntityIcon(expectedModel);

      await overlayHomePage.navigateToUrl(overlayUrl);
      if (overlayUrl.includes('overlay-manager')) {
        await overlayHomePage.overlayChatIcon.click();
      }
      await expect
        .soft(
          overlayContainer.getConversationSettings().getElementLocator(),
          ExpectedMessages.conversationSettingsVisible,
        )
        .toBeVisible();
      await overlayEntitySettingAssertion.assertSystemPromptValue('');
      const temperature = await overlayEntitySettings
        .getTemperatureSlider()
        .getTemperature();
      expect
        .soft(temperature, ExpectedMessages.defaultTemperatureIsOne)
        .toBe('1');
      const modelAddons = expectedModel.selectedAddons ?? [];
      const selectedAddons = await overlayEntitySettings
        .getAddons()
        .getSelectedAddons();
      expect
        .soft(selectedAddons, ExpectedMessages.noAddonsSelected)
        .toEqual(modelAddons);

      await expect
        .soft(
          overlayHeader.leftPanelToggle.getElementLocator(),
          ExpectedMessages.sideBarPanelIsHidden,
        )
        .toBeVisible();
      await expect
        .soft(
          overlayHeader.rightPanelToggle.getElementLocator(),
          ExpectedMessages.sideBarPanelIsHidden,
        )
        .toBeVisible();

      const overlayTheme = await overlayHomePage.getTheme();
      expect
        .soft(overlayTheme, ExpectedMessages.applicationThemeIsValid)
        .toContain('light');

      const userRequest = '1+2';
      const request = await overlayChat.sendRequestWithButton(userRequest);
      await overlayApiAssertion.assertRequestModelId(request, expectedModel);

      await overlayChatHeaderAssertion.assertClearButtonState('visible');
      await expect
        .soft(
          overlayChatHeader.openConversationSettings.getElementLocator(),
          ExpectedMessages.conversationSettingsVisible,
        )
        .toBeVisible();
      await expect
        .soft(
          overlayChatHeader.chatTitle.getElementLocator(),
          ExpectedMessages.headerTitleCorrespondRequest,
        )
        .toHaveText(userRequest);
      await overlayChatHeaderAssertion.assertHeaderIcon(expectedModelIcon);
      await overlayChatMessagesAssertion.assertMessageIcon(
        2,
        expectedModelIcon,
      );
    },
  );
}
