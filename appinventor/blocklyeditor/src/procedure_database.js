/* -*- mode: javascript; js-indent-level: 2; -*- */
/**
 * @license
 * Copyright © 2016 Massachusetts Institute of Technology. All rights reserved.
 */

/**
 * @fileoverview A database for tracking user-defined procedures.
 * @author Evan W. Patton <ewpatton@mit.edu>
 */

'use strict';

goog.provide('AI.Blockly.ProcedureDatabase');
goog.require('Blockly');
goog.require('goog.object');

Blockly.ProcedureDatabase = function() {
  this.procedures_ = {};
  this.returnProcedures_ = {};
  this.voidProcedures_ = {};
  this.length = 0;
  this.returnProcedures = 0;
  this.voidProcedures = 0;
};

Blockly.ProcedureDatabase.defaultValue = ['', 'none'];

/**
 * Get a list of names for procedures in the database.
 *
 * @param {Boolean=false} returnValue Return names of procedures with return values (true) or without return values (false)
 * @returns {!string[]}
 */
Blockly.ProcedureDatabase.prototype.getNames = function(returnValue) {
  return Object.keys(returnValue ? this.returnProcedures_ : this.voidProcedures_);
};

/**
 * Get a list of procedure definition blocks.
 *
 * @param {Boolean=false} returnValue Return procedure definition blocks with return values (true) or without return values (false)
 * @returns {!Blockly.Block[]}
 */
Blockly.ProcedureDatabase.prototype.getDeclarationBlocks = function(returnValue) {
  var blockArray = [];
  goog.object.forEach(returnValue ? this.returnProcedures_ : this.voidProcedures_,
                      function(block) { blockArray.push(block); });
  return blockArray;
};

Blockly.ProcedureDatabase.prototype.getDeclarationsBlocksExcept = function(block) {
  var blockArray = [];
  goog.object.forEach(this.procedures_, function(b) {
    if (b != block) blockArray.push(b);
  });
  return blockArray;
};

Blockly.ProcedureDatabase.prototype.getAllDeclarationNames = function() {
  return Object.keys(this.procedures_);
};

/**
 * Add a procedure to the database.
 *
 * @param {!string} name
 * @param {!Blockly.Block} block
 * @returns {boolean} true if the definition was added, otherwise false.
 */
Blockly.ProcedureDatabase.prototype.addProcedure = function(name, block) {
  if (block.type != 'procedures_defnoreturn' && block.type != 'procedures_defreturn') {
    // not a procedure block!
    console.warn('Attempt to addProcedure with block type ' + block.type);
    return false;
  }
  if (name in this.procedures_) {
    return false;
  }
  this.procedures_[name] = block;
  this.length++;
  if (block.type == 'procedures_defnoreturn') {
    this.voidProcedures_[name] = block;
    this.voidProcedures++;
  } else {
    this.returnProcedures_[name] = block;
    this.returnProcedures++;
  }
  return true;
};

/**
 * Remove a procedure from the database.
 *
 * @param {!string} name
 */
Blockly.ProcedureDatabase.prototype.removeProcedure = function(name) {
  if (name in this.procedures_) {
    var block = this.procedures_[name];
    if (block.type == 'procedures_defnoreturn') {
      delete this.voidProcedures_[name];
      this.voidProcedures--;
    } else {
      delete this.returnProcedures_[name];
      this.returnProcedures--;
    }
    delete this.procedures_[name];
    this.length--;
  }
  return true;
};

/**
 * Rename a procedure in the database with the given oldNmae to newName.
 *
 * @param {!string} oldName
 * @param {!string} newName
 * @returns {boolean} true if the procedure was renamed in the database, otherwise false.
 */
Blockly.ProcedureDatabase.prototype.renameProcedure = function(oldName, newName) {
  if (newName in this.procedures_) {
    return false;
  }
  if (oldName in this.procedures_) {
    var block = this.procedures_[oldName];
    if (block.type == 'procedures_defnoreturn') {
      this.voidProcedures_[newName] = block;
      delete this.voidProcedures_[oldName];
    } else {
      this.returnProcedures_[newName] = block;
      delete this.returnProcedures_[oldName];
    }
    this.procedures_[newName] = block;
    delete this.procedures_[oldName];
    return true;
  } else {
    console.warn('Attempt to renameProcedure not in the database.');
    return false;
  }
};

Blockly.ProcedureDatabase.prototype.getProcedure = function(name) {
  return this.procedures_[name];
};
