import { BaseAssertion } from '@/src/assertions/base/baseAssertion';
import { CheckboxState, ElementState, ExpectedMessages } from '@/src/testData';
import { EntityType, TreeEntity } from '@/src/testData/types';
import { Attributes } from '@/src/ui/domData';
import { Folders } from '@/src/ui/webElements/entityTree';
import { ThemesUtil } from '@/src/utils/themesUtil';
import { expect } from '@playwright/test';

export class FolderAssertion<T extends Folders> extends BaseAssertion {
  readonly folder: T;

  constructor(folder: T) {
    super();
    this.folder = folder;
  }

  public async assertFolderState(
    folder: TreeEntity,
    expectedState: ElementState,
  ) {
    const folderLocator = this.folder.getFolderByName(
      folder.name,
      folder.index,
    );
    await this.assertElementState(folderLocator, expectedState);
  }

  public async assertFolderCheckbox(
    folder: TreeEntity,
    expectedState: ElementState,
  ) {
    const folderCheckboxLocator = this.folder.getFolderCheckbox(
      folder.name,
      folder.index,
    );
    await this.assertElementState(folderCheckboxLocator, expectedState);
  }

  public async assertFolderCheckboxState(
    folder: TreeEntity,
    expectedState: CheckboxState,
  ) {
    const message =
      expectedState === CheckboxState.checked
        ? ExpectedMessages.folderIsChecked
        : expectedState === CheckboxState.partiallyChecked
          ? ExpectedMessages.folderContentIsPartiallyChecked
          : ExpectedMessages.folderIsNotChecked;
    expect
      .soft(
        await this.folder.getFolderCheckboxState(folder.name, folder.index),
        message,
      )
      .toBe(expectedState);
  }

  public async assertFolderAndCheckboxHasSelectedColors(
    folder: TreeEntity,
    theme: string,
    entityType: EntityType,
  ) {
    const { checkboxColor, backgroundColor } =
      ThemesUtil.getEntityCheckboxAndBackgroundColor(theme, entityType);
    await this.assertFolderCheckboxBorderColors(folder, checkboxColor);
    await this.assertFolderBackgroundColor(folder, backgroundColor);
    await this.assertFolderCheckboxColor(folder, checkboxColor);
  }

  public async assertFolderEntityAndCheckboxHasSelectedColors(
    folder: TreeEntity,
    folderEntity: TreeEntity,
    theme: string,
    entityType: EntityType,
  ) {
    const { checkboxColor, backgroundColor } =
      ThemesUtil.getEntityCheckboxAndBackgroundColor(theme, entityType);
    await this.assertFolderEntityCheckboxColor(
      folder,
      folderEntity,
      checkboxColor,
    );
    await this.assertFolderEntityCheckboxBorderColors(
      folder,
      folderEntity,
      checkboxColor,
    );
    await this.assertFolderEntityBackgroundColor(
      folder,
      folderEntity,
      backgroundColor,
    );
  }

  public async assertFolderCheckboxColor(
    folder: TreeEntity,
    expectedCheckboxColor: string,
  ) {
    const folderCheckboxColor = await this.folder.getFolderCheckboxColor(
      folder.name,
      folder.index,
    );
    expect
      .soft(folderCheckboxColor[0], ExpectedMessages.iconColorIsValid)
      .toBe(expectedCheckboxColor);
  }

  public async assertFolderCheckboxBorderColors(
    folder: TreeEntity,
    expectedCheckboxBorderColor: string,
  ) {
    const folderCheckboxBorderColors =
      await this.folder.getFolderCheckboxBorderColors(
        folder.name,
        folder.index,
      );
    Object.values(folderCheckboxBorderColors).forEach((borders) => {
      borders.forEach((borderColor) => {
        expect
          .soft(borderColor, ExpectedMessages.borderColorsAreValid)
          .toBe(expectedCheckboxBorderColor);
      });
    });
  }

  public async assertFolderBackgroundColor(
    folder: TreeEntity,
    expectedColor: string,
  ) {
    const folderBackgroundColor = await this.folder.getFolderBackgroundColor(
      folder.name,
      folder.index,
    );
    expect
      .soft(
        folderBackgroundColor[0],
        ExpectedMessages.folderBackgroundColorIsValid,
      )
      .toBe(expectedColor);
  }

