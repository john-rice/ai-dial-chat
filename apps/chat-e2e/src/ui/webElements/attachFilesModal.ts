import { BaseElement } from './baseElement';

import {
  AttachFilesModalSelectors,
  EntitySelectors,
  IconSelectors,
  MenuSelectors,
  SelectFolderModalSelectors,
} from '@/src/ui/selectors';
import { DropdownMenu } from '@/src/ui/webElements/dropdownMenu';
import { AttachFilesTree, Folders } from '@/src/ui/webElements/entityTree';
import { FilesModalHeader } from '@/src/ui/webElements/filesModalHeader';
import { ModalError } from '@/src/ui/webElements/modalError';
import { Search } from '@/src/ui/webElements/search';
import { Locator, Page } from '@playwright/test';

export enum FileModalSection {
  AllFiles = 'All files',
  SharedWithMe = 'Shared with me',
  Organization = 'Organization',
}
export class AttachFilesModal extends BaseElement {
  constructor(page: Page, parentLocator?: Locator) {
    super(page, AttachFilesModalSelectors.modalContainer, parentLocator);
  }

  private fileDropdownMenu!: DropdownMenu;
  private modalHeader!: FilesModalHeader;
  //'All files' section entities
  private allFolderFiles!: Folders;
  private allFilesTree!: AttachFilesTree;
  private sharedWithMeTree!: AttachFilesTree;
  private organizationTree!: AttachFilesTree;
  private search!: Search;
  public modalError!: ModalError;

  getSearchInput(): BaseElement {
    if (!this.search) {
      this.search = new Search(this.page, this.rootLocator);
    }
    return this.search;
  }

  getModalError(): ModalError {
    if (!this.modalError) {
      this.modalError = new ModalError(this.page, this.rootLocator);
    }
    return this.modalError;
  }

  getFileDropdownMenu(): DropdownMenu {
    if (!this.fileDropdownMenu) {
      this.fileDropdownMenu = new DropdownMenu(this.page);
    }
    return this.fileDropdownMenu;
  }

  getModalHeader(): FilesModalHeader {
    if (!this.modalHeader) {
      this.modalHeader = new FilesModalHeader(this.page, this.rootLocator);
    }
    return this.modalHeader;
  }

  public getSharedWithMeFilesContainer(): BaseElement {
    return this.getChildElementBySelector(
      AttachFilesModalSelectors.sharedWithMeFilesContainer,
    );
  }

  public async expandCollapseSection(section: FileModalSection) {
    let fileTree;
    if (section === FileModalSection.AllFiles) {
      fileTree = this.getAllFilesTree();
    } else if (section === FileModalSection.SharedWithMe) {
      fileTree = this.getSharedWithMeTree();
    } else if (section === FileModalSection.Organization) {
      fileTree = this.getOrganizationTree();
    }
    await fileTree!
      .getChildElementBySelector(AttachFilesModalSelectors.rootFolder)
      .click();
  }

  public getAllFilesContainer(): BaseElement {
    return this.getChildElementBySelector(
      AttachFilesModalSelectors.allFilesContainer,
    );
  }
  getAllFolderFiles(): Folders {
    if (!this.allFolderFiles) {
      this.allFolderFiles = new Folders(
        this.page,
        this.rootLocator,
        AttachFilesModalSelectors.allFilesContainer,
        EntitySelectors.file,
      );
    }
    return this.allFolderFiles;
  }

  getOrganizationTree(): AttachFilesTree {
    if (!this.organizationTree) {
      this.organizationTree = new AttachFilesTree(
        this.page,
        this.rootLocator,
        AttachFilesModalSelectors.organizationFilesContainer,
      );
    }
    return this.organizationTree;
  }

  getAllFilesTree(): AttachFilesTree {
    if (!this.allFilesTree) {
      this.allFilesTree = new AttachFilesTree(
        this.page,
        this.rootLocator,
        AttachFilesModalSelectors.allFilesContainer,
      );
    }
    return this.allFilesTree;
  }

  public getSectionElement(section: FileModalSection): BaseElement {
    switch (section) {
      case FileModalSection.AllFiles:
        return this.getChildElementBySelector(
          AttachFilesModalSelectors.allFilesContainer,
        );
      case FileModalSection.SharedWithMe:
        return this.getChildElementBySelector(
          AttachFilesModalSelectors.sharedWithMeFilesContainer,
        );
      case FileModalSection.Organization:
        return this.getChildElementBySelector(
          AttachFilesModalSelectors.organizationFilesContainer,
        );
      default:
        throw new Error(`Unknown section: ${section}`);
    }
  }

  getSharedWithMeTree(): AttachFilesTree {
    if (!this.sharedWithMeTree) {
      this.sharedWithMeTree = new AttachFilesTree(
        this.page,
        this.rootLocator,
        AttachFilesModalSelectors.sharedWithMeFilesContainer,
      );
    }
    return this.sharedWithMeTree;
  }

  public attachFilesButton = this.getChildElementBySelector(
    AttachFilesModalSelectors.attachFilesButton,
  );

  public uploadFromDeviceButton = this.getChildElementBySelector(
    AttachFilesModalSelectors.uploadFromDeviceButton,
  );

  public deleteFilesButton = this.getChildElementBySelector(
    AttachFilesModalSelectors.deleteFilesButton,
  );

  public downloadFilesButton = this.getChildElementBySelector(
    AttachFilesModalSelectors.downloadFilesButton,
  );

  public newFolderButton = this.getChildElementBySelector(
    SelectFolderModalSelectors.newFolderButton,
  );

  public getFilesSection = (sectionElement: BaseElement) =>
    sectionElement
      .getChildElementBySelector(AttachFilesModalSelectors.fileSection)
      .getElementLocator();

  public closeButton = this.getChildElementBySelector(IconSelectors.cancelIcon);

  public async checkAttachedFile(
    filename: string,
    section: FileModalSection = FileModalSection.AllFiles,
  ) {
    let treeElement;
    switch (section) {
      case FileModalSection.AllFiles:
        treeElement = this.getAllFilesTree();
        break;
      case FileModalSection.SharedWithMe:
        treeElement = this.getSharedWithMeTree();
        break;
      default:
        throw new Error(`Unknown file modal section: ${section}`);
    }
    await treeElement.attachedFileIcon(filename).click();
  }

  public async attachFiles() {
    await this.attachFilesButton.click();
    await this.waitForState({ state: 'hidden' });
  }

  public async openFileDropdownMenu(
    filename: string,
    section: FileModalSection,
  ) {
    let fileTree;
    if (section === FileModalSection.AllFiles) {
      fileTree = this.getAllFilesTree();
    } else if (section === FileModalSection.SharedWithMe) {
      fileTree = this.getSharedWithMeTree();
    }
    const file = fileTree!.getEntityByName(filename);
    await file.hover();
    await file.locator(MenuSelectors.dotsMenu).click();
    await this.getFileDropdownMenu().waitForState();
  }
}
