import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
    Image,
    PanResponder,
    Platform,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { GLView } from "expo-gl";
import {
    Sparkles,
    ArrowRight,
    Bot,
    Timer,
    View as ViewIcon,
    ChefHat,
    Eye,
    Lightbulb,
    Mic,
    BadgeCheck,
    Video,
    Play,
    PlayCircle,
    Link as LinkIcon,
    CheckCircle,
    Circle,
    MenuSquare,
    Globe,
    Check,
    ArrowLeft,
} from "lucide-react-native";
import Colors from "@/constants/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

const SLIDES = [
    { id: "1", type: "welcome" },
    { id: "2", type: "core_innovation" },
    { id: "3", type: "creator_alignment" },
    { id: "4", type: "video_magic" },
    { id: "5", type: "user_type" },
];

interface ShaderBackgroundProps {
    style?: any;
}

const ShaderBackground: React.FC<ShaderBackgroundProps> = ({ style }) => {
    const timeRef = useRef(0);
    const glRef = useRef<any>(null);
    const rafRef = useRef<number | null>(null);

    const onContextCreate = useCallback((gl: any) => {
        glRef.current = gl;
        
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        
        const vertShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShader, `
            attribute vec2 position;
            varying vec2 vUv;
            void main() {
                vUv = position * 0.5 + 0.5;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `);
        gl.compileShader(vertShader);

        const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShader, `
            precision highp float;
            varying vec2 vUv;
            uniform float uTime;
            uniform vec2 uResolution;
            
            vec3 palette(float t) {
                vec3 a = vec3(0.063, 0.133, 0.082);
                vec3 b = vec3(0.169, 0.933, 0.357);
                vec3 c = vec3(0.5, 0.5, 0.5);
                vec3 d = vec3(0.0, 0.333, 0.167);
                return a + b * cos(6.28318 * (c * t + d));
            }
            
            void main() {
                vec2 uv = vUv;
                vec2 uv0 = uv;
                vec3 finalColor = vec3(0.0);
                
                for (float i = 0.0; i < 3.0; i++) {
                    uv = fract(uv * 1.5) - 0.5;
                    
                    float d = length(uv) * exp(-length(uv0));
                    
                    vec3 col = palette(length(uv0) + i * 0.4 + uTime * 0.15);
                    
                    d = sin(d * 8.0 + uTime * 0.3) / 8.0;
                    d = abs(d);
                    d = pow(0.01 / d, 1.2);
                    
                    finalColor += col * d * 0.15;
                }
                
                vec3 darkGreen = vec3(0.063, 0.133, 0.082);
                finalColor = mix(darkGreen, finalColor, 0.4);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `);
        gl.compileShader(fragShader);

        const program = gl.createProgram();
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);
        gl.useProgram(program);

        const vertices = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
        ]);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const positionLocation = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const timeLocation = gl.getUniformLocation(program, "uTime");
        const resolutionLocation = gl.getUniformLocation(program, "uResolution");

        const render = () => {
            if (!glRef.current) return;
            
            timeRef.current += 0.016;
            gl.uniform1f(timeLocation, timeRef.current);
            gl.uniform2f(resolutionLocation, gl.drawingBufferWidth, gl.drawingBufferHeight);
            
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            gl.flush();
            gl.endFrameEXP();
            
            rafRef.current = requestAnimationFrame(render);
        };
        
        render();
    }, []);

    useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            glRef.current = null;
        };
    }, []);

    if (Platform.OS === 'web') {
        return (
            <LinearGradient
                colors={["#102215", "#0a160d", "#051008"]}
                style={[StyleSheet.absoluteFill, style]}
            />
        );
    }

    return (
        <GLView
            style={[StyleSheet.absoluteFill, style]}
            onContextCreate={onContextCreate}
        />
    );
};

const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
    <View style={styles.stepperContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => (
            <View
                key={index}
                style={[
                    styles.stepDot,
                    index === currentStep && styles.stepDotActive,
                    index < currentStep && styles.stepDotCompleted,
                ]}
            />
        ))}
    </View>
);

