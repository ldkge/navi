import EmberObject from '@ember/object';
import { getOwner, setOwner } from '@ember/application';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Pretender from 'pretender';
import metadataRoutes, {
  TableOne,
  TableTwo,
  DimensionOne,
  DimensionTwo,
  DimensionThree,
  MetricOne,
  MetricTwo,
  Host
} from '../../helpers/metadata-routes';

let Service, Server;

module('Unit - Service - Bard Metadata', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    Service = this.owner.factoryFor('service:bard-metadata').create({
      host: Host
    });
    setOwner(Service, this.owner);

    //setup Pretender
    Server = new Pretender(metadataRoutes);
  });

  hooks.afterEach(function() {
    //shutdown pretender
    Server.shutdown();
  });

  test('Service Exists', function(assert) {
    assert.ok(!!Service, 'Service exists');
  });

  test('loadMetadata', async function(assert) {
    assert.expect(4);

    await Service.loadMetadata();
    let keg = Service._keg;

    assert.deepEqual(
      keg.all('metadata/table').mapBy('name'),
      [TableOne.name, TableTwo.name],
      'All tables are loaded in the keg'
    );

    assert.deepEqual(
      keg.all('metadata/dimension').mapBy('name'),
      [DimensionOne.name, DimensionThree.name, DimensionTwo.name],
      'All dimensions are loaded in the keg'
    );

    assert.deepEqual(
      keg.all('metadata/metric').mapBy('name'),
      [MetricOne.name, MetricTwo.name],
      'All metrics are loaded in the keg'
    );

    assert.ok(Service.metadataLoaded, 'metadataLoaded property is set to true after data is loaded');
  });

  test('loadMetadata after data loaded', async function(assert) {
    assert.expect(1);

    const result = await Service.loadMetadata();
    assert.notOk(result, 'loadMetadata returns a promise that resolves to nothing when metadata is already loaded');
  });

  test('_loadMetadataForType', async function(assert) {
    assert.expect(1);

    this.owner.register('model:metadata/record', EmberObject.extend());

    let keg = this.owner.lookup('service:keg'),
      testRecord = { id: 'foo', description: 'foo' };

    await Service._loadMetadataForType('record', [testRecord]);

    let record = keg.getById('metadata/record', 'foo');

    assert.deepEqual(
      { id: record.id, description: record.description },
      testRecord,
      'The testRecord has been pushed to the keg'
    );
  });

  test('all method', async function(assert) {
    assert.expect(5);

    await Service.loadMetadata();
    assert.deepEqual(
      Service.all('table').mapBy('name'),
      [TableOne.name, TableTwo.name],
      'all method returns all loaded tables'
    );

    assert.deepEqual(
      Service.all('dimension').mapBy('name'),
      [DimensionOne.name, DimensionThree.name, DimensionTwo.name],
      'all method returns all loaded dimensions'
    );

    assert.deepEqual(
      Service.all('metric').mapBy('name'),
      [MetricOne.name, MetricTwo.name],
      'all method returns all loaded metrics'
    );

    assert.throws(
      () => {
        Service.all('foo');
      },
      new Error('Assertion Failed: Type must be table, metric or dimension'),
      'Service `all` method throws error when metadata type is invalid'
    );

    Service.set('metadataLoaded', false);

    assert.throws(
      () => {
        Service.all('metric');
      },
      new Error('Assertion Failed: Metadata must be loaded before the operation can be performed'),
      'Service `all` method throws error when metadata is not loaded'
    );
  });

  test('getById', async function(assert) {
    assert.expect(6);

    await Service.loadMetadata();
    let keg = getOwner(Service).lookup('service:keg');

    assert.equal(
      Service.getById('table', 'table1'),
      keg.getById('metadata/table', 'table1'),
      'Table1 is fetched from the keg using getMetadtaById'
    );

    assert.equal(
      Service.getById('dimension', 'dimensionOne'),
      keg.getById('metadata/dimension', 'dimensionOne'),
      'DimensionOne is fetched from the keg using getMetadtaById'
    );

    assert.equal(
      Service.getById('metric', 'metricOne'),
      keg.getById('metadata/metric', 'metricOne'),
      'MetricOne is fetched from the keg using getMetadtaById'
    );

    assert.equal(Service.getById('metric'), undefined, 'getById returns undefined when no id is passed');

    assert.throws(
      () => {
        Service.getById('foo');
      },
      new Error('Assertion Failed: Type must be table, metric or dimension'),
      'Service `getById` method throws error when metadata type is invalid'
    );

    Service.set('metadataLoaded', false);

    assert.throws(
      () => {
        Service.getById('metric');
      },
      new Error('Assertion Failed: Metadata must be loaded before the operation can be performed'),
      'Service `getById` method throws error when metadata is not loaded'
    );
  });

  test('fetchById', async function(assert) {
    assert.expect(4);

    const data = await Service.fetchById('metric', 'metricOne');
    assert.deepEqual(data, MetricOne, 'Service fetchById should load correct data');

    let keg = Service._keg;

    assert.deepEqual(
      keg.all('metadata/metric').mapBy('name'),
      ['metricOne'],
      'Fetched entity has been added to the keg'
    );

    await Service.fetchById('metric', 'metricOne');
    assert.equal(Server.handledRequests.length, 2, 'Fetched entity from service every call');

    assert.deepEqual(
      keg.all('metadata/metric').mapBy('name'),
      ['metricOne'],
      'Fetching an entity already present in the keg doesn`t add another copy into the keg'
    );
  });

  test('findById', async function(assert) {
    assert.expect(4);
    Service.set('metadataLoaded', true);
    const metricOne = await Service.findById('metric', 'metricOne');
    assert.deepEqual(metricOne, MetricOne, 'Service findById should load correct data');

    let keg = Service._keg;

    assert.deepEqual(
      keg.all('metadata/metric').mapBy('name'),
      ['metricOne'],
      'Fetched entity has been added to the keg'
    );

   const data = await Service.findById('metric', 'metricOne');
   assert.deepEqual(data.name, MetricOne.name, 'Service findById should return correct data');
   assert.equal(Server.handledRequests.length, 1, 'Meta data endpoint only called once');
  });

  test('getMetaField', async function(assert) {
    assert.expect(3);
    await Service.loadMetadata();
    assert.equal(Service.getMetaField('metric', 'metricOne', 'longName'), 'Metric One', 'gets field from requested');

    assert.equal(
      Service.getMetaField('metric', 'metricOne', 'shortName', 'someDefault'),
      'someDefault',
      'returns default when field is not found'
    );

    assert.equal(
      Service.getMetaField('metric', 'InvalidMetric', 'shortName', 'someDefault'),
      'someDefault',
      'returns default when metric is not found'
    );
  });
});