  public async assertFolderDotsMenuState(
    folder: TreeEntity,
    expectedState: ElementState,
  ) {
    const dotsMenu = this.folder.folderDotsMenu(folder.name, folder.index);
    await this.assertElementState(dotsMenu, expectedState);
  }

  public async hoverAndAssertFolderDotsMenuState(
    entity: TreeEntity,
    expectedState: ElementState,
  ) {
    await this.folder.getFolderByName(entity.name).hover();
    await this.assertFolderDotsMenuState(
      {
        name: entity.name,
      },
      expectedState,
    );
  }

  public async assertFolderEntityDotsMenuState(
    folder: TreeEntity,
    folderEntity: TreeEntity,
    expectedState: ElementState,
  ) {
    const dotsMenu = this.folder.folderEntityDotsMenu(
      folder.name,
      folderEntity.name,
    );
    await this.assertElementState(dotsMenu, expectedState);
  }

  public async hoverAndAssertFolderEntityDotsMenuState(
    folder: TreeEntity,
    folderEntity: TreeEntity,
    expectedState: ElementState,
  ) {
    const folderEntityLocator = this.folder.getFolderEntity(
      folder.name,
      folderEntity.name,
      folder.index,
      folderEntity.index,
    );
    await folderEntityLocator.hover();
    await this.assertFolderEntityDotsMenuState(
      folder,
      folderEntity,
      expectedState,
    );
  }

  public async assertFolderEntityState(
    folder: TreeEntity,
    folderEntity: TreeEntity,
    expectedState: ElementState,
  ) {
    const folderEntityLocator = this.folder.getFolderEntity(
      folder.name,
      folderEntity.name,
      folder.index,
      folderEntity.index,
    );
    await this.assertElementState(folderEntityLocator, expectedState);
  }

  public async assertFolderEntityCheckbox(
    folder: TreeEntity,
    folderEntity: TreeEntity,
    expectedState: ElementState,
  ) {
    const folderEntityCheckboxLocator = this.folder.getFolderEntityCheckbox(
      folder.name,
      folderEntity.name,
    );
    await this.assertElementState(folderEntityCheckboxLocator, expectedState);
  }

  public async assertFolderEntityCheckboxState(
    folder: TreeEntity,
    folderEntity: TreeEntity,
    expectedState: CheckboxState,
  ) {
    const message =
      expectedState === CheckboxState.checked
        ? ExpectedMessages.entityIsChecked
        : ExpectedMessages.entityIsNotChecked;
    expect
      .soft(
        await this.folder.getFolderEntityCheckboxState(
          folder.name,
          folderEntity.name,
          folder.index,
          folderEntity.index,
        ),
        message,
      )
      .toBe(expectedState);
  }

  public async assertFolderEntityCheckboxColor(
    folder: TreeEntity,
    folderEntity: TreeEntity,
    expectedColor: string,
  ) {
    const folderEntityCheckboxColor =
      await this.folder.getFolderEntityCheckboxColor(
        folder.name,
        folderEntity.name,
      );
    expect
      .soft(folderEntityCheckboxColor[0], ExpectedMessages.iconColorIsValid)
      .toBe(expectedColor);
  }

  public async assertFolderEntityCheckboxBorderColors(
    folder: TreeEntity,
    folderEntity: TreeEntity,
    expectedColor: string,
  ) {
    const folderEntityCheckboxBorderColors =
      await this.folder.getFolderEntityCheckboxBorderColors(
        folder.name,
        folderEntity.name,
      );
    Object.values(folderEntityCheckboxBorderColors).forEach((borders) => {
      borders.forEach((borderColor) => {
        expect
          .soft(borderColor, ExpectedMessages.borderColorsAreValid)
          .toBe(expectedColor);
      });
    });
  }

  public async assertFolderEntityBackgroundColor(
    folder: TreeEntity,
    folderEntity: TreeEntity,
    expectedColor: string,
  ) {
    const folderEntityBackgroundColor =
      await this.folder.getFolderEntityBackgroundColor(
        folder.name,
        folderEntity.name,
      );
    expect
      .soft(
        folderEntityBackgroundColor[0],
        ExpectedMessages.folderEntityBackgroundColorIsValid,
      )
      .toBe(expectedColor);
  }

  public async assertFolderEntityColor(
    folder: TreeEntity,
    folderEntity: TreeEntity,
    expectedColor: string,
  ) {
    const folderEntityElement = this.folder.getFolderEntityNameElement(
      folder.name,
      folderEntity.name,
      folder.index,
      folderEntity.index,
    );
    await this.assertElementColor(folderEntityElement, expectedColor);
  }

