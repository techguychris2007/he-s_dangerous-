// Types for the in-browser test kit: a compatible subset of Vitest, @testing-library/react and
// @testing-library/user-event. Only what is declared here exists at run time.

// Style sheets are injected into the page by the runner (as Vite does), so importing one is allowed.
declare module '*.css';

declare module 'vitest' {
  type Awaitable<T> = T | PromiseLike<T>;
  export function describe(name: string, fn: () => void): void;
  export function test(name: string, fn: () => Awaitable<unknown>, timeout?: number): void;
  export function it(name: string, fn: () => Awaitable<unknown>, timeout?: number): void;
  export function beforeEach(fn: () => Awaitable<unknown>): void;
  export function afterEach(fn: () => Awaitable<unknown>): void;
  export function beforeAll(fn: () => Awaitable<unknown>): void;
  export function afterAll(fn: () => Awaitable<unknown>): void;

  interface Matchers<R = void> {
    toBe(expected: unknown): R;
    toEqual(expected: unknown): R;
    toStrictEqual(expected: unknown): R;
    toBeTruthy(): R;
    toBeFalsy(): R;
    toBeNull(): R;
    toBeUndefined(): R;
    toBeDefined(): R;
    toBeNaN(): R;
    toBeGreaterThan(n: number | bigint): R;
    toBeGreaterThanOrEqual(n: number | bigint): R;
    toBeLessThan(n: number | bigint): R;
    toBeLessThanOrEqual(n: number | bigint): R;
    toBeCloseTo(n: number, digits?: number): R;
    toBeInstanceOf(ctor: abstract new (...args: never[]) => unknown): R;
    toBeTypeOf(type: 'string' | 'number' | 'boolean' | 'bigint' | 'symbol' | 'undefined' | 'object' | 'function'): R;
    toContain(item: unknown): R;
    toContainEqual(item: unknown): R;
    toHaveLength(n: number): R;
    toHaveProperty(path: string | readonly string[], value?: unknown): R;
    toMatch(pattern: string | RegExp): R;
    toMatchObject(expected: object): R;
    toThrow(expected?: string | RegExp | (abstract new (...args: never[]) => unknown)): R;
    toHaveBeenCalled(): R;
    toHaveBeenCalledTimes(n: number): R;
    toHaveBeenCalledWith(...args: unknown[]): R;
    toHaveBeenLastCalledWith(...args: unknown[]): R;
    // jest-dom matchers — available in React (DOM) targets
    toBeInTheDocument(): R;
    toBeVisible(): R;
    toHaveTextContent(text: string | RegExp): R;
    toBeDisabled(): R;
    toBeEnabled(): R;
    toHaveAttribute(name: string, value?: string | RegExp): R;
    toHaveValue(value: string | number | string[] | null): R;
    toBeChecked(): R;
    toHaveFocus(): R;
    toBeRequired(): R;
    toBeInvalid(): R;
    toHaveAccessibleName(name?: string | RegExp): R;
    toHaveAccessibleDescription(description?: string | RegExp): R;
    toHaveClass(...names: string[]): R;
  }
  interface Assertion extends Matchers<void> {
    not: Matchers<void>;
    resolves: Matchers<Promise<void>> & { not: Matchers<Promise<void>> };
    rejects: Matchers<Promise<void>> & { not: Matchers<Promise<void>> };
  }
  interface AsymmetricMatcher { readonly $$asymmetric: true }
  interface ExpectStatic {
    (actual: unknown): Assertion;
    any(ctor: unknown): never;
    anything(): never;
    objectContaining(obj: object): never;
    arrayContaining(items: readonly unknown[]): never;
    stringContaining(text: string): never;
    stringMatching(pattern: string | RegExp): never;
  }
  export const expect: ExpectStatic;

