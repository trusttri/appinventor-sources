// -*- mode: java; c-basic-offset: 2; -*-
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
 */
Blockly.WorkspaceSvg.prototype.drawer_ = null;

/**
 * The workspace's backpack (if any).
 * @type {Blockly.Backpack}
 */
Blockly.WorkspaceSvg.prototype.backpack_ = null;

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
        if (this.backpack && this.backpack.flyout_.autoClose) {
          this.backpack.hide();
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
  if (this.options.enableWarningIndicator && !this.options.readOnly && this.warningIndicator_ == null) {
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
  if (Blockly.Backpack && !Blockly.readOnly) {
    this.backpack = new Blockly.Backpack(this, {scrollbars: true, media: './media/'});
    var svgBackpack = this.backpack.createDom();
    this.svgGroup_.appendChild(svgBackpack);
    this.backpack.init();
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
      if (this.backpack) {
        this.backpack.flyout_.reflow();
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
};

/**
 * Show the blocks drawer for the built-in category.
 */
Blockly.WorkspaceSvg.prototype.showBuiltin = function(name) {
  if (this.drawer_)
    this.drawer_.showBuiltin(name);
};

/**
 * Show the drawer with generic blocks for a component type.
 */
Blockly.WorkspaceSvg.prototype.showGeneric = function(name) {
  if (this.drawer_)
    this.drawer_.showGeneric(name);
};

/**
 * Show the drawer for a component instance.
 */
Blockly.WorkspaceSvg.prototype.showComponent = function(component) {
  if (this.drawer_)
    this.drawer_.showComponent(component);
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
  var start = new Date().getTime();
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
  var stop = new Date().getTime();
  var timeDiffOuter = stop - start;
  Blockly.Instrument.stats.blockCount = allBlocks.length;
  Blockly.Instrument.stats.topBlockCount = topBlocks.length;
  Blockly.Instrument.stats.workspaceRenderCalls++;
  Blockly.Instrument.stats.workspaceRenderTime += timeDiffOuter;
};
