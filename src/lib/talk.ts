export type TalkMode = "alert" | "choice" | "chat";

export type TalkChoice = {
  id: string;
  label: string;
};

export type TalkPrompt = {
  petId: string;
  mode: TalkMode;
  text: string;
  detail?: string;
  choices?: TalkChoice[];
};

export function talkWindowMode(
  prompt: TalkPrompt | null
): "compact" | "alert" | "choice" | "chat" {
  if (!prompt) return "compact";
  return prompt.mode;
}
