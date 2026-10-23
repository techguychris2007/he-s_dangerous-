import { CHARACTERS, type CharacterId } from '../../data/characters';
import CharacterAvatar from './CharacterAvatar';
import './characters.css';

/** A character portrait with a speech bubble. The avatar is decorative because the bubble names the speaker. */
export default function CharacterSays({ id, children, size = 56, className = '' }: { id: CharacterId; children: React.ReactNode; size?: number; className?: string }) {
  const character = CHARACTERS[id];
  return (
    <div className={`dw-speaker ${className}`}>
      <CharacterAvatar id={id} size={size} decorative />
      <p className="dw-speaker__bubble">
        <span className="dw-speaker__name">{character.name}<small>{character.role}</small></span>
        {children}
      </p>
    </div>
  );
}
