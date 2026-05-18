"use client";

import React from "react";

type Props = { score: number | undefined };

function scoreToColor(score: number): string {
  const r = Math.round(239 + (200 - 239) * score);
  const g = Math.round(68 + (242 - 68) * score);
  const b = Math.round(68 + (65 - 68) * score);
  return `rgb(${r},${g},${b})`;
}

export default function ScoreDebugOverlay({ score }: Props) {
  if (score === undefined) return null;

  return React.createElement(
    React.Fragment,
    null,
    React.createElement("div", {
      style: {
        position: "absolute",
        top: 4,
        right: 4,
        zIndex: 30,
        backgroundColor: "rgba(0,0,0,0.65)",
        color: "#C8F241",
        fontFamily: "monospace",
        fontSize: 10,
        lineHeight: 1,
        padding: "2px 5px",
        borderRadius: 3,
        pointerEvents: "none",
      },
      "aria-hidden": true,
    }, score.toFixed(2)),
    React.createElement("div", {
      style: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: scoreToColor(score),
        pointerEvents: "none",
      },
      "aria-hidden": true,
    }),
  );
}