export default function OnboardingScreen() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const translateX = useRef(new Animated.Value(0)).current;
    const [dimensions, setDimensions] = useState({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setDimensions({ width: window.width, height: window.height });
        });
        return () => subscription?.remove();
    }, []);

    const goToSlide = useCallback((index: number) => {
        if (index >= 0 && index < SLIDES.length) {
            Animated.spring(translateX, {
                toValue: -index * dimensions.width,
                useNativeDriver: true,
                tension: 50,
                friction: 12,
            }).start();
            setCurrentSlide(index);
        }
    }, [translateX, dimensions.width]);

    const handleNext = useCallback(() => {
        if (currentSlide < SLIDES.length - 1) {
            goToSlide(currentSlide + 1);
        } else {
            router.replace("/(auth)/login");
        }
    }, [currentSlide, goToSlide]);

    const handleBack = useCallback(() => {
        if (currentSlide > 0) {
            goToSlide(currentSlide - 1);
        }
    }, [currentSlide, goToSlide]);

    const handleSkip = useCallback(() => {
        router.replace("/(auth)/login");
    }, []);

    const handleUserTypeSelect = useCallback((type: 'cook' | 'creator') => {
        router.replace("/(auth)/login");
    }, []);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > 10;
            },
            onPanResponderMove: (_, gestureState) => {
                const newTranslateX = -currentSlide * dimensions.width + gestureState.dx;
                translateX.setValue(newTranslateX);
            },
            onPanResponderRelease: (_, gestureState) => {
                const { dx, vx } = gestureState;
                
                if (dx < -SWIPE_THRESHOLD || (dx < 0 && vx < -0.5)) {
                    if (currentSlide < SLIDES.length - 1) {
                        goToSlide(currentSlide + 1);
                    } else {
                        goToSlide(currentSlide);
                    }
                } else if (dx > SWIPE_THRESHOLD || (dx > 0 && vx > 0.5)) {
                    if (currentSlide > 0) {
                        goToSlide(currentSlide - 1);
                    } else {
                        goToSlide(currentSlide);
                    }
                } else {
                    goToSlide(currentSlide);
                }
            },
        })
    ).current;

    const renderSlide = (slide: typeof SLIDES[0], index: number) => {
        const slideWidth = dimensions.width;
        
        switch (slide.type) {
            case "welcome":
                return <WelcomeSlide key={slide.id} onNext={handleNext} onSkip={handleSkip} currentStep={index} totalSteps={SLIDES.length} slideWidth={slideWidth} />;
            case "core_innovation":
                return <CoreInnovationSlide key={slide.id} onNext={handleNext} onSkip={handleSkip} currentStep={index} totalSteps={SLIDES.length} slideWidth={slideWidth} />;
            case "creator_alignment":
                return <CreatorAlignmentSlide key={slide.id} onNext={handleNext} onSkip={handleSkip} currentStep={index} totalSteps={SLIDES.length} slideWidth={slideWidth} />;
            case "video_magic":
                return <VideoMagicSlide key={slide.id} onNext={handleNext} onSkip={handleSkip} currentStep={index} totalSteps={SLIDES.length} slideWidth={slideWidth} />;
            case "user_type":
                return <UserTypeSlide key={slide.id} onSelect={handleUserTypeSelect} onBack={handleBack} onSkip={handleSkip} currentStep={index} totalSteps={SLIDES.length} slideWidth={slideWidth} />;
            default:
                return <View key={slide.id} />;
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <ShaderBackground />
            
            <View style={styles.slidesWrapper} {...panResponder.panHandlers}>
                <Animated.View
                    style={[
                        styles.slidesContainer,
                        {
                            transform: [{ translateX }],
                            width: dimensions.width * SLIDES.length,
                        },
                    ]}
                >
                    {SLIDES.map((slide, index) => renderSlide(slide, index))}
                </Animated.View>
            </View>
        </View>
    );
}

interface SlideProps {
    onNext?: () => void;
    onSkip: () => void;
    currentStep: number;
    totalSteps: number;
    slideWidth: number;
}

