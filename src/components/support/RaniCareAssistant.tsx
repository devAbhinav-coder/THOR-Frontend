"use client";

import { RaniCareChatPanel } from "./rani-care/RaniCareChatPanel";
import { useRaniCareChat } from "./rani-care/useRaniCareChat";

export default function RaniCareAssistant() {
  const chat = useRaniCareChat();
  return <RaniCareChatPanel {...chat} />;
}
