/**
 * Copyright 2017, Yahoo Holdings Inc.
 * Licensed under the terms of the MIT license. See accompanying LICENSE.md file for terms.
 */
import Ember from 'ember';

export default Ember.Controller.extend({

  /*
   * @property {Controller} reportController
   */
  reportController: Ember.inject.controller('dashboards.dashboard.widgets.widget')
});
