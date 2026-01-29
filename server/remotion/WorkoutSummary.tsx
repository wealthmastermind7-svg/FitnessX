import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { z } from "zod";

export const workoutSummarySchema = z.object({
  workoutName: z.string(),
  duration: z.number(),
  exerciseCount: z.number(),
  totalVolume: z.number(),
  caloriesBurned: z.number(),
  muscleGroups: z.array(z.string()),
  personalRecords: z.number(),
  userName: z.string(),
  completedAt: z.string(),
});

type WorkoutSummaryProps = z.infer<typeof workoutSummarySchema>;

const AnimatedNumber: React.FC<{
  value: number;
  suffix?: string;
  delay?: number;
}> = ({ value, suffix = "", delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 50,
      stiffness: 100,
    },
  });

  const displayValue = Math.round(value * Math.min(progress, 1));

  return (
    <span>
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number;
  suffix?: string;
  delay: number;
  color: string;
}> = ({ label, value, suffix, delay, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 12,
      stiffness: 200,
    },
  });

  const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 40px",
        borderRadius: 24,
        background: "rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        transform: `scale(${scale})`,
        opacity,
        minWidth: 200,
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontWeight: 800,
          color,
          fontFamily: "SF Pro Display, -apple-system, sans-serif",
        }}
      >
        <AnimatedNumber value={value} suffix={suffix} delay={delay + 10} />
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 500,
          color: "rgba(255, 255, 255, 0.7)",
          marginTop: 8,
          textTransform: "uppercase",
          letterSpacing: 2,
          fontFamily: "SF Pro Display, -apple-system, sans-serif",
        }}
      >
        {label}
      </div>
    </div>
  );
};

const MuscleTag: React.FC<{ muscle: string; delay: number }> = ({
  muscle,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 15,
      stiffness: 300,
    },
  });

  return (
    <div
      style={{
        padding: "12px 28px",
        borderRadius: 50,
        background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
        color: "#fff",
        fontSize: 20,
        fontWeight: 600,
        transform: `scale(${scale})`,
        fontFamily: "SF Pro Display, -apple-system, sans-serif",
        boxShadow: "0 4px 20px rgba(255, 107, 107, 0.4)",
      }}
    >
      {muscle}
    </div>
  );
};

export const WorkoutSummary: React.FC<WorkoutSummaryProps> = ({
  workoutName,
  duration,
  exerciseCount,
  totalVolume,
  caloriesBurned,
  muscleGroups,
  personalRecords,
  userName,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const bgGradientProgress = interpolate(frame, [0, durationInFrames], [0, 1]);
  const bgRotation = bgGradientProgress * 360;

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const titleY = spring({
    frame,
    fps,
    config: {
      damping: 20,
      stiffness: 100,
    },
  });

  const completedTextScale = spring({
    frame: frame - 30,
    fps,
    config: {
      damping: 15,
      stiffness: 200,
    },
  });

  const prBadgeScale = spring({
    frame: frame - 180,
    fps,
    config: {
      damping: 12,
      stiffness: 300,
    },
  });

  const formatVolume = (vol: number) => {
    if (vol >= 1000) {
      return `${(vol / 1000).toFixed(1)}k`;
    }
    return vol.toString();
  };

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${bgRotation}deg, #1a0a2e 0%, #2C124B 30%, #16082a 70%, #0d0415 100%)`,
        fontFamily: "SF Pro Display, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(157, 78, 221, 0.15) 0%, transparent 60%)",
        }}
      />

      <Sequence from={0}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            height: "100%",
            padding: "80px 60px",
          }}
        >
          <div
            style={{
              opacity: titleOpacity,
              transform: `translateY(${(1 - titleY) * -50}px)`,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.6)",
                marginBottom: 16,
                textTransform: "uppercase",
                letterSpacing: 4,
              }}
            >
              Workout Complete
            </div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1.1,
              }}
            >
              {workoutName}
            </div>
            <div
              style={{
                fontSize: 24,
                color: "rgba(255, 255, 255, 0.5)",
                marginTop: 12,
              }}
            >
              by {userName}
            </div>
          </div>
        </div>
      </Sequence>

      <Sequence from={40}>
        <div
          style={{
            position: "absolute",
            top: 340,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 30,
          }}
        >
          <div
            style={{
              transform: `scale(${completedTextScale})`,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 30px rgba(16, 185, 129, 0.4)",
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              marginTop: 40,
            }}
          >
            <StatCard
              label="Duration"
              value={duration}
              suffix=" min"
              delay={60}
              color="#FF6B6B"
            />
            <StatCard
              label="Exercises"
              value={exerciseCount}
              delay={75}
              color="#9D4EDD"
            />
            <StatCard
              label="Volume"
              value={totalVolume}
              suffix=" lbs"
              delay={90}
              color="#10B981"
            />
            <StatCard
              label="Calories"
              value={caloriesBurned}
              delay={105}
              color="#F59E0B"
            />
          </div>
        </div>
      </Sequence>

      <Sequence from={130}>
        <div
          style={{
            position: "absolute",
            top: 1150,
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: "rgba(255, 255, 255, 0.5)",
              marginBottom: 20,
              textTransform: "uppercase",
              letterSpacing: 3,
            }}
          >
            Muscles Trained
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              justifyContent: "center",
              maxWidth: 800,
            }}
          >
            {muscleGroups.map((muscle, index) => (
              <MuscleTag key={muscle} muscle={muscle} delay={140 + index * 10} />
            ))}
          </div>
        </div>
      </Sequence>

      {personalRecords > 0 && (
        <Sequence from={180}>
          <div
            style={{
              position: "absolute",
              bottom: 200,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                transform: `scale(${prBadgeScale})`,
                padding: "24px 48px",
                borderRadius: 100,
                background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                boxShadow: "0 8px 40px rgba(245, 158, 11, 0.5)",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="#fff"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {personalRecords} New PR{personalRecords > 1 ? "s" : ""}!
              </span>
            </div>
          </div>
        </Sequence>
      )}

      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "rgba(255, 255, 255, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              background: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 800,
            }}
          >
            FitForge
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
