// -*- mode: javascript; js-indent-level: 2; -*-
// Copyright © 2016 Massachusetts Institute of Technology. All rights reserved.

/**
 * @license
 * @fileoverview Visual blocks editor for MIT App Inventor
 * App Inventor extensions to Blockly's SVG Workspace
 *
 * @author ewpatton@mit.edu (Evan W. Patton)
 */

'use strict';

goog.provide('AI.Blockly.WorkspaceSvg');

goog.require('Blockly.WorkspaceSvg');

/**
 * AI2 Blocks Drawer
 * @type {Blockly.Drawer}
 * @private
 */
Blockly.WorkspaceSvg.prototype.drawer_ = null;

/**
 * The workspace's backpack (if any).
 * @type {Blockly.Backpack}
 * @private
 */
Blockly.WorkspaceSvg.prototype.backpack_ = null;

/**
 * The workspace's component database.
 * @type {Blockly.ComponentDatabase}
 * @private
 */
Blockly.WorkspaceSvg.prototype.componentDb_ = null;

/**
 * The workspace's typeblock instance.
 * @type {Blockly.TypeBlock}
 * @private
 */
Blockly.WorkspaceSvg.prototype.typeBlock_ = null;

/**
 * latest clicked position is used to open the type blocking suggestions window
 * Initial position is 0,0
 * @type {{x: number, y: number}}
 */
Blockly.WorkspaceSvg.prototype.latestClick = { x: 0, y: 0 }

/**
 * Wrap the onMouseClick_ event to handle additional behaviors.
 */
Blockly.WorkspaceSvg.prototype.onMouseDown_ = (function(func) {
  if (func.isWrapped) {
    return func;
  } else {
    var f = function(e) {
      try {
        this.latestClick = { x: e.clientX, y: e.clientY };
        return func.call(this, e);
      } finally {
        //if drawer exists and supposed to close
        if (this.drawer_ && this.drawer_.flyout_.autoClose) {
          this.drawer_.hide();
        }
        if (this.backpack_ && this.backpack_.flyout_.autoClose) {
          this.backpack_.hide();
        }

        //Closes mutators
        var blocks = this.getAllBlocks();
        var numBlocks = blocks.length;
        var temp_block = null;
        for(var i = 0; i < numBlocks; i++) {
          temp_block = blocks[i];
          if(temp_block.mutator){
            //deselect block in mutator workspace
            if(Blockly.selected && Blockly.selected.workspace && Blockly.selected.workspace!=Blockly.mainWorkspace){
              Blockly.selected.unselect();
            }
            blocks[i].mutator.setVisible(false);
          }
        }
      }
    };
    f.isWrapper = true;
    return f;
  }
})(Blockly.WorkspaceSvg.prototype.onMouseDown_);

Blockly.WorkspaceSvg.prototype.createDom = (function(func) {
  if (func.isWrapped) {
    return func;
  } else {
    var f = function() {
      var svg = func.apply(this, Array.prototype.slice.call(arguments));
      return svg;
    };
    f.isWrapper = true;
    return f;
  }
})(Blockly.WorkspaceSvg.prototype.createDom);

Blockly.WorkspaceSvg.prototype.dispose = (function(func) {
  if (func.isWrapped) {
    return func;
  } else {
    var wrappedFunc = function() {
      func.call(this);
      if (this.backpack_) {
        this.backpack_.dispose();
        return null;
      }
    };
    wrappedFunc.isWrapped = true;
    return wrappedFunc;
  }
})(Blockly.WorkspaceSvg.prototype.dispose);

/**
 * Adds the warning indicator.
 */
Blockly.WorkspaceSvg.prototype.addWarningIndicator = function() {
  if (!this.options.readOnly && this.warningIndicator_ == null) {
    this.warningHandler_ = new Blockly.WarningHandler(this);
    this.warningIndicator_ = new Blockly.WarningIndicator(this);
    var svgWarningIndicator = this.warningIndicator_.createDom();
    this.svgGroup_.appendChild(svgWarningIndicator);
    this.warningIndicator_.init();
  }
};

/**
 * Add a backpack.
 */
Blockly.WorkspaceSvg.prototype.addBackpack = function() {
  if (Blockly.Backpack && !this.options.readOnly) {
    this.backpack_ = new Blockly.Backpack(this, {scrollbars: true, media: './media/'});
    var svgBackpack = this.backpack_.createDom(this);
    this.svgGroup_.appendChild(svgBackpack);
    this.backpack_.init();
  }
};

