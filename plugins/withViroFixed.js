const {
    withDangerousMod,
    withAppBuildGradle,
    withSettingsGradle,
    withPlugins,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

console.log("Loading withViroFixed plugin...");

// 1. Force AR Mode in MainApplication.kt
const withForceARInit = (config) => {
    return withDangerousMod(config, [
        "android",
        async (config) => {
            console.log("[ViroPlugin] Executing withForceARInit");
            let mainApplicationPath = "";
            const mainApplicationPrefix = path.join(
                config.modRequest.platformProjectRoot,
                "app", "src", "main", "java",
                ...(config?.android?.package?.split?.(".") || [])
            );

            const potentialPaths = [
                path.join(mainApplicationPrefix, "MainApplication.java"),
                path.join(mainApplicationPrefix, "MainApplication.kt"),
            ];

            for (const p of potentialPaths) {
                if (fs.existsSync(p)) {
                    mainApplicationPath = p;
                    break;
                }
            }

            if (!mainApplicationPath) {
                console.warn("[ViroPlugin] MainApplication not found via prefix", mainApplicationPrefix);
                return config;
            }

            let contents = fs.readFileSync(mainApplicationPath, "utf-8");

            if (contents.includes("ReactViroPackage.ViroPlatform.GVR")) {
                console.log("[ViroPlugin] Patching MainApplication.kt to remove GVR");
                contents = contents.replace(
                    /new ReactViroPackage\(ReactViroPackage\.ViroPlatform\.AR\s*,\s*ReactViroPackage\.ViroPlatform\.GVR\)/g,
                    "new ReactViroPackage(ReactViroPackage.ViroPlatform.AR)"
                );
                contents = contents.replace(
                    /ReactViroPackage\(ReactViroPackage\.ViroPlatform\.AR\s*,\s*ReactViroPackage\.ViroPlatform\.GVR\)/g,
                    "ReactViroPackage(ReactViroPackage.ViroPlatform.AR)"
                );
                fs.writeFileSync(mainApplicationPath, contents);
            } else {
                console.log("[ViroPlugin] MainApplication.kt already patched or GVR not found");
            }
            return config;
        },
    ]);
};

// 2. Inject Viro Dependencies (AR ONLY) into build.gradle
const withViroBuildGradle = (config) => {
    return withAppBuildGradle(config, (config) => {
        console.log("[ViroPlugin] Executing withViroBuildGradle");
        const buildGradle = config.modResults.contents;

        if (buildGradle.includes("':react_viro'")) {
            console.log("[ViroPlugin] dependency ':react_viro' already present in build.gradle");
            return config;
        }

        const dependencies = `
    implementation project(':arcore_client')
    implementation project(':react_viro')
    implementation project(':viro_renderer')
    implementation 'com.google.android.exoplayer:exoplayer:2.19.1'
    implementation 'com.google.protobuf.nano:protobuf-javanano:3.1.0'
    `;

        // Try robust injection
        if (buildGradle.includes("dependencies {")) {
            console.log("[ViroPlugin] Inheriting dependencies block found, injecting Viro deps...");
            config.modResults.contents = buildGradle.replace(
                /dependencies\s*{/,
                `dependencies {\n${dependencies}`
            );
        } else {
            console.error("[ViroPlugin] CRITICAL: 'dependencies {' block NOT found in build.gradle!");
        }

        return config;
    });
};

// 3. Inject Viro Includes (AR ONLY) into settings.gradle
const withViroSettingsGradle = (config) => {
    return withSettingsGradle(config, (config) => {
        console.log("[ViroPlugin] Executing withViroSettingsGradle");
        const settingsGradle = config.modResults.contents;

        if (settingsGradle.includes("':react_viro'")) {
            console.log("[ViroPlugin] include ':react_viro' already present in settings.gradle");
            return config;
        }

        const includes = `
include ':react_viro', ':arcore_client', ':viro_renderer'
project(':arcore_client').projectDir = new File('../node_modules/@viro-community/react-viro/android/arcore_client')
project(':viro_renderer').projectDir = new File('../node_modules/@viro-community/react-viro/android/viro_renderer')
project(':react_viro').projectDir = new File('../node_modules/@viro-community/react-viro/android/react_viro')
    `;

        console.log("[ViroPlugin] Appending Viro includes to settings.gradle");
        config.modResults.contents = settingsGradle + "\n" + includes;
        return config;
    });
};

const withViroFixed = (config) => {
    return withPlugins(config, [
        withForceARInit,
        withViroBuildGradle,
        withViroSettingsGradle
    ]);
};

module.exports = withViroFixed;
