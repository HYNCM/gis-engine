import { Check, Circle } from "lucide-react";

const STEPS = ["Create project", "Inspect data", "Review plan", "Apply revision", "Export app"];

interface Props {
  completed: number;
}

export default function ProgressTrack({ completed }: Props) {
  if (completed >= STEPS.length) return null;
  return (
    <nav className="progress-track" aria-label="First project progress">
      {STEPS.map((step, index) => {
        const done = index < completed;
        const current = index === completed;
        return (
          <div className={`progress-step ${done ? "is-done" : ""} ${current ? "is-current" : ""}`} key={step}>
            {done ? <Check size={13} aria-hidden="true" /> : <Circle size={11} aria-hidden="true" />}
            <span>{step}</span>
          </div>
        );
      })}
    </nav>
  );
}
