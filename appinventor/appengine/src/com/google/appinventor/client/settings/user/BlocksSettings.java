package com.google.appinventor.client.settings.user;

import com.google.appinventor.client.settings.Settings;
import com.google.appinventor.client.widgets.properties.EditableProperty;
import com.google.appinventor.shared.rpc.user.UserInfoProvider;
import com.google.appinventor.shared.settings.SettingsConstants;

public final class BlocksSettings extends Settings {

  public BlocksSettings(UserInfoProvider user) {
    super(SettingsConstants.BLOCKS_SETTINGS);

    addProperty(new EditableProperty(this, SettingsConstants.GRID_ENABLED,
        "false", EditableProperty.TYPE_INVISIBLE));
    addProperty(new EditableProperty(this, SettingsConstants.SNAP_ENABLED,
        "false", EditableProperty.TYPE_INVISIBLE));
  }
}
