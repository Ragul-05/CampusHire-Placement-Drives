import { PLACEMENT_STAGE_OPTIONS } from '../utils/stageOptions';

type Props = {
  value: string;
  onChange: (stage: string) => void;
  disabled?: boolean;
  disableSelected?: boolean;
  className?: string;
};

function toLabel(stage: string): string {
  if (stage === 'ASSESSMENT') return 'Assessment';
  if (stage === 'TECHNICAL') return 'Technical';
  if (stage === 'HR') return 'HR Round';
  if (stage === 'ELIGIBLE') return 'Eligible';
  if (stage === 'REJECTED') return 'Rejected';
  return 'Selected';
}

export default function StageDropdown({ value, onChange, disabled, disableSelected, className }: Props) {
  const normalized = value === 'APPLIED' ? 'ELIGIBLE' : value;
  const stageClass = `stage-select-${normalized.toLowerCase()}`;

  return (
    <select
      className={`stage-select ${stageClass} ${className ?? ''}`.trim()}
      value={normalized}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {PLACEMENT_STAGE_OPTIONS.map((stage) => (
        <option key={stage} value={stage} disabled={disableSelected && stage === 'SELECTED'}>
          {toLabel(stage)}
        </option>
      ))}
    </select>
  );
}
