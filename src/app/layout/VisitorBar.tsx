import { Link } from 'react-router-dom';

/** One line above the page while a visitor browses without an account. Says what they can do now and
 *  what an account adds; the Sign in and Join buttons live in the top bar, so this stays text. */
export default function VisitorBar() {
  return (
    <p className="dw-visitor-bar" role="note">
      You’re browsing without an account. Lessons and labs open once you <Link to="/login?mode=signup">create a free account</Link>, and your progress is saved from the first flag.
    </p>
  );
}
