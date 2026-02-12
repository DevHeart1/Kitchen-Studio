
import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import {
    ViroARScene,
    ViroText,
    ViroTrackingStateConstants,
    ViroARPlaneSelector,
    ViroBox,
    ViroMaterials,
    ViroAmbientLight,
    ViroSpotLight,
    ViroNode,
    ViroFlexView,
    ViroAnimations,
    ViroSphere,
    ViroParticleEmitter,
    ViroQuad,
} from "@viro-community/react-viro";

import { GeminiLiveService } from "@/services/GeminiLiveService";

interface KitchenSceneProps {
    sceneNavigator: {
        viroAppProps: {
            recipe: any;
            currentStepIndex: number;
            onStepComplete: () => void;
            onPanPlaced: () => void;
            session: any;
        };
    };
}

export const KitchenScene = (props: KitchenSceneProps) => {
    const { recipe, currentStepIndex, onStepComplete, onPanPlaced } = props.sceneNavigator.viroAppProps;
    const [text, setText] = useState("Initializing AR...");
    const [showInstructions, setShowInstructions] = useState(false);
    const [panPosition, setPanPosition] = useState<[number, number, number] | null>(null);

    // Initialize Gemini Live
    useEffect(() => {
        GeminiLiveService.connect();
        return () => {
            GeminiLiveService.disconnect();
        };
    }, []);

    // Trigger Gemini when step changes
    useEffect(() => {
        if (showInstructions && recipe?.instructions?.[currentStepIndex]) {
            const stepText = recipe.instructions[currentStepIndex].step;
            GeminiLiveService.onStepComplete(currentStepIndex - 1, stepText);
        }
    }, [currentStepIndex, showInstructions]);

    const onInitialized = (state: any, reason: any) => {
        if (state === ViroTrackingStateConstants.TRACKING_NORMAL) {
            setText("Scan a table to place your station!");
        } else if (state === ViroTrackingStateConstants.TRACKING_UNAVAILABLE) {
            setText("Move your phone to detect surfaces.");
        }
    };

    const currentStep = recipe?.instructions?.[currentStepIndex];

    const onPlaneSelected = (anchor: any) => {
        setText("");
        setShowInstructions(true);
        setPanPosition([0, 0, 0]);

        // 1. Tell Gemini
        GeminiLiveService.onPanPlaced();

        // 2. Start Game Logic (Timer, XP, etc)
        if (onPanPlaced) onPanPlaced();
    };

    return (
        <ViroARScene onTrackingUpdated={onInitialized} physicsWorld={{ gravity: [0, -9.8, 0] } as any}>
            <ViroAmbientLight color={"#ffffff"} intensity={200} />
            <ViroSpotLight
                innerAngle={5}
                outerAngle={90}
                direction={[0, -1, -0.2]}
                position={[0, 3, 1]}
                color="#ffffff"
                castsShadow={true}
            />

            {/* Helper Text (Heads-up display) */}
            {text !== "" && (
                <ViroText
                    text={text}
                    scale={[0.1, 0.1, 0.1]}
                    position={[0, 0, -1]}
                    style={styles.hudTextStyle}
                />
            )}

            {/* Surface Detection */}
            <ViroARPlaneSelector onPlaneSelected={onPlaneSelected}>
                <ViroNode position={[0, 0, 0]} dragType="FixedToWorld" onDrag={() => { }}>

                    {/* Main Instruction Panel - Floating above the Pan */}
                    <ViroFlexView
                        style={styles.panelContainer}
                        position={[0, 0.6, -0.3]} // Slightly behind and above pan
                        rotation={[-15, 0, 0]} // Slight tilt up for readability
                        height={0.8}
                        width={1.5}
                        animation={{ name: "fadeIn", run: showInstructions, loop: false }}
                        visible={showInstructions}
                    >
                        {/* Header */}
                        <ViroFlexView style={styles.panelHeader} height={0.15} width={1.5}>
                            <ViroText
                                text={`STEP ${currentStepIndex + 1}`}
                                style={styles.stepTitle}
                                height={0.15}
                                width={1.4}
                            />
                        </ViroFlexView>

                        {/* Body */}
                        <ViroFlexView style={styles.panelBody} height={0.5} width={1.5}>
                            <ViroText
                                text={currentStep?.step || "Cooking Complete!"}
                                style={styles.stepBody}
                                scale={[1, 1, 1]}
                                height={0.4}
                                width={1.4}
                                textClipMode="None"
                            />
                        </ViroFlexView>

                        {/* Footer / Action */}
                        <ViroFlexView style={styles.panelFooter} height={0.15} width={1.5} onClick={onStepComplete}>
                            <ViroText
                                text="TAP TO NEXT >"
                                style={styles.stepAction}
                                height={0.15}
                                width={1.5}
                            />
                        </ViroFlexView>
                    </ViroFlexView>

                    {/* The "Digital Pan" - Physics Static Body */}
                    <ViroBox
                        position={[0, 0.02, 0]}
                        scale={[0.3, 0.05, 0.3]}
                        materials={["panMaterial"]}
                        physicsBody={{
                            type: "Static",
                            restitution: 0.5,
                            friction: 0.5
                        }}
                        visible={showInstructions}
                    />

                    {/* "Heat Shimmer" Overlay on Pan Surface */}
                    <ViroQuad
                        position={[0, 0.05, 0]}
                        rotation={[-90, 0, 0]}
                        width={0.25}
                        height={0.25}
                        materials={["heatMaterial"]}
                        animation={{ name: "heatPulse", run: showInstructions, loop: true }}
                        visible={showInstructions}
                    />

                    {/* Steam / Smoke Emitter */}
                    <ViroParticleEmitter
                        position={[0, 0.1, 0]}
                        duration={2000}
                        visible={showInstructions}
                        run={showInstructions}
                        loop={true}
                        fixedToEmitter={true}
                        image={{
                            source: require("@/assets/images/icon.png"), // Using app icon as placeholder partcle texture
                            height: 0.05,
                            width: 0.05,
                            bloomThreshold: 1.0
                        }}
                        spawnBehavior={{
                            particleLifetime: [1500, 1500],
                            emissionRatePerSecond: [20, 30],
                            spawnVolume: {
                                shape: "box",
                                params: [0.1, 0.0, 0.1],
                                spawnOnSurface: false
                            },
                            maxParticles: 50
                        }}
                        particleAppearance={{
                            opacity: {
                                initialRange: [0.3, 0.6],
                                interpolation: [
                                    { endValue: 0.0, interval: [0, 1500] }
                                ]
                            },
                            scale: {
                                initialRange: [[0.02, 0.02, 0.02], [0.05, 0.05, 0.05]],
                                interpolation: [
                                    { endValue: [0.1, 0.1, 0.1], interval: [0, 1000] }
                                ]
                            }
                        }}
                        particlePhysics={{
                            velocity: {
                                initialRange: [[-0.05, 0.1, -0.05], [0.05, 0.4, 0.05]]
                            },
                            acceleration: {
                                initialRange: [[0, 0.1, 0], [0, 0.3, 0]]
                            }
                        }}
                    />

                    {/* Pan Handle (visual only) */}
                    <ViroBox
                        position={[0.2, 0.02, 0]}
                        scale={[0.2, 0.02, 0.04]}
                        materials={["panHandleMaterial"]}
                        visible={showInstructions}
                    />

                    {/* Ingredient Droplets - Physics Dynamic Body */}
                    {showInstructions && (
                        <ViroSphere
                            position={[0, 0.4, 0]} // Drop from above
                            radius={0.02}
                            materials={["ingredientMaterial"]}
                            physicsBody={{
                                type: "Dynamic",
                                mass: 1,
                                useGravity: true,
                                restitution: 0.2,
                                friction: 0.3
                            }}
                            key={`droplet-${currentStepIndex}`} // Re-spawn on step change
                        />
                    )}

                </ViroNode>
            </ViroARPlaneSelector>
        </ViroARScene>
    );
};

