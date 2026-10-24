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
  api: GameAPI;
}> = ({ gameId, api }) => {
  switch (gameId) {
    // Track 1
    case 'sum':
      return <TargetSum key={`sum-${api.level}`} api={api} />;
    case 'seq':
      return <SignalSequence key={`seq-${api.level}`} api={api} />;
    case 'hanoi':
      return <StackSort key={`hanoi-${api.level}`} api={api} />;
    case 'func':
      return <FunctionMachine key={`func-${api.level}`} api={api} />;
    case 'pixel':
      return <PixelLogic key={`pixel-${api.level}`} api={api} />;
    case 'matrix':
      return <MatrixComplete key={`matrix-${api.level}`} api={api} />;

    // Track 2
    case 'digit':
      return <DigitChallenge key={`digit-${api.level}`} api={api} />;
    case 'grid':
      return <GridChallenge key={`grid-${api.level}`} api={api} />;
    case 'motion':
      return <MotionChallenge key={`motion-${api.level}`} api={api} />;
    case 'switch':
      return <SwitchChallenge key={`switch-${api.level}`} api={api} />;
    case 'sudo':
      return <GeoSudo key={`sudo-${api.level}`} api={api} />;
    case 'inductive':
      return <InductiveChallenge key={`inductive-${api.level}`} api={api} />;

    default:
      return <div className="text-white p-6">Game not found.</div>;
  }
};