const WelcomeSlide = ({ onNext, onSkip, currentStep, totalSteps, slideWidth }: SlideProps) => (
    <View style={[styles.slide, { width: slideWidth }]}>
        <Image
            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCyJcC6w6Y8aCmB7VEJCLSgj55KpiBWUHp6R8YqtzvydJUXhAMYewxGZEYh-P9h-LwyZiJHs8O1vXgQwqWdp2HtQTNPWaIwUQbgzbNJOUV-eAgVS8ribKmzuat_gOusrWD5UZnm8cMLafkxyiA7njADlLZe_KJfH6tgP-IefV7JvQu0_dtNBjvh-FzZkbyEyXaio8HT8iVnyhW79C6rJy1UC5hp55SCg3BhdHEkYw5eDtpf_Q4GQlhK_AYn4OjnT9mmjQpHtepcdg" }}
            style={[StyleSheet.absoluteFill, { opacity: 0.5 }]}
            resizeMode="cover"
        />
        <LinearGradient
            colors={["transparent", "rgba(16,34,21,0.8)", "#102215"]}
            style={StyleSheet.absoluteFill}
        />

        <View style={styles.slideContent}>
            <View style={styles.header}>
                <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
                <TouchableOpacity onPress={onSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.flexSpacer} />

            <View style={styles.bottomContent}>
                <View style={styles.aiBadge}>
                    <Bot size={16} color={Colors.primary} />
                    <Text style={styles.aiBadgeText}>AI KITCHEN ASSISTANT</Text>
                </View>

                <Text style={styles.title}>
                    Welcome to the{"\n"}
                    <Text style={styles.highlight}>Future of Cooking</Text>
                </Text>

                <Text style={styles.subtitle}>
                    Kitchen Studio: Cook with AI. Learn visually. Never guess again.
                </Text>

                <TouchableOpacity style={styles.primaryButton} onPress={onNext} activeOpacity={0.9}>
                    <Text style={styles.primaryButtonText}>See How It Works</Text>
                    <ArrowRight size={20} color={Colors.backgroundDark} />
                </TouchableOpacity>
                
                <Text style={styles.swipeHint}>Swipe to navigate</Text>
            </View>
        </View>
    </View>
);

const CoreInnovationSlide = ({ onNext, onSkip, currentStep, totalSteps, slideWidth }: SlideProps) => (
    <View style={[styles.slide, { width: slideWidth, backgroundColor: Colors.backgroundLight }]}>
        <View style={styles.slideContent}>
            <View style={styles.header}>
                <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
                <TouchableOpacity onPress={onSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.skipTextDark}>Skip</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.centeredContent}>
                <View style={styles.phoneMockup}>
                    <LinearGradient
                        colors={["rgba(43,238,91,0.15)", "transparent"]}
                        style={StyleSheet.absoluteFill}
                    />
                    <Image
                        source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCthHYMUEBYzQ9rYHH68GujT_ynIprHibR2MMnTaUEwM7HBh5qrLfcWvQQcrb_dDIfj5wy7CBQ8cq-PhIVwrjVxSTSFfLAFQs2wxbofQixsF9MiGHGNtv17z8dCXWAR_O2P2qA7TX4ff42hYp_qhlYVnNBQJ4y8WkYMikDsl4x2QWHske5J56ZmTWDYBsiUhjSzgvByD_wUVIbKHA-qMu9jwZ6pxHrQAuoIM0mjO0mrQeBkdWxlYVMsbkUCsru0Sdh59avkYy6ubA" }}
                        style={styles.phoneScreen}
                    />
                    <View style={styles.arOverlay}>
                        <View style={styles.arTagTopLeft}>
                            <View style={styles.arDot} />
                            <Text style={styles.arTagText}>HEAT: MED-HIGH</Text>
                        </View>
                        <View style={styles.arTagTopRight}>
                            <Timer size={14} color={Colors.primary} />
                            <Text style={styles.arTagText}>Flip in 30s</Text>
                        </View>
                        <View style={styles.centerFocus}>
                            <ViewIcon size={32} color={Colors.primary} style={{ opacity: 0.8 }} />
                        </View>
                    </View>
                </View>

                <View style={styles.textSection}>
                    <Text style={styles.sectionTitleDark}>
                        Cook Hands-Free with{"\n"}
                        <Text style={styles.highlight}>Real-Time Guidance</Text>
                    </Text>

                    <View style={styles.featureList}>
                        <FeatureItem icon={<Eye size={14} color={Colors.primary} />} text="AI watches your cooking" />
                        <FeatureItem icon={<Lightbulb size={14} color={Colors.primary} />} text="Real-time tips" />
                        <FeatureItem icon={<Mic size={14} color={Colors.primary} />} text="Voice & visual guidance" />
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={onNext} activeOpacity={0.9}>
                <Text style={styles.primaryButtonText}>That's Powerful</Text>
            </TouchableOpacity>
        </View>
    </View>
);

const FeatureItem = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
    <View style={styles.featureItem}>
        <View style={styles.featureIcon}>{icon}</View>
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

