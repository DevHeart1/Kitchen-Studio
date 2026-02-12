const { AndroidConfig } = require('@expo/config-plugins');

const withSpeechRecognition = (config) => {
    return AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.RECORD_AUDIO',
    ]);
};

module.exports = withSpeechRecognition;