ViroMaterials.createMaterials({
    panMaterial: {
        diffuseColor: "#222222",
        lightingModel: "PBR",
        roughness: 0.2,
        metalness: 0.8,
    },
    panHandleMaterial: {
        diffuseColor: "#111111",
        lightingModel: "PBR",
    },
    ingredientMaterial: {
        diffuseColor: "#f59e0b", // Oil/Sauce color
        lightingModel: "Blinn",
    },
    glassMaterial: {
        diffuseColor: "rgba(20, 20, 20, 0.8)",
    },
    heatMaterial: {
        diffuseColor: "rgba(255, 100, 0, 0.3)", // Transparent orange
        lightingModel: "Constant",
        blendMode: "Add", // Additive blend for glow
    }
});

ViroAnimations.registerAnimations({
    fadeIn: {
        properties: { opacity: 1.0 },
        duration: 500,
        easing: "EaseIn",
    },
    heatPulse: {
        properties: { opacity: 0.6 },
        duration: 1000,
        easing: "EaseInOut",
    }
});

const styles = StyleSheet.create({
    hudTextStyle: {
        fontSize: 20,
        color: "#ffffff",
        textAlignVertical: "center",
        textAlign: "center",
        fontWeight: "bold",
    },
    panelContainer: {
        backgroundColor: "rgba(20, 20, 20, 0.9)", // Dark Glass
        flexDirection: "column",
    },
    panelHeader: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#10b981", // Brand Green
        padding: 0.05,
    },
    panelBody: {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 0.1,
    },
    panelFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#333333",
    },
    stepTitle: {
        fontSize: 24,
        color: "#ffffff",
        fontWeight: "bold",
        textAlign: "center",
    },
    stepBody: {
        fontSize: 32, // Large readable text
        color: "#ffffff",
        textAlign: "center",
        fontWeight: "400",
    },
    stepAction: {
        fontSize: 20,
        color: "#10b981",
        fontWeight: "bold",
        textAlign: "center",
    }
});