/**
 * Handle backpack rescaling
 */
Blockly.WorkspaceSvg.prototype.setScale = (function(func) {
  if (func.isWrapped) {
    return func;
  } else {
    var wrappedFunction = function(newScale) {
      func.call(this, newScale);
      if (this.backpack_) {
        this.backpack_.flyout_.reflow();
      }
    };
    wrappedFunction.isWrapped = true;
    return wrappedFunction;
  }
})(Blockly.WorkspaceSvg.prototype.setScale);

/**
 * Hide the blocks drawer.
 */
Blockly.WorkspaceSvg.prototype.hideDrawer = function() {
  if (this.drawer_)
    this.drawer_.hide();
  return this;
};

/**
 * Show the blocks drawer for the built-in category.
 */
Blockly.WorkspaceSvg.prototype.showBuiltin = function(name) {
  if (this.drawer_)
    this.drawer_.showBuiltin(name);
  return this;
};

/**
 * Show the drawer with generic blocks for a component type.
 */
Blockly.WorkspaceSvg.prototype.showGeneric = function(name) {
  if (this.drawer_)
    this.drawer_.showGeneric(name);
  return this;
};

/**
 * Show the drawer for a component instance.
 */
Blockly.WorkspaceSvg.prototype.showComponent = function(component) {
  if (this.drawer_)
    this.drawer_.showComponent(component);
  return this;
};

/**
 * Check whether the drawer is showing.
 */
Blockly.WorkspaceSvg.prototype.isDrawerShowing = function() {
  if (this.drawer_) {
    return this.drawer_.isShowing();
  } else {
    return false;
  }
};

// Override Blockly's render with optimized version from lyn
Blockly.WorkspaceSvg.prototype.render = function() {
  if (Blockly.Instrument.isOn) {
    var start = new Date().getTime();
  }
  // [lyn, 04/08/14] Get both top and all blocks for stats
  var topBlocks = this.getTopBlocks();
  var allBlocks = this.getAllBlocks();
  if (Blockly.Instrument.useRenderDown) {
    for (var t = 0, topBlock; topBlock = topBlocks[t]; t++) {
      Blockly.Instrument.timer(
          function () { topBlock.renderDown(); },
          function (result, timeDiffInner) {
            Blockly.Instrument.stats.renderDownTime += timeDiffInner;
          }
      );
    }
  } else {
    var renderList = allBlocks;
    for (var x = 0, block; block = renderList[x]; x++) {
      if (!block.getChildren().length) {
        block.render();
      }
    }
  }
  if (Blockly.Instrument.isOn) {
    var stop = new Date().getTime();
    var timeDiffOuter = stop - start;
    Blockly.Instrument.stats.blockCount = allBlocks.length;
    Blockly.Instrument.stats.topBlockCount = topBlocks.length;
    Blockly.Instrument.stats.workspaceRenderCalls++;
    Blockly.Instrument.stats.workspaceRenderTime += timeDiffOuter;
  }
};

/**
 * Obtain the {@link Blockly.ComponentDatabase} associated with the workspace.
 *
 * @returns {!Blockly.ComponentDatabase}
 */
Blockly.WorkspaceSvg.prototype.getComponentDatabase = function() {
  return this.componentDb_;
};

Blockly.WorkspaceSvg.prototype.getProcedureDatabase = function() {
  return this.procedureDb_;
};

/**
 * Add a new component to the workspace.
 *
 * @param {string} uid
 * @param {string} instanceName
 * @param {string} typeName
 * @returns The workspace for chaining calls.
 */
Blockly.WorkspaceSvg.prototype.addComponent = function(uid, instanceName, typeName) {
  if (this.componentDb_.addInstance(uid, instanceName, typeName)) {
    return this;
  }
  this.typeBlock_.needsReload.components = true;
  return this;
};

/**
 * Remove a component from the workspace.
 *
 * @param uid {string} The component's unique identifier
 * @returns The workspace for chaining calls.
 */
Blockly.WorkspaceSvg.prototype.removeComponent = function(uid) {
  if (!this.componentDb_.removeInstance(uid)) {
    return this;
  }
  this.typeBlock_.needsReload.components = true;
  var blocks = this.getAllBlocks();
  for (var i = 0, block; block = blocks[i]; ++i) {
    if (block.category == 'Component' && block.componentUid == uid) {
      block.dispose(true);
    }
  }
  return this;
};

