import { findAll, find, visit, click } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';
import { selectChoose } from 'ember-power-select/test-support/helpers';
import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';
import reorder from '../helpers/reorder';

module('Acceptance | line chart', function(hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  test('tooltip updates', async function(assert) {
    assert.expect(2);

    await visit('/line-chart');
    let container = this.owner.__container__;

    showTooltip(container);

    // check text of the tooltip container
    assert.dom('.sub-title').hasText('Ad Clicks', "The tooltip contains the metric's display name.");

    // Select a different metric
    await selectChoose('.navi-visualization-config .metric-select__select__selector', 'Revenue (USD)');

    showTooltip(container);

    // check text of the tooltip container
    assert
      .dom('.sub-title')
      .hasText(
        'Revenue (USD)',
        'The tooltip contains the correct metric display name after a new parameterized metric is selected'
      );
  });

  test('custom chart builders', async function(assert) {
    assert.expect(1);

    await visit('/line-chart');

    let customChartBuilderSeries = findAll('.custom-chart-builder .c3-legend-item').map(e => e.textContent);
    assert.deepEqual(
      customChartBuilderSeries,
      ['custom', 'series', 'grouping'],
      'A custom chart builder can be supplied for unique series grouping logic'
    );
  });

  test('line style options', async function(assert) {
    await visit('/line-chart');

    let linePath = find('svg .c3-chart-line.chart-series-0 .c3-lines path').getAttribute('d');

    await selectChoose('.line-chart-config__curve-opt', 'Spline');

    let linePathSpline = find('svg .c3-chart-line.chart-series-0 .c3-lines path').getAttribute('d');
    let lineAreaSpline = find('svg .c3-chart-line.chart-series-0 .c3-areas path').getAttribute('d');

    assert.notEqual(linePath, linePathSpline, 'Chart updated with new values');

    await click('.line-chart-config__area-opt .x-toggle-btn');

    let linePathSplineArea = find('svg .c3-chart-line.chart-series-0 .c3-lines path').getAttribute('d');
    let lineAreaSplineArea = find('svg .c3-chart-line.chart-series-0 .c3-areas path').getAttribute('d');

    assert.notEqual(linePathSpline, linePathSplineArea, 'lines have been updated');
    assert.notEqual(lineAreaSpline, lineAreaSplineArea, 'Area is updated');
  });

  test('series reorder', async function(assert) {
    await visit('/line-chart');

    // switch on `stacked` and expand the config
    await click('.line-chart-config__stacked-opt .x-toggle-btn');
    await click('.line-chart-config__series-config__header');

    assert.deepEqual(
      findAll('.line-chart-config__series-config__item__content').map(el => el.textContent.trim()),
      [
        'Unique Identifiers',
        'Total Page Views',
        'Revenue (USD)'
      ],
      'The headers are reordered as specified by the reorder'
    );

    await reorder(
      'mouse',
      '.line-chart-config__series-config__item__handler',
      '.line-chart-config__series-config__item__handler:nth-child(2)', // move second metric to first metric position
      '.line-chart-config__series-config__item__handler:nth-child(2)', // move new second metric to second metric position
    );

    assert.deepEqual(
      findAll('.line-chart-config__series-config__item__content').map(el => el.textContent.trim()),
      [
        'Total Page Views',
        'Unique Identifiers',
        'Revenue (USD)'
      ],
      'The headers are reordered as specified by the reorder'
    );
  });

  /**
   * @function showTooltip
   * @param {Object} container - app container
   * This will show the chart tooltip so that we can fetch its contents.
   */
  function showTooltip(container) {
    let emberId = find(findAll('.chart-container .navi-vis-c3-chart')[1]).id,
      component = container.lookup('-view-registry:main')[emberId],
      c3 = component.get('chart');
    c3.tooltip.show({ x: 1 });
  }
});
