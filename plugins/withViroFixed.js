const {
    withDangerousMod,
    withProjectBuildGradle,
    withAppBuildGradle,
    withSettingsGradle,
    withAndroidManifest,
    withPlugins,
    AndroidConfig,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const withBranchAndroid = (config) => {
    return withDangerousMod(config, [
        "android",
        async (config) => {
            // FORCE AR ONLY to avoid double-init crash with GVR
            const viroPluginConfig = ["AR"];

            let mainApplicationPath = "";
            const mainApplicationPrefix = path.join(
                config.modRequest.platformProjectRoot,
                "app", "src", "main", "java",
                ...(config?.android?.package?.split?.(".") || [])
            );

            // Check for .kt or .java
            const ktPath = path.join(mainApplicationPrefix, "MainApplication.kt");
            const javaPath = path.join(mainApplicationPrefix, "MainApplication.java");

            if (fs.existsSync(ktPath)) {
                mainApplicationPath = ktPath;
            } else if (fs.existsSync(javaPath)) {
                mainApplicationPath = javaPath;
            } else {
                // If neither exists (unlikely in prebuild), just skip
                return config;
            }

            let data = fs.readFileSync(mainApplicationPath, "utf-8");

            // Add Import
            if (!data.includes("import com.viromedia.bridge.ReactViroPackage")) {
                data = data.replace(
                    /package\s+[\w\.]+/,
                    `$&
import com.viromedia.bridge.ReactViroPackage`
                );
            }

            // Add Package to List
            // We only insert if it's NOT already there (to avoid re-running issues)
            if (!data.includes("ReactViroPackage.ViroPlatform.AR")) {
                const packageLine = `add(ReactViroPackage(ReactViroPackage.ViroPlatform.AR))`;

                if (data.includes("PackageList(this).packages.apply {")) {
                    // Kotlin new architecture style
                    data = data.replace(
                        "PackageList(this).packages.apply {",
                        `PackageList(this).packages.apply {\n            ${packageLine}`
                    );
                } else if (data.includes("return new ArrayList<>(Arrays.asList(")) {
                    // Java legacy style
                    data = data.replace(
                        "return new ArrayList<>(Arrays.asList(",
                        `return new ArrayList<>(Arrays.asList(\n            new ReactViroPackage(ReactViroPackage.ViroPlatform.AR),`
                    );
                } else if (data.includes("super.getPackages();")) {
                    // Another Java style
                    // Skip complex regex for now, rely on standard expo template
                }
            }

            fs.writeFileSync(mainApplicationPath, data, "utf-8");
            return config;
        },
    ]);
};

// Ensure Min SDK is 24+
const withViroProjectBuildGradle = (config) => {
    return withProjectBuildGradle(config, async (config) => {
        config.modResults.contents = config.modResults.contents.replace(
            /minSdkVersion\s?=\s?\d+/,
            `minSdkVersion = 24`
        );
        return config;
    });
};

// Add dependencies
const withViroAppBuildGradle = (config) => {
    return withAppBuildGradle(config, async (config) => {
        const dependencies = [
            "implementation project(':gvr_common')",
            "implementation project(':arcore_client')",
            "implementation project(':react_viro')",
            "implementation project(':viro_renderer')",
            "implementation 'com.google.android.exoplayer:exoplayer:2.19.1'",
            "implementation 'com.google.protobuf.nano:protobuf-javanano:3.1.0'"
        ];

        if (!config.modResults.contents.includes(":react_viro")) {
            // Simple append to dependencies block
            const depBlock = dependencies.join("\n    ");
            config.modResults.contents = config.modResults.contents.replace(
                /dependencies\s?{/,
                `dependencies {\n    ${depBlock}`
            );
        }
        return config;
    });
};

// Include modules
const withViroSettingsGradle = (config) => {
    return withSettingsGradle(config, async (config) => {
        if (!config.modResults.contents.includes(":react_viro")) {
            config.modResults.contents += `
include ':react_viro', ':arcore_client', ':gvr_common', ':viro_renderer'
project(':arcore_client').projectDir = new File('../node_modules/@viro-community/react-viro/android/arcore_client')
project(':gvr_common').projectDir = new File('../node_modules/@viro-community/react-viro/android/gvr_common')
project(':viro_renderer').projectDir = new File('../node_modules/@viro-community/react-viro/android/viro_renderer')
project(':react_viro').projectDir = new File('../node_modules/@viro-community/react-viro/android/react_viro')
        `;
        }
        return config;
    });
};

// Add Permissions & Metadata
const withViroManifest = (config) => {
    return withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;

        // Add Permissions
        const permissions = ["android.permission.CAMERA", "android.permission.RECORD_AUDIO", "android.permission.Internet"]; // Internet is default but good to ensure
        AndroidConfig.Permissions.addPermission(androidManifest, permissions);

        // Add Metadata for ARCore
        const mainApp = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
        AndroidConfig.Manifest.addMetaDataItemToMainApplication(
            mainApp,
            "com.google.ar.core",
            "optional"
        );

        return config;
    });
};

module.exports = (config) => {
    return withPlugins(config, [
        withBranchAndroid,
        withViroProjectBuildGradle,
        withViroManifest,
        withViroSettingsGradle,
        withViroAppBuildGradle,
    ]);
};
