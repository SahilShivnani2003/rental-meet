import { useRef, useEffect } from "react";
import { Animated, View } from "react-native";
import { Colors } from "../../theme/theme";

export default function LoadingDots() {
    const dot0 = useRef(new Animated.Value(0)).current;
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dots = [dot0, dot1, dot2];

    useEffect(() => {
        const pulse = (dot: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, { toValue: -6, duration: 280, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
                ])
            );
        dots.forEach((d, i) => pulse(d, i * 140).start());
        return () => dots.forEach((d) => d.stopAnimation());
    }, []);

    return (
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            {dots.map((d, i) => (
                <Animated.View
                    key={i}
                    style={{
                        width: 7, height: 7, borderRadius: 4,
                        backgroundColor: Colors.white,
                        transform: [{ translateY: d }],
                    }}
                />
            ))}
        </View>
    );
}