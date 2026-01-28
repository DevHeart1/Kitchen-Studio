import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    FlatList,
    Animated,
    Image,
    Platform,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
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
    Star,
    Check,
    ArrowLeft,
} from "lucide-react-native";
import Colors from "@/constants/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const SLIDES = [
    { id: "1", type: "welcome" },
    { id: "2", type: "core_innovation" },
    { id: "3", type: "creator_alignment" },
    { id: "4", type: "video_magic" },
    { id: "5", type: "user_type" },
];

export default function OnboardingScreen() {
    const flatListRef = useRef<FlatList>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleNext = () => {
        if (currentSlide < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentSlide + 1,
                animated: true,
            });
        } else {
            router.replace("/(auth)/preferences");
        }
    };

    const handleSkip = () => {
        router.replace("/(auth)/preferences");
    };

    const handleBack = () => {
        if (currentSlide > 0) {
            flatListRef.current?.scrollToIndex({
                index: currentSlide - 1,
                animated: true,
            });
        }
    };

    const handleUserTypeSelect = (type: 'cook' | 'creator') => {
        if (type === 'cook') {
            router.replace("/(auth)/preferences");
        } else {
            // Future: navigate to creator flow
            console.log("Selected Creator flow");
            router.replace("/(auth)/preferences");
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Background with gradients handled in individual slides or globally */}
            <View style={styles.backgroundContainer}>
                <LinearGradient
                    colors={["#102215", "#0a160d"]}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            <FlatList
                ref={flatListRef}
                data={SLIDES}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                scrollEnabled={false} // Disable manual scrolling for strictly controlled flow if desired, leveraging buttons
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(
                        event.nativeEvent.contentOffset.x / SCREEN_WIDTH
                    );
                    setCurrentSlide(index);
                }}
                renderItem={({ item, index }) => {
                    switch (item.type) {
                        case "welcome": return <WelcomeSlide onNext={handleNext} />;
                        case "core_innovation": return <CoreInnovationSlide onNext={handleNext} onSkip={handleSkip} />;
                        case "creator_alignment": return <CreatorAlignmentSlide onNext={handleNext} onSkip={handleSkip} />;
                        case "video_magic": return <VideoMagicSlide onNext={handleNext} onSkip={handleSkip} />;
                        case "user_type": return <UserTypeSlide onSelect={handleUserTypeSelect} onBack={handleBack} onSkip={handleSkip} />;
                        default: return <View />;
                    }
                }}
                keyExtractor={(item) => item.id}
            />
        </View>
    );
}

// --- Slide Components ---

// 1. Welcome Hook
const WelcomeSlide = ({ onNext }: { onNext: () => void }) => (
    <View style={styles.slide}>
        <Image
            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCyJcC6w6Y8aCmB7VEJCLSgj55KpiBWUHp6R8YqtzvydJUXhAMYewxGZEYh-P9h-LwyZiJHs8O1vXgQwqWdp2HtQTNPWaIwUQbgzbNJOUV-eAgVS8ribKmzuat_gOusrWD5UZnm8cMLafkxyiA7njADlLZe_KJfH6tgP-IefV7JvQu0_dtNBjvh-FzZkbyEyXaio8HT8iVnyhW79C6rJy1UC5hp55SCg3BhdHEkYw5eDtpf_Q4GQlhK_AYn4OjnT9mmjQpHtepcdg" }}
            style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
            resizeMode="cover"
        />
        <LinearGradient
            colors={["transparent", "#102215"]}
            style={StyleSheet.absoluteFill}
        />

        <View style={styles.slideContent}>
            <View style={styles.header}>
                <View style={styles.progressRow}>
                    <View style={[styles.progressDot, styles.progressActive]} />
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                </View>
                <TouchableOpacity onPress={onNext}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

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
            </View>
        </View>
    </View>
);

// 2. Core Innovation
const CoreInnovationSlide = ({ onNext, onSkip }: { onNext: () => void, onSkip: () => void }) => (
    <View style={[styles.slide, { backgroundColor: Colors.backgroundLight }]}>
        {/* Simulate light mode / mixed mode */}
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#f6f8f6' }} />

        <View style={styles.slideContent}>
            <View style={styles.header}>
                <View style={styles.progressRow}>
                    <View style={styles.progressDotDark} />
                    <View style={[styles.progressDotActive, { width: 32 }]} />
                    <View style={styles.progressDotDark} />
                    <View style={styles.progressDotDark} />
                    <View style={styles.progressDotDark} />
                </View>
                <TouchableOpacity onPress={onSkip}>
                    <Text style={styles.skipTextDark}>Skip</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.centeredContent}>
                {/* Simulation of Phone AR */}
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
                <Text style={styles.primaryButtonText}>That’s Powerful</Text>
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

