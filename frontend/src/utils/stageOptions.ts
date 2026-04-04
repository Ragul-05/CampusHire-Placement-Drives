export const PLACEMENT_STAGE_OPTIONS = [
  'ELIGIBLE',
  'ASSESSMENT',
  'TECHNICAL',
  'HR',
  'SELECTED',
] as const;

export type PlacementStageOption = (typeof PLACEMENT_STAGE_OPTIONS)[number];

export const FACULTY_EDITABLE_STAGES = [
  'ELIGIBLE',
  'ASSESSMENT',
  'TECHNICAL',
  'HR',
] as const;

export function isFacultyEditableStage(stage: string): boolean {
  return FACULTY_EDITABLE_STAGES.includes(stage as (typeof FACULTY_EDITABLE_STAGES)[number]);
}
