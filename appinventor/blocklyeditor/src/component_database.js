/* -*- mode: javascript; js-indent-level 2; -*- */
/**
 * @license
 * Copyright © 2016 Massachusetts Institute of Technology. All rights reserved.
 */

/**
 * @fileoverview A database for tracking component and component types
 * within the Blockly workspace.
 * @author Evan W. Patton <ewpatton@mit.edu>
 */

'use strict';

goog.provide('AI.Blockly.ComponentDatabase');

goog.require('AI.Blockly.Component');

Blockly.PROPERTY_READABLE = 1;
Blockly.PROPERTY_WRITEABLE = 2;
Blockly.PROPERTY_READWRITEABLE = 3;

/**
 * Database for component type information and instances.
 * @constructor
 */
Blockly.ComponentDatabase = function() {
  this.instances_ = {};
  this.types_ = {};
  // For migration of old projects that are name based rather than uid based.
  this.instanceNameUid_ = {};
};

Blockly.ComponentDatabase.prototype.addInstance = function(uid, name, typeName) {
  if (this.hasInstance(uid)) {
    return false;
  }
  this.instances_[uid] = {name: name, typeName: typeName};
  this.instanceNameUid_[name] = uid;
  return true;
};

Blockly.ComponentDatabase.prototype.hasInstance = function(uid) {
  return uid in this.instances_;
};

Blockly.ComponentDatabase.prototype.getInstance = function(uidOrName) {
  return this.instances_[uidOrName] || this.instances_[this.instanceNameUid_[uidOrName]];
};

Blockly.ComponentDatabase.prototype.renameInstance = function(uid, oldName, newName) {
  if (!this.hasInstance(uid)) {
    return false;
  }
  this.instances_[uid].name = newName;
  this.instanceNameUid_[newName] = uid;
  delete this.instanceNameUid_[oldName];
  return true;
};

Blockly.ComponentDatabase.prototype.removeInstance = function(uid) {
  if (!this.hasInstance(uid)) {
    return false;
  }
  delete this.instances_[uid];
  return true;
};

Blockly.ComponentDatabase.prototype.hasType = function(typeName) {
  return typeName in this.types_;
};

Blockly.ComponentDatabase.prototype.getType = function(typeName) {
  return this.types_[typeName];
};

Blockly.ComponentDatabase.prototype.getInstanceNames = function() {
  var instanceNames = [];
  for (var uid in this.instances_) {
    if (this.instances_.hasOwnProperty(uid) && typeof this.instances_[uid] == 'object') {
      instanceNames.push(this.instances_[uid].name);
    }
  }
  return instanceNames;
};

Blockly.ComponentDatabase.prototype.instanceNameToTypeName = function(instanceName) {
  if (instanceName in this.instanceNameUid_) {
    return this.instances_[this.instanceNameUid_[instanceName]].typeName;
  }
  return false;
};

/**
 * Obtain an array of (name, uuid) pairs for displaying components in
 * a dropdown list.
 *
 * @returns {!Array.<!Array<string>>} An array of pairs containing a
 * text value to display for the name of a component and a UUID
 * identifying the component.
 */
// TODO(ewpatton): Profile on larger projects to see if an index by
// type is appropriate
Blockly.ComponentDatabase.prototype.getComponentUidNameMapByType = function(componentType) {
  var componentNameArray = [];
  for (var uid in this.instances_) {
    if (this.instances_[uid].typeName == componentType) {
      componentNameArray.push([this.instances_[uid].name, uid]);
    }
  }
  return componentNameArray;
};

/**
 * @typedef ComponentInfo
 * @type {object}
 * @property {string} type
 * @property {string} name
 * @property {string} external
 * @property {string} version
 * @property {string} categoryString
 * @property {string} helpString
 * @property {string} showOnPalette
 * @property {string} nonVisible
 * @property {string} iconName
 * @property {Object.<string, string>} events
 * @property {Object.<string, string>} properties
 * @property {Object.<string, string>} blockProperties
 * @property {Object.<string, string>} methods
 */

/**
 * Populate the types database.
 *
 * @param {ComponentInfo[]} componentInfos
 */
Blockly.ComponentDatabase.prototype.populateTypes = function(componentInfos) {
  for (var i = 0, componentInfo; componentInfo = componentInfos[i]; ++i) {
    var info = this.types_[componentInfo.name] = {
      type: componentInfo.type,
      external: componentInfo.external,
      componentInfo: componentInfo,
      eventDictionary: {},
      methodDictionary: {},
      properties: {},
      setPropertyList: [],
      getPropertyList: []
    };
    // parse type description and fill in all of the fields
    for (var j = 0, event; event = componentInfo.events[j]; ++j) {
      if (typeof event['deprecated'] === 'string') {
        event['deprecated'] = JSON.parse(event['deprecated']);
      }
      info.eventDictionary[event.name] = event;
    }
    for (var j = 0, method; method = componentInfo.methods[j]; ++j) {
      if (typeof method['deprecated'] === 'string') {
        method['deprecated'] = JSON.parse(method['deprecated']);
      }
      info.methodDictionary[method.name] = method;
    }
    for (var j = 0, property; property = componentInfo.blockProperties[j]; ++j) {
      info.properties[property.name] = property;
      if (typeof property['deprecated'] === 'string') {
        property['deprecated'] = JSON.parse(property['deprecated']);
        if (property['deprecated']) continue;
      }
      if (property['rw'] == 'read-write') {
        property.mutability = Blockly.PROPERTY_READWRITEABLE;
        info.getPropertyList.push(property.name);
        info.setPropertyList.push(property.name);
      } else if (property['rw'] == 'read-only') {
        property.mutability = Blockly.PROPERTY_READABLE;
        info.getPropertyList.push(property.name);
      } else if (property['rw'] == 'write-only') {
        property.mutability = Blockly.PROPERTY_WRITEABLE;
        info.setPropertyList.push(property.name);
      }
    }
  }
};
