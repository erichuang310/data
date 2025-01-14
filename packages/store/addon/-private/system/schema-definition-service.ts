import Store from './ds-model-store';
import { RecordIdentifier } from '../ts-interfaces/identifier';
import { get } from '@ember/object';
import { getOwner } from '@ember/application';
import normalizeModelName from './normalize-model-name';
import { RelationshipsSchema, AttributesSchema } from '../ts-interfaces/record-data-schemas';
import require, { has } from 'require';

const HAS_MODEL_PACKAGE = has('@ember-data/model');
let _Model;
function getModel() {
  if (HAS_MODEL_PACKAGE) {
    _Model = _Model || require('@ember-data/model').default;
  }
  return _Model;
}

export class DSModelSchemaDefinitionService {
  private _modelFactoryCache = Object.create(null);
  private _relationshipsDefCache = Object.create(null);
  private _attributesDefCache = Object.create(null);

  constructor(public store: Store) {}

  // Following the existing RD implementation
  attributesDefinitionFor(identifier: RecordIdentifier | string): AttributesSchema {
    let modelName, attributes;
    if (typeof identifier === 'string') {
      modelName = identifier;
    } else {
      modelName = identifier.type;
    }

    attributes = this._attributesDefCache[modelName];

    if (attributes === undefined) {
      let modelClass = this.store.modelFor(modelName);
      let attributeMap = get(modelClass, 'attributes');

      attributes = Object.create(null);
      attributeMap.forEach((meta, name) => (attributes[name] = meta));
      this._attributesDefCache[modelName] = attributes;
    }

    return attributes;
  }

  // Following the existing RD implementation
  relationshipsDefinitionFor(identifier: RecordIdentifier | string): RelationshipsSchema {
    let modelName, relationships;
    if (typeof identifier === 'string') {
      modelName = identifier;
    } else {
      modelName = identifier.type;
    }

    relationships = this._relationshipsDefCache[modelName];

    if (relationships === undefined) {
      let modelClass = this.store.modelFor(modelName);
      relationships = get(modelClass, 'relationshipsObject') || null;
      this._relationshipsDefCache[modelName] = relationships;
    }

    return relationships;
  }

  doesTypeExist(modelName: string): boolean {
    let normalizedModelName = normalizeModelName(modelName);
    let factory = getModelFactory(this.store, this._modelFactoryCache, normalizedModelName);

    return factory !== null;
  }
}

/**
 *
 * @param store
 * @param cache modelFactoryCache
 * @param normalizedModelName already normalized modelName
 * @return {*}
 */
export function getModelFactory(store, cache, normalizedModelName) {
  let factory = cache[normalizedModelName];

  if (!factory) {
    factory = _lookupModelFactory(store, normalizedModelName);

    if (!factory) {
      //Support looking up mixins as base types for polymorphic relationships
      factory = _modelForMixin(store, normalizedModelName);
    }

    if (!factory) {
      // we don't cache misses in case someone wants to register a missing model
      return null;
    }

    let klass = factory.class;
    // assert(`'${inspect(klass)}' does not appear to be an ember-data model`, klass.isModel);

    // TODO: deprecate this
    if (klass.isModel) {
      let hasOwnModelNameSet = klass.modelName && klass.hasOwnProperty('modelName');
      if (!hasOwnModelNameSet) {
        klass.modelName = normalizedModelName;
      }
    }

    cache[normalizedModelName] = factory;
  }

  return factory;
}

export function _lookupModelFactory(store, normalizedModelName) {
  let owner = getOwner(store);

  return owner.factoryFor(`model:${normalizedModelName}`);
}

/*
    In case someone defined a relationship to a mixin, for example:
    ```
      let Comment = Model.extend({
        owner: belongsTo('commentable'. { polymorphic: true })
      });
      let Commentable = Ember.Mixin.create({
        comments: hasMany('comment')
      });
    ```
    we want to look up a Commentable class which has all the necessary
    relationship metadata. Thus, we look up the mixin and create a mock
    Model, so we can access the relationship CPs of the mixin (`comments`)
    in this case
  */
export function _modelForMixin(store, normalizedModelName) {
  if (HAS_MODEL_PACKAGE) {
    let owner = getOwner(store);
    let MaybeMixin = owner.factoryFor(`mixin:${normalizedModelName}`);
    let mixin = MaybeMixin && MaybeMixin.class;

    if (mixin) {
      let ModelForMixin = getModel().extend(mixin);
      ModelForMixin.reopenClass({
        __isMixin: true,
        __mixin: mixin,
      });

      //Cache the class as a model
      owner.register('model:' + normalizedModelName, ModelForMixin);
    }

    return _lookupModelFactory(store, normalizedModelName);
  }
}
