import type { Pose, Keypoint } from "@tensorflow-models/pose-detection";

export interface FormFeedback {
  isCorrect: boolean;
  message: string;
  tip: string;
  confidence: number;
}

export interface ExerciseFormRule {
  name: string;
  checkForm: (pose: Pose) => FormFeedback;
  keyPoints: string[];
  description: string;
}

const getKeypoint = (pose: Pose, name: string): Keypoint | undefined => {
  return pose.keypoints.find((kp) => kp.name === name);
};

const calculateAngle = (
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
): number => {
  const radians =
    Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
};

const checkVisibility = (keypoints: (Keypoint | undefined)[], threshold = 0.3): boolean => {
  return keypoints.every((kp) => kp && kp.score && kp.score > threshold);
};

export const SQUAT_FORM: ExerciseFormRule = {
  name: "Squat",
  keyPoints: ["left_hip", "left_knee", "left_ankle", "right_hip", "right_knee", "right_ankle"],
  description: "Keep your back straight, knees over toes, and go deep",
  checkForm: (pose: Pose): FormFeedback => {
    const leftHip = getKeypoint(pose, "left_hip");
    const leftKnee = getKeypoint(pose, "left_knee");
    const leftAnkle = getKeypoint(pose, "left_ankle");
    const rightHip = getKeypoint(pose, "right_hip");
    const rightKnee = getKeypoint(pose, "right_knee");
    const rightAnkle = getKeypoint(pose, "right_ankle");

    if (!checkVisibility([leftHip, leftKnee, leftAnkle, rightHip, rightKnee, rightAnkle])) {
      return {
        isCorrect: false,
        message: "Position yourself so your full body is visible",
        tip: "Stand side-on to the camera for best tracking",
        confidence: 0,
      };
    }

    const leftKneeAngle = calculateAngle(
      leftHip as { x: number; y: number },
      leftKnee as { x: number; y: number },
      leftAnkle as { x: number; y: number }
    );
    const rightKneeAngle = calculateAngle(
      rightHip as { x: number; y: number },
      rightKnee as { x: number; y: number },
      rightAnkle as { x: number; y: number }
    );

    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;
    const confidence = Math.min(
      (leftKnee?.score || 0),
      (rightKnee?.score || 0),
      (leftHip?.score || 0),
      (rightHip?.score || 0)
    );

    if (avgKneeAngle > 160) {
      return {
        isCorrect: false,
        message: "Go lower - aim for parallel or below",
        tip: "Push your hips back as you descend",
        confidence,
      };
    }

    if (avgKneeAngle < 70) {
      return {
        isCorrect: true,
        message: "Great depth! Full range of motion",
        tip: "Drive through your heels to stand up",
        confidence,
      };
    }

    if (avgKneeAngle >= 70 && avgKneeAngle <= 100) {
      return {
        isCorrect: true,
        message: "Good form! Parallel squat achieved",
        tip: "Keep your chest up and core tight",
        confidence,
      };
    }

    return {
      isCorrect: false,
      message: "Almost there - go a bit deeper",
      tip: "Keep your weight on your heels",
      confidence,
    };
  },
};

export const PUSHUP_FORM: ExerciseFormRule = {
  name: "Push-up",
  keyPoints: ["left_shoulder", "left_elbow", "left_wrist", "left_hip", "left_ankle"],
  description: "Keep your body in a straight line from head to heels",
  checkForm: (pose: Pose): FormFeedback => {
    const leftShoulder = getKeypoint(pose, "left_shoulder");
    const leftElbow = getKeypoint(pose, "left_elbow");
    const leftWrist = getKeypoint(pose, "left_wrist");
    const leftHip = getKeypoint(pose, "left_hip");
    const leftAnkle = getKeypoint(pose, "left_ankle");

    if (!checkVisibility([leftShoulder, leftElbow, leftWrist, leftHip, leftAnkle])) {
      return {
        isCorrect: false,
        message: "Position yourself side-on to the camera",
        tip: "Your full body should be visible in the frame",
        confidence: 0,
      };
    }

    const elbowAngle = calculateAngle(
      leftShoulder as { x: number; y: number },
      leftElbow as { x: number; y: number },
      leftWrist as { x: number; y: number }
    );

    const bodyAngle = calculateAngle(
      leftShoulder as { x: number; y: number },
      leftHip as { x: number; y: number },
      leftAnkle as { x: number; y: number }
    );

    const confidence = Math.min(
      (leftShoulder?.score || 0),
      (leftElbow?.score || 0),
      (leftHip?.score || 0)
    );

    if (bodyAngle < 160) {
      return {
        isCorrect: false,
        message: "Keep your hips in line - avoid sagging or piking",
        tip: "Engage your core to maintain a straight line",
        confidence,
      };
    }

    if (elbowAngle > 160) {
      return {
        isCorrect: true,
        message: "Good starting position - arms extended",
        tip: "Lower your chest toward the ground",
        confidence,
      };
    }

    if (elbowAngle < 100) {
      return {
        isCorrect: true,
        message: "Great depth! Full range of motion",
        tip: "Push through your palms to return to start",
        confidence,
      };
    }

    return {
      isCorrect: false,
      message: "Go lower - aim for 90 degrees at the elbows",
      tip: "Keep your elbows at 45 degrees from your body",
      confidence,
    };
  },
};