const CreatorAlignmentSlide = ({ onNext, onSkip, currentStep, totalSteps, slideWidth }: SlideProps) => (
    <View style={[styles.slide, { width: slideWidth }]}>
        <LinearGradient
            colors={["#102215", "#0a160d"]}
            style={StyleSheet.absoluteFill}
        />
        <View style={styles.slideContent}>
            <View style={styles.header}>
                <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
                <TouchableOpacity onPress={onSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.topTextCenter}>
                <View style={styles.verifiedBadge}>
                    <BadgeCheck size={14} color={Colors.primary} />
                    <Text style={styles.verifiedText}>Top Chefs</Text>
                </View>
                <Text style={styles.centerTitle}>
                    Learn directly from{"\n"}
                    <Text style={styles.highlight}>chefs & creators</Text>
                </Text>
                <Text style={styles.centerSubtitle}>
                    Step-by-step guidance with AI-assisted cooking sessions from the world's best creators.
                </Text>
            </View>

            <View style={styles.cardsStack}>
                <View style={[styles.stackCard, styles.card1]}>
                    <Image source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAfBYnEG4tJD-HApng8Ia42tteRGkL0T4N039sMTEpjL_11dInr3NDCz7u_EWIbYIpWOCdsq0dkAw-ZK87tpqTKRrZl_ej337JQ_xsSnrfCprr1h_cur4ujP7huiWrQYKMNVSba7DaOR0y-fvz2-mxWstBqSS1lknq3PkEjOPoRe5kwcCSCAaialYwrp47WXKEglniuMbh6xGBnNkA-J2_h0arQT9H-fPYU4fvPcPg0DzjZliead1Z0fkAqI9qEuV0Cufw0QQyw7Q" }} style={styles.stackImage} />
                </View>
                <View style={[styles.stackCard, styles.card2]}>
                    <Image source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzVXoa0ajnxy0VYAcQxOE-9mPMvXX5rNIwC2q3AjMNqotiBXTZTDGLt785UEPyNq00NhtCzGCGtzl_9pedZJd5-c0uCb5im3nLTc4SOOMS5rQfILzGyM-K6XXglbaYcg4XaOGPojaq8pL-w_4LdrM0lJ8jn85kkSU3-gdBKy9qlBeToRZFQXja7ey49GGYVEhM2mJ2aGTH6BZslvxUGCWRi6MwVVsWQeXKDzIjWIbl4Ez0tb5tcr2x5Ib8YbepLL36Rtx3BZOflw" }} style={styles.stackImage} />
                </View>
                <View style={[styles.stackCard, styles.card3]}>
                    <Image source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCyJcC6w6Y8aCmB7VEJCLSgj55KpiBWUHp6R8YqtzvydJUXhAMYewxGZEYh-P9h-LwyZiJHs8O1vXgQwqWdp2HtQTNPWaIwUQbgzbNJOUV-eAgVS8ribKmzuat_gOusrWD5UZnm8cMLafkxyiA7njADlLZe_KJfH6tgP-IefV7JvQu0_dtNBjvh-FzZkbyEyXaio8HT8iVnyhW79C6rJy1UC5hp55SCg3BhdHEkYw5eDtpf_Q4GQlhK_AYn4OjnT9mmjQpHtepcdg" }} style={styles.stackImage} />
                    <LinearGradient colors={["transparent", "rgba(0,0,0,0.9)"]} style={StyleSheet.absoluteFill} />

                    <View style={styles.cardTags}>
                        <View style={styles.tagLive}>
                            <View style={styles.liveDot} />
                            <Text style={styles.tagLiveText}>LIVE</Text>
                        </View>
                        <View style={styles.tagSession}>
                            <Video size={10} color={Colors.primary} />
                            <Text style={styles.tagSessionText}>Studio Session</Text>
                        </View>
                    </View>

                    <View style={styles.cardBottom}>
                        <Text style={styles.cardTitle}>Authentic Neapolitan{"\n"}Pizza Masterclass</Text>
                        <View style={styles.cardCreator}>
                            <View style={styles.creatorAvatar}>
                                <Image source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKQEveE15mdA8sempyLN-vdmsQhMtOYtxO9en3axYqtnqmde2fVCDUcOA9D0qa4_0uxIHaIQJ52PHCi7T7gGHnck3Cp1HprGyUh69_NnS_gbO5cbdFKtskdF3_jwCFZDMYNrHBh4ILQmi_lMvEcaLh5nfSqfXLeUEvijesXaL8Em9Jz_d5rJzMQBJ8NTnvWFrn-pJQt3K38vIeG0VHnawuvfHJv2esc5c5zLuMxZs2oDsTPFI6-aF4yPveD2lUkvaGtFVpu5pQLw" }} style={styles.avatarImg} />
                                <View style={styles.verifiedIcon}><Check size={8} color="#102215" strokeWidth={4} /></View>
                            </View>
                            <View>
                                <Text style={styles.creatorName}>Eitan Bernath</Text>
                                <Text style={styles.creatorStats}>2.4M followers</Text>
                            </View>
                            <View style={styles.playBtnSmall}>
                                <Play size={16} color="#102215" fill="#102215" />
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={onNext} activeOpacity={0.9}>
                <Text style={styles.primaryButtonText}>Explore Creator Studios</Text>
                <ArrowRight size={20} color={Colors.backgroundDark} />
            </TouchableOpacity>
            <Text style={styles.footerNote}>Join a community of <Text style={{ color: 'white' }}>50k+ home cooks</Text></Text>
        </View>
    </View>
);