// 3. Creator Alignment
const CreatorAlignmentSlide = ({ onNext, onSkip }: { onNext: () => void, onSkip: () => void }) => (
    <View style={styles.slide}>
        <View style={styles.slideContent}>
            <View style={styles.header}>
                <View style={styles.progressRow}>
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                    <View style={[styles.progressDotActive, { width: 32 }]} />
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                </View>
                <TouchableOpacity onPress={onSkip}>
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
                    Step-by-step guidance with AI-assisted cooking sessions from the world’s best creators.
                </Text>
            </View>

            <View style={styles.cardsStack}>
                {/* Card 1 */}
                <View style={[styles.stackCard, styles.card1]}>
                    <Image source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAfBYnEG4tJD-HApng8Ia42tteRGkL0T4N039sMTEpjL_11dInr3NDCz7u_EWIbYIpWOCdsq0dkAw-ZK87tpqTKRrZl_ej337JQ_xsSnrfCprr1h_cur4ujP7huiWrQYKMNVSba7DaOR0y-fvz2-mxWstBqSS1lknq3PkEjOPoRe5kwcCSCAaialYwrp47WXKEglniuMbh6xGBnNkA-J2_h0arQT9H-fPYU4fvPcPg0DzjZliead1Z0fkAqI9qEuV0Cufw0QQyw7Q" }} style={styles.stackImage} />
                </View>
                {/* Card 2 */}
                <View style={[styles.stackCard, styles.card2]}>
                    <Image source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzVXoa0ajnxy0VYAcQxOE-9mPMvXX5rNIwC2q3AjMNqotiBXTZTDGLt785UEPyNq00NhtCzGCGtzl_9pedZJd5-c0uCb5im3nLTc4SOOMS5rQfILzGyM-K6XXglbaYcg4XaOGPojaq8pL-w_4LdrM0lJ8jn85kkSU3-gdBKy9qlBeToRZFQXja7ey49GGYVEhM2mJ2aGTH6BZslvxUGCWRi6MwVVsWQeXKDzIjWIbl4Ez0tb5tcr2x5Ib8YbepLL36Rtx3BZOflw" }} style={styles.stackImage} />
                </View>
                {/* Card 3 (Main) */}
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

// 4. Video Magic
const VideoMagicSlide = ({ onNext, onSkip }: { onNext: () => void, onSkip: () => void }) => (
    <View style={styles.slide}>
        <View style={styles.slideContent}>
            <View style={styles.header}>
                <View style={styles.progressRow}>
                    <View style={[styles.progressDotActive, { backgroundColor: Colors.primary }]} />
                    <View style={[styles.progressDotActive, { backgroundColor: Colors.primary }]} />
                    <View style={[styles.progressDotActive, { backgroundColor: Colors.primary }]} />
                    <View style={[styles.progressDotActive, { width: 32 }]} />
                    <View style={styles.progressDot} />
                </View>
                <TouchableOpacity onPress={onSkip}>
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

            <View style={styles.centeredContent}>
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
                <Text style={styles.primaryButtonText}>That’s Magic</Text>
                <Sparkles size={18} color={Colors.backgroundDark} fill={Colors.backgroundDark} />
            </TouchableOpacity>
        </View>
    </View>
);

// 5. User Type Selection
const UserTypeSlide = ({ onSelect, onBack, onSkip }: { onSelect: (type: 'cook' | 'creator') => void, onBack: () => void, onSkip: () => void }) => {
    const [selected, setSelected] = useState<'cook' | 'creator'>('cook');

    return (
        <View style={styles.slide}>
            <View style={styles.slideContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
                        <ArrowLeft size={24} color="#cbd5e1" />
                    </TouchableOpacity>
                    <View style={styles.progressRow}>
                        <View style={[styles.progressDotActive, { backgroundColor: Colors.primary + '4D' }]} />
                        <View style={[styles.progressDotActive, { backgroundColor: Colors.primary + '4D' }]} />
                        <View style={[styles.progressDotActive, { backgroundColor: Colors.primary + '4D' }]} />
                        <View style={[styles.progressDotActive, { backgroundColor: Colors.primary + '4D' }]} />
                        <View style={[styles.progressDotActive, { width: 32 }]} />
                    </View>
                    <TouchableOpacity onPress={onSkip}>
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
                    {/* Home Cook Option */}
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

                    {/* Creator Option */}
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

                <View style={{ flex: 1 }} />

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
    backgroundContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    slide: {
        width: SCREEN_WIDTH,
        height: "100%", // Explicit height
        overflow: "hidden",
    },
    slideContent: {
        flex: 1,
        padding: 24,
        justifyContent: "space-between",
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    progressRow: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
    },
    progressDot: {
        width: 8,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    progressDotDark: {
        width: 8,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    progressActive: {
        width: 32,
        backgroundColor: Colors.primary,
    },
    progressDotActive: {
        width: 8,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
    },
    skipText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        fontWeight: '600',
    },
    skipTextDark: {
        color: 'rgba(0,0,0,0.4)',
        fontSize: 14,
        fontWeight: '600',
    },
    bottomContent: {
        gap: 20,
        marginTop: 'auto',
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
        backdropFilter: 'blur(10px)',
    },
    aiBadgeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 10,
        letterSpacing: 1,
    },
    title: {
        fontSize: 42, // Scaled down slightly for mobile safety, original was 5xl
        fontWeight: 'bold',
        color: 'white',
        lineHeight: 48,
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
        fontWeight: 'bold',
    },
    // Slide 2 specific
    centeredContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
    },
    phoneMockup: {
        width: 200,
        height: 400,
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
        left: 16,
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
        right: 12,
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
        fontSize: 10,
        fontWeight: 'bold',
    },
    arDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    centerFocus: {
        width: 60,
        height: 60,
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
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0f172a',
        textAlign: 'center',
        lineHeight: 34,
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
        fontSize: 16,
        color: '#475569',
        fontWeight: '500',
    },
    // Slide 3 specific
    topTextCenter: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
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
        fontWeight: 'bold',
    },
    centerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        lineHeight: 38,
        marginBottom: 8,
    },
    centerSubtitle: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        maxWidth: 280,
    },
    cardsStack: {
        height: 380,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    stackCard: {
        width: 260,
        height: 340,
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
        padding: 16,
        paddingBottom: 20,
    },
    cardTags: {
        position: 'absolute',
        top: 16,
        left: 16,
        gap: 8,
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
    tagLiveText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
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
    tagSessionText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    cardTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
        lineHeight: 26,
    },
    cardCreator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    creatorAvatar: {
        width: 40,
        height: 40,
        marginRight: 10,
    },
    avatarImg: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
    creatorName: { color: 'white', fontSize: 13, fontWeight: 'bold' },
    creatorStats: { color: '#cbd5e1', fontSize: 10 },
    playBtnSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerNote: {
        textAlign: 'center',
        color: '#64748b',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 16,
    },
    // Slide 4
    magicContainer: {
        height: 360,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginTop: 20,
    },
    magicIcon: {
        position: 'absolute',
        width: 64,
        height: 64,
        borderRadius: 32,
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
        width: 200,
        height: 240,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        position: 'absolute',
        top: 0,
        left: 20,
        transform: [{ rotate: '-6deg' }],
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 16,
        zIndex: 5,
    },
    magicCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    linkIconBg: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
    placeholderLine: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
    videoPreview: { width: '100%', height: 120, backgroundColor: '#0f172a', borderRadius: 16, alignItems: 'center', justifyContent: "center", marginBottom: 12 },
    linkPreview: { flexDirection: 'row', gap: 6, padding: 8, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8 },
    linkText: { color: '#94a3b8', fontSize: 10 },
    recipeCard: {
        width: 220,
        height: 260,
        backgroundColor: 'white',
        borderRadius: 24,
        position: 'absolute',
        bottom: 0,
        right: 20,
        transform: [{ rotate: '6deg' }],
        zIndex: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        overflow: 'hidden',
    },
    recipeImage: { width: '100%', height: 140 },
    recipeNameOverlay: { position: 'absolute', top: 110, left: 12, color: 'white', fontWeight: 'bold', fontSize: 14 },
    recipeContent: { padding: 12, gap: 8 },
    ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    ingName: { flex: 1, fontSize: 12, fontWeight: '600', color: '#0f172a' },
    ingQty: { fontSize: 10, color: '#64748b' },
    stepBadge: {
        position: 'absolute',
        right: -8,
        top: -8,
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    stepBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#102215' },
    // Slide 5
    topTextLeft: {
        marginTop: 10,
        marginBottom: 30,
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
        gap: 20,
        marginBottom: 30,
    },
    optionCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
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
        width: 64,
        height: 64,
        borderRadius: 16,
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
    optionTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
    optionDesc: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },
    checkCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    highlighTextWhite: { color: Colors.primary },
    highlighTextCreator: { color: '#c084fc' },
});
