import { EntityTreeAssertion } from '@/src/assertions/base/entityTreeAssertion';
import {
  ElementState,
  EntityType,
  ExpectedMessages,
  TreeEntity,
} from '@/src/testData';
import { SideBarEntitiesTree } from '@/src/ui/webElements/entityTree/sidebar/sideBarEntitiesTree';
import { ThemesUtil } from '@/src/utils/themesUtil';
import { expect } from '@playwright/test';

export class SideBarEntityAssertion<
  T extends SideBarEntitiesTree,
> extends EntityTreeAssertion<SideBarEntitiesTree> {
  readonly sideBarEntitiesTree: T;

  constructor(sideBarEntitiesTree: T) {
    super(sideBarEntitiesTree);
    this.sideBarEntitiesTree = sideBarEntitiesTree;
  }

  public async assertEntityAndCheckboxHasSelectedColors(
    entity: TreeEntity,
    theme: string,
    entityType: EntityType,
  ) {
    const { checkboxColor, backgroundColor } =
      ThemesUtil.getEntityCheckboxAndBackgroundColor(theme, entityType);
    await this.assertEntityCheckboxColor(entity, checkboxColor);
    await this.assertEntityCheckboxBorderColors(entity, checkboxColor);
    await this.assertEntityBackgroundColor(entity, backgroundColor);
  }

  public async assertEntityDotsMenuState(
    entity: TreeEntity,
    expectedState: ElementState,
  ) {
    const dotsMenuLocator = this.sideBarEntitiesTree.entityDotsMenu(
      entity.name,
      entity.index,
    );
    expectedState === 'visible'
      ? await expect
          .soft(dotsMenuLocator, ExpectedMessages.dotsMenuIsVisible)
          .toBeVisible()
      : await expect
          .soft(dotsMenuLocator, ExpectedMessages.dotsMenuIsHidden)
          .toBeHidden();
  }

  public async hoverAndAssertEntityDotsMenuState(
    entity: TreeEntity,
    expectedState: ElementState,
  ) {
    await this.sideBarEntitiesTree.getEntityByName(entity.name).hover();
    await this.assertEntityDotsMenuState(
      {
        name: entity.name,
      },
      expectedState,
    );
  }

  public async assertEntitiesCount(
    expectedCount: number,
    actualCount?: number,
  ) {
    if (actualCount === undefined) {
      await this.assertElementsCount(this.sideBarEntitiesTree, expectedCount);
    } else {
      this.assertValue(
        expectedCount,
        actualCount,
        ExpectedMessages.elementsCountIsValid,
      );
    }
  }
}
