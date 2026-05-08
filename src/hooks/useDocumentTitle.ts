import { useEffect } from 'react';

const APP_NAME = 'TGS HRMS';

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} — ${APP_NAME}`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
