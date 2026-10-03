import { lesson } from "@/sanity/schemaTypes/lesson";
import { mission } from "@/sanity/schemaTypes/mission";
import { playerProgress } from "@/sanity/schemaTypes/playerProgress";
import {
  choiceOption,
  missionStep,
  priceOption,
  quizChoice,
  quizQuestion,
  reward,
  supplyOption,
} from "@/sanity/schemaTypes/objects";

export const schemaTypes = [
  lesson,
  mission,
  playerProgress,
  missionStep,
  choiceOption,
  supplyOption,
  priceOption,
  quizQuestion,
  quizChoice,
  reward,
];
