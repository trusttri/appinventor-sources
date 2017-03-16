// -*- mode: java; c-basic-offset: 2; -*-
// Copyright 2012 Massachusetts Institute of Technology. All rights reserved.

/**
 * @license
 * @fileoverview Logic blocks yail generators for Blockly, modified for MIT App Inventor.
 * @author mckinney@mit.edu (Andrew F. McKinney)
 */

'use strict';

goog.provide('Blockly.Yail.logic');

Blockly.Yail['logic_boolean'] = function() {
  // Boolean values true and false.
  var code = (this.getFieldValue('BOOL') == 'TRUE') ? Blockly.Yail.YAIL_TRUE
      : Blockly.Yail.YAIL_FALSE;
  return [ code, Blockly.Yail.ORDER_ATOMIC ];
};

Blockly.Yail['logic_false'] = function() {
  return Blockly.Yail.logic_boolean.call(this);
}

Blockly.Yail['logic_negate'] = function() {
  // negate operation
  var argument = Blockly.Yail
      .valueToCode(this, 'BOOL', Blockly.Yail.ORDER_NONE)
      || Blockly.Yail.YAIL_FALSE;
  var code = Blockly.Yail.YAIL_CALL_YAIL_PRIMITIVE + "yail-not"
      + Blockly.Yail.YAIL_SPACER;
  code = code + Blockly.Yail.YAIL_OPEN_COMBINATION
      + Blockly.Yail.YAIL_LIST_CONSTRUCTOR + Blockly.Yail.YAIL_SPACER
      + argument + Blockly.Yail.YAIL_CLOSE_COMBINATION;
  code = code + Blockly.Yail.YAIL_SPACER + Blockly.Yail.YAIL_QUOTE
      + Blockly.Yail.YAIL_OPEN_COMBINATION + "boolean"
      + Blockly.Yail.YAIL_CLOSE_COMBINATION + Blockly.Yail.YAIL_SPACER;
  code = code + Blockly.Yail.YAIL_DOUBLE_QUOTE + "not"
      + Blockly.Yail.YAIL_DOUBLE_QUOTE + Blockly.Yail.YAIL_CLOSE_COMBINATION;
  return [ code, Blockly.Yail.ORDER_ATOMIC ];
};

Blockly.Yail['logic_operation'] = function() {
  // The and, or logic operations
  // TODO: (Andrew) Make these take multiple arguments.
  var mode = this.getFieldValue('OP');
  var tuple = Blockly.Yail.logic_operation.OPERATORS[mode];
  var operator = tuple[0];
  var order = tuple[1];
  var argument0 = Blockly.Yail.valueToCode(this, 'A', order) || Blockly.Yail.YAIL_FALSE;
  var argument1 = Blockly.Yail.valueToCode(this, 'B', order) || Blockly.Yail.YAIL_FALSE;
  var code = Blockly.Yail.YAIL_OPEN_COMBINATION + operator
      + Blockly.Yail.YAIL_SPACER + argument0 + Blockly.Yail.YAIL_SPACER
      + argument1 + Blockly.Yail.YAIL_CLOSE_COMBINATION;
  return [ code, Blockly.Yail.ORDER_ATOMIC ];
};

Blockly.Yail.logic_operation.OPERATORS = {
  AND : [ 'and-delayed', Blockly.Yail.ORDER_NONE ],
  OR : [ 'or-delayed', Blockly.Yail.ORDER_NONE ]
};

Blockly.Yail['logic_or'] = function() {
  return Blockly.Yail.logic_operation.call(this);
}

