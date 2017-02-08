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

Blockly.PROPERTY_READABLE = 1;
Blockly.PROPERTY_WRITEABLE = 2;
Blockly.PROPERTY_READWRITEABLE = 3;

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
 * @property {Object.<string, Object<string, string>>} events
 * @property {Object.<string, Object<string, string>>} properties
 * @property {Object.<string, Object<string, string>>} blockProperties
 * @property {Object.<string, Object<string, string>>} methods
 */
ComponentInfo;

/**
 * @typedef ParameterDescriptor
 * @type {object}
 * @property {!string} name
 * @property {!type} type
 */
ParameterDescriptor;

/**
 * @typedef {{name: !string, description: !string, deprecated: ?boolean, parameters: !ParameterDescriptor[]}}
 */
EventDescriptor;

/**
 * @typedef {{name: !string, description: !string, deprecated: ?boolean, parameters: !ParameterDescriptor[], returnType: ?string}}
 */
MethodDescriptor;

/**
 * @typedef PropertyDescriptor
 * @type {object}
 * @property {!string} name
 * @property {!string} description
 * @property {!string} type
 * @property {!string} rw
 * @property {?boolean} deprecated
 */
PropertyDescriptor;

/**
 * @typedef ComponentTypeDescriptor
 * @type {object}
 * @property {!string} type
 * @property {!string} external
 * @property {!ComponentInfo} componentInfo
 * @property {!Object.<string, EventDescriptor>} eventDictionary
 * @property {!Object.<string, MethodDescriptor>} methodDictionary
 * @property {!Object.<string, PropertyDescriptor>} properties
 * @property {!string[]} setPropertyList
 * @property {!string[]} getPropertyList
 */
ComponentTypeDescriptor;

/**
 * @typedef ComponentInstanceDescriptor
 * @type {object}
 * @property {!string} name
 * @property {!string} typeName
 */
ComponentInstanceDescriptor;

/**
 * Database for component type information and instances.
 * @constructor
 */
