export interface StarStoryBuilderResult {
  candidateName: string;
  roleSummary: string;
  storyStrategy: string;
  strengthsToLead: string[];
  practiceTips: string[];
  stories: StarStory[];
}

export type StoryUseCase =
  | 'behavioral'
  | 'technical'
  | 'leadership'
  | 'ownership'
  | 'impact'
  | 'conflict';

export interface StarStory {
  title: string;
  bestUse: StoryUseCase;
  relevance: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  recruiterVersion: string;
  deepDiveVersion: string;
  proofPoints: string[];
  likelyFollowUps: string[];
  weakSpots: string[];
}