  public async assertFolderEditInputState(expectedState: ElementState) {
    const editInputLocator = this.folder
      .getEditFolderInput()
      .getElementLocator();
    await this.assertElementState(editInputLocator, expectedState);
  }

  public async assertFolderEditInputValue(expectedValue: string) {
    const inputValue = await this.folder
      .getEditFolderInput()
      .getEditInputValue();
    expect
      .soft(inputValue, ExpectedMessages.charactersAreNotDisplayed)
      .toBe(expectedValue);
  }

  public async assertRootFolderState(
    folder: TreeEntity,
    expectedState: ElementState,
  ) {
    const folderLocator = this.folder.getRootFolderByName(
      folder.name,
      folder.index,
    );
    await this.assertElementState(folderLocator, expectedState);
  }

  public async assertFolderArrowIconState(
    folder: TreeEntity,
    expectedState: ElementState,
  ) {
    const arrowIcon = this.folder.getFolderArrowIcon(folder.name, folder.index);
    await this.assertElementState(arrowIcon, expectedState);
  }

  public async assertSharedFolderArrowIconColor(
    folder: TreeEntity,
    expectedColor: string,
  ) {
    const arrowIconColor = await this.folder.getFolderArrowIconColor(
      folder.name,
      folder.index,
    );
    expect
      .soft(arrowIconColor[0], ExpectedMessages.sharedIconColorIsValid)
      .toBe(expectedColor);
  }

  public async assertFolderEntityArrowIconState(
    folder: TreeEntity,
    folderEntity: TreeEntity,
    expectedState: ElementState,
  ) {
    const entityArrowIcon = this.folder.getFolderEntityArrowIcon(
      folder.name,
      folderEntity.name,
      folder.index,
      folderEntity.index,
    );
    await this.assertElementState(entityArrowIcon, expectedState);
  }

  public async assertFolderEntityIcon(
    folder: TreeEntity,
    folderEntity: TreeEntity,
    expectedIcon: string,
  ) {
    const folderEntityIcon = this.folder.getFolderEntityIcon(
      folder.name,
      folderEntity.name,
      folder.index,
      folderEntity.index,
    );
    await this.assertEntityIcon(folderEntityIcon, expectedIcon);
  }

  public async assertFoldersCount(expectedCount: number) {
    const actualFoldersCount = await this.folder.getFoldersCount();
    expect
      .soft(actualFoldersCount, ExpectedMessages.foldersCountIsValid)
      .toBe(expectedCount);
  }

  public async assertFolderSelectedState(
    folder: TreeEntity,
    isSelected: boolean,
  ) {
    await expect
      .soft(
        this.folder.getFolderByName(folder.name, folder.index),
        ExpectedMessages.folderIsHighlighted,
      )
      .toHaveAttribute(Attributes.ariaSelected, String(isSelected));
  }

  public async assertFolderEntitySelectedState(
    folder: TreeEntity,
    folderEntity: TreeEntity,
    isSelected: boolean,
  ) {
    const selectedFolderEntity = this.folder.getSelectedFolderEntity(
      folder.name,
      folderEntity.name,
      folder.index,
      folderEntity.index,
    );
    isSelected
      ? await expect
          .soft(selectedFolderEntity, ExpectedMessages.entityIsSelected)
          .toBeVisible()
      : await expect
          .soft(selectedFolderEntity, ExpectedMessages.entityIsNotSelected)
          .toBeHidden();
  }

  //the function argument is a full path to the searched folder, e.g., 'test' - if the folder is not nested, or 'test1/test1.1/test1.1.1' in the case of a nested structure
  public async assertSearchResultRepresentation(searchFolderPath: string) {
    //extract folder path elements to an array
    const searchFolderHierarchyArray = searchFolderPath.split('/');
    const foundFolders = await this.folder.getFolderNames();
    let index = 0;
    //check if each path element is sequentially included in the search results
    const isHierarchyIncludedIntoResults = foundFolders.every(
      (item) => (index = searchFolderHierarchyArray.indexOf(item, index) + 1),
    );
    expect
      .soft(
        isHierarchyIncludedIntoResults,
        ExpectedMessages.searchResultsAreCorrect,
      )
      .toBeTruthy();
  }
}
