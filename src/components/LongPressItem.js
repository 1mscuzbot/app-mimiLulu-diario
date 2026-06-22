import { useRef, useState } from "react";
import { Animated, TouchableOpacity, StyleSheet } from "react-native";

export default function LongPressItem({
  onLongPress,
  delay = 400,
  style,
  children,
  color = "#E91E63",
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const [pressing, setPressing] = useState(false);

  const handlePressIn = () => {
    setPressing(true);
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: delay,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setPressing(false);
        onLongPress?.();
      }
    });
  };

  const handlePressOut = () => {
    anim.stopAnimation();
    setPressing(false);
    anim.setValue(0);
  };

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3.5],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.3, 0.05],
  });

  return (
    <TouchableOpacity
      style={style}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.85}
    >
      {pressing && (
        <Animated.View
          style={[
            styles.overlay,
            {
              backgroundColor: color,
              opacity,
              transform: [{ scale }],
            },
          ]}
        />
      )}
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 16,
  },
});
