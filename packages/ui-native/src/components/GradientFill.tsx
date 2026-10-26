import { useId } from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

export interface GradientStop {
  offset: number;
  color: string;
  opacity?: number;
}

export interface GradientLayer {
  kind: "linear" | "radial";
  stops: GradientStop[];
  /** Linear: start/end points as 0-1 fractions. */
  from?: { x: number; y: number };
  to?: { x: number; y: number };
  /** Radial: center and radius as 0-1 fractions. */
  center?: { x: number; y: number };
  radius?: number;
}

export interface GradientFillProps {
  layers: GradientLayer[];
  borderRadius?: number;
}

/** Absolutely-fills its parent with one or more stacked SVG gradients. */
export function GradientFill({ layers, borderRadius = 0 }: GradientFillProps) {
  const baseId = useId().replace(/:/g, "");

  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        {layers.map((layer, index) => {
          const id = `${baseId}-${index}`;
          const stops = layer.stops.map((stop) => (
            <Stop
              key={stop.offset}
              offset={stop.offset}
              stopColor={stop.color}
              stopOpacity={stop.opacity ?? 1}
            />
          ));
          if (layer.kind === "radial") {
            const center = layer.center ?? { x: 0.5, y: 0.5 };
            return (
              <RadialGradient
                key={id}
                id={id}
                cx={center.x}
                cy={center.y}
                r={layer.radius ?? 0.5}
                fx={center.x}
                fy={center.y}
              >
                {stops}
              </RadialGradient>
            );
          }
          const from = layer.from ?? { x: 0, y: 0 };
          const to = layer.to ?? { x: 1, y: 0 };
          return (
            <LinearGradient key={id} id={id} x1={from.x} y1={from.y} x2={to.x} y2={to.y}>
              {stops}
            </LinearGradient>
          );
        })}
      </Defs>
      {layers.map((_, index) => (
        <Rect
          key={index}
          x={0}
          y={0}
          width="100%"
          height="100%"
          rx={borderRadius}
          ry={borderRadius}
          fill={`url(#${baseId}-${index})`}
        />
      ))}
    </Svg>
  );
}
