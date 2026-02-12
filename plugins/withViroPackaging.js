const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withViroPackaging(config) {
    return withAppBuildGradle(config, (config) => {
        if (config.modResults.contents.includes("pickFirst '**/libc++_shared.so'")) {
            return config;
        }

        const packagingOptions = `
    packagingOptions {
        pickFirst '**/libc++_shared.so'
        pickFirst '**/libevent.so'
        pickFirst '**/libevent_core.so'
        pickFirst '**/libevent_extra.so'
        pickFirst '**/libevent_pthreads.so'
        pickFirst '**/libfbjni.so'
    }
    `;

        // Insert inside the android { ... } block
        if (config.modResults.contents.includes('android {')) {
            config.modResults.contents = config.modResults.contents.replace(
                'android {',
                `android {${packagingOptions}`
            );
        } else {
            // Fallback for unexpected build.gradle structure (unlikely in Expo)
            config.modResults.contents += `\nandroid {${packagingOptions}}\n`;
        }

        return config;
    });
};
