'use client';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react';

interface Props { name: string; children: ReactNode; className?: string }
interface State { failed: boolean; attempt: number }

/**
 * Error boundary for one dashboard module. A rendering failure in one section shows "We couldn't load this section."
 * with Try again, and every other section keeps working. Try again remounts the module, which re-runs its requests.
 * Nothing about the person (names, emails, ids) is logged: only the module name and the error's own message.
 */
export class ModuleBoundary extends Component<Props, State> {
  state: State = { failed: false, attempt: 0 };
  static getDerivedStateFromError(): Partial<State> { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error(`[module:${this.props.name}]`, error.message, info.componentStack?.split('\n')[1]?.trim() ?? ''); }
  private retry = () => this.setState((s) => ({ failed: false, attempt: s.attempt + 1 }));
  render() {
    if (this.state.failed) {
      return (
        <section aria-label={this.props.name} className={this.props.className ?? 'min-w-0 rounded-card border border-line bg-white shadow-card'}>
          <div role="alert" className="flex flex-col items-center px-6 py-10 text-center">
            <AlertTriangle size={22} strokeWidth={1.75} className="text-down" aria-hidden />
            <p className="mt-3 font-display text-[15px] font-bold">We couldn&apos;t load this section.</p>
            <p className="mt-1 max-w-md text-slate2">{this.props.name} hit a problem. The rest of your workspace is not affected.</p>
            <button type="button" onClick={this.retry} className="mt-4 inline-flex h-ctl items-center gap-2 rounded-ctl border border-line2 bg-white px-4 text-body font-medium text-navy transition-colors duration-150 hover:border-faint hover:bg-soft"><RotateCcw size={15} aria-hidden />Try again</button>
          </div>
        </section>
      );
    }
    return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>;
  }
}
