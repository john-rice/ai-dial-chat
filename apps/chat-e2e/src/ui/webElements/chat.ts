import {
  ChatSelectors,
  ChatSettingsSelectors,
  ErrorLabelSelectors,
  ReplaySelectors,
} from '../selectors';
import { BaseElement } from './baseElement';
import { ChatMessages } from './chatMessages';
import { SendMessage } from './sendMessage';

import { API, ExpectedConstants, ScrollState, Side } from '@/src/testData';
import { keys } from '@/src/ui/keyboard';
import { AgentInfo } from '@/src/ui/webElements/agentInfo';
import { ChatHeader } from '@/src/ui/webElements/chatHeader';
import { Compare } from '@/src/ui/webElements/compare';
import { Footer } from '@/src/ui/webElements/footer';
import { PlaybackControl } from '@/src/ui/webElements/playbackControl';
import { PublicationReviewControl } from '@/src/ui/webElements/publicationReviewControl';
import { Locator, Page } from '@playwright/test';

export const PROMPT_APPLY_DELAY = 500;
export const SCROLL_MOVING_DELAY = 100;

export class Chat extends BaseElement {
  constructor(page: Page, parentLocator: Locator) {
    super(page, ChatSelectors.chat, parentLocator);
  }

  private chatHeader!: ChatHeader;
  private sendMessage!: SendMessage;
  private chatMessages!: ChatMessages;
  private compare!: Compare;
  private playbackControl!: PlaybackControl;
  private agentInfo!: AgentInfo;
  private footer!: Footer;
  private publicationReviewControl!: PublicationReviewControl;
  public replay = this.getChildElementBySelector(ReplaySelectors.startReplay);
  public chatSpinner = this.getChildElementBySelector(ChatSelectors.spinner);
  public notAllowedModelLabel = this.getChildElementBySelector(
    ErrorLabelSelectors.notAllowedModel,
  );
  public duplicate = this.getChildElementBySelector(ChatSelectors.duplicate);
  public scrollableArea = this.getChildElementBySelector(
    ChatSelectors.chatScrollableArea,
  );
  public addModelButton = this.getChildElementBySelector(
    ChatSelectors.addModelToWorkspace,
  );
  public changeAgentButton = this.getChildElementBySelector(
    ChatSettingsSelectors.changeAgentButton,
  );
  public configureSettingsButton = this.getChildElementBySelector(
    ChatSettingsSelectors.configureSettingsButton,
  );

  getChatHeader(): ChatHeader {
    if (!this.chatHeader) {
      this.chatHeader = new ChatHeader(this.page, this.rootLocator);
    }
    return this.chatHeader;
  }

  getSendMessage(): SendMessage {
    if (!this.sendMessage) {
      this.sendMessage = new SendMessage(this.page, this.rootLocator);
    }
    return this.sendMessage;
  }

  getChatMessages(): ChatMessages {
    if (!this.chatMessages) {
      this.chatMessages = new ChatMessages(this.page, this.rootLocator);
    }
    return this.chatMessages;
  }

  getCompare(): Compare {
    if (!this.compare) {
      this.compare = new Compare(this.page);
    }
    return this.compare;
  }

  getPlaybackControl(): PlaybackControl {
    if (!this.playbackControl) {
      this.playbackControl = new PlaybackControl(this.page, this.rootLocator);
    }
    return this.playbackControl;
  }

  getAgentInfo(): AgentInfo {
    if (!this.agentInfo) {
      this.agentInfo = new AgentInfo(this.page, this.rootLocator);
    }
    return this.agentInfo;
  }

  getFooter(): Footer {
    if (!this.footer) {
      this.footer = new Footer(this.page, this.rootLocator);
    }
    return this.footer;
  }

  getPublicationReviewControl(): PublicationReviewControl {
    if (!this.publicationReviewControl) {
      this.publicationReviewControl = new PublicationReviewControl(
        this.page,
        this.rootLocator,
      );
    }
    return this.publicationReviewControl;
  }

  public async sendRequestWithKeyboard(message: string, waitForAnswer = true) {
    return this.sendRequest(
      message,
      () => this.getSendMessage().sendWithEnterKey(message),
      waitForAnswer,
    );
  }

  public async startReplay(userRequest?: string, waitForAnswer = false) {
    await this.replay.waitForState();
    const requestPromise = this.waitForRequestSent(userRequest);
    await this.replay.click();
    const request = await requestPromise;
    await this.waitForResponse(waitForAnswer);
    return request.postDataJSON();
  }

  public async startReplayForDifferentModels() {
    await this.replay.waitForState();
    const requests: string[] = [];
    this.page.on('request', (data) => {
      if (data.url().includes(API.chatHost)) {
        requests.push(data.postData()!);
      }
    });
    await this.replay.click();
    await this.waitForResponse(true);
    return requests.map((r) => JSON.parse(r));
  }

  public async sendRequestInCompareMode(
    message: string,
    comparedEntities: { rightEntity: string; leftEntity: string },
    waitForAnswer = false,
  ) {
    // Click on "Add Model to Workspace" button if present
    await this.addModelToWorkspace();
    const rightRequestPromise = this.waitForRequestSent(
      comparedEntities.rightEntity,
    );
    const leftRequestPromise = this.waitForRequestSent(
      comparedEntities.leftEntity,
    );
    await this.getSendMessage().send(message);
    const rightRequest = await rightRequestPromise;
    const leftRequest = await leftRequestPromise;
    await this.waitForResponse(waitForAnswer);
    return {
      rightRequest: rightRequest.postDataJSON(),
      leftRequest: leftRequest.postDataJSON(),
    };
  }