const VideoMagicSlide = ({ onNext, onSkip, currentStep, totalSteps, slideWidth }: SlideProps) => (
    <View style={[styles.slide, { width: slideWidth }]}>
        <LinearGradient
            colors={["#102215", "#0a160d"]}
            style={StyleSheet.absoluteFill}
        />
        <View style={styles.slideContent}>
            <View style={styles.header}>
                <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
                <TouchableOpacity onPress={onSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.magicContainer}>
                <View style={styles.magicIcon}>
                    <Sparkles size={32} color="#102215" fill="#102215" />
                </View>

                <View style={styles.magicCard}>
                    <View style={styles.magicCardHeader}>
                        <View style={styles.linkIconBg}><LinkIcon size={14} color="#ec4899" /></View>
                        <View style={styles.placeholderLine} />
                    </View>
                    <View style={styles.videoPreview}>
                        <PlayCircle size={40} color="rgba(255,255,255,0.6)" />
                    </View>
                    <View style={styles.linkPreview}>
                        <LinkIcon size={10} color="#94a3b8" />
                        <Text style={styles.linkText}>tiktok.com/@chef...</Text>
                    </View>
                </View>

                <View style={styles.recipeCard}>
                    <Image source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAfBYnEG4tJD-HApng8Ia42tteRGkL0T4N039sMTEpjL_11dInr3NDCz7u_EWIbYIpWOCdsq0dkAw-ZK87tpqTKRrZl_ej337JQ_xsSnrfCprr1h_cur4ujP7huiWrQYKMNVSba7DaOR0y-fvz2-mxWstBqSS1lknq3PkEjOPoRe5kwcCSCAaialYwrp47WXKEglniuMbh6xGBnNkA-J2_h0arQT9H-fPYU4fvPcPg0DzjZliead1Z0fkAqI9qEuV0Cufw0QQyw7Q" }} style={styles.recipeImage} resizeMode="cover" />
                    <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={StyleSheet.absoluteFill} />
                    <Text style={styles.recipeNameOverlay}>Spicy Shoyu Ramen</Text>

                    <View style={styles.recipeContent}>
                        <View style={styles.ingredientRow}>
                            <CheckCircle size={14} color={Colors.primary} fill={Colors.primary} />
                            <Text style={styles.ingName}>Wheat Noodles</Text>
                            <Text style={styles.ingQty}>200g</Text>
                        </View>
                        <View style={styles.ingredientRow}>
                            <CheckCircle size={14} color={Colors.primary} fill={Colors.primary} />
                            <Text style={styles.ingName}>Chili Oil</Text>
                            <Text style={styles.ingQty}>1 tbsp</Text>
                        </View>
                        <View style={styles.ingredientRow}>
                            <Circle size={14} color="#cbd5e1" />
                            <Text style={[styles.ingName, { color: '#94a3b8' }]}>Soft Boiled Egg</Text>
                            <Text style={[styles.ingQty, { color: '#64748b' }]}>1 pc</Text>
                        </View>
                    </View>

                    <View style={styles.stepBadge}>
                        <MenuSquare size={10} color="#102215" />
                        <Text style={styles.stepBadgeText}>Step-by-step</Text>
                    </View>
                </View>
            </View>

            <View style={styles.bottomTextSection}>
                <View style={styles.verifiedBadge}>
                    <Globe size={14} color={Colors.primary} />
                    <Text style={styles.verifiedText}>Works with public videos</Text>
                </View>
                <Text style={styles.centerTitle}>
                    Turn any video{"\n"}
                    into a <Text style={styles.highlight}>guide</Text>
                </Text>
                <Text style={styles.centerSubtitle}>
                    Import any cooking video instantly. AI extracts ingredients and creates a hands-free guide.
                </Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={onNext} activeOpacity={0.9}>
                <Text style={styles.primaryButtonText}>That's Magic</Text>
                <Sparkles size={18} color={Colors.backgroundDark} fill={Colors.backgroundDark} />
            </TouchableOpacity>
        </View>
    </View>
);

