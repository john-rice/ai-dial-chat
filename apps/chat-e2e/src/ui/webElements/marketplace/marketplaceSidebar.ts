import { MarketplaceSideBarSelectors } from '@/src/ui/selectors/marketplaceSelectors';
import { BaseElement } from '@/src/ui/webElements';
import { MarketplaceFilter } from '@/src/ui/webElements/marketplace/marketplaceFilter';
import { Locator, Page } from '@playwright/test';

export class MarketplaceSidebar extends BaseElement {
  constructor(page: Page, parentLocator: Locator) {
    super(page, MarketplaceSideBarSelectors.sidebar, parentLocator);
  }

  private marketplaceFilter!: MarketplaceFilter;

  getMarketplaceFilter(): MarketplaceFilter {
    if (!this.marketplaceFilter) {
      this.marketplaceFilter = new MarketplaceFilter(
        this.page,
        this.rootLocator,
      );
    }
    return this.marketplaceFilter;
  }

  public marketplaceHomePageButton = this.getChildElementBySelector(
    MarketplaceSideBarSelectors.marketplaceHomePageButton,
  );
  public myApplicationsButton = this.getChildElementBySelector(
    MarketplaceSideBarSelectors.myApplicationsButton,
  );
}
