import CodeBlock from '../../components/lesson/CodeBlock';
import Callout from '../../components/lesson/Callout';
import PracticeTasksCallout from '../../components/lesson/PracticeTasksCallout';

export default function DecoratorsAndClosures() {
  return (
    <div className="prose-hh">
      <h1>Closures &amp; Decorators</h1>
      <p>
        A decorator lets you wrap a function with extra behavior — logging, timing, auth checks, rate
        limiting — without editing the function's own body at all. Under the hood, decorators rely on two
        facts about Python that are worth understanding directly: functions are ordinary values, and inner
        functions can "remember" variables from the scope they were created in.
      </p>

      <h2>Functions are values (first-class functions)</h2>
      <CodeBlock label="functions can be passed around like any other value">{`def shout(text):
    return text.upper() + "!"

def whisper(text):
    return text.lower() + "..."

def apply(func, text):
    return func(text)   # func is just a variable holding a function

print(apply(shout, "hello"))    # "HELLO!"
print(apply(whisper, "hello"))  # "hello..."`}</CodeBlock>
      <p>
        Because functions are values, you can pass one into another function as an argument, store one in
        a list, or <em>return one from another function</em> — that last capability is exactly what makes
        decorators possible.
      </p>

      <h2>Closures — an inner function that remembers its enclosing scope</h2>
      <CodeBlock label="a closure">{`def make_multiplier(factor):
    def multiply(x):
        return x * factor   # factor is "closed over" from the enclosing scope
    return multiply

double = make_multiplier(2)
triple = make_multiplier(3)
print(double(5))   # 10
print(triple(5))   # 15 — double and triple each remember their OWN factor`}</CodeBlock>
      <p>
        <code>multiply</code> keeps a reference to <code>factor</code> even after{' '}
        <code>make_multiplier</code> has already returned — that's the "closure": the inner function closes
        over variables from its enclosing scope and carries them along wherever it goes.
      </p>

      <h2>Your first decorator</h2>
      <CodeBlock label="a decorator is a function that takes a function and returns a function">{`def require_auth(func):
    def wrapper(*args, **kwargs):
        session = args[0]
        if not session.get("authenticated"):
            raise PermissionError("Not authenticated")
        return func(*args, **kwargs)
    return wrapper

@require_auth
def get_secret_data(session):
    return "top secret"

# the @require_auth line above is exactly equivalent to writing:
# get_secret_data = require_auth(get_secret_data)

get_secret_data({"authenticated": True})   # "top secret"
get_secret_data({"authenticated": False})  # raises PermissionError`}</CodeBlock>
      <p>
        <code>*args, **kwargs</code> in <code>wrapper</code>'s signature means "accept any positional and
        keyword arguments, whatever they are" — this is what lets one decorator wrap functions with
        completely different signatures without needing to know their exact parameters in advance.
      </p>

      <h2>Decorators that take their own arguments</h2>
      <p>
        Sometimes the decorator itself needs configuration — <code>@rate_limit(3)</code> instead of just{' '}
        <code>@rate_limit</code>. This needs one extra layer of nesting: a function that takes the
        decorator's arguments and <em>returns</em> the actual decorator.
      </p>
      <CodeBlock label="a decorator factory">{`def rate_limit(max_calls):
    def decorator(func):          # this is the actual decorator
        calls = [0]                 # a mutable closure variable, shared across all calls
        def wrapper(*args, **kwargs):
            if calls[0] >= max_calls:
                raise RuntimeError("Rate limit exceeded")
            calls[0] += 1
            return func(*args, **kwargs)
        return wrapper
    return decorator

@rate_limit(3)
def ping(host):
    return f"pong from {host}"

ping("a"); ping("b"); ping("c")   # fine
ping("d")                          # raises RuntimeError — 4th call exceeds the limit`}</CodeBlock>
      <Callout variant="tip">
        <p>
          Trace the nesting carefully: <code>rate_limit(3)</code> runs immediately and returns{' '}
          <code>decorator</code>. THEN <code>@decorator</code> is applied to <code>ping</code>, running{' '}
          <code>decorator(ping)</code>, which returns <code>wrapper</code>. Every subsequent call to{' '}
          <code>ping(...)</code> is really a call to that <code>wrapper</code>.
        </p>
      </Callout>

      <h2>Class-based decorators: when a decorator needs to hold real state</h2>
      <p>
        The <code>rate_limit</code> decorator above smuggled its counter into a closure using a one-item list
        (<code>calls = [0]</code>) — a common but slightly awkward workaround, since a plain integer in a
        closure can't be reassigned from the inner function directly. A class-based decorator, using{' '}
        <code>__call__</code> to make an instance itself callable, often reads more clearly once a decorator
        needs to track real state:
      </p>
      <CodeBlock label="the same rate limiter, as a class instead of nested closures">{`class RateLimit:
    def __init__(self, max_calls):
        self.max_calls = max_calls
        self.calls = 0

    def __call__(self, func):
        def wrapper(*args, **kwargs):
            if self.calls >= self.max_calls:
                raise RuntimeError("Rate limit exceeded")
            self.calls += 1
            return func(*args, **kwargs)
        return wrapper

@RateLimit(3)
def ping(host):
    return f"pong from {host}"`}</CodeBlock>
      <p>
        <code>@RateLimit(3)</code> first creates a <code>RateLimit</code> instance, then Python applies it as
        the decorator by calling that instance — which is exactly what <code>__call__</code> enables. Reach
        for this style once a decorator's internal state is complex enough that a plain closure variable
        starts feeling like a workaround rather than a natural fit.
      </p>

      <h2>functools.wraps — preserving the original function's identity</h2>
      <CodeBlock label="a small but important detail">{`from functools import wraps

def logged(func):
    @wraps(func)   # copies func's __name__, docstring, etc. onto wrapper
    def wrapper(*args, **kwargs):
        print(f"calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper`}</CodeBlock>
      <p>
        Without <code>@wraps(func)</code>, a decorated function's <code>__name__</code> and docstring get
        silently replaced by <code>wrapper</code>'s — which makes debugging and auto-generated
        documentation confusing. It costs one line and is standard practice on every real decorator.
      </p>

      <PracticeTasksCallout
        tasks={[
          { id: 'py-adv-01', title: 'A require_auth Decorator' },
          { id: 'py-adv-02', title: 'A rate_limit Decorator With Arguments' },
        ]}
      />
    </div>
  );
}
