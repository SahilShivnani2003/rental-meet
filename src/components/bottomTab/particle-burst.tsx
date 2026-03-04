import React, { useRef, useEffect } from 'react';
import {  StyleSheet, Animated } from 'react-native';
import { Colors } from '../../theme/theme';

interface Particle {
    angle: number; // radians
    distance: number;
    size: number;
    color: string;
}

interface ParticleBurstProps {
    /** Trigger a new burst by incrementing this value */
    trigger: number;
    /** Center X of the burst origin (absolute, relative to tab bar) */
    x: number;
    /** Center Y of the burst origin (absolute, relative to tab bar) */
    y: number;
    particleCount?: number;
    colors?: string[];
}

const DEFAULT_COLORS = [
    Colors.primary,
    Colors.primaryGlow,
    'rgba(255,255,255,0.9)',
    'rgba(245,166,35,0.6)',
];

function buildParticles(count: number, colors: string[]): Particle[] {
    return Array.from({ length: count }, (_, i) => ({
        angle: (i / count) * Math.PI * 2 + Math.random() * 0.4,
        distance: 28 + Math.random() * 22,
        size: 2.5 + Math.random() * 2.5,
        color: colors[i % colors.length],
    }));
}

export default function ParticleBurst({
    trigger,
    x,
    y,
    particleCount = 10,
    colors = DEFAULT_COLORS,
}: ParticleBurstProps) {
    const particles = useRef<Particle[]>(buildParticles(particleCount, colors));
    const anims = useRef(particles.current.map(() => new Animated.Value(0))).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (trigger === 0) return;

        // Reset
        anims.forEach(a => a.setValue(0));
        opacity.setValue(1);

        Animated.parallel([
            // Fade out overall
            Animated.timing(opacity, {
                toValue: 0,
                duration: 500,
                delay: 100,
                useNativeDriver: true,
            }),
            // Fly each particle outward
            ...anims.map(anim =>
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 420 + Math.random() * 120,
                    useNativeDriver: true,
                }),
            ),
        ]).start();
    }, [trigger]);

    return (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
            {particles.current.map((p, i) => {
                const tx = anims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.cos(p.angle) * p.distance],
                });
                const ty = anims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, Math.sin(p.angle) * p.distance],
                });
                const scale = anims[i].interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.3, 0.2],
                });

                return (
                    <Animated.View
                        key={i}
                        style={[
                            styles.particle,
                            {
                                width: p.size,
                                height: p.size,
                                borderRadius: p.size / 2,
                                backgroundColor: p.color,
                                left: x - p.size / 2,
                                top: y - p.size / 2,
                                transform: [{ translateX: tx }, { translateY: ty }, { scale }],
                            },
                        ]}
                    />
                );
            })}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    particle: {
        position: 'absolute',
    },
});
