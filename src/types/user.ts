export interface UserProfile {
  id: string;
  userId: string;
  nickname: string;
  preferredName: string;
  isAdultConfirmed: boolean;
  onboardingCompleted: boolean;
  lastCharacterId: string | null;
  emailRecallEnabled: boolean;
  lastLoginAt: Date | null;
  recallEmailCount: number;
  emailRecallPaused: boolean;
  lastRecallEmailSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCharacterRelationship {
  id: string;
  userId: string;
  characterId: string;
  affinityScore: number;
  relationshipStage: string;
  introSeen: boolean;
  lastChatAt: Date | null;
  messageCount: number;
  dailyImageCount: number;
  dailyVoiceCount: number;
  dailyUploadImageCount: number;
  dailyUploadVoiceCount: number;
  dailyResetDate: Date | null;
  lastAffinityUpdatedAt: Date | null;
  lastDecayAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
