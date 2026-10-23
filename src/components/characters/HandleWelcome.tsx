import { useHandle } from '../../state/useHandle';
import { useModalA11y } from '../../hooks/useModalA11y';
import { OperatorAvatar } from './CharacterAvatar';
import CharacterSays from './CharacterSays';
import './characters.css';
import '../dashboard/dashboard.css';

/** First sign-in on a device: Sentinel issues the learner's cyber name and operator avatar. */
export default function HandleWelcome() {
  const { seed, handle, reroll, seen, markSeen } = useHandle();
  if (seen) return null;
  return <Dialog seed={seed} handle={handle} reroll={reroll} close={markSeen} />;
}

function Dialog({ seed, handle, reroll, close }: { seed: string; handle: string; reroll: () => void; close: () => void }) {
  const panelRef = useModalA11y(close);
  return (
    <div className="dw-handle-backdrop">
      <div ref={panelRef} className="dw-handle-dialog" role="dialog" aria-modal="true" aria-labelledby="dw-handle-title" tabIndex={-1}>
        <p className="dw-handle-dialog__eyebrow">Access granted</p>
        <OperatorAvatar seed={seed} size={112} label={`Your operator avatar`} />
        <h2 id="dw-handle-title">Your cyber name is<br /><span>{handle}</span></h2>
        <CharacterSays id="sentinel" size={40}>Every operator here works under a call sign. This one is yours — it is what the academy and the leaderboard will call you.</CharacterSays>
        <div className="dw-handle-dialog__actions">
          <button type="button" className="dw-button" onClick={reroll}>Generate another</button>
          <button type="button" className="dw-button dw-button--primary" onClick={close}>Keep {handle}</button>
        </div>
      </div>
    </div>
  );
}
