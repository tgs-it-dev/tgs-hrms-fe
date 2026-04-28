import { TIMEOUTS } from '../constants/appConstants';

interface SnackbarOptions {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

class SnackbarManager {
  private container: HTMLDivElement | null = null;

  private createContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'snackbar-container';
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    }
  }

  private getSnackbarColor(type: string) {
    switch (type) {
      case 'success':
        return '#2e7d32'; // Material-UI success color
      case 'error':
        return '#d32f2f'; // Material-UI error color
      case 'warning':
        return '#ed6c02'; // Material-UI warning color
      case 'info':
        return '#0288d1'; // Material-UI info color
      default:
        return '#484c7f';
    }
  }

  private getSnackbarIcon(type: string) {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  }

  show({ message, type = 'info', duration = TIMEOUTS.SNACKBAR_DURATION }: SnackbarOptions) {
    this.createContainer();

    const snackbar = document.createElement('div');
    snackbar.style.cssText = `
      background-color: ${this.getSnackbarColor(type)};
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 8px;
      box-shadow: 0 3px 5px -1px rgba(0,0,0,0.2), 0 6px 10px 0 rgba(0,0,0,0.14), 0 1px 18px 0 rgba(0,0,0,0.12);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 400px;
      word-wrap: break-word;
      pointer-events: auto;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 48px;
    `;

    const icon = document.createElement('span');
    icon.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      flex-shrink: 0;
    `;
    icon.textContent = this.getSnackbarIcon(type);

    const messageText = document.createElement('span');
    messageText.style.cssText = `
      flex: 1;
      line-height: 1.4;
    `;
    messageText.textContent = message;

    snackbar.appendChild(icon);
    snackbar.appendChild(messageText);

    this.container?.appendChild(snackbar);

    // Animate in
    setTimeout(() => {
      snackbar.style.transform = 'translateX(0)';
    }, 10);

    // Auto remove
    setTimeout(() => {
      snackbar.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (this.container && this.container.contains(snackbar)) {
          this.container.removeChild(snackbar);
        }
      }, 300);
    }, duration);
  }

  success(message: string, duration?: number) {
    this.show({ message, type: 'success', duration });
  }

  error(message: string, duration?: number) {
    this.show({ message, type: 'error', duration });
  }

  warning(message: string, duration?: number) {
    this.show({ message, type: 'warning', duration });
  }

  info(message: string, duration?: number) {
    this.show({ message, type: 'info', duration });
  }
}

export const snackbar = new SnackbarManager();