  // Compile-time type assertions, checked by the TypeScript compiler (they do nothing at run time).
  type IsEqual<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
  interface ExpectTypeOf<Actual> {
    toEqualTypeOf<Expected>(...mismatch: IsEqual<Actual, Expected> extends true ? [] : [typeMismatch: { actual: Actual; expected: Expected }]): void;
    toMatchTypeOf<Expected>(...mismatch: [Actual] extends [Expected] ? [] : [typeMismatch: { actual: Actual; expected: Expected }]): void;
    toBeString(...mismatch: IsEqual<Actual, string> extends true ? [] : [notString: Actual]): void;
    toBeNumber(...mismatch: IsEqual<Actual, number> extends true ? [] : [notNumber: Actual]): void;
    toBeNever(...mismatch: [Actual] extends [never] ? [] : [notNever: Actual]): void;
    toBeCallableWith(...args: Actual extends (...a: infer P) => unknown ? P : never): void;
    parameters: ExpectTypeOf<Actual extends (...a: infer P) => unknown ? P : never>;
    returns: ExpectTypeOf<Actual extends (...a: never[]) => infer R ? R : never>;
    resolves: ExpectTypeOf<Awaited<Actual>>;
    not: {
      toEqualTypeOf<Expected>(...mismatch: IsEqual<Actual, Expected> extends true ? [unexpectedlyEqual: Expected] : []): void;
      toMatchTypeOf<Expected>(...mismatch: [Actual] extends [Expected] ? [unexpectedlyMatches: Expected] : []): void;
    };
  }
  export function expectTypeOf<Actual>(value: Actual): ExpectTypeOf<Actual>;
  export function expectTypeOf<Actual>(): ExpectTypeOf<Actual>;
  export function assertType<T>(value: T): void;

  type Procedure = (...args: any[]) => any;
  interface MockContext<T extends Procedure> {
    readonly calls: Parameters<T>[];
    readonly results: { type: 'return' | 'throw'; value: unknown }[];
    readonly lastCall: Parameters<T> | undefined;
  }
  export interface Mock<T extends Procedure = Procedure> {
    (...args: Parameters<T>): ReturnType<T>;
    readonly mock: MockContext<T>;
    mockImplementation(fn: T): this;
    mockImplementationOnce(fn: T): this;
    mockReturnValue(value: ReturnType<T>): this;
    mockReturnValueOnce(value: ReturnType<T>): this;
    mockResolvedValue(value: Awaited<ReturnType<T>>): this;
    mockResolvedValueOnce(value: Awaited<ReturnType<T>>): this;
    mockRejectedValue(error: unknown): this;
    mockRejectedValueOnce(error: unknown): this;
    mockClear(): this;
    mockReset(): this;
    mockRestore(): void;
  }
  export const vi: {
    fn<T extends Procedure = (...args: any[]) => any>(impl?: T): Mock<T>;
    isMockFunction(fn: unknown): boolean;
    spyOn<O extends object, K extends keyof O>(obj: O, method: K): O[K] extends Procedure ? Mock<O[K]> : never;
    restoreAllMocks(): void;
    useFakeTimers(options?: { now?: number | Date }): typeof vi;
    useRealTimers(): typeof vi;
    isFakeTimers(): boolean;
    setSystemTime(time: number | string | Date): typeof vi;
    advanceTimersByTime(ms: number): typeof vi;
    advanceTimersByTimeAsync(ms: number): Promise<typeof vi>;
    runAllTimers(): typeof vi;
    getTimerCount(): number;
  };
}

declare module '@testing-library/react' {
  import type { ReactNode, ComponentType } from 'react';
  type Matcher = string | RegExp | ((text: string) => boolean);
  interface RoleOptions { name?: Matcher; level?: number; checked?: boolean; pressed?: boolean; expanded?: boolean; selected?: boolean; current?: boolean | string; hidden?: boolean }
  interface TextOptions { exact?: boolean; hidden?: boolean }
  interface WaitOptions { timeout?: number; interval?: number }
  type Q<Opt> = {
    get: (matcher: Matcher, options?: Opt) => HTMLElement;
    getAll: (matcher: Matcher, options?: Opt) => HTMLElement[];
    query: (matcher: Matcher, options?: Opt) => HTMLElement | null;
    queryAll: (matcher: Matcher, options?: Opt) => HTMLElement[];
    find: (matcher: Matcher, options?: Opt, wait?: WaitOptions) => Promise<HTMLElement>;
    findAll: (matcher: Matcher, options?: Opt, wait?: WaitOptions) => Promise<HTMLElement[]>;
  };
  type ByRole = {
    getByRole(role: string, options?: RoleOptions): HTMLElement;
    getAllByRole(role: string, options?: RoleOptions): HTMLElement[];
    queryByRole(role: string, options?: RoleOptions): HTMLElement | null;
    queryAllByRole(role: string, options?: RoleOptions): HTMLElement[];
    findByRole(role: string, options?: RoleOptions, wait?: WaitOptions): Promise<HTMLElement>;
    findAllByRole(role: string, options?: RoleOptions, wait?: WaitOptions): Promise<HTMLElement[]>;
  };
  type Named<K extends string, Opt> = {
    [P in `getBy${K}`]: Q<Opt>['get'] } & { [P in `getAllBy${K}`]: Q<Opt>['getAll'] } & { [P in `queryBy${K}`]: Q<Opt>['query'] } &
    { [P in `queryAllBy${K}`]: Q<Opt>['queryAll'] } & { [P in `findBy${K}`]: Q<Opt>['find'] } & { [P in `findAllBy${K}`]: Q<Opt>['findAll'] };
  export type BoundQueries = ByRole & Named<'Text', TextOptions> & Named<'LabelText', TextOptions> & Named<'PlaceholderText', TextOptions> &
    Named<'DisplayValue', TextOptions> & Named<'AltText', TextOptions> & Named<'Title', TextOptions> & Named<'TestId', TextOptions>;
  export interface RenderResult extends BoundQueries {
    container: HTMLElement;
    baseElement: HTMLElement;
    rerender(ui: ReactNode): void;
    unmount(): void;
    asFragment(): DocumentFragment;
  }
  export function render(ui: ReactNode, options?: { wrapper?: ComponentType<{ children: ReactNode }>; container?: HTMLElement }): RenderResult;
  export const screen: BoundQueries & { debug(element?: Element): void };
  export function within(element: HTMLElement): BoundQueries;
  export function waitFor<T>(callback: () => T | Promise<T>, options?: WaitOptions): Promise<T>;
  export function waitForElementToBeRemoved(callback: (() => Element | Element[] | null) | Element, options?: WaitOptions): Promise<void>;
  export function cleanup(): void;
  export function act(callback: () => void | Promise<void>): Promise<void>;
  export const fireEvent: {
    click(el: Element, init?: MouseEventInit): void;
    change(el: Element, init?: { target: { value: string } }): void;
    input(el: Element, init?: { target: { value: string } }): void;
    submit(el: Element): void;
    keyDown(el: Element, init?: KeyboardEventInit): void;
    focus(el: Element): void;
    blur(el: Element): void;
  };
}

