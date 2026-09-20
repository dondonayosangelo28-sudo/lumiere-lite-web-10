import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorFallback } from '@/components/ErrorFallback'

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  error: Error | null
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[v0] App render error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorFallback
          title="Something went wrong"
          message={this.state.error.message || 'An unexpected error occurred.'}
          onRetry={() => window.location.reload()}
        />
      )
    }

    return this.props.children
  }
}
