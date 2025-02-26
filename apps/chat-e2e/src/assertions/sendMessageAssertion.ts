import { BaseAssertion } from '@/src/assertions/base/baseAssertion';
import {
  ElementActionabilityState,
  ElementState,
  ExpectedMessages,
} from '@/src/testData';
import { Styles } from '@/src/ui/domData';
import { SendMessage } from '@/src/ui/webElements';
import { expect } from '@playwright/test';

export class SendMessageAssertion extends BaseAssertion {
  readonly sendMessage: SendMessage;

  constructor(sendMessage: SendMessage) {
    super();
    this.sendMessage = sendMessage;
  }

  public async assertSendMessageWidth(
    initialWidth: number,
    option: { hasFullWidth: boolean },
  ) {
    const sendMessageInputFullWidth = await this.sendMessage
      .getComputedStyleProperty(Styles.width)
      .then((w) => +w[0].replace('px', ''));
    option.hasFullWidth
      ? expect
          .soft(sendMessageInputFullWidth, ExpectedMessages.elementWidthIsValid)
          .toBeGreaterThan(initialWidth)
      : expect
          .soft(sendMessageInputFullWidth, ExpectedMessages.elementWidthIsValid)
          .toBe(initialWidth);
  }

  public async assertMessageValue(expectedValue: string | undefined) {
    const messageValue = await this.sendMessage.getMessage();
    expect
      .soft(messageValue, ExpectedMessages.messageContentIsValid)
      .toBe(expectedValue ?? '');
  }

  public async assertContinueReplayButtonState(expectedState: ElementState) {
    const continueReplayButton =
      this.sendMessage.proceedGenerating.getElementLocator();
    expectedState === 'visible'
      ? await expect
          .soft(continueReplayButton, ExpectedMessages.buttonIsVisible)
          .toBeVisible()
      : await expect
          .soft(continueReplayButton, ExpectedMessages.buttonIsNotVisible)
          .toBeHidden();
  }

  public async assertScrollDownButtonState(expectedState: ElementState) {
    const scrollDownButton =
      this.sendMessage.scrollDownButton.getElementLocator();
    expectedState === 'visible'
      ? await expect
          .soft(scrollDownButton, ExpectedMessages.scrollDownButtonIsVisible)
          .toBeVisible()
      : await expect
          .soft(scrollDownButton, ExpectedMessages.scrollDownButtonIsNotVisible)
          .toBeHidden();
  }

  public async assertInputFieldState(
    expectedState: ElementState,
    expectedActionability: ElementActionabilityState,
  ) {
    const messageInput = this.sendMessage.messageInput.getElementLocator();
    await this.assertElementState(messageInput, expectedState);
    await this.assertElementActionabilityState(
      messageInput,
      expectedActionability,
    );
  }
}