declare module '@testing-library/user-event' {
  export interface UserEvent {
    click(element: Element): Promise<void>;
    dblClick(element: Element): Promise<void>;
    type(element: Element, text: string, options?: { skipClick?: boolean }): Promise<void>;
    clear(element: Element): Promise<void>;
    selectOptions(element: Element, values: string | string[] | HTMLElement | HTMLElement[]): Promise<void>;
    keyboard(text: string): Promise<void>;
    tab(options?: { shift?: boolean }): Promise<void>;
    hover(element: Element): Promise<void>;
  }
  const userEvent: UserEvent & { setup(options?: { delay?: number }): UserEvent };
  export default userEvent;
  export { userEvent };
}

declare module 'react-router' {
  import type { ReactNode, ReactElement, AnchorHTMLAttributes, CSSProperties } from 'react';
  export interface Location { pathname: string; search: string; hash: string; state: unknown; key: string }
  export type To = string | { pathname?: string; search?: string; hash?: string };
  export interface NavigateOptions { replace?: boolean; state?: unknown }
  export interface NavigateFunction {
    (to: To, options?: NavigateOptions): void;
    (delta: number): void;
  }
  export function MemoryRouter(props: { initialEntries?: (string | { pathname: string; search?: string; state?: unknown })[]; initialIndex?: number; children?: ReactNode }): ReactElement;
  export function BrowserRouter(props: { children?: ReactNode }): ReactElement;
  export function Routes(props: { children?: ReactNode; location?: To }): ReactElement | null;
  export function Route(props: { path?: string; index?: boolean; element?: ReactNode; children?: ReactNode }): ReactElement | null;
  export function Outlet(): ReactElement | null;
  export function Navigate(props: { to: To; replace?: boolean; state?: unknown }): null;
  export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> { to: To; replace?: boolean; state?: unknown }
  export function Link(props: LinkProps): ReactElement;
  export interface NavLinkRenderProps { isActive: boolean; isPending: boolean; isTransitioning: boolean }
  export interface NavLinkProps extends Omit<LinkProps, 'className' | 'style' | 'children'> {
    end?: boolean;
    className?: string | ((props: NavLinkRenderProps) => string | undefined);
    style?: CSSProperties | ((props: NavLinkRenderProps) => CSSProperties | undefined);
    children?: ReactNode | ((props: NavLinkRenderProps) => ReactNode);
  }
  export function NavLink(props: NavLinkProps): ReactElement;
  export function useNavigate(): NavigateFunction;
  export function useLocation(): Location;
  export function useParams<K extends string = string>(): Readonly<Partial<Record<K, string>>>;
  export function useSearchParams(): [URLSearchParams, (next: URLSearchParams | Record<string, string> | ((prev: URLSearchParams) => URLSearchParams), options?: NavigateOptions) => void];
}

declare module 'react-router-dom' {
  export * from 'react-router';
}