export const PLANK_FORM: ExerciseFormRule = {
  name: "Plank",
  keyPoints: ["left_shoulder", "left_hip", "left_ankle", "left_elbow"],
  description: "Hold a straight line from shoulders to ankles",
  checkForm: (pose: Pose): FormFeedback => {
    const leftShoulder = getKeypoint(pose, "left_shoulder");
    const leftHip = getKeypoint(pose, "left_hip");
    const leftAnkle = getKeypoint(pose, "left_ankle");

    if (!checkVisibility([leftShoulder, leftHip, leftAnkle])) {
      return {
        isCorrect: false,
        message: "Position yourself side-on to the camera",
        tip: "Your full body should be visible",
        confidence: 0,
      };
    }

    const bodyAngle = calculateAngle(
      leftShoulder as { x: number; y: number },
      leftHip as { x: number; y: number },
      leftAnkle as { x: number; y: number }
    );

    const confidence = Math.min(
      (leftShoulder?.score || 0),
      (leftHip?.score || 0),
      (leftAnkle?.score || 0)
    );

    if (bodyAngle > 175) {
      return {
        isCorrect: true,
        message: "Perfect plank position!",
        tip: "Keep breathing and engage your core",
        confidence,
      };
    }

    if (bodyAngle < 160) {
      const hipY = leftHip?.y || 0;
      const shoulderY = leftShoulder?.y || 0;
      const ankleY = leftAnkle?.y || 0;

      if (hipY < (shoulderY + ankleY) / 2) {
        return {
          isCorrect: false,
          message: "Hips too high - lower them slightly",
          tip: "Think about pushing your hips toward the ground",
          confidence,
        };
      } else {
        return {
          isCorrect: false,
          message: "Hips sagging - lift them up",
          tip: "Squeeze your glutes and tighten your abs",
          confidence,
        };
      }
    }

    return {
      isCorrect: true,
      message: "Good form - keep holding!",
      tip: "Focus on keeping your body rigid",
      confidence,
    };
  },
};

export const LUNGE_FORM: ExerciseFormRule = {
  name: "Lunge",
  keyPoints: ["left_hip", "left_knee", "left_ankle", "right_hip", "right_knee", "right_ankle"],
  description: "Front knee over ankle, back knee toward ground",
  checkForm: (pose: Pose): FormFeedback => {
    const leftHip = getKeypoint(pose, "left_hip");
    const leftKnee = getKeypoint(pose, "left_knee");
    const leftAnkle = getKeypoint(pose, "left_ankle");
    const rightKnee = getKeypoint(pose, "right_knee");

    if (!checkVisibility([leftHip, leftKnee, leftAnkle, rightKnee])) {
      return {
        isCorrect: false,
        message: "Position yourself so both legs are visible",
        tip: "Stand at a slight angle to the camera",
        confidence: 0,
      };
    }

    const frontKneeAngle = calculateAngle(
      leftHip as { x: number; y: number },
      leftKnee as { x: number; y: number },
      leftAnkle as { x: number; y: number }
    );

    const confidence = Math.min(
      (leftKnee?.score || 0),
      (rightKnee?.score || 0),
      (leftHip?.score || 0)
    );

    if (frontKneeAngle > 100 && frontKneeAngle < 120) {
      return {
        isCorrect: true,
        message: "Excellent lunge form!",
        tip: "Push through your front heel to stand",
        confidence,
      };
    }

    if (frontKneeAngle > 120) {
      return {
        isCorrect: false,
        message: "Go deeper - lower your back knee",
        tip: "Your front thigh should be parallel to the ground",
        confidence,
      };
    }

    if (frontKneeAngle < 80) {
      return {
        isCorrect: false,
        message: "Knee too far forward - step out more",
        tip: "Keep your front knee above your ankle",
        confidence,
      };
    }

    return {
      isCorrect: true,
      message: "Good lunge depth",
      tip: "Keep your torso upright",
      confidence,
    };
  },
};

export const EXERCISE_FORMS: Record<string, ExerciseFormRule> = {
  squat: SQUAT_FORM,
  "barbell squat": SQUAT_FORM,
  "goblet squat": SQUAT_FORM,
  "front squat": SQUAT_FORM,
  "push-up": PUSHUP_FORM,
  pushup: PUSHUP_FORM,
  "push up": PUSHUP_FORM,
  plank: PLANK_FORM,
  "forearm plank": PLANK_FORM,
  lunge: LUNGE_FORM,
  "walking lunge": LUNGE_FORM,
  "reverse lunge": LUNGE_FORM,
  "forward lunge": LUNGE_FORM,
};

export const getFormRuleForExercise = (exerciseName: string): ExerciseFormRule | null => {
  const normalizedName = exerciseName.toLowerCase().trim();
  
  if (EXERCISE_FORMS[normalizedName]) {
    return EXERCISE_FORMS[normalizedName];
  }
  
  for (const [key, rule] of Object.entries(EXERCISE_FORMS)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return rule;
    }
  }
  
  return null;
};

export const SKELETON_CONNECTIONS: [string, string][] = [
  ["nose", "left_eye"],
  ["nose", "right_eye"],
  ["left_eye", "left_ear"],
  ["right_eye", "right_ear"],
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["right_shoulder", "right_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["right_hip", "right_knee"],
  ["left_knee", "left_ankle"],
  ["right_knee", "right_ankle"],
];