  public async regenerateResponseInCompareMode(
    comparedEntities: { rightEntity: string; leftEntity: string },
    compareSide: Side,
  ) {
    const rightRespPromise = this.page.waitForResponse(
      (resp) =>
        resp.request().postData() !== null &&
        resp.request().postData()!.includes(comparedEntities.rightEntity),
    );
    const leftRespPromise = this.page.waitForResponse(
      (resp) =>
        resp.request().postData() !== null &&
        resp.request().postData()!.includes(comparedEntities.leftEntity),
    );
    const regenerateButtonIndex = compareSide === Side.left ? 1 : 2;
    await this.getChatMessages()
      .regenerate.getNthElement(regenerateButtonIndex)
      .click();
    await rightRespPromise;
    await leftRespPromise;
    await this.waitForResponse(true);
  }

  public waitForRequestSent(userRequest: string | undefined) {
    return userRequest !== undefined
      ? this.page.waitForRequest((request) => {
          ExpectedConstants.charsToEscape.forEach((char) => {
            if (userRequest?.includes(char)) {
              userRequest = userRequest.replaceAll(char, `\\${char}`);
            }
          });
          return (
            request.url().includes(API.chatHost) &&
            request.postData()!.includes(userRequest!)
          );
        })
      : this.page.waitForRequest(API.chatHost);
  }

  public async proceedReplaying(waitForAnswer = false) {
    const proceedGeneratingButton = this.getSendMessage().proceedGenerating;
    await proceedGeneratingButton.waitForState();
    const requestPromise = this.page.waitForRequest(API.chatHost);
    await proceedGeneratingButton.click();
    const request = await requestPromise;
    await this.waitForResponse(waitForAnswer);
    return request.postDataJSON();
  }

  public async waitForResponse(waitForAnswer = false) {
    if (waitForAnswer) {
      await this.getChatMessages().waitForResponseReceived();
    }
  }

  public async waitForChatLoaded() {
    await this.chatSpinner.waitForState({ state: 'detached' });
  }

  public async addModelToWorkspace() {
    if (await this.addModelButton.isVisible()) {
      await this.addModelButton.click();
    }
  }

  private async sendRequest(
    message: string | undefined,
    sendMethod: () => Promise<void>,
    waitForAnswer = true,
  ) {
    await this.addModelToWorkspace();
    const requestPromise = this.waitForRequestSent(message);
    await sendMethod();
    const request = await requestPromise;
    await this.waitForResponse(waitForAnswer);
    return request.postDataJSON();
  }

  public async sendRequestWithButton(message: string, waitForAnswer = true) {
    return this.sendRequest(
      message,
      () => this.getSendMessage().send(message),
      waitForAnswer,
    );
  }

  public async sendRequestWithPrompt(prompt: string, waitForAnswer = true) {
    return this.sendRequest(
      prompt,
      () => this.getSendMessage().send(),
      waitForAnswer,
    );
  }

  public async saveAndSubmitRequest(waitForAnswer = false) {
    return this.sendRequest(
      undefined,
      () => this.getChatMessages().saveAndSubmit.click(),
      waitForAnswer,
    );
  }

  public async playNextChatMessage(waitForResponse = true) {
    await this.getPlaybackControl().playbackNextDisabledButton.waitForState({
      state: 'hidden',
    });
    await this.getPlaybackControl().playbackNextButton.click();
    if (waitForResponse) {
      await this.getSendMessage().waitForMessageInputLoaded();
      await this.getChatMessages().waitForResponseReceived();
    }
  }

  public async playChatMessageWithKey(key: string) {
    await this.page.keyboard.press(key);
    await this.getSendMessage().waitForMessageInputLoaded();
    await this.getChatMessages().waitForResponseReceived();
  }

  public async playPreviousChatMessage() {
    await this.getPlaybackControl().playbackPreviousDisabledButton.waitForState(
      { state: 'hidden' },
    );
    await this.getPlaybackControl().playbackPreviousButton.click();
  }

  public async duplicateConversation() {
    const respPromise = this.page.waitForResponse(
      (resp) => resp.request().method() === 'POST',
    );
    await this.duplicate.click();
    await respPromise;
  }

  public async scrollContent(deltaX: number, deltaY: number) {
    const chatBounding = await this.getElementBoundingBox();
    await this.page.mouse.move(
      chatBounding!.x + chatBounding!.width / 2,
      chatBounding!.y + chatBounding!.height / 2,
    );
    await this.page.mouse.wheel(deltaX, deltaY);
  }

  public async waitForScrollPosition(state: ScrollState) {
    let counter = 5;
    while (counter > 0) {
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await this.page.waitForTimeout(SCROLL_MOVING_DELAY);
      counter--;
      const scrollPosition =
        await this.getSendMessage().getVerticalScrollPosition();
      if (scrollPosition === state) {
        break;
      }
    }
  }

  public async goToContentPosition(state: ScrollState) {
    const chatBounding = await this.getElementBoundingBox();
    await this.click({
      position: {
        x: chatBounding!.x + chatBounding!.width / 2,
        y: chatBounding!.y + chatBounding!.height / 2,
      },
    });
    let keyToPress;
    switch (state) {
      case ScrollState.top:
        keyToPress = keys.home;
        break;
      case ScrollState.bottom:
        keyToPress = keys.end;
        break;
    }
    await this.page.keyboard.press(keyToPress!);
    await this.waitForScrollPosition(state);
  }
}
