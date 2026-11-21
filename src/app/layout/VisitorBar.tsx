import { Link } from 'react-router-dom';

/** One line above the page while a visitor browses without an account. Says what they can do now and
 *  what an account adds; the Sign in and Join buttons live in the top bar, so this stays text. */
export default function VisitorBar() {
  return (
    <p className="dw-visitor-bar" role="note">
      You’re browsing as a guest. <Link to="/login?mode=signup">Create a free account</Link> to open lessons and labs and keep your progress.
    </p>
  );
}
