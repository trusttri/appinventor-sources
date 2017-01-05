package com.google.appinventor.client.editor.adapters;

import com.google.appinventor.client.editor.youngandroid.YaFormEditor;
import com.google.gwt.core.client.JavaScriptObject;

public class DesignerAdapter extends JavaScriptObject implements IDesigner {

  static {
    setupPrototype();
  }

  private static native void setupPrototype()/*-{
    AI.Adapter.Designer.prototype.addComponent = function() {
      var editor = this.editor;
      var args = Array.prototype.slice.call(arguments);
      $entry(function() { editor.@com.google.appinventor.client.editor.youngandroid.YaFormEditor::addComponent(com/google/appinventor/
    };
    AI.Adapter.Designer.prototype.removeComponent = ;
    AI.Adapter.Designer.prototype.renameComponent = ;
    AI.Adapter.Designer.prototype.setProperty = ;
  }-*/;

  public static native DesignerAdapter make(YaFormEditor editor)/*-{
    var adapter = new AI.Adapter.Designer(editor);
    adapter.projectId = editor.@com.google.appinventor.client.editor.FileEditor::getProjectId()();
    return adapter;
  }-*/;

  @Override
  public native void addComponent(String uuid, String type)/*-{
    
  }-*/;
  
  @Override
  public native IComponent getComponentByUuid(String uuid)/*-{
  }-*/;
  
  @Override
  public native void removeComponent(String uuid)/*-{
  }-*/;
  
  @Override
  public native void renameComponent(String uuid, String name)/*-{
  }-*/;
  
  @Override
  public native void setProperty(String uuid, String name, String value)/*-{
  }-*/;
}