/**
 * Rename a component in the workspace.
 *
 * @param oldName {string} The previous name of the component.
 * @param newName {string} The new name of the component.
 * @param uid {string} The unique identifier of the component.
 * @returns The workspace for chaining calls.
 */
Blockly.WorkspaceSvg.prototype.renameComponent = function(oldName, newName, uid) {
  if (!this.componentDb_.renameInstance(oldName, newName, uid)) {
    console.log('Renaming: No such component instance ' + oldName + '; aborting.');
    return this;
  }
  this.typeBlock_.needsReload.components = true;
  var blocks = this.getAllBlocks();
  for (var i = 0, block; block = blocks[i]; ++i) {
    if (block.category == 'Component') {
      block.rename(oldName, newName);
    }
  }
  return this;
};

/**
 * Populate the component type database with the components encoded by
 * strComponentInfos.
 *
 * @param {string} strComponentInfos String containing JSON-encoded
 * component information.
 */
Blockly.WorkspaceSvg.prototype.populateComponentTypes = function(strComponentInfos) {
  this.componentDb_.populateTypes(JSON.parse(strComponentInfos));
};

/**
 * Loads the contents of a blocks file into the workspace.
 *
 * @param formJson {string} JSON string containing structure of the Form
 * @param blocksContent {string} XML serialization of the blocks
 * @returns The workspace for chaining calls.
 */
Blockly.WorkspaceSvg.prototype.loadBlocksFile = function(formJson, blocksContent) {
  if (blocksContent.length != 0) {
    try {
      Blockly.Block.isRenderingOn = false;
      Blockly.Versioning.upgrade(formJson, blocksContent, this);
    } finally {
      Blockly.Block.isRenderingOn = true;
    }
    if (this.getCanvas() != null) {
      this.render();
    }
  }
  return this;
};

/**
 * Verifies all of the blocks on the workspace and adds error icons if
 * any problems are identified.
 *
 * @returns The workspace for chaining calls.
 */
Blockly.WorkspaceSvg.prototype.verifyAllBlocks = function() {
  var blocks = this.getAllBlocks();
  for (var i = 0, block; block = blocks[i]; ++i) {
    if (block.category == 'Component') {
      block.verify();
    }
  }
  return this;
};

/**
 * Saves the workspace as an XML file and returns the contents as a
 * string.
 *
 * @returns {string} XML serialization of the workspace's blocks.
 */
Blockly.WorkspaceSvg.prototype.saveBlocksFile = function() {
  return Blockly.SaveFile.get(this);
};

/**
 * Generate the YAIL for the blocks workspace.
 *
 * @param {string} formJson
 * @param {string} packageName
 * @param {boolean=false} opt_repl
 * @returns String containing YAIL to be sent to the phone.
 */
Blockly.WorkspaceSvg.prototype.getFormYail = function(formJson, packageName, opt_repl) {
  return Blockly.Yail.getFormYail(formJson, packageName, !!opt_repl, this);
};

Blockly.WorkspaceSvg.prototype.getWarningHandler = function() {
  return this.warningHandler_;
};

Blockly.WorkspaceSvg.prototype.getWarningIndicator = function() {
  return this.warningIndicator_;
};

Blockly.WorkspaceSvg.prototype.exportBlocksImageToUri = function(cb) {
  Blockly.ExportBlocksImage.getUri(cb, this);
};

Blockly.WorkspaceSvg.prototype.hideChaff = function() {
  this.fieldFlydown_ && this.fieldFlydown_.hide();
  this.typeBlock_ && this.typeBlock_.hide();
};

Blockly.WorkspaceSvg.prototype.activate = function() {
  Blockly.mainWorkspace = this;
};

Blockly.WorkspaceSvg.prototype.buildComponentMap = function(warnings, errors, forRepl, compileUnattachedBlocks) {
  var map = {components: {}, globals: []};
  var blocks = this.getTopBlocks(true);
  for (var i = 0, block; block = blocks[i]; ++i) {
    if (block.type == 'procedures_defnoreturn' || block.type == 'procedures_defreturn' || block.type == 'global_declaration') {
      map.globals.push(block);
    } else if (block.category == 'Component' && block.blockType == 'event') {
      var instanceName = block.instanceName;
      if (!map.components[instanceName]) {
	map.components[instanceName] = [];
      }
      map.components[instanceName].push(block);
    }
  }
  return map;
};

Blockly.WorkspaceSvg.prototype.resize = (function(resize) {
  return function() {
    resize.call(this);
    return this;
  };
})(Blockly.WorkspaceSvg.prototype.resize);