Blockly.Yail['logic_compare'] = function() {
  // Basic logic compare operators
  // // TODO: (Hal) handle any type?
  var argument0 = Blockly.Yail.valueToCode(this, 'A', Blockly.Yail.ORDER_NONE) || Blockly.Yail.YAIL_FALSE;
  var argument1 = Blockly.Yail.valueToCode(this, 'B', Blockly.Yail.ORDER_NONE) || Blockly.Yail.YAIL_FALSE;
  var yailCommand = (this.getFieldValue('OP') == "NEQ" ? 'yail-not-equal?' : "yail-equal?" );
  var code = Blockly.Yail.YAIL_CALL_YAIL_PRIMITIVE + yailCommand
      + Blockly.Yail.YAIL_SPACER;
  code = code + Blockly.Yail.YAIL_OPEN_COMBINATION
      + Blockly.Yail.YAIL_LIST_CONSTRUCTOR + Blockly.Yail.YAIL_SPACER
      + argument0 + Blockly.Yail.YAIL_SPACER + argument1
      + Blockly.Yail.YAIL_CLOSE_COMBINATION;
  code = code + Blockly.Yail.YAIL_SPACER + Blockly.Yail.YAIL_QUOTE
      + Blockly.Yail.YAIL_OPEN_COMBINATION + "any" + Blockly.Yail.YAIL_SPACER
      + "any" + Blockly.Yail.YAIL_CLOSE_COMBINATION + Blockly.Yail.YAIL_SPACER;
  code = code + Blockly.Yail.YAIL_DOUBLE_QUOTE + "="
      + Blockly.Yail.YAIL_DOUBLE_QUOTE + Blockly.Yail.YAIL_CLOSE_COMBINATION;
  return [ code, Blockly.Yail.ORDER_ATOMIC ];
};

getStringOfParameter = function(parameter, thisBlock){ //should put in parameter_array[i], this
    // "parameters":[{"name":"ID", "type": "input_value"},{"name":"DIRECTION", "type": "field_dropdown"}
  if(parameter["type"] == "input_value"){

      if(parameter["name"] == 'COLOR'){
          var color_string = Blockly.Yail.valueToCode(Blockly.selected, parameter["name"] , Blockly.Yail.ORDER_NONE);
          var color_num = window.parseInt(color_string) * (-1);
          var color_num_hexa = "#" + (window.Math.pow(16,6) - color_num).toString(16);
          console.log(color_string);
          console.log(color_num_hexa);
          return color_num_hexa;
      }

      return Blockly.Yail.valueToCode(thisBlock, parameter["name"], Blockly.Yail.ORDER_NONE )

  }else if(parameter["type"] == "field_dropdown"){

      console.log(thisBlock.getFieldValue(parameter["name"]));
      return thisBlock.getFieldValue(parameter["name"]);

  }else{
      console.log("put in wrong parameters");
      return "";
  }
};

Blockly.Yail['move_cube'] = function(){

    //get information of block in JSON format
    var decoded_block_info = decodeURIComponent(this.block_info);
    var info_JSON_format = JSON.parse(decoded_block_info);

    //get the function name
    var function_name = info_JSON_format["function_name"];

    //get the parameters, assuming that the user has put an array which contains labels of parameters in order, inside the JSON format
    var parameter_array = info_JSON_format["parameters"];
    var string_of_parameters = "";

    for(var i=0; i<parameter_array.length; i++){
        if(i!=0) {
            string_of_parameters += ',';
        }
        //string_of_parameters += '\'' + Blockly.Yail.valueToCode(this, parameter_array[i]["name"], Blockly.Yail.ORDER_NONE ) + '\'';
        string_of_parameters += '\'' + getStringOfParameter(parameter_array[i], this) + '\'';
    }


    var code = Blockly.Yail.YAIL_CALL_COMPONENT_METHOD + Blockly.Yail.YAIL_SPACER + '\'WebViewer1 \'RunJavaScript' + Blockly.Yail.YAIL_SPACER ;
    code += Blockly.Yail.YAIL_OPEN_BLOCK + Blockly.Yail.YAIL_LIST_CONSTRUCTOR + Blockly.Yail.YAIL_SPACER ;
    code += '\"' + function_name + '\"' + Blockly.Yail.YAIL_SPACER;

    code += '\"' + string_of_parameters + '\"' + Blockly.Yail.YAIL_SPACER;

    code += Blockly.Yail.YAIL_CLOSE_COMBINATION + Blockly.Yail.YAIL_SPACER;
    code += '\'' +Blockly.Yail.YAIL_OPEN_COMBINATION+'text'+ Blockly.Yail.YAIL_SPACER +'any';
    code += Blockly.Yail.YAIL_CLOSE_COMBINATION + Blockly.Yail.YAIL_CLOSE_COMBINATION;
    return code;



};



