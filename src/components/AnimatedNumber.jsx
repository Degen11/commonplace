import useAnimatedNumber from "../hooks/useAnimatedNumber";

/**
 * Drop-in replacement for rendering a number with smooth counting animation.
 * Usage: <AnimatedNumber value={42} /> instead of {42}
 */
export default function AnimatedNumber({ value, duration = 300 }) {
  const display = useAnimatedNumber(value, duration);
  return display;
}
