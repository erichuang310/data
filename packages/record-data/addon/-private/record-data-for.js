import { recordDataFor } from '@ember-data/store/-private';

export function relationshipsFor(instance) {
  let recordData = recordDataFor(instance) || instance;

  return recordData._relationships;
}

export function relationshipStateFor(instance, propertyName) {
  return relationshipsFor(instance).get(propertyName);
}

export function implicitRelationshipsFor(instance) {
  let recordData = recordDataFor(instance) || instance;

  return recordData.__implicitRelationships;
}

export function implicitRelationshipStateFor(instance, propertyName) {
  return implicitRelationshipsFor(instance)[propertyName];
}
