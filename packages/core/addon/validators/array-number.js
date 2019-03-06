/**
 * Copyright 2017, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */

import { isArray } from '@ember/array';
import { isPresent } from '@ember/utils';
import BaseValidator from 'ember-cp-validations/validators/base';

export default BaseValidator.extend({
  validate(value, options) {
    if (isArray(value) && value.every(isPresent) && !value.some(isNaN)) {
      return true;
    }
    return this.createErrorMessage('Not all values in the array are numbers', value, options);
  }
});