Blockly.ComponentDatabase = function() {
  /** @type {Object.<string, ComponentInstanceDescriptor>} */
  this.instances_ = {};
  /** @type {Object.<string, ComponentTypeDescriptor>} */
  this.types_ = {};
  // For migration of old projects that are name based rather than uid based.
  /** @type {Object.<string, string>} */
  this.instanceNameUid_ = {};

  // Internationalization support
  this.i18nComponentTypes_ = {};
  this.i18nEventNames_ = {};
  this.i18nMethodNames_ = {};
  this.i18nParamNames_ = {};
  this.i18nPropertyNames_ = {};
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

/**
 * Iterate over all component instances calling the callback function with the
 * instance and its UUID.
 *
 * @param {function(!ComponentInstanceDescriptor, !string)} callback
 */
Blockly.ComponentDatabase.prototype.forEachInstance = function(callback) {
  goog.object.forEach(this.instances_, callback);
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
    if (this.instances_.hasOwnProperty(uid) && this.instances_[uid].typeName == componentType) {
      componentNameArray.push([this.instances_[uid].name, uid]);
    }
  }
  return componentNameArray;
};

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
    for (var j = 0, /** @type {EventDescriptor} */ event; event = componentInfo.events[j]; ++j) {
      if (typeof event['deprecated'] === 'string') {
        event['deprecated'] = JSON.parse(event['deprecated']);
      }
      if (event['parameters'] === undefined) {
        event['parameters'] = event['params'];
        delete event['params'];
      }
      info.eventDictionary[event.name] = event;
    }
    for (var j = 0, /** @type {MethodDescriptor} */ method; method = componentInfo.methods[j]; ++j) {
      if (typeof method['deprecated'] === 'string') {
        method['deprecated'] = JSON.parse(method['deprecated']);
      }
      if (method['parameters'] === undefined) {
        method['parameters'] = method['params'];
        delete method['params'];
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

/**
 * Populate the tranlsations for components.
 * @param translations
 */
Blockly.ComponentDatabase.prototype.populateTranslations = function(translations) {
  for (var key in translations) {
    if (translations.hasOwnProperty(key)) {
      var parts = key.split('-', 2);
      if (parts[0] == 'COMPONENT') {
        this.i18nComponentTypes_[parts[1]] = translations[key];
      } else if (parts[0] == 'PROPERTY') {
        this.i18nPropertyNames_[parts[1]] = translations[key];
      } else if (parts[0] == 'EVENT') {
        this.i18nEventNames_[parts[1]] = translations[key];
      } else if (parts[0] == 'METHOD') {
        this.i18nMethodNames_[parts[1]] = translations[key];
      } else if (parts[0] == 'PARAM') {
        this.i18nParamNames_[parts[1]] = translations[key];
      }
    }
  }
};

/**
 * Get the event type descriptor for a given type, event pair.
 *
 * @param {!string} typeName
 * @param {!string} eventName
 * @returns {EventDescriptor}
 */
Blockly.ComponentDatabase.prototype.getEventForType = function(typeName, eventName) {
  if (typeName in this.types_) {
    return this.types_[typeName].eventDictionary[eventName];
  }
  return undefined;
};

/**
 * @callback EventIterationCallback
 * @param {!EventDescriptor} eventDesc
 * @param {!string} eventName
 */

/**
 * Iterate over the events declared in typeName calling the provided callback.
 *
 * @param {!string} typeName
 * @param {!EventIterationCallback} callback
 */
Blockly.ComponentDatabase.prototype.forEventInType = function(typeName, callback) {
  if (typeName in this.types_) {
    goog.object.map(this.types_[typeName].eventDictionary, callback);
  }
};

/**
 * Get the method type descriptor for a given type, method pair.
 *
 * @param {!string} typeName
 * @param {!string} methodName
 * @returns {(MethodDescriptor|undefined)}
 */
Blockly.ComponentDatabase.prototype.getMethodForType = function(typeName, methodName) {
  if (typeName in this.types_) {
    return this.types_[typeName].methodDictionary[methodName];
  }
  return undefined;
};

/**
 * @callback MethodIterationCallback
 * @param {!MethodDescriptor} methodDef
 * @param {!string} methodName
 */

/**
 * Iterate over the methods declared in typeName calling the provided callback.
 *
 * @param {!string} typeName
 * @param {!MethodIterationCallback} callback
 */
Blockly.ComponentDatabase.prototype.forMethodInType = function(typeName, callback) {
  if (typeName in this.types_) {
    goog.object.map(this.types_[typeName].methodDictionary, callback);
  }
};

/**
 *
 */
Blockly.ComponentDatabase.prototype.getPropertyForType = function(typeName, propertyName) {
  if (this.types_[typeName]) {
    if (this.types_[typeName].properties[propertyName]) {
      return this.types_[typeName].properties[propertyName];
    }
  }
  return null;
};

Blockly.ComponentDatabase.prototype.getSetterNamesForType = function(typeName) {
  return this.types_[typeName].setPropertyList;
};

Blockly.ComponentDatabase.prototype.getGetterNamesForType = function(typeName) {
  return this.types_[typeName].getPropertyList;
};

Blockly.ComponentDatabase.prototype.getInternationalizedComponentType = function(name) {
  return this.i18nComponentTypes_[name] || name;
};

Blockly.ComponentDatabase.prototype.getInternationalizedEventName = function(name) {
  return this.i18nEventNames_[name] || name;
};

Blockly.ComponentDatabase.prototype.getInternationalizedMethodName = function(name) {
  return this.i18nMethodNames_[name] || name;
};

Blockly.ComponentDatabase.prototype.getInternationalizedParameterName = function(name) {
  return this.i18nParamNames_[name] || name;
};

Blockly.ComponentDatabase.prototype.getInternationalizedPropertyName = function(name) {
  return this.i18nPropertyNames_[name] || name;
};
