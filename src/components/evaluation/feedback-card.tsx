import { CircleCheck, Dumbbell, Target, TrendingUp } from "lucide-react";

import { Icon } from "@/components/ui/icon";

interface Props {
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export function FeedbackCard({ feedback, strengths, improvements }: Props) {
  return (
    <div className="stack gap-4">
      {feedback && <p className="leading-normal">{feedback}</p>}

      {strengths.length > 0 && (
        <div className="stack gap-2">
          <h4 className="feedback-heading text-sm text-success">
            <Icon icon={Dumbbell} size={16} />
            Kekuatan
          </h4>
          <ul className="stack gap-1">
            {strengths.map((item, index) => (
              <li
                key={`${index}-${item}`}
                className="feedback-item text-secondary text-sm"
              >
                <Icon icon={CircleCheck} size={14} className="text-success" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {improvements.length > 0 && (
        <div className="stack gap-2">
          <h4 className="feedback-heading text-sm text-warning">
            <Icon icon={Target} size={16} />
            Perlu Diperbaiki
          </h4>
          <ul className="stack gap-1">
            {improvements.map((item, index) => (
              <li
                key={`${index}-${item}`}
                className="feedback-item text-secondary text-sm"
              >
                <Icon icon={TrendingUp} size={14} className="text-warning" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
