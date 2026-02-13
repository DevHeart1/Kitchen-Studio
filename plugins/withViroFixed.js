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

            // Add import if missing
            if (!contents.includes("import com.viromedia.bridge.ReactViroPackage")) {
                contents = contents.replace(
                    /package\s+[\w.]+/,
                    (match) => `${match}\nimport com.viromedia.bridge.ReactViroPackage`
                );
            }

            // Remove old GVR references if any
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
            }

            // Inject ReactViroPackage if missing
            if (!contents.includes("new ReactViroPackage(ReactViroPackage.ViroPlatform.AR)") &&
                !contents.includes("ReactViroPackage(ReactViroPackage.ViroPlatform.AR)")) {

                console.log("[ViroPlugin] Injecting ReactViroPackage (AR) into MainApplication.kt");

                // Check for Kotlin "PackageList(this).packages"
                if (contents.includes("PackageList(this).packages")) {
                    // Try to wrap it in apply block if not already
                     contents = contents.replace(
                        /return\s+PackageList\(this\)\.packages(?!\.apply)/,
                        "return PackageList(this).packages.apply { add(ReactViroPackage(ReactViroPackage.ViroPlatform.AR)) }"
                    );
                     // If that regex didn't match, maybe it's "val packages = PackageList(this).packages"
                     if (!contents.includes("ReactViroPackage(ReactViroPackage.ViroPlatform.AR)")) {
                         contents = contents.replace(
                             /PackageList\(this\)\.packages(?!\.apply)/,
                             "PackageList(this).packages.apply { add(ReactViroPackage(ReactViroPackage.ViroPlatform.AR)) }"
                         );
                     }
                } else if (contents.includes("getPackages()")) {
                    // Java fallback or complex Kotlin
                    // This is harder to patch reliably with regex without context
                    console.warn("[ViroPlugin] Could not reliably inject ReactViroPackage. Manual intervention may be needed.");
                }
            }

            fs.writeFileSync(mainApplicationPath, contents);
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
