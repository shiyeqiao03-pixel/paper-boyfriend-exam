export interface Character {
  id: string;
  name: string;
  slug: string;
  shortLabel: string;
  occupation: string;
  introText: string;
  homepageText: string;
  selectionText: string;
  introCardText: string;
  basePrompt: string;
  ttsProvider: string | null;
  ttsVoiceId: string | null;
  voiceStyle: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