interface UserTypeSlideProps extends SlideProps {
    onSelect: (type: 'cook' | 'creator') => void;
    onBack: () => void;
}

const UserTypeSlide = ({ onSelect, onBack, onSkip, currentStep, totalSteps, slideWidth }: UserTypeSlideProps) => {
    const [selected, setSelected] = useState<'cook' | 'creator'>('cook');

    return (
        <View style={[styles.slide, { width: slideWidth }]}>
            <LinearGradient
                colors={["#102215", "#0a160d"]}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.slideContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                        <ArrowLeft size={24} color="#cbd5e1" />
                    </TouchableOpacity>
                    <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
                    <TouchableOpacity onPress={onSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.topTextLeft}>
                    <Text style={styles.title}>
                        How will you use{"\n"}
                        <Text style={styles.highlight}>Kitchen Studio?</Text>
                    </Text>
                    <Text style={styles.subtitle}>
                        Tell us who you are to personalize your Kitchen Studio experience.
                    </Text>
                </View>

                <View style={styles.optionsContainer}>
                    <TouchableOpacity
                        style={[styles.optionCard, selected === 'cook' && styles.optionCardSelected]}
                        onPress={() => setSelected('cook')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.optionIcon, selected === 'cook' && styles.optionIconSelected]}>
                            <ChefHat size={32} color={selected === 'cook' ? Colors.primary : Colors.primary + 'CC'} />
                        </View>
                        <View style={styles.optionText}>
                            <Text style={[styles.optionTitle, selected === 'cook' && styles.highlighTextWhite]}>I am a Home Cook</Text>
                            <Text style={styles.optionDesc}>Discover recipes, cook with AR, and follow creators.</Text>
                        </View>
                        {selected === 'cook' && <View style={styles.checkCircle}><Check size={16} color="#102215" strokeWidth={3} /></View>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.optionCard, selected === 'creator' && styles.optionCardSelectedCreator]}
                        onPress={() => setSelected('creator')}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.optionIcon, selected === 'creator' && styles.optionIconSelectedCreator]}>
                            <Video size={32} color={selected === 'creator' ? '#c084fc' : '#c084fcCC'} />
                        </View>
                        <View style={styles.optionText}>
                            <Text style={[styles.optionTitle, selected === 'creator' && styles.highlighTextCreator]}>I am a Creator</Text>
                            <Text style={styles.optionDesc}>Host sessions, build your brand, and monetize your skills.</Text>
                        </View>
                        {selected === 'creator' && <View style={[styles.checkCircle, { backgroundColor: '#c084fc', borderColor: '#c084fc' }]}><Check size={16} color="#102215" strokeWidth={3} /></View>}
                    </TouchableOpacity>
                </View>

                <View style={styles.flexSpacer} />

                <TouchableOpacity
                    style={[styles.primaryButton, selected === 'creator' && { backgroundColor: '#c084fc', shadowColor: '#c084fc' }]}
                    onPress={() => onSelect(selected)}
                    activeOpacity={0.9}
                >
                    <Text style={styles.primaryButtonText}>
                        {selected === 'cook' ? 'Continue as Chef' : 'Enter Creator Studio'}
                    </Text>
                    <ArrowRight size={20} color={Colors.backgroundDark} />
                </TouchableOpacity>

                <Text style={styles.footerNote}>Join 50k+ home chefs</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#102215",
    },
    slidesWrapper: {
        flex: 1,
        overflow: 'hidden',
    },
    slidesContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    slide: {
        flex: 1,
        overflow: "hidden",
    },
    slideContent: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 48,
        paddingBottom: Platform.OS === 'ios' ? 40 : 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        minHeight: 40,
    },
    stepperContainer: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    stepDotActive: {
        width: 32,
        backgroundColor: Colors.primary,
    },
    stepDotCompleted: {
        backgroundColor: Colors.primary + '80',
    },
    skipText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        fontWeight: '600' as const,
        minWidth: 40,
        textAlign: 'right' as const,
    },
    skipTextDark: {
        color: 'rgba(0,0,0,0.4)',
        fontSize: 14,
        fontWeight: '600' as const,
        minWidth: 40,
        textAlign: 'right' as const,
    },
    flexSpacer: {
        flex: 1,
    },
    bottomContent: {
        gap: 20,
    },
    aiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignSelf: 'flex-start',
    },
    aiBadgeText: {
        color: 'white',
        fontWeight: 'bold' as const,
        fontSize: 10,
        letterSpacing: 1,
    },
    title: {
        fontSize: Math.min(40, SCREEN_WIDTH * 0.1),
        fontWeight: 'bold' as const,
        color: 'white',
        lineHeight: Math.min(48, SCREEN_WIDTH * 0.12),
    },
    highlight: {
        color: Colors.primary,
        textShadowColor: 'rgba(43,238,91,0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#cbd5e1',
        lineHeight: 24,
        maxWidth: 300,
    },
    primaryButton: {
        height: 64,
        backgroundColor: Colors.primary,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    primaryButtonText: {
        color: "#102215",
        fontSize: 18,
        fontWeight: 'bold' as const,
    },
    swipeHint: {
        textAlign: 'center' as const,
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        marginTop: 8,
    },
    centeredContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
    },
    phoneMockup: {
        width: Math.min(180, SCREEN_WIDTH * 0.45),
        height: Math.min(360, SCREEN_HEIGHT * 0.4),
        borderRadius: 24,
        borderWidth: 8,
        borderColor: '#1e293b',
        backgroundColor: '#0f172a',
        overflow: 'hidden',
        position: 'relative',
        transform: [{ rotate: '-6deg' }],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    phoneScreen: {
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    arOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    arTagTopLeft: {
        position: 'absolute',
        top: 40,
        left: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    arTagTopRight: {
        position: 'absolute',
        top: 80,
        right: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    arTagText: {
        color: 'white',
        fontSize: 8,
        fontWeight: 'bold' as const,
    },
    arDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
    },
    centerFocus: {
        width: 50,
        height: 50,
        borderWidth: 2,
        borderColor: 'rgba(43,238,91,0.3)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textSection: {
        alignItems: 'center',
        gap: 16,
    },
    sectionTitleDark: {
        fontSize: Math.min(26, SCREEN_WIDTH * 0.065),
        fontWeight: 'bold' as const,
        color: '#0f172a',
        textAlign: 'center' as const,
        lineHeight: Math.min(32, SCREEN_WIDTH * 0.08),
    },
    featureList: {
        gap: 12,
        alignSelf: 'flex-start',
        paddingLeft: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(43,238,91,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '500' as const,
    },
    topTextCenter: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: 'rgba(43,238,91,0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(43,238,91,0.3)',
        marginBottom: 12,
    },
    verifiedText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: 'bold' as const,
    },
    centerTitle: {
        fontSize: Math.min(30, SCREEN_WIDTH * 0.075),
        fontWeight: 'bold' as const,
        color: 'white',
        textAlign: 'center' as const,
        lineHeight: Math.min(36, SCREEN_WIDTH * 0.09),
        marginBottom: 8,
    },
    centerSubtitle: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center' as const,
        maxWidth: 280,
    },
    cardsStack: {
        flex: 1,
        maxHeight: 340,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    stackCard: {
        width: Math.min(240, SCREEN_WIDTH * 0.6),
        height: Math.min(300, SCREEN_HEIGHT * 0.35),
        borderRadius: 24,
        position: 'absolute',
        backgroundColor: '#1e293b',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        overflow: 'hidden',
    },
    stackImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    card1: {
        transform: [{ rotate: '-8deg' }, { translateX: -20 }, { scale: 0.9 }],
        opacity: 0.6,
        zIndex: 1,
    },
    card2: {
        transform: [{ rotate: '8deg' }, { translateX: 20 }, { scale: 0.95 }],
        opacity: 0.8,
        zIndex: 2,
    },
    card3: {
        transform: [{ rotate: '0deg' }],
        zIndex: 3,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        padding: 14,
        paddingBottom: 16,
    },
    cardTags: {
        position: 'absolute',
        top: 12,
        left: 12,
        gap: 6,
    },
    tagLive: {
        backgroundColor: '#ef4444',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'white',
    },
    tagLiveText: { color: 'white', fontSize: 10, fontWeight: 'bold' as const },
    tagSession: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    tagSessionText: { color: 'white', fontSize: 10, fontWeight: 'bold' as const },
    cardTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold' as const,
        marginBottom: 10,
        lineHeight: 22,
    },
    cardCreator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    creatorAvatar: {
        width: 36,
        height: 36,
        marginRight: 8,
    },
    avatarImg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#102215',
    },
    verifiedIcon: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: Colors.primary,
        borderRadius: 6,
        padding: 1,
    },
    creatorName: { color: 'white', fontSize: 12, fontWeight: 'bold' as const },
    creatorStats: { color: '#cbd5e1', fontSize: 10 },
    playBtnSmall: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerNote: {
        textAlign: 'center' as const,
        color: '#64748b',
        fontSize: 12,
        fontWeight: '500' as const,
        marginTop: 16,
    },
    magicContainer: {
        flex: 1,
        maxHeight: 320,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginVertical: 16,
    },
    magicIcon: {
        position: 'absolute',
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
    },
    magicCard: {
        width: Math.min(180, SCREEN_WIDTH * 0.45),
        height: Math.min(220, SCREEN_HEIGHT * 0.26),
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        position: 'absolute',
        top: 0,
        left: 16,
        transform: [{ rotate: '-6deg' }],
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 14,
        zIndex: 5,
    },
    magicCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    linkIconBg: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
    placeholderLine: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
    videoPreview: { width: '100%', height: 100, backgroundColor: '#0f172a', borderRadius: 16, alignItems: 'center', justifyContent: "center", marginBottom: 10 },
    linkPreview: { flexDirection: 'row', gap: 6, padding: 8, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8 },
    linkText: { color: '#94a3b8', fontSize: 10 },
    recipeCard: {
        width: Math.min(200, SCREEN_WIDTH * 0.5),
        height: Math.min(240, SCREEN_HEIGHT * 0.28),
        backgroundColor: 'white',
        borderRadius: 24,
        position: 'absolute',
        bottom: 0,
        right: 16,
        transform: [{ rotate: '6deg' }],
        zIndex: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        overflow: 'hidden',
    },
    recipeImage: { width: '100%', height: 120 },
    recipeNameOverlay: { position: 'absolute', top: 95, left: 12, color: 'white', fontWeight: 'bold' as const, fontSize: 13 },
    recipeContent: { padding: 10, gap: 6 },
    ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    ingName: { flex: 1, fontSize: 11, fontWeight: '600' as const, color: '#0f172a' },
    ingQty: { fontSize: 9, color: '#64748b' },
    stepBadge: {
        position: 'absolute',
        right: -6,
        top: -6,
        backgroundColor: Colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    stepBadgeText: { fontSize: 9, fontWeight: 'bold' as const, color: '#102215' },
    bottomTextSection: {
        alignItems: 'center',
        marginBottom: 16,
    },
    topTextLeft: {
        marginTop: 8,
        marginBottom: 24,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionsContainer: {
        gap: 16,
    },
    optionCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    optionCardSelected: {
        backgroundColor: 'rgba(43,238,91,0.1)',
        borderColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    optionCardSelectedCreator: {
        backgroundColor: 'rgba(192,132,252,0.1)',
        borderColor: '#c084fc',
        shadowColor: '#c084fc',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    optionIcon: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: 'rgba(43,238,91,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(43,238,91,0.1)',
    },
    optionIconSelected: {
        backgroundColor: 'rgba(43,238,91,0.2)',
        borderColor: Colors.primary,
    },
    optionIconSelectedCreator: {
        backgroundColor: 'rgba(192,132,252,0.2)',
        borderColor: '#c084fc',
    },
    optionText: { flex: 1 },
    optionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' as const, marginBottom: 4 },
    optionDesc: { color: '#94a3b8', fontSize: 12, lineHeight: 16 },
    checkCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    highlighTextWhite: { color: Colors.primary },
    highlighTextCreator: { color: '#c084fc' },
});
