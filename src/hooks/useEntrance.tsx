import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

export default function useEntrance(delay = 0) {
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(24)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, {
                toValue: 1,
                delay,
                duration: 360,
                useNativeDriver: true,
            }),
            Animated.spring(slide, {
                toValue: 0,
                delay,
                useNativeDriver: true,
                speed: 14,
                bounciness: 5,
            }),
        ]).start();
    }, []);
    return { fade, slide };
}
