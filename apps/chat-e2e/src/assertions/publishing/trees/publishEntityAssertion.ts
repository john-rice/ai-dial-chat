import { EntityTreeAssertion } from '@/src/assertions/base/entityTreeAssertion';
import { PublishingExpectedMessages, TreeEntity } from '@/src/testData';
import { PublishEntitiesTree } from '@/src/ui/webElements/entityTree';

export class PublishEntityAssertion<
  T extends PublishEntitiesTree,
> extends EntityTreeAssertion<PublishEntitiesTree> {
  readonly publishEntities: T;

  constructor(publishEntities: T) {
    super(publishEntities);
    this.publishEntities = publishEntities;
  }

  public async assertEntityVersion(
    entity: TreeEntity,
    expectedVersion: string,
  ) {
    await this.assertElementText(
      this.publishEntities.getEntityVersion(entity.name, entity.index),
      expectedVersion,
      PublishingExpectedMessages.entityVersionIsValid,
    );
  }

  public async assertEntityVersionColor(
    entity: TreeEntity,
    expectedColor: string,
  ) {
    await this.assertElementColor(
      this.publishEntities.getEntityVersionElement(entity.name, entity.index),
      expectedColor,
    );
  }
}
