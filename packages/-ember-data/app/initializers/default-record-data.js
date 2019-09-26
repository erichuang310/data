import Store from '@ember-data/store';
import { RecordData } from '@ember-data/record-data/-private';
import { identifierCacheFor } from '@ember-data/store/-private';
import { IDENTIFIERS } from '@ember-data/canary-features';

// we seem forced to use reopen because of multi-store support
Store.reopen({});

export default {
  name: 'default-record-data',
  initialize: function() {},
};
