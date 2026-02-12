const { AndroidConfig } = require('@expo/config-plugins');
console.log('AndroidConfig keys:', Object.keys(AndroidConfig));
if (AndroidConfig.Permissions) {
    console.log('AndroidConfig.Permissions keys:', Object.keys(AndroidConfig.Permissions));
}
