import React, { useState } from "react";
import { StyleSheet } from "react-native";
import {
    ViroARScene,
    ViroText,
    ViroConstants,
    ViroARPlaneSelector,
    ViroBox,
    ViroMaterials,
    ViroAmbientLight,
    ViroSpotLight,
    ViroNode,
    ViroFlexView,
} from "@viro-community/react-viro";

interface KitchenSceneProps {
    sceneNavigator: {
        viroAppProps: {
            recipe: any;
            currentStepIndex: number;
            onStepComplete: () => void;
        };
    };
}

export const KitchenScene = (props: KitchenSceneProps) => {
    const { recipe, currentStepIndex, onStepComplete } = props.sceneNavigator.viroAppProps;
    const [text, setText] = useState("Initializing AR...");

    const onInitialized = (state: any, reason: any) => {
        if (state === ViroConstants.TRACKING_NORMAL) {
            setText("Scan a surface to place your station!");
        } else if (state === ViroConstants.TRACKING_NONE) {
            setText("Move your phone to detect surfaces.");
        }
    };

    const currentStep = recipe?.instructions?.[currentStepIndex];

    return (
        <ViroARScene onTrackingUpdated={onInitialized}>
            <ViroAmbientLight color={"#ffffff"} intensity={200} />
            <ViroSpotLight
                innerAngle={5}
                outerAngle={90}
                direction={[0, -1, -0.2]}
                position={[0, 3, 1]}
                color="#ffffff"
                castsShadow={true}
            />

            {/* Floating Status Text (Always visible in front of camera) */}
            <ViroText
                text={text}
                scale={[0.1, 0.1, 0.1]}
                position={[0, 0, -1]}
                style={styles.helloWorldTextStyle}
            />

            {/* Surface Detection for placing the cooking station */}
            <ViroARPlaneSelector>
                <ViroNode position={[0, 0, 0]} dragType="FixedToWorld" onDrag={() => { }}>
                    {/* 3D Step Card */}
                    <ViroFlexView
                        style={styles.stepCard}
                        position={[0, 0.5, 0]}
                        rotation={[0, 0, 0]}
                        height={1}
                        width={2}
                    >
                        <ViroText
                            text={`Step ${currentStepIndex + 1}`}
                            style={styles.stepTitle}
                            height={0.2}
                            width={2}
                        />
                        <ViroText
                            text={currentStep?.step || "Cooking Complete!"}
                            style={styles.stepBody}
                            height={0.8}
                            width={2}
                        />
                    </ViroFlexView>

                    {/* Interactive "Next" Button/Box */}
                    <ViroBox
                        position={[0, -0.2, 0]}
                        scale={[0.2, 0.2, 0.2]}
                        materials={["buttonMaterial"]}
                        animation={{ name: "rotate", run: true, loop: true }}
                        onClick={onStepComplete}
                    />
                </ViroNode>
            </ViroARPlaneSelector>
        </ViroARScene>
    );
};

ViroMaterials.createMaterials({
    buttonMaterial: {
        diffuseColor: "#10b981", // Primary green
        lightingModel: "Blinn",
    },
});

const styles = StyleSheet.create({
    helloWorldTextStyle: {
        fontFamily: "System",
        fontSize: 20,
        color: "#ffffff",
        textAlignVertical: "center",
        textAlign: "center",
    },
    stepCard: {
        backgroundColor: "rgba(30, 30, 30, 0.9)",
        flexDirection: "column",
        padding: 0.1,
    },
    stepTitle: {
        fontSize: 30,
        color: "#10b981",
        fontWeight: "bold",
        textAlign: "center",
    },
    stepBody: {
        fontSize: 20,
        color: "#ffffff",
        textAlign: "center",
    },
});
