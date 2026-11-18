import React from 'react';
import { GameId, GameAPI } from '../types';

// Track 1
import { TargetSum } from './track1/TargetSum';
import { SignalSequence } from './track1/SignalSequence';
import { StackSort } from './track1/StackSort';
import { FunctionMachine } from './track1/FunctionMachine';
import { PixelLogic } from './track1/PixelLogic';
import { MatrixComplete } from './track1/MatrixComplete';

// Track 2
import { DigitChallenge } from './track2/DigitChallenge';
import { GridChallenge } from './track2/GridChallenge';
import { MotionChallenge } from './track2/MotionChallenge';
import { SwitchChallenge } from './track2/SwitchChallenge';
import { GeoSudo } from './track2/GeoSudo';
import { InductiveChallenge } from './track2/InductiveChallenge';

export const GameRenderer: React.FC<{
  gameId: GameId;
  puzzleKey: string;
  api: GameAPI;
}> = ({ gameId, puzzleKey, api }) => {
  switch (gameId) {
    // Track 1
    case 'sum':
      return <TargetSum key={puzzleKey} api={api} />;
    case 'seq':
      return <SignalSequence key={puzzleKey} api={api} />;
    case 'hanoi':
      return <StackSort key={puzzleKey} api={api} />;
    case 'func':
      return <FunctionMachine key={puzzleKey} api={api} />;
    case 'pixel':
      return <PixelLogic key={puzzleKey} api={api} />;
    case 'matrix':
      return <MatrixComplete key={puzzleKey} api={api} />;

    // Track 2
    case 'digit':
      return <DigitChallenge key={puzzleKey} api={api} />;
    case 'grid':
      return <GridChallenge key={puzzleKey} api={api} />;
    case 'motion':
      return <MotionChallenge key={puzzleKey} api={api} />;
    case 'switch':
      return <SwitchChallenge key={puzzleKey} api={api} />;
    case 'sudo':
      return <GeoSudo key={puzzleKey} api={api} />;
    case 'inductive':
      return <InductiveChallenge key={puzzleKey} api={api} />;

    default:
      return <div className="text-white p-6">Game not found.</div>;
  }
};
