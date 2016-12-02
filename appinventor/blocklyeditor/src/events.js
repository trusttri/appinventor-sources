'use strict';

goog.provide('AI.Blockly.Events');

goog.require('Blockly.Events');

Blockly.Events.COMPANION_CONNECTED = 'companion_connected';

Blockly.Events.CompanionConnected = function() {
  Blockly.Events.CompanionConnected.superClass_.constructor.call(this);
};
goog.inherits(Blockly.Events.CompanionConnected, Blockly.Events.Abstract);

Blockly.Events.CompanionConnected.prototype.type = Blockly.Events.COMPANION_CONNECTED;

Blockly.Events.ComponentAdded = function(projectId,component) {
  Blockly.Events.ComponentAdded.superClass_.constructor.call(this);
  this.componentId = component.id;
  this.projectId = projectId;
};
goog.inherits(Blockly.Events.ComponentAdded, Blockly.Events.Abstract);

