const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withViroProguard = (config) => {
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const proguardPath = path.join(
                config.modRequest.platformProjectRoot,
                'app',
                'proguard-rules.pro'
            );

            const viroRules = `
# ViroReact Rules
-keep class com.viromedia.bridge.** { *; }
-keep class com.viromedia.renderer.** { *; }
-keep class com.viro.core.** { *; }
-dontwarn com.viromedia.**
-dontwarn com.viro.core.**
-keep class javax.microedition.khronos.** { *; }
-dontwarn javax.microedition.khronos.**
`;

            if (fs.existsSync(proguardPath)) {
                let content = fs.readFileSync(proguardPath, 'utf-8');
                if (!content.includes('com.viromedia.bridge')) {
                    content += viroRules;
                    fs.writeFileSync(proguardPath, content, 'utf-8');
                }
            } else {
                // Create if doesn't exist (though expo usually creates it)
                fs.writeFileSync(proguardPath, viroRules, 'utf-8');
            }

            return config;
        },
    ]);
};

module.exports = withViroProguard;
